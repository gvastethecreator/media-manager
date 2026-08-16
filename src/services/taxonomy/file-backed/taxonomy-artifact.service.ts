import { randomUUID } from 'node:crypto';
import { readdir } from 'node:fs/promises';
import { and, eq, inArray, or, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import type { SQLiteColumn } from 'drizzle-orm/sqlite-core';
import { db } from '@/lib/drizzle';
import { mediaRoots } from '@/lib/drizzle/schema/media-core/assets';
import { notes } from '@/lib/drizzle/schema/taxonomy/notes';
import { prompts } from '@/lib/drizzle/schema/taxonomy/prompts';
import { taxonomyArtifactDeletionLedger, taxonomyArtifacts } from '@/lib/drizzle/schema/taxonomy/artifacts';
import { wildcards } from '@/lib/drizzle/schema/taxonomy/wildcards';
import type {
	AuthorizedPathReference,
	AuthorizedRootRegistry,
	RootPermission,
} from '@/server/security/authorized-roots';
import type { FavoriteWriteTransaction } from '@/services/favorite/favorite-write-transaction';
import {
	ArtifactConflictError,
	createArtifactPathAuthority,
	createArtifactDeletionTombstone,
	discardArtifactDeletionTombstone,
	ArtifactValidationError,
	type ArtifactDeletionTombstone,
	type ArtifactPathAuthority,
	type ArtifactFamily,
	type ArtifactParameter,
	type AuthoredMetadata,
	checkArtifactChanged,
	computeArtifactHash,
	extractFrontmatter,
	generateFrontmatter,
	commitQuarantinedArtifact,
	quarantineArtifactFile,
	quarantineTemporaryArtifact,
	readArtifactFile,
	readArtifactDeletionTombstone,
	renameArtifactFile,
	restoreQuarantinedArtifact,
	writeArtifactFile,
	type QuarantinedArtifact,
} from './file-backed.service';
import { withTaxonomyArtifactMutationPermit } from './mutation-permit';

const FAMILY_DIRECTORY: Record<ArtifactFamily, string> = {
	note: 'notes',
	prompt: 'prompts',
	wildcard: 'wildcards',
};

/**
 * Converts a stored root-relative binding into the only filesystem authority
 * accepted by the storage layer. Each storage syscall invokes this resolver
 * again, so it never inherits an absolute path from an earlier lookup.
 */
function artifactPath(
	registry: AuthorizedRootRegistry,
	reference: AuthorizedPathReference,
	permission: RootPermission
): ArtifactPathAuthority {
	return createArtifactPathAuthority(reference, async (current, mode) => {
		const resolved = await registry.resolve(current, permission, mode);
		return resolved.absolutePath;
	});
}

type TaxonomyArtifactRow = typeof taxonomyArtifacts.$inferSelect;
type TaxonomyArtifactDeletionLedgerRow = typeof taxonomyArtifactDeletionLedger.$inferSelect;

interface TaxonomyArtifactDeletionLedgerIdentity {
	contentHash: string;
	entityId: string;
	entityType: ArtifactFamily;
	nonce: string;
	relativePath: string;
	rootId: string;
}

export interface TaxonomyArtifactDocument {
	body: string;
	byteSize: number;
	contentHash: string;
	entityId: string;
	entityType: ArtifactFamily;
	metadata: AuthoredMetadata;
	relativePath: string;
	rootId: string;
	syncStatus: TaxonomyArtifactRow['syncStatus'];
}

/**
 * A save response carries the already-committed entity projection. Returning it
 * with the artifact makes the canonical PUT the success boundary for editors;
 * clients do not need a second, failure-prone entity GET before closing a save.
 */
export interface SaveTaxonomyArtifactResult<TEntity = TaxonomyArtifactEntityProjection> extends TaxonomyArtifactDocument {
	entity: TEntity;
}

export type TaxonomyArtifactEntityProjection =
	| typeof prompts.$inferSelect
	| typeof notes.$inferSelect
	| typeof wildcards.$inferSelect;

export interface SaveTaxonomyArtifactInput {
	body: string;
	entityId: string;
	entityType: ArtifactFamily;
	expectedHash?: string;
	metadata: Omit<AuthoredMetadata, 'id' | 'kind' | 'schemaVersion'>;
	operational?: {
		featuredImage?: string | null;
		parentId?: string | null;
		shortcut?: string | null;
	};
	rootId?: string;
	restoreMissing?: boolean;
}

export interface RelocateTaxonomyArtifactInput {
	entityId: string;
	entityType: ArtifactFamily;
	expectedHash: string;
	fileName: string;
}

export interface DeleteTaxonomyArtifactInput {
	deleteMissing?: boolean;
	entityId: string;
	entityType: ArtifactFamily;
	expectedHash: string;
}

export interface SearchTaxonomyArtifactsInput {
	authorizedRootIds: readonly string[];
	entityType?: ArtifactFamily;
	limit?: number;
	offset?: number;
	query: string;
}

export function authorizedTaxonomyRootIds(registry: AuthorizedRootRegistry): string[] {
	return registry
		.list()
		.filter((root) => root.permissions.includes('read') && root.permissions.includes('index'))
		.map((root) => root.id);
}

export async function isTaxonomyEntityAuthorized(
	registry: AuthorizedRootRegistry,
	entityType: ArtifactFamily,
	entityId: string
): Promise<boolean> {
	const binding = await getBinding(entityType, entityId);
	if (!binding) return true;
	return authorizedTaxonomyRootIds(registry).includes(binding.rootId);
}

export async function filterAuthorizedTaxonomyEntities<T extends { id: string }>(
	registry: AuthorizedRootRegistry,
	entityType: ArtifactFamily,
	entities: readonly T[]
): Promise<T[]> {
	if (entities.length === 0) return [];
	const bindings: Array<Pick<TaxonomyArtifactRow, 'entityId' | 'rootId'>> = [];
	const entityIds = entities.map((entity) => entity.id);
	for (let offset = 0; offset < entityIds.length; offset += 250) {
		bindings.push(
			...(await db
				.select({ entityId: taxonomyArtifacts.entityId, rootId: taxonomyArtifacts.rootId })
				.from(taxonomyArtifacts)
				.where(
					and(
						eq(taxonomyArtifacts.entityType, entityType),
						inArray(taxonomyArtifacts.entityId, entityIds.slice(offset, offset + 250))
					)
				))
		);
	}
	const authorizedRoots = new Set(authorizedTaxonomyRootIds(registry));
	const deniedIds = new Set(
		bindings
			.filter((binding: Pick<TaxonomyArtifactRow, 'entityId' | 'rootId'>) => !authorizedRoots.has(binding.rootId))
			.map((binding: Pick<TaxonomyArtifactRow, 'entityId' | 'rootId'>) => binding.entityId)
	);
	return entities.filter((entity) => !deniedIds.has(entity.id));
}

export class TaxonomyArtifactServiceError extends Error {
	readonly code: string;
	readonly status: number;

	constructor(code: string, message: string, status: number) {
		super(message);
		this.name = 'TaxonomyArtifactServiceError';
		this.code = code;
		this.status = status;
	}
}

function canonicalRelativePath(entityType: ArtifactFamily, entityId: string): string {
	if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(entityId)) {
		throw new ArtifactValidationError('entityId no cumple el contrato portable.');
	}
	return `taxonomy/${FAMILY_DIRECTORY[entityType]}/${entityId}.md`;
}

function canonicalMetadata(input: SaveTaxonomyArtifactInput): AuthoredMetadata {
	return {
		...input.metadata,
		id: input.entityId,
		kind: input.entityType,
		schemaVersion: 1,
	};
}

function assertDocumentIdentity(metadata: AuthoredMetadata, entityType: ArtifactFamily, entityId: string): void {
	if (metadata.id !== entityId || metadata.kind !== entityType || metadata.schemaVersion !== 1) {
		throw new ArtifactConflictError('La identidad portable del archivo no coincide con su binding.');
	}
}

async function getBinding(entityType: ArtifactFamily, entityId: string): Promise<TaxonomyArtifactRow | null> {
	const [row] = await db
		.select()
		.from(taxonomyArtifacts)
		.where(and(eq(taxonomyArtifacts.entityType, entityType), eq(taxonomyArtifacts.entityId, entityId)))
		.limit(1);
	return row ?? null;
}

function deletionLedgerWhere(identity: TaxonomyArtifactDeletionLedgerIdentity) {
	return and(
		eq(taxonomyArtifactDeletionLedger.rootId, identity.rootId),
		eq(taxonomyArtifactDeletionLedger.relativePath, identity.relativePath),
		eq(taxonomyArtifactDeletionLedger.entityType, identity.entityType),
		eq(taxonomyArtifactDeletionLedger.entityId, identity.entityId),
		eq(taxonomyArtifactDeletionLedger.contentHash, identity.contentHash),
		eq(taxonomyArtifactDeletionLedger.nonce, identity.nonce)
	);
}

async function readDeletionLedger(
	identity: TaxonomyArtifactDeletionLedgerIdentity
): Promise<TaxonomyArtifactDeletionLedgerRow | null> {
	const [row] = await db
		.select()
		.from(taxonomyArtifactDeletionLedger)
		.where(deletionLedgerWhere(identity))
		.limit(1);
	return row ?? null;
}

async function createDeletionLedger(
	writer: FavoriteWriteTransaction,
	identity: TaxonomyArtifactDeletionLedgerIdentity
): Promise<void> {
	await writer.insert(taxonomyArtifactDeletionLedger).values(identity);
}

async function discardDeletionLedger(identity: TaxonomyArtifactDeletionLedgerIdentity): Promise<void> {
	await db.delete(taxonomyArtifactDeletionLedger).where(deletionLedgerWhere(identity));
}

function artifactRecoveryKey(
	rootId: string,
	relativePath: string,
	entityType: ArtifactFamily,
	entityId: string
): string {
	return JSON.stringify([rootId, relativePath, entityType, entityId]);
}

function artifactRecoveryKeyForBinding(binding: TaxonomyArtifactRow): string {
	return artifactRecoveryKey(binding.rootId, binding.relativePath, binding.entityType as ArtifactFamily, binding.entityId);
}

async function getEntityProjection(
	entityType: ArtifactFamily,
	entityId: string
): Promise<TaxonomyArtifactEntityProjection | null> {
	switch (entityType) {
		case 'prompt': {
			const [entity] = await db.select().from(prompts).where(eq(prompts.id, entityId)).limit(1);
			return entity ?? null;
		}
		case 'note': {
			const [entity] = await db.select().from(notes).where(eq(notes.id, entityId)).limit(1);
			return entity ?? null;
		}
		case 'wildcard': {
			const [entity] = await db.select().from(wildcards).where(eq(wildcards.id, entityId)).limit(1);
			return entity ?? null;
		}
	}
}

export async function assertInlineTaxonomyMutationAllowed(entityType: ArtifactFamily, entityId: string): Promise<void> {
	if (await getBinding(entityType, entityId)) {
		throw new ArtifactConflictError(
			'La entidad es file-backed; use /api/taxonomy-artifacts para modificar contenido o lifecycle.'
		);
	}
}

async function targetExists(entityType: ArtifactFamily, entityId: string): Promise<boolean> {
	let exists = false;
	switch (entityType) {
		case 'prompt':
			exists = Boolean((await db.select({ id: prompts.id }).from(prompts).where(eq(prompts.id, entityId)).limit(1))[0]);
			break;
		case 'note':
			exists = Boolean((await db.select({ id: notes.id }).from(notes).where(eq(notes.id, entityId)).limit(1))[0]);
			break;
		case 'wildcard':
			exists = Boolean(
				(await db.select({ id: wildcards.id }).from(wildcards).where(eq(wildcards.id, entityId)).limit(1))[0]
			);
			break;
	}
	return exists;
}

async function assertTargetExists(entityType: ArtifactFamily, entityId: string): Promise<void> {
	if (!(await targetExists(entityType, entityId))) {
		throw new TaxonomyArtifactServiceError('ARTIFACT_TARGET_NOT_FOUND', 'La entidad taxonomy no existe.', 404);
	}
}

async function applyEntityProjection(
	writer: FavoriteWriteTransaction,
	entityType: ArtifactFamily,
	entityId: string,
	metadata: AuthoredMetadata,
	body: string,
	operational?: SaveTaxonomyArtifactInput['operational']
): Promise<void> {
	let updatedRows: Array<{ id: string }>;
	switch (entityType) {
		case 'prompt': {
			const [currentPrompt] = await writer
				.select({ metadata: prompts.metadata })
				.from(prompts)
				.where(eq(prompts.id, entityId))
				.limit(1);
			let existingMetadata: Record<string, unknown> = {};
			try {
				const parsed = currentPrompt?.metadata ? (JSON.parse(currentPrompt.metadata) as unknown) : null;
				if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
					existingMetadata = parsed as Record<string, unknown>;
				}
			} catch {
				// Legacy metadata inválida no debe impedir reparar la proyección canónica.
			}
			updatedRows = await writer
				.update(prompts)
				.set({
					category: metadata.category ?? null,
					color: metadata.color ?? null,
					content: body,
					description: metadata.summary ?? null,
					emoji: metadata.emoji ?? null,
					metadata: JSON.stringify({
						...existingMetadata,
						parameters: metadata.parameters ?? [],
						purpose: metadata.purpose ?? null,
					}),
					name: metadata.title,
				})
				.where(eq(prompts.id, entityId))
				.returning({ id: prompts.id });
			break;
		}
		case 'note':
			updatedRows = await writer
				.update(notes)
				.set({ category: metadata.category ?? 'general', content: body, title: metadata.title })
				.where(eq(notes.id, entityId))
				.returning({ id: notes.id });
			break;
		case 'wildcard':
			updatedRows = await writer
				.update(wildcards)
				.set({
					category: metadata.category ?? null,
					children: JSON.stringify(body.split('\n')),
					color: metadata.color ?? null,
					description: metadata.summary ?? null,
					emoji: metadata.emoji ?? null,
					...(operational?.featuredImage !== undefined ? { featuredImage: operational.featuredImage } : {}),
					name: metadata.title,
					...(operational?.parentId !== undefined ? { parentId: operational.parentId } : {}),
					...(operational?.shortcut !== undefined ? { shortcut: operational.shortcut } : {}),
				})
				.where(eq(wildcards.id, entityId))
				.returning({ id: wildcards.id });
			break;
	}
	if (updatedRows.length !== 1) {
		throw new TaxonomyArtifactServiceError(
			'ARTIFACT_TARGET_NOT_FOUND',
			'La entidad taxonomy desapareció antes de confirmar su proyección.',
			404
		);
	}
}

async function persistProjection(input: {
	body: string;
	byteSize: number;
	contentHash: string;
	entityId: string;
	entityType: ArtifactFamily;
	metadata: AuthoredMetadata;
	operational?: SaveTaxonomyArtifactInput['operational'];
	relativePath: string;
	rootId: string;
	createMissingWildcard?: boolean;
}): Promise<void> {
	await db.transaction(async (tx: FavoriteWriteTransaction) => {
		if (input.createMissingWildcard && input.entityType === 'wildcard') {
			const existing = await tx
				.select({ id: wildcards.id })
				.from(wildcards)
				.where(eq(wildcards.id, input.entityId))
				.limit(1);
			if (existing.length === 0) {
				await tx.insert(wildcards).values({
					category: input.metadata.category ?? null,
					children: JSON.stringify(input.body.split('\n')),
					color: input.metadata.color ?? null,
					description: input.metadata.summary ?? null,
					emoji: input.metadata.emoji ?? null,
					featuredImage: input.operational?.featuredImage ?? null,
					id: input.entityId,
					name: input.metadata.title,
					parentId: input.operational?.parentId ?? null,
					shortcut: input.operational?.shortcut ?? null,
				});
			}
		}
		await withTaxonomyArtifactMutationPermit(tx, input.entityType, input.entityId, 'update', async () => {
			await tx
				.insert(taxonomyArtifacts)
				.values({
					authoredMetadata: JSON.stringify(input.metadata),
					byteSize: input.byteSize,
					contentHash: input.contentHash,
					entityId: input.entityId,
					entityType: input.entityType,
					indexedBody: input.body,
					indexedSummary: input.metadata.summary ?? null,
					indexedTitle: input.metadata.title,
					lastSyncedAt: new Date(),
					relativePath: input.relativePath,
					rootId: input.rootId,
					syncStatus: 'synced',
				})
				.onConflictDoUpdate({
					set: {
						authoredMetadata: JSON.stringify(input.metadata),
						byteSize: input.byteSize,
						contentHash: input.contentHash,
						indexedBody: input.body,
						indexedSummary: input.metadata.summary ?? null,
						indexedTitle: input.metadata.title,
						lastSyncedAt: new Date(),
						relativePath: input.relativePath,
						rootId: input.rootId,
						syncStatus: 'synced',
					},
					target: [taxonomyArtifacts.entityType, taxonomyArtifacts.entityId],
				});
			await applyEntityProjection(tx, input.entityType, input.entityId, input.metadata, input.body, input.operational);
		});
	});
}

export async function createFileBackedWildcardArtifact(
	registry: AuthorizedRootRegistry,
	input: Omit<SaveTaxonomyArtifactInput, 'entityId' | 'entityType' | 'expectedHash' | 'restoreMissing'> & {
		rootId: string;
	}
): Promise<{ artifact: TaxonomyArtifactDocument; entity: typeof wildcards.$inferSelect }> {
	await assertTaxonomyRootExists(input.rootId);
	const entityId = `wild-${crypto.randomUUID()}`;
	const entityType = 'wildcard' as const;
	const metadata = canonicalMetadata({ ...input, entityId, entityType });
	const content = generateFrontmatter(metadata, input.body);
	const parsed = extractFrontmatter(content);
	const relativePath = canonicalRelativePath(entityType, entityId);
	const target = artifactPath(registry, { relativePath, rootId: input.rootId }, 'write');
	const write = await writeArtifactFile(target, content, { createOnly: true });
	try {
		await persistProjection({
			body: parsed.body,
			byteSize: write.byteSize,
			contentHash: write.contentHash,
			createMissingWildcard: true,
			entityId,
			entityType,
			metadata: parsed.metadata,
			operational: input.operational,
			relativePath,
			rootId: input.rootId,
		});
	} catch (error) {
		await rmCreatedArtifactAfterDatabaseFailure(target, write.contentHash);
		throw error;
	}
	const [row, entity] = await Promise.all([
		getBinding(entityType, entityId),
		db
			.select()
			.from(wildcards)
			.where(eq(wildcards.id, entityId))
			.limit(1)
			.then((rows: (typeof wildcards.$inferSelect)[]) => rows[0]),
	]);
	if (!(row && entity)) throw new Error('La creación file-backed confirmó sin proyección legible.');
	return { artifact: toDocument(row, parsed.metadata, parsed.body), entity };
}

function toDocument(row: TaxonomyArtifactRow, metadata: AuthoredMetadata, body: string): TaxonomyArtifactDocument {
	return {
		body,
		byteSize: row.byteSize,
		contentHash: row.contentHash,
		entityId: row.entityId,
		entityType: row.entityType as ArtifactFamily,
		metadata,
		relativePath: row.relativePath,
		rootId: row.rootId,
		syncStatus: row.syncStatus,
	};
}

export async function saveTaxonomyArtifact(
	registry: AuthorizedRootRegistry,
	input: SaveTaxonomyArtifactInput
): Promise<TaxonomyArtifactDocument> {
	if (input.entityType !== 'wildcard' && input.operational !== undefined) {
		throw new ArtifactValidationError('operational sólo está permitido para Wildcard.');
	}
	await assertTargetExists(input.entityType, input.entityId);
	const existing = await getBinding(input.entityType, input.entityId);
	const document = generateFrontmatter(canonicalMetadata(input), input.body);
	const canonical = extractFrontmatter(document);
	const metadata = canonical.metadata;
	const body = canonical.body;

	if (existing && input.expectedHash === undefined) {
		throw new ArtifactConflictError('expectedHash es obligatorio para actualizar un artefacto file-backed.');
	}
	if (existing && input.rootId !== undefined && input.rootId !== existing.rootId) {
		throw new ArtifactConflictError('Use relocate para cambiar el root de un artefacto existente.');
	}

	const rootId = existing?.rootId ?? input.rootId;
	if (!rootId) throw new ArtifactValidationError('rootId es obligatorio al externalizar un artefacto.');
	await assertTaxonomyRootExists(rootId);
	const relativePath = existing?.relativePath ?? canonicalRelativePath(input.entityType, input.entityId);
	const target = artifactPath(registry, { relativePath, rootId }, 'write');
	let previousContent: string | null = null;
	if (existing) {
		try {
			previousContent = await readArtifactFile(target);
		} catch (error) {
			if (!isRootError(error, 'ENOENT') && !isRootError(error, 'ROOT_PATH_NOT_FOUND')) throw error;
		}
	}
	if (existing && previousContent === null && !input.restoreMissing) {
		throw new ArtifactConflictError(
			'El archivo canónico está ausente; usa restoreMissing para recrearlo explícitamente.'
		);
	}
	if (existing && previousContent === null && input.expectedHash !== existing.contentHash) {
		throw new ArtifactConflictError('La proyección cambió desde la última lectura del archivo ausente.');
	}
	const write = await writeArtifactFile(target, document, {
		createOnly: !existing || previousContent === null,
		expectedHash: existing && previousContent !== null ? input.expectedHash : undefined,
	});

	try {
		await persistProjection({
			body,
			byteSize: write.byteSize,
			contentHash: write.contentHash,
			entityId: input.entityId,
			entityType: input.entityType,
			metadata,
			operational: input.operational,
			relativePath,
			rootId,
		});
	} catch (error) {
		if (previousContent === null) {
			await rmCreatedArtifactAfterDatabaseFailure(target, write.contentHash);
		} else {
			await writeArtifactFile(target, previousContent, { expectedHash: write.contentHash });
		}
		throw error;
	}

	const row = await getBinding(input.entityType, input.entityId);
	if (!row) throw new Error('TaxonomyArtifact no quedó persistido.');
	return toDocument(row, metadata, body);
}

/**
 * Keeps the mutation response self-contained for UI editors. The artifact and
 * entity projection were both committed before this read, so a later refresh
 * may fail independently without turning a confirmed save into an error.
 */
export async function saveTaxonomyArtifactWithEntity(
	registry: AuthorizedRootRegistry,
	input: SaveTaxonomyArtifactInput
): Promise<SaveTaxonomyArtifactResult> {
	const artifact = await saveTaxonomyArtifact(registry, input);
	const entity = await getEntityProjection(input.entityType, input.entityId);
	if (!entity) throw new Error('TaxonomyArtifact confirmó sin proyección legible.');
	return { ...artifact, entity };
}

async function rmCreatedArtifactAfterDatabaseFailure(path: ArtifactPathAuthority, expectedHash: string): Promise<void> {
	const quarantine = await quarantineArtifactFile(path, expectedHash);
	await commitQuarantinedArtifact(quarantine);
}

export async function deleteTaxonomyArtifactWithEntity(
	registry: AuthorizedRootRegistry,
	input: DeleteTaxonomyArtifactInput,
	deleteEntity: (beforeDelete?: (transaction: FavoriteWriteTransaction) => Promise<void>) => Promise<void>
): Promise<void> {
	const binding = await getBinding(input.entityType, input.entityId);
	if (!binding) throw new TaxonomyArtifactServiceError('ARTIFACT_NOT_FOUND', 'Artefacto no encontrado.', 404);
	const target = artifactPath(registry, { relativePath: binding.relativePath, rootId: binding.rootId }, 'delete');
	const deletionLedger: TaxonomyArtifactDeletionLedgerIdentity = {
		contentHash: input.expectedHash,
		entityId: input.entityId,
		entityType: input.entityType,
		nonce: randomUUID(),
		relativePath: binding.relativePath,
		rootId: binding.rootId,
	};
	const createTombstone = (): Promise<ArtifactDeletionTombstone> =>
		createArtifactDeletionTombstone(target, {
			...deletionLedger,
		});
	const assertStillMissing = async (): Promise<void> => {
		try {
			await readArtifactFile(target);
		} catch (error) {
			if (isRootError(error, 'ENOENT') || isRootError(error, 'ROOT_PATH_NOT_FOUND')) return;
			throw error;
		}
		throw new ArtifactConflictError('El archivo reapareció; recarga antes de borrar.');
	};
	if (input.deleteMissing) {
		if (binding.syncStatus !== 'missing' || binding.contentHash !== input.expectedHash) {
			throw new ArtifactConflictError('El binding ya no representa el archivo ausente confirmado por el editor.');
		}
		let tombstone: ArtifactDeletionTombstone | undefined;
		try {
			await deleteEntity(async (transaction) => {
				// This callback runs inside the entity deletion transaction. Recheck
				// absence after creating a durable claim so a visible reappearance
				// aborts before SQLite removes the identity.
				await assertStillMissing();
				tombstone = await createTombstone();
				await assertStillMissing();
				await createDeletionLedger(transaction, deletionLedger);
			});
		} catch (error) {
			if (tombstone) {
				try {
					await discardArtifactDeletionTombstone(tombstone);
				} catch {
					// A cleanup race leaves a durable marker for rebuild rather than
					// silently forgetting the interrupted delete.
				}
			}
			throw error;
		}
		// Keep the tombstone after commit. If an external file appears during the
		// unavoidable portable TOCTOU interval or after a crash, rebuild suppresses
		// re-adoption and reports the durable recovery state.
		return;
	}

	let tombstone: ArtifactDeletionTombstone | undefined;
	let quarantine: QuarantinedArtifact | undefined;
	let entityDeleted = false;
	try {
		tombstone = await createTombstone();
		quarantine = await quarantineArtifactFile(target, input.expectedHash);
		await deleteEntity((transaction) => createDeletionLedger(transaction, deletionLedger));
		entityDeleted = true;
	} catch (error) {
		if (quarantine && !entityDeleted) {
			try {
				await restoreQuarantinedArtifact(quarantine);
			} catch {
				throw error;
			}
		}
		if (tombstone && !entityDeleted) {
			try {
				await discardArtifactDeletionTombstone(tombstone);
			} catch {
				// Preserve a durable recovery record if its cleanup races.
			}
		}
		throw error;
	}
	// La transacción DB ya confirmó la eliminación. Si el cleanup falla, la cuarentena
	// queda deliberadamente para que rebuild la finalice; restaurar crearía un huérfano.
	await commitQuarantinedArtifact(quarantine);
}

function authoredMetadataFromBinding(binding: TaxonomyArtifactRow): AuthoredMetadata | null {
	try {
		const parsed = JSON.parse(binding.authoredMetadata) as AuthoredMetadata;
		const canonical = extractFrontmatter(generateFrontmatter(parsed, binding.indexedBody)).metadata;
		assertDocumentIdentity(canonical, binding.entityType as ArtifactFamily, binding.entityId);
		return canonical;
	} catch {
		return null;
	}
}

async function authoredMetadataFromProjection(binding: TaxonomyArtifactRow): Promise<AuthoredMetadata> {
	const stored = authoredMetadataFromBinding(binding);
	if (stored) return stored;

	const entityType = binding.entityType as ArtifactFamily;
	const entityId = binding.entityId;
	const identity = { id: entityId, kind: entityType, schemaVersion: 1 as const };
	switch (entityType) {
		case 'prompt': {
			const [row] = await db
				.select({
					category: prompts.category,
					color: prompts.color,
					description: prompts.description,
					emoji: prompts.emoji,
					metadata: prompts.metadata,
					name: prompts.name,
				})
				.from(prompts)
				.where(eq(prompts.id, entityId))
				.limit(1);
			let portable: { parameters?: ArtifactParameter[]; purpose?: string | null } = {};
			try {
				portable = row?.metadata ? JSON.parse(row.metadata) : {};
			} catch {
				portable = {};
			}
			return {
				...identity,
				category: row?.category ?? undefined,
				color: row?.color ?? undefined,
				emoji: row?.emoji ?? undefined,
				parameters: portable.parameters ?? [],
				purpose: portable.purpose ?? undefined,
				summary: row?.description ?? undefined,
				title: row?.name ?? binding.indexedTitle,
			};
		}
		case 'note': {
			const [row] = await db
				.select({ category: notes.category, title: notes.title })
				.from(notes)
				.where(eq(notes.id, entityId))
				.limit(1);
			return {
				...identity,
				category: row?.category,
				summary: binding.indexedSummary ?? undefined,
				title: row?.title ?? binding.indexedTitle,
			};
		}
		case 'wildcard': {
			const [row] = await db
				.select({
					category: wildcards.category,
					color: wildcards.color,
					description: wildcards.description,
					emoji: wildcards.emoji,
					name: wildcards.name,
				})
				.from(wildcards)
				.where(eq(wildcards.id, entityId))
				.limit(1);
			return {
				...identity,
				category: row?.category ?? undefined,
				color: row?.color ?? undefined,
				emoji: row?.emoji ?? undefined,
				summary: row?.description ?? undefined,
				title: row?.name ?? binding.indexedTitle,
			};
		}
	}
}

export async function readAndReconcileTaxonomyArtifact(
	registry: AuthorizedRootRegistry,
	entityType: ArtifactFamily,
	entityId: string
): Promise<TaxonomyArtifactDocument | null> {
	const binding = await getBinding(entityType, entityId);
	if (!binding) return null;
	const target = artifactPath(registry, { relativePath: binding.relativePath, rootId: binding.rootId }, 'read');
	let sync: Awaited<ReturnType<typeof checkArtifactChanged>>;
	try {
		sync = await checkArtifactChanged(target, binding.contentHash);
	} catch (error) {
		if ((error as { code?: string }).code === 'ROOT_PATH_NOT_FOUND') {
			await db
				.update(taxonomyArtifacts)
				.set({ syncStatus: 'missing' })
				.where(and(eq(taxonomyArtifacts.entityType, entityType), eq(taxonomyArtifacts.entityId, entityId)));
			const metadata = await authoredMetadataFromProjection(binding);
			return { ...toDocument(binding, metadata, binding.indexedBody), syncStatus: 'missing' };
		}
		throw error;
	}
	if (sync.content === null) {
		await db
			.update(taxonomyArtifacts)
			.set({ syncStatus: 'missing' })
			.where(and(eq(taxonomyArtifacts.entityType, entityType), eq(taxonomyArtifacts.entityId, entityId)));
		const metadata = await authoredMetadataFromProjection(binding);
		return { ...toDocument(binding, metadata, binding.indexedBody), syncStatus: 'missing' };
	}
	let parsed: ReturnType<typeof extractFrontmatter>;
	try {
		parsed = extractFrontmatter(sync.content);
		assertDocumentIdentity(parsed.metadata, entityType, entityId);
	} catch (error) {
		const syncStatus = error instanceof ArtifactConflictError ? 'conflict' : 'error';
		await db
			.update(taxonomyArtifacts)
			.set({ syncStatus })
			.where(and(eq(taxonomyArtifacts.entityType, entityType), eq(taxonomyArtifacts.entityId, entityId)));
		throw error;
	}
	const authoredMetadataNeedsBackfill = authoredMetadataFromBinding(binding) === null;
	if ((sync.needsReindex || authoredMetadataNeedsBackfill || binding.syncStatus !== 'synced') && sync.currentHash) {
		await persistProjection({
			body: parsed.body,
			byteSize: Buffer.byteLength(sync.content, 'utf8'),
			contentHash: sync.currentHash,
			entityId,
			entityType,
			metadata: parsed.metadata,
			relativePath: binding.relativePath,
			rootId: binding.rootId,
		});
	}
	const current = (await getBinding(entityType, entityId)) ?? binding;
	return toDocument(current, parsed.metadata, parsed.body);
}

export async function relocateTaxonomyArtifact(
	registry: AuthorizedRootRegistry,
	input: RelocateTaxonomyArtifactInput
): Promise<TaxonomyArtifactDocument> {
	if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}\.md$/.test(input.fileName)) {
		throw new ArtifactValidationError('fileName no cumple el contrato portable Markdown.');
	}
	const binding = await getBinding(input.entityType, input.entityId);
	if (!binding) throw new TaxonomyArtifactServiceError('ARTIFACT_NOT_FOUND', 'Artefacto no encontrado.', 404);
	const destinationPath = `taxonomy/${FAMILY_DIRECTORY[input.entityType]}/${input.fileName}`;
	const source = artifactPath(registry, { relativePath: binding.relativePath, rootId: binding.rootId }, 'write');
	const destination = artifactPath(registry, { relativePath: destinationPath, rootId: binding.rootId }, 'write');
	await renameArtifactFile(source, destination, input.expectedHash);
	try {
		const updated = await db
			.update(taxonomyArtifacts)
			.set({ relativePath: destinationPath })
			.where(
				and(
					eq(taxonomyArtifacts.entityType, input.entityType),
					eq(taxonomyArtifacts.entityId, input.entityId),
					eq(taxonomyArtifacts.rootId, binding.rootId),
					eq(taxonomyArtifacts.relativePath, binding.relativePath),
					eq(taxonomyArtifacts.contentHash, input.expectedHash)
				)
			)
			.returning({ entityId: taxonomyArtifacts.entityId });
		if (updated.length !== 1) {
			throw new ArtifactConflictError('El binding cambió durante el rename.');
		}
	} catch (error) {
		await renameArtifactFile(destination, source, input.expectedHash);
		throw error;
	}
	const document = await readAndReconcileTaxonomyArtifact(registry, input.entityType, input.entityId);
	if (!document) throw new Error('TaxonomyArtifact desapareció después del rename.');
	return document;
}

function boundedPage(value: number | undefined, fallback: number, max: number): number {
	return Number.isSafeInteger(value) && (value ?? -1) >= 0 ? Math.min(value ?? fallback, max) : fallback;
}

function escapedPattern(query: string): string {
	return `%${query.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_')}%`;
}

function escapedLike(column: SQLiteColumn, pattern: string): SQL<boolean> {
	return sql<boolean>`${column} LIKE ${pattern} ESCAPE '\\'`;
}

export async function searchTaxonomyArtifacts(input: SearchTaxonomyArtifactsInput): Promise<{
	data: TaxonomyArtifactRow[];
	limit: number;
	offset: number;
}> {
	const query = input.query.trim();
	if (!query || query.length > 512) throw new ArtifactValidationError('query no cumple el contrato de búsqueda.');
	const limit = boundedPage(input.limit, 50, 100);
	const offset = boundedPage(input.offset, 0, 1_000_000);
	if (input.authorizedRootIds.length === 0) return { data: [], limit, offset };
	const pattern = escapedPattern(query);
	const textPredicate = or(
		escapedLike(taxonomyArtifacts.indexedTitle, pattern),
		escapedLike(taxonomyArtifacts.indexedSummary, pattern),
		escapedLike(taxonomyArtifacts.indexedBody, pattern)
	);
	const authorizedRoots = inArray(taxonomyArtifacts.rootId, [...new Set(input.authorizedRootIds)]);
	const where = input.entityType
		? and(
				eq(taxonomyArtifacts.entityType, input.entityType),
				eq(taxonomyArtifacts.syncStatus, 'synced'),
				authorizedRoots,
				textPredicate
			)
		: and(eq(taxonomyArtifacts.syncStatus, 'synced'), authorizedRoots, textPredicate);
	const data = await db
		.select()
		.from(taxonomyArtifacts)
		.where(where)
		.orderBy(taxonomyArtifacts.indexedTitle, taxonomyArtifacts.entityId)
		.limit(limit)
		.offset(offset);
	return { data, limit, offset };
}

const MAX_DISCOVERED_ARTIFACTS = 10_000;
const PORTABLE_MARKDOWN_FILE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}\.md$/;
const QUARANTINE_FILE =
	/^\.(.+\.md)\.[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.quarantine$/i;
const DELETE_TOMBSTONE_FILE =
	/^\.(.+\.md)\.[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.delete-tombstone$/i;
const TEMPORARY_FILE = /^\.(.+\.md)\.[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.tmp$/i;

interface RebuildResult {
	adopted: number;
	conflict: number;
	error: number;
	finalizedDeletes: number;
	finalizedWrites: number;
	missing: number;
	quarantinedTemps: number;
	recoveredDeletes: number;
	relocated: number;
	suppressedReappearances: number;
	synced: number;
	tombstones: number;
	total: number;
}

function isRootError(error: unknown, code: string): boolean {
	return (error as { code?: string }).code === code;
}

function isMissingArtifactPath(error: unknown): boolean {
	return isRootError(error, 'ENOENT') || isRootError(error, 'ROOT_PATH_NOT_FOUND');
}

async function markBindingConflict(binding: TaxonomyArtifactRow | null): Promise<void> {
	if (!binding) return;
	await db
		.update(taxonomyArtifacts)
		.set({ syncStatus: 'conflict' })
		.where(and(eq(taxonomyArtifacts.entityType, binding.entityType), eq(taxonomyArtifacts.entityId, binding.entityId)));
}

/**
 * A deletion tombstone remains after the entity transaction commits. It blocks
 * automatic adoption when a file appears again after a missing-file delete or
 * a process crash. Active, unchanged bindings can clear an interrupted marker
 * only when the current root also grants delete permission.
 */
async function recoverDeletionTombstone(
	registry: AuthorizedRootRegistry,
	rootId: string,
	directoryPath: string,
	fileName: string,
	result: RebuildResult,
	conflicted: Set<string>,
	suppressed: Set<string>
): Promise<void> {
	const match = fileName.match(DELETE_TOMBSTONE_FILE);
	if (!match || !PORTABLE_MARKDOWN_FILE.test(match[1])) return;
	const tombstonePath = artifactPath(registry, { relativePath: `${directoryPath}/${fileName}`, rootId }, 'read');
	const tombstone = await readArtifactDeletionTombstone(tombstonePath);
	const originalRelativePath = `${directoryPath}/${match[1]}`;
	if (tombstone.original.relativePath !== originalRelativePath) {
		throw new ArtifactValidationError('La tombstone no pertenece al directorio de su artefacto.');
	}
	const ledger: TaxonomyArtifactDeletionLedgerIdentity = {
		contentHash: tombstone.contentHash,
		entityId: tombstone.entityId,
		entityType: tombstone.entityType,
		nonce: tombstone.nonce,
		relativePath: originalRelativePath,
		rootId,
	};
	if (!(await readDeletionLedger(ledger))) {
		// Disk markers are untrusted input. A copied or invented marker cannot
		// suppress an artifact unless this exact root/path/hash/nonce claim was
		// committed with the entity deletion.
		return;
	}
	const key = artifactRecoveryKey(rootId, originalRelativePath, tombstone.entityType, tombstone.entityId);
	result.tombstones += 1;
	const [binding, entityPresent] = await Promise.all([
		getBinding(tombstone.entityType, tombstone.entityId),
		targetExists(tombstone.entityType, tombstone.entityId),
	]);

	let originalContent: string | null = null;
	try {
		originalContent = await readArtifactFile(tombstone.original);
	} catch (error) {
		if (!isRootError(error, 'ENOENT') && !isRootError(error, 'ROOT_PATH_NOT_FOUND')) throw error;
	}

	if (
		binding &&
		entityPresent &&
		originalContent !== null &&
		computeArtifactHash(originalContent) === tombstone.contentHash
	) {
		const root = registry.list().find((candidate) => candidate.id === rootId);
		if (root?.permissions.includes('delete')) {
			const deletableTombstone = artifactPath(
				registry,
				{ relativePath: `${directoryPath}/${fileName}`, rootId },
				'delete'
			);
			await discardDeletionLedger(ledger);
			await discardArtifactDeletionTombstone({ ...tombstone, tombstone: deletableTombstone });
			return;
		}
	}

	// Either the entity was deleted (normal durable case), or an interrupted
	// deletion no longer has matching bytes. In both states rebuild must not
	// silently recreate a Wildcard or project stale Prompt/Note content.
	suppressed.add(key);
	if (originalContent !== null) result.suppressedReappearances += 1;
	if (binding) {
		await markBindingConflict(binding);
		conflicted.add(key);
		conflicted.add(artifactRecoveryKeyForBinding(binding));
		result.conflict += 1;
	}
}

async function recoverTemporaryArtifact(
	registry: AuthorizedRootRegistry,
	rootId: string,
	directoryPath: string,
	fileName: string,
	result: RebuildResult
): Promise<void> {
	const match = fileName.match(TEMPORARY_FILE);
	if (!match || !PORTABLE_MARKDOWN_FILE.test(match[1])) return;
	const root = registry.list().find((candidate) => candidate.id === rootId);
	if (!root?.permissions.includes('write')) {
		throw new TaxonomyArtifactServiceError(
			'ARTIFACT_TEMPORARY_RECOVERY_FORBIDDEN',
			'El root no concede escritura para poner staging temporal en cuarentena.',
			403
		);
	}
	const temporary = artifactPath(registry, { relativePath: `${directoryPath}/${fileName}`, rootId }, 'write');
	await quarantineTemporaryArtifact(temporary);
	result.quarantinedTemps += 1;
}

async function recoverQuarantine(
	registry: AuthorizedRootRegistry,
	rootId: string,
	directoryPath: string,
	fileName: string,
	result: RebuildResult,
	conflicted: Set<string>
): Promise<void> {
	const match = fileName.match(QUARANTINE_FILE);
	if (!match || !PORTABLE_MARKDOWN_FILE.test(match[1])) return;
	const quarantineRelativePath = `${directoryPath}/${fileName}`;
	const quarantinePath = artifactPath(registry, { relativePath: quarantineRelativePath, rootId }, 'delete');
	const content = await readArtifactFile(quarantinePath);
	const parsed = extractFrontmatter(content);
	if (!(parsed.metadata.kind && parsed.metadata.id))
		throw new ArtifactValidationError('Quarantine sin identidad portable.');
	const originalRelativePath = `${directoryPath}/${match[1]}`;
	const key = artifactRecoveryKey(rootId, originalRelativePath, parsed.metadata.kind, parsed.metadata.id);
	const binding = await getBinding(parsed.metadata.kind, parsed.metadata.id);
	const entityPresent = await targetExists(parsed.metadata.kind, parsed.metadata.id);
	const quarantine: QuarantinedArtifact = {
		contentHash: computeArtifactHash(content),
		original: artifactPath(registry, { relativePath: originalRelativePath, rootId }, 'write'),
		quarantine: quarantinePath,
	};

	if (binding && entityPresent && binding.rootId === rootId && binding.relativePath === originalRelativePath) {
		let installedContent: string | null = null;
		try {
			installedContent = await readArtifactFile(quarantine.original);
		} catch (error) {
			if (!isMissingArtifactPath(error)) throw error;
		}
		if (installedContent !== null) {
			try {
				const installed = extractFrontmatter(installedContent);
				assertDocumentIdentity(installed.metadata, parsed.metadata.kind, parsed.metadata.id);
			} catch {
				await markBindingConflict(binding);
				conflicted.add(key);
				conflicted.add(artifactRecoveryKeyForBinding(binding));
				result.conflict += 1;
				return;
			}
			await commitQuarantinedArtifact(quarantine);
			result.finalizedWrites += 1;
		} else {
			await restoreQuarantinedArtifact(quarantine);
			result.recoveredDeletes += 1;
		}
		return;
	}
	if (binding && entityPresent && binding.rootId === rootId && binding.relativePath !== originalRelativePath) {
		try {
			const installed = artifactPath(registry, { relativePath: binding.relativePath, rootId: binding.rootId }, 'read');
			const installedContent = await readArtifactFile(installed);
			const installedDocument = extractFrontmatter(installedContent);
			assertDocumentIdentity(installedDocument.metadata, parsed.metadata.kind, parsed.metadata.id);
			if (computeArtifactHash(installedContent) !== quarantine.contentHash) {
				throw new ArtifactConflictError('El destino del rename no conserva los bytes puestos en cuarentena.');
			}
			await commitQuarantinedArtifact(quarantine);
			result.finalizedWrites += 1;
		} catch {
			await markBindingConflict(binding);
			conflicted.add(key);
			conflicted.add(artifactRecoveryKeyForBinding(binding));
			result.conflict += 1;
		}
		return;
	}
	if (!binding && !entityPresent) {
		await commitQuarantinedArtifact(quarantine);
		result.finalizedDeletes += 1;
		return;
	}
	await markBindingConflict(binding);
	conflicted.add(key);
	if (binding) conflicted.add(artifactRecoveryKeyForBinding(binding));
	result.conflict += 1;
}

async function discoverArtifact(
	registry: AuthorizedRootRegistry,
	rootId: string,
	entityType: ArtifactFamily,
	relativePath: string,
	result: RebuildResult,
	conflicted: Set<string>,
	suppressed: Set<string>
): Promise<string | null> {
	const target = artifactPath(registry, { relativePath, rootId }, 'read');
	const content = await readArtifactFile(target);
	const parsed = extractFrontmatter(content);
	if (!(parsed.metadata.id && parsed.metadata.kind))
		throw new ArtifactValidationError('Artefacto sin identidad portable.');
	assertDocumentIdentity(parsed.metadata, entityType, parsed.metadata.id);
	const key = artifactRecoveryKey(rootId, relativePath, entityType, parsed.metadata.id);
	if (suppressed.has(key)) return null;
	if (conflicted.has(key)) {
		await markBindingConflict(await getBinding(entityType, parsed.metadata.id));
		return null;
	}
	const entityPresent = await targetExists(entityType, parsed.metadata.id);
	if (!entityPresent && entityType !== 'wildcard') {
		throw new TaxonomyArtifactServiceError(
			'ARTIFACT_TARGET_NOT_FOUND',
			'El artefacto descubierto no tiene entidad taxonomy.',
			404
		);
	}

	const binding = await getBinding(entityType, parsed.metadata.id);
	if (binding && (binding.rootId !== rootId || binding.relativePath !== relativePath)) {
		try {
			await registry.resolve({ relativePath: binding.relativePath, rootId: binding.rootId }, 'read', 'existing');
			conflicted.add(key);
			conflicted.add(artifactRecoveryKeyForBinding(binding));
			await markBindingConflict(binding);
			result.conflict += 1;
			return null;
		} catch (error) {
			if (!isRootError(error, 'ROOT_PATH_NOT_FOUND')) throw error;
			result.relocated += 1;
		}
	} else if (!binding) {
		result.adopted += 1;
	}

	await persistProjection({
		body: parsed.body,
		byteSize: Buffer.byteLength(content, 'utf8'),
		contentHash: computeArtifactHash(content),
		createMissingWildcard: !entityPresent && entityType === 'wildcard',
		entityId: parsed.metadata.id,
		entityType,
		metadata: parsed.metadata,
		relativePath,
		rootId,
	});
	return key;
}

async function discoverTaxonomyArtifacts(
	registry: AuthorizedRootRegistry,
	entityTypes: ArtifactFamily[],
	result: RebuildResult
): Promise<{ conflicted: Set<string>; seen: Set<string>; suppressed: Set<string> }> {
	const seen = new Set<string>();
	const conflicted = new Set<string>();
	const suppressed = new Set<string>();
	let discovered = 0;
	const persistedRootIds = new Set(
		(await db.select({ id: mediaRoots.id }).from(mediaRoots)).map((row: { id: string }) => row.id)
	);

	for (const root of registry.list()) {
		if (!(persistedRootIds.has(root.id) && root.permissions.includes('index') && root.permissions.includes('read'))) {
			continue;
		}
		for (const entityType of entityTypes) {
			const directoryPath = `taxonomy/${FAMILY_DIRECTORY[entityType]}`;
			let directory: Awaited<ReturnType<AuthorizedRootRegistry['resolve']>>;
			try {
				directory = await registry.resolve({ relativePath: directoryPath, rootId: root.id }, 'index', 'existing');
			} catch (error) {
				if (isRootError(error, 'ROOT_PATH_NOT_FOUND')) continue;
				throw error;
			}
			const discoveredEntries = (await readdir(directory.absolutePath, { withFileTypes: true })).filter(
				(entry) =>
					entry.isFile() &&
					(PORTABLE_MARKDOWN_FILE.test(entry.name) ||
						QUARANTINE_FILE.test(entry.name) ||
						DELETE_TOMBSTONE_FILE.test(entry.name) ||
						TEMPORARY_FILE.test(entry.name))
			);
			for (const entry of discoveredEntries) {
				discovered += 1;
				if (discovered > MAX_DISCOVERED_ARTIFACTS) {
					throw new ArtifactValidationError(`Rebuild excede ${MAX_DISCOVERED_ARTIFACTS} archivos gobernados.`);
				}
			}

			const markdownEntries = discoveredEntries.filter((entry) => PORTABLE_MARKDOWN_FILE.test(entry.name));
			const quarantineEntries = discoveredEntries.filter((entry) => QUARANTINE_FILE.test(entry.name));
			const tombstoneEntries = discoveredEntries.filter((entry) => DELETE_TOMBSTONE_FILE.test(entry.name));
			const temporaryEntries = discoveredEntries.filter((entry) => TEMPORARY_FILE.test(entry.name));
			for (const entry of [...tombstoneEntries, ...temporaryEntries, ...markdownEntries, ...quarantineEntries]) {
				const isQuarantine = QUARANTINE_FILE.test(entry.name);
				const isTombstone = DELETE_TOMBSTONE_FILE.test(entry.name);
				const isTemporary = TEMPORARY_FILE.test(entry.name);
				const relativePath = `${directoryPath}/${entry.name}`;
				try {
					if (isTombstone) {
						await recoverDeletionTombstone(
							registry,
							root.id,
							directoryPath,
							entry.name,
							result,
							conflicted,
							suppressed
						);
						continue;
					}
					if (isTemporary) {
						await recoverTemporaryArtifact(registry, root.id, directoryPath, entry.name, result);
						continue;
					}
					if (isQuarantine) {
						await recoverQuarantine(registry, root.id, directoryPath, entry.name, result, conflicted);
						continue;
					}
					const key = await discoverArtifact(
						registry,
						root.id,
						entityType,
						relativePath,
						result,
						conflicted,
						suppressed
					);
					if (key) seen.add(key);
				} catch {
					if (!isQuarantine) {
						const [binding] = await db
							.select({ entityId: taxonomyArtifacts.entityId })
							.from(taxonomyArtifacts)
							.where(and(eq(taxonomyArtifacts.rootId, root.id), eq(taxonomyArtifacts.relativePath, relativePath)))
							.limit(1);
						if (binding) continue;
					}
					result.error += 1;
				}
			}
		}
	}
	for (const key of [...conflicted, ...suppressed]) seen.delete(key);
	return { conflicted, seen, suppressed };
}

export async function rebuildTaxonomyArtifactIndex(
	registry: AuthorizedRootRegistry,
	entityType?: ArtifactFamily
): Promise<RebuildResult> {
	const entityTypes: ArtifactFamily[] = entityType ? [entityType] : ['prompt', 'note', 'wildcard'];
	const result: RebuildResult = {
		adopted: 0,
		conflict: 0,
		error: 0,
		finalizedDeletes: 0,
		finalizedWrites: 0,
		missing: 0,
		quarantinedTemps: 0,
		recoveredDeletes: 0,
		relocated: 0,
		suppressedReappearances: 0,
		synced: 0,
		tombstones: 0,
		total: 0,
	};
	const discovered = await discoverTaxonomyArtifacts(registry, entityTypes, result);
	const authorizedRootIds = authorizedTaxonomyRootIds(registry);
	if (authorizedRootIds.length === 0) return result;
	const authorizedRoots = inArray(taxonomyArtifacts.rootId, authorizedRootIds);
	const rows = entityType
		? await db
				.select()
				.from(taxonomyArtifacts)
				.where(and(eq(taxonomyArtifacts.entityType, entityType), authorizedRoots))
		: await db.select().from(taxonomyArtifacts).where(authorizedRoots);
	result.total = rows.length;

	for (const row of rows) {
		const rowType = row.entityType as ArtifactFamily;
		const key = artifactRecoveryKey(row.rootId, row.relativePath, rowType, row.entityId);
		if (discovered.conflicted.has(key) || discovered.suppressed.has(key)) continue;
		if (discovered.seen.has(key)) {
			result.synced += 1;
			continue;
		}
		try {
			const document = await readAndReconcileTaxonomyArtifact(registry, rowType, row.entityId);
			if (document?.syncStatus === 'missing') result.missing += 1;
			else result.synced += 1;
		} catch (error) {
			const syncStatus = error instanceof ArtifactConflictError ? 'conflict' : 'error';
			result[syncStatus] += 1;
			await db
				.update(taxonomyArtifacts)
				.set({ syncStatus })
				.where(and(eq(taxonomyArtifacts.entityType, rowType), eq(taxonomyArtifacts.entityId, row.entityId)));
		}
	}
	return result;
}

export function parseArtifactParameters(metadata: AuthoredMetadata): ArtifactParameter[] {
	return metadata.parameters ?? [];
}

export function artifactReference(row: TaxonomyArtifactRow): AuthorizedPathReference {
	return { relativePath: row.relativePath, rootId: row.rootId };
}

export async function assertTaxonomyRootExists(rootId: string): Promise<void> {
	const [root] = await db.select({ id: mediaRoots.id }).from(mediaRoots).where(eq(mediaRoots.id, rootId)).limit(1);
	if (!root) throw new ArtifactValidationError('rootId no pertenece al catálogo persistente.');
}
