import { constants } from 'node:fs';
import { copyFile, link, lstat, unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import type { MediaAssetReference } from './media-asset-reference';
import type { AuthorizedPathReference, AuthorizedRootRegistry, ResolvedAuthorizedPath } from './authorized-roots';
import type {
	FileMutationRecoveryHandle,
	FileMutationRecoveryPrepareInput,
	SerializedFileIdentity,
} from './file-mutation-recovery';

export type AuthorizedFileMutationErrorCode =
	| 'FILE_ALREADY_EXISTS'
	| 'FILE_ATOMIC_MOVE_UNSUPPORTED'
	| 'FILE_MUTATION_FAILED'
	| 'FILE_NOT_A_FILE'
	| 'FILE_ROLLBACK_REQUIRED';

export class AuthorizedFileMutationError extends Error {
	readonly code: AuthorizedFileMutationErrorCode;
	readonly status: number;

	constructor(code: AuthorizedFileMutationErrorCode, message: string, status: number, cause?: unknown) {
		super(message, { cause });
		this.name = 'AuthorizedFileMutationError';
		this.code = code;
		this.status = status;
	}
}

interface FileIdentity {
	dev: bigint;
	ino: bigint;
}

interface StagedDestination {
	destinationIdentity: FileIdentity;
	sourceIdentity: FileIdentity;
}

export interface AuthorizedFileRelocationResult {
	cleanupPending: boolean;
	destination: ResolvedAuthorizedPath;
	recoveryPending: boolean;
	source: ResolvedAuthorizedPath;
}

function errorCode(error: unknown): string | undefined {
	return (error as NodeJS.ErrnoException | undefined)?.code;
}

function sameAbsolutePath(left: string, right: string): boolean {
	const normalizedLeft = resolve(left);
	const normalizedRight = resolve(right);
	return process.platform === 'win32'
		? normalizedLeft.toLocaleLowerCase('en-US') === normalizedRight.toLocaleLowerCase('en-US')
		: normalizedLeft === normalizedRight;
}

async function readFileIdentity(path: string): Promise<FileIdentity> {
	const stats = await lstat(path, { bigint: true });
	if (!stats.isFile()) {
		throw new AuthorizedFileMutationError('FILE_NOT_A_FILE', 'El asset autorizado no es un archivo.', 400);
	}
	return { dev: stats.dev, ino: stats.ino };
}

async function removeIfOwned(path: string, identity: FileIdentity): Promise<boolean> {
	try {
		const current = await lstat(path, { bigint: true });
		if (current.dev !== identity.dev || current.ino !== identity.ino) return false;
		await unlink(path);
		return true;
	} catch (error) {
		return errorCode(error) === 'ENOENT';
	}
}

function serializeIdentity(identity: FileIdentity): SerializedFileIdentity {
	return { dev: identity.dev.toString(), ino: identity.ino.toString() };
}

function collision(error: unknown): AuthorizedFileMutationError {
	return new AuthorizedFileMutationError(
		'FILE_ALREADY_EXISTS',
		'Ya existe un archivo con ese nombre en el destino.',
		409,
		error
	);
}

function mutationFailed(error: unknown): AuthorizedFileMutationError {
	return new AuthorizedFileMutationError(
		'FILE_MUTATION_FAILED',
		'No se pudo completar la operación de archivo.',
		500,
		error
	);
}

async function copyAcrossDevicesExclusively(sourcePath: string, destinationPath: string): Promise<FileIdentity> {
	const temporaryPath = join(dirname(destinationPath), `.media-manager-stage-${randomUUID()}`);
	let temporaryIdentity: FileIdentity | undefined;
	let destinationIdentity: FileIdentity | undefined;
	try {
		await copyFile(sourcePath, temporaryPath, constants.COPYFILE_EXCL);
		temporaryIdentity = await readFileIdentity(temporaryPath);
		try {
			await link(temporaryPath, destinationPath);
			destinationIdentity = temporaryIdentity;
		} catch (error) {
			if (errorCode(error) === 'EEXIST') throw collision(error);
			throw new AuthorizedFileMutationError(
				'FILE_ATOMIC_MOVE_UNSUPPORTED',
				'El volumen de destino no permite promover archivos de forma atómica y exclusiva.',
				409,
				error
			);
		}
		if (!(await removeIfOwned(temporaryPath, temporaryIdentity))) {
			throw new AuthorizedFileMutationError(
				'FILE_ROLLBACK_REQUIRED',
				'La operación se detuvo porque no pudo retirar su archivo temporal de forma segura.',
				500
			);
		}
		return destinationIdentity;
	} catch (error) {
		const destinationClean = destinationIdentity ? await removeIfOwned(destinationPath, destinationIdentity) : true;
		const temporaryClean = temporaryIdentity ? await removeIfOwned(temporaryPath, temporaryIdentity) : true;
		if (!destinationClean || !temporaryClean) {
			throw new AuthorizedFileMutationError(
				'FILE_ROLLBACK_REQUIRED',
				'La operación falló y requiere recuperación manual de archivos creados por ella.',
				500,
				error
			);
		}
		if (error instanceof AuthorizedFileMutationError) throw error;
		throw mutationFailed(error);
	}
}

async function stageDestinationExclusively(sourcePath: string, destinationPath: string): Promise<StagedDestination> {
	const sourceIdentity = await readFileIdentity(sourcePath);
	try {
		await link(sourcePath, destinationPath);
		return { destinationIdentity: sourceIdentity, sourceIdentity };
	} catch (error) {
		if (errorCode(error) === 'EEXIST') throw collision(error);
		if (errorCode(error) !== 'EXDEV') throw mutationFailed(error);
		return {
			destinationIdentity: await copyAcrossDevicesExclusively(sourcePath, destinationPath),
			sourceIdentity,
		};
	}
}

/**
 * Relocates one authorized media file without overwriting an existing destination.
 *
 * The destination remains an additional link/copy until the database commit succeeds. If the
 * commit fails, only the destination inode created by this operation is removed. The source is
 * deleted last, so ordinary failures cannot destroy the only copy of the asset.
 */
export async function commitAuthorizedFileRelocation(options: {
	asset: MediaAssetReference;
	commit: (destinationAbsolutePath: string) => Promise<void>;
	destination: AuthorizedPathReference;
	prepareRecovery: (input: FileMutationRecoveryPrepareInput) => Promise<FileMutationRecoveryHandle>;
	registry: AuthorizedRootRegistry;
	rollbackCommit: (committedDestinationAbsolutePath: string) => Promise<void>;
	source: AuthorizedPathReference;
}): Promise<AuthorizedFileRelocationResult> {
	const { asset, commit, destination, prepareRecovery, registry, rollbackCommit, source } = options;
	const transfer = await registry.resolveTransfer(source, destination, {
		destinationPermission: 'write',
		sourcePermission: 'delete',
	});

	// A compensating cleanup needs read access to stage the source and delete access to the target.
	await Promise.all([registry.resolve(source, 'read', 'existing'), registry.resolve(destination, 'delete', 'create')]);
	const samePath = sameAbsolutePath(transfer.source.absolutePath, transfer.destination.absolutePath);
	if (samePath) {
		if (transfer.source.relativePath !== transfer.destination.relativePath) {
			throw new AuthorizedFileMutationError(
				'FILE_ATOMIC_MOVE_UNSUPPORTED',
				'Los cambios que sólo alteran mayúsculas requieren el broker nativo.',
				409
			);
		}
	}
	const recovery = await prepareRecovery({ asset, destination, source });

	if (samePath) {
		let databaseCommitted = false;
		try {
			await commit(transfer.source.absolutePath);
			databaseCommitted = true;
			await recovery.transition({ state: 'completed', reasonCode: 'NO_FILESYSTEM_CHANGE_REQUIRED' });
			return { cleanupPending: false, recoveryPending: false, ...transfer };
		} catch (error) {
			if (databaseCommitted) {
				try {
					await rollbackCommit(transfer.source.absolutePath);
					await recovery.transition({ state: 'completed', reasonCode: 'NOOP_DATABASE_COMMIT_ROLLED_BACK' });
				} catch (rollbackError) {
					await recovery
						.transition({ state: 'manual_recovery_required', reasonCode: 'NOOP_DATABASE_ROLLBACK_FAILED' })
						.catch(() => undefined);
					throw new AuthorizedFileMutationError(
						'FILE_ROLLBACK_REQUIRED',
						'La operación requiere reconciliación de base de datos.',
						500,
						rollbackError
					);
				}
			} else {
				await recovery
					.transition({ state: 'completed', reasonCode: 'NOOP_DATABASE_COMMIT_REJECTED' })
					.catch(() => undefined);
			}
			throw error;
		}
	}

	let staged: StagedDestination | undefined;
	try {
		staged = await stageDestinationExclusively(transfer.source.absolutePath, transfer.destination.absolutePath);
		await recovery.transition({
			destinationIdentity: serializeIdentity(staged.destinationIdentity),
			reasonCode: 'DESTINATION_STAGED_EXCLUSIVELY',
			sourceIdentity: serializeIdentity(staged.sourceIdentity),
			state: 'destination_staged',
		});
	} catch (error) {
		if (typeof staged !== 'undefined') {
			const destinationClean = await removeIfOwned(transfer.destination.absolutePath, staged.destinationIdentity);
			if (!destinationClean) {
				await recovery
					.transition({
						destinationIdentity: serializeIdentity(staged.destinationIdentity),
						reasonCode: 'JOURNAL_STAGE_TRANSITION_FAILED_DESTINATION_DIVERGED',
						sourceIdentity: serializeIdentity(staged.sourceIdentity),
						state: 'manual_recovery_required',
					})
					.catch(() => undefined);
				throw new AuthorizedFileMutationError(
					'FILE_ROLLBACK_REQUIRED',
					'El staging no pudo registrarse y el destino requiere reconciliación.',
					500,
					error
				);
			}
		}
		await recovery
			.transition({ state: 'completed', reasonCode: 'DESTINATION_STAGE_REJECTED_OR_REVERTED' })
			.catch(() => undefined);
		throw error;
	}
	if (!staged) throw mutationFailed(new Error('Destination staging did not produce an identity.'));

	try {
		const currentSourceIdentity = await readFileIdentity(transfer.source.absolutePath);
		if (
			currentSourceIdentity.dev !== staged.sourceIdentity.dev ||
			currentSourceIdentity.ino !== staged.sourceIdentity.ino
		) {
			throw new AuthorizedFileMutationError('FILE_MUTATION_FAILED', 'El origen cambió durante la operación.', 409);
		}
		const revalidatedDestination = await registry.resolve(destination, 'write', 'existing');
		if (!sameAbsolutePath(revalidatedDestination.absolutePath, transfer.destination.absolutePath)) {
			throw new AuthorizedFileMutationError('FILE_MUTATION_FAILED', 'El destino cambió durante la operación.', 409);
		}
		const currentDestinationIdentity = await readFileIdentity(transfer.destination.absolutePath);
		if (
			currentDestinationIdentity.dev !== staged.destinationIdentity.dev ||
			currentDestinationIdentity.ino !== staged.destinationIdentity.ino
		) {
			throw new AuthorizedFileMutationError('FILE_MUTATION_FAILED', 'El destino cambió durante la operación.', 409);
		}
	} catch (error) {
		const destinationClean = await removeIfOwned(transfer.destination.absolutePath, staged.destinationIdentity);
		await recovery
			.transition({
				reasonCode: destinationClean
					? 'PRECOMMIT_REVALIDATION_FAILED_DESTINATION_REMOVED'
					: 'PRECOMMIT_REVALIDATION_FAILED_DESTINATION_DIVERGED',
				state: destinationClean ? 'completed' : 'manual_recovery_required',
			})
			.catch(() => undefined);
		if (!destinationClean) {
			throw new AuthorizedFileMutationError(
				'FILE_ROLLBACK_REQUIRED',
				'La validación previa falló y el destino requiere recuperación manual.',
				500,
				error
			);
		}
		throw error;
	}

	let databaseCommitted = false;
	try {
		await commit(transfer.destination.absolutePath);
		databaseCommitted = true;
		await recovery.transition({ reasonCode: 'DATABASE_LOCATION_COMMITTED', state: 'database_committed' });
	} catch (error) {
		let databaseRolledBack = !databaseCommitted;
		if (databaseCommitted) {
			try {
				await rollbackCommit(transfer.destination.absolutePath);
				databaseRolledBack = true;
			} catch {
				databaseRolledBack = false;
			}
		}
		const destinationClean = await removeIfOwned(transfer.destination.absolutePath, staged.destinationIdentity);
		const converged = databaseRolledBack && destinationClean;
		await recovery
			.transition({
				reasonCode: `DATABASE_COMMIT_PHASE_FAILED_DB_${databaseRolledBack ? 'AT_SOURCE' : 'DIVERGED'}_DEST_${destinationClean ? 'ABSENT' : 'DIVERGED'}`,
				state: converged ? 'completed' : 'manual_recovery_required',
			})
			.catch(() => undefined);
		if (!converged) {
			throw new AuthorizedFileMutationError(
				'FILE_ROLLBACK_REQUIRED',
				'La confirmación de base falló y requiere reconciliación manual.',
				500,
				error
			);
		}
		throw error;
	}

	try {
		const postCommitDestination = await registry.resolve(destination, 'write', 'existing');
		const postCommitIdentity = await readFileIdentity(postCommitDestination.absolutePath);
		if (
			!sameAbsolutePath(postCommitDestination.absolutePath, transfer.destination.absolutePath) ||
			postCommitIdentity.dev !== staged.destinationIdentity.dev ||
			postCommitIdentity.ino !== staged.destinationIdentity.ino
		) {
			throw new AuthorizedFileMutationError(
				'FILE_MUTATION_FAILED',
				'El destino cambió durante la confirmación de la operación.',
				409
			);
		}
	} catch (error) {
		let databaseRolledBack = false;
		try {
			await rollbackCommit(transfer.destination.absolutePath);
			databaseRolledBack = true;
		} catch {
			// A durable record below preserves the recovery contract when DB compensation fails.
		}
		const destinationClean = await removeIfOwned(transfer.destination.absolutePath, staged.destinationIdentity);
		await recovery
			.transition({
				reasonCode: `POST_COMMIT_REVALIDATION_FAILED_DB_${databaseRolledBack ? 'ROLLED_BACK' : 'DIVERGED'}_DEST_${destinationClean ? 'ABSENT' : 'DIVERGED'}`,
				state: 'manual_recovery_required',
			})
			.catch(() => undefined);
		throw new AuthorizedFileMutationError(
			'FILE_ROLLBACK_REQUIRED',
			'El destino cambió y la operación requiere reconciliación manual.',
			500,
			error
		);
	}

	let recoveryPending = false;
	const cleanupPending = !(await removeIfOwned(transfer.source.absolutePath, staged.sourceIdentity));
	if (cleanupPending) {
		try {
			await recovery.transition({
				reasonCode: 'SOURCE_IDENTITY_CHANGED_OR_DELETE_FAILED',
				state: 'source_cleanup_pending',
			});
		} catch {
			recoveryPending = true;
		}
	}
	try {
		const finalDestination = await registry.resolve(destination, 'write', 'existing');
		const finalIdentity = await readFileIdentity(finalDestination.absolutePath);
		if (
			!sameAbsolutePath(finalDestination.absolutePath, transfer.destination.absolutePath) ||
			finalIdentity.dev !== staged.destinationIdentity.dev ||
			finalIdentity.ino !== staged.destinationIdentity.ino
		) {
			throw new Error('destination-identity-changed');
		}
	} catch (error) {
		await recovery
			.transition({
				reasonCode: 'FINAL_DESTINATION_REVALIDATION_FAILED',
				state: 'manual_recovery_required',
			})
			.catch(() => undefined);
		throw new AuthorizedFileMutationError(
			'FILE_ROLLBACK_REQUIRED',
			'La validación final del destino falló y requiere reconciliación manual.',
			500,
			error
		);
	}
	if (!cleanupPending) {
		try {
			await recovery.transition({ state: 'completed', reasonCode: 'FILESYSTEM_AND_DATABASE_CONVERGED' });
		} catch {
			recoveryPending = true;
		}
	}
	return { cleanupPending, recoveryPending, ...transfer };
}
