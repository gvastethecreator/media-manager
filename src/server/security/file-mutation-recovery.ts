import { randomUUID } from 'node:crypto';
import { chmod, lstat, mkdir, open, readFile, unlink } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getMediaAssetLocation, parseMediaAssetReference, type MediaAssetReference } from './media-asset-reference';
import type { AuthorizedPathReference, AuthorizedRootRegistry } from './authorized-roots';

export const FILE_MUTATION_RECOVERY_JOURNAL_ENV = 'MEDIA_MANAGER_FILE_MUTATION_RECOVERY_JOURNAL';

export type FileMutationRecoveryState =
	| 'prepared'
	| 'destination_staged'
	| 'database_committed'
	| 'manual_recovery_required'
	| 'source_cleanup_pending'
	| 'completed';

export interface SerializedFileIdentity {
	dev: string;
	ino: string;
}

export interface FileMutationRecoveryPrepareInput {
	asset: MediaAssetReference;
	destination: AuthorizedPathReference;
	source: AuthorizedPathReference;
}

export interface FileMutationRecoveryTransition {
	destinationIdentity?: SerializedFileIdentity;
	reasonCode: string;
	sourceIdentity?: SerializedFileIdentity;
	state: FileMutationRecoveryState;
}

interface FileMutationRecoveryRecord extends FileMutationRecoveryPrepareInput, FileMutationRecoveryTransition {
	id: string;
	timestamp: string;
	version: 1;
}

export interface FileMutationRecoveryHandle {
	id: string;
	transition(input: FileMutationRecoveryTransition): Promise<void>;
}

let journalWriteQueue: Promise<void> = Promise.resolve();

function databaseDirectory(environment: Record<string, string | undefined>): string {
	const databaseUrl = environment.DATABASE_URL || 'file:./db.sqlite';
	if (databaseUrl.startsWith('file:')) {
		try {
			return dirname(fileURLToPath(databaseUrl));
		} catch {
			return dirname(resolve(databaseUrl.slice('file:'.length)));
		}
	}
	return process.cwd();
}

export function resolveFileMutationRecoveryJournalPath(
	environment: Record<string, string | undefined> = process.env
): string {
	const configured = environment[FILE_MUTATION_RECOVERY_JOURNAL_ENV]?.trim();
	return configured ? resolve(configured) : resolve(databaseDirectory(environment), '.media-manager-recovery.jsonl');
}

async function appendRecoveryRecord(
	record: FileMutationRecoveryRecord,
	environment: Record<string, string | undefined>
): Promise<void> {
	const journalPath = resolveFileMutationRecoveryJournalPath(environment);
	const write = journalWriteQueue.then(async () => {
		await mkdir(dirname(journalPath), { recursive: true });
		const file = await open(journalPath, 'a', 0o600);
		try {
			await file.writeFile(`${JSON.stringify(record)}\n`, { encoding: 'utf8' });
			await file.sync();
		} finally {
			await file.close();
		}
		await chmod(journalPath, 0o600).catch(() => undefined);
	});
	journalWriteQueue = write.catch(() => undefined);
	await write;
}

export async function prepareFileMutationRecovery(
	input: FileMutationRecoveryPrepareInput,
	environment: Record<string, string | undefined> = process.env
): Promise<FileMutationRecoveryHandle> {
	const base: FileMutationRecoveryRecord = {
		...input,
		id: randomUUID(),
		reasonCode: 'OPERATION_PREPARED',
		state: 'prepared',
		timestamp: new Date().toISOString(),
		version: 1,
	};
	await appendRecoveryRecord(base, environment);
	let current = base;
	return {
		id: base.id,
		transition: async (transition) => {
			const next: FileMutationRecoveryRecord = {
				...current,
				...transition,
				timestamp: new Date().toISOString(),
			};
			await appendRecoveryRecord(next, environment);
			current = next;
		},
	};
}

function isPathReference(value: unknown): value is AuthorizedPathReference {
	return Boolean(
		value &&
		typeof value === 'object' &&
		typeof (value as { rootId?: unknown }).rootId === 'string' &&
		typeof (value as { relativePath?: unknown }).relativePath === 'string'
	);
}

function parseRecoveryRecord(value: unknown): FileMutationRecoveryRecord {
	if (!(value && typeof value === 'object')) throw new Error('Recovery journal entry inválida.');
	const record = value as Partial<FileMutationRecoveryRecord>;
	if (
		record.version !== 1 ||
		typeof record.id !== 'string' ||
		typeof record.reasonCode !== 'string' ||
		typeof record.state !== 'string' ||
		typeof record.timestamp !== 'string' ||
		!isPathReference(record.source) ||
		!isPathReference(record.destination)
	) {
		throw new Error('Recovery journal entry incompleta.');
	}
	return { ...record, asset: parseMediaAssetReference(record.asset) } as FileMutationRecoveryRecord;
}

async function readLatestRecoveryRecords(
	environment: Record<string, string | undefined>
): Promise<Map<string, FileMutationRecoveryRecord>> {
	let contents: string;
	try {
		contents = await readFile(resolveFileMutationRecoveryJournalPath(environment), 'utf8');
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') return new Map();
		throw error;
	}
	const latest = new Map<string, FileMutationRecoveryRecord>();
	for (const line of contents.split(/\r?\n/)) {
		if (!line.trim()) continue;
		const record = parseRecoveryRecord(JSON.parse(line));
		latest.set(record.id, record);
	}
	return latest;
}

function sameReference(left: AuthorizedPathReference, right: AuthorizedPathReference): boolean {
	return left.rootId === right.rootId && left.relativePath === right.relativePath;
}

async function currentIdentity(path: string): Promise<SerializedFileIdentity | null> {
	try {
		const stats = await lstat(path, { bigint: true });
		return { dev: stats.dev.toString(), ino: stats.ino.toString() };
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
		throw error;
	}
}

function sameIdentity(left: SerializedFileIdentity | null, right?: SerializedFileIdentity): boolean {
	return Boolean(left && right && left.dev === right.dev && left.ino === right.ino);
}

async function appendReconciliationState(
	record: FileMutationRecoveryRecord,
	transition: FileMutationRecoveryTransition,
	environment: Record<string, string | undefined>
): Promise<void> {
	await appendRecoveryRecord({ ...record, ...transition, timestamp: new Date().toISOString() }, environment);
}

export interface FileMutationReconciliationResult {
	completed: number;
	manual: number;
	pending: number;
}

export async function reconcilePendingFileMutations(
	registry: AuthorizedRootRegistry,
	environment: Record<string, string | undefined> = process.env
): Promise<FileMutationReconciliationResult> {
	const records = await readLatestRecoveryRecords(environment);
	const result: FileMutationReconciliationResult = { completed: 0, manual: 0, pending: 0 };
	for (const record of records.values()) {
		if (record.state === 'completed') continue;
		if (record.state === 'manual_recovery_required') {
			result.manual += 1;
			continue;
		}
		try {
			const location = await getMediaAssetLocation(record.asset);
			const databasePath = await registry.authorizeAbsolutePath(location.path, 'read');
			const databaseReference = { rootId: databasePath.rootId, relativePath: databasePath.relativePath };
			const sourcePath = await registry.resolve(record.source, 'delete', 'create');
			const destinationPath = await registry.resolve(record.destination, 'delete', 'create');

			if (sameReference(databaseReference, record.source)) {
				const destinationIdentity = await currentIdentity(destinationPath.absolutePath);
				if (destinationIdentity === null) {
					await appendReconciliationState(
						record,
						{ state: 'completed', reasonCode: 'RECOVERED_DATABASE_AT_SOURCE' },
						environment
					);
					result.completed += 1;
					continue;
				}
				if (sameIdentity(destinationIdentity, record.destinationIdentity)) {
					await unlink(destinationPath.absolutePath);
					await appendReconciliationState(
						record,
						{ state: 'completed', reasonCode: 'RECOVERED_STAGED_DESTINATION_REMOVED' },
						environment
					);
					result.completed += 1;
					continue;
				}
			}

			if (sameReference(databaseReference, record.destination)) {
				const destinationIdentity = await currentIdentity(destinationPath.absolutePath);
				if (
					!destinationIdentity ||
					(record.destinationIdentity && !sameIdentity(destinationIdentity, record.destinationIdentity))
				) {
					throw new Error('RECOVERY_DESTINATION_IDENTITY_MISMATCH');
				}
				const sourceIdentity = await currentIdentity(sourcePath.absolutePath);
				if (sourceIdentity === null) {
					await appendReconciliationState(
						record,
						{ state: 'completed', reasonCode: 'RECOVERED_DATABASE_AT_DESTINATION' },
						environment
					);
					result.completed += 1;
					continue;
				}
				if (sameIdentity(sourceIdentity, record.sourceIdentity)) {
					await unlink(sourcePath.absolutePath);
					await appendReconciliationState(
						record,
						{ state: 'completed', reasonCode: 'RECOVERED_SOURCE_CLEANUP' },
						environment
					);
					result.completed += 1;
					continue;
				}
				await appendReconciliationState(
					record,
					{ state: 'source_cleanup_pending', reasonCode: 'RECOVERY_SOURCE_IDENTITY_MISMATCH' },
					environment
				);
				result.pending += 1;
				continue;
			}
			throw new Error('RECOVERY_DATABASE_LOCATION_DIVERGED');
		} catch {
			await appendReconciliationState(
				record,
				{ state: 'manual_recovery_required', reasonCode: 'STARTUP_RECONCILIATION_REQUIRES_REVIEW' },
				environment
			);
			result.manual += 1;
		}
	}
	return result;
}
