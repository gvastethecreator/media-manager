import { readdir } from "node:fs/promises";
import { and, eq, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import type { SQLiteColumn } from "drizzle-orm/sqlite-core";
import { db } from "@/lib/drizzle";
import { mediaRoots } from "@/lib/drizzle/schema/media-core/assets";
import { notes } from "@/lib/drizzle/schema/taxonomy/notes";
import { prompts } from "@/lib/drizzle/schema/taxonomy/prompts";
import { taxonomyArtifacts } from "@/lib/drizzle/schema/taxonomy/artifacts";
import { wildcards } from "@/lib/drizzle/schema/taxonomy/wildcards";
import type { AuthorizedPathReference, AuthorizedRootRegistry } from "@/server/security/authorized-roots";
import type { FavoriteWriteTransaction } from "@/services/favorite/favorite-write-transaction";
import {
	ArtifactConflictError,
	ArtifactValidationError,
	type ArtifactFamily,
	type ArtifactParameter,
	type AuthoredMetadata,
	checkArtifactChanged,
	computeArtifactHash,
	extractFrontmatter,
	generateFrontmatter,
	commitQuarantinedArtifact,
	quarantineArtifactFile,
	readArtifactFile,
	renameArtifactFile,
	restoreQuarantinedArtifact,
	writeArtifactFile,
	type QuarantinedArtifact,
} from "./file-backed.service";

const FAMILY_DIRECTORY: Record<ArtifactFamily, string> = {
	note: "notes",
	prompt: "prompts",
	wildcard: "wildcards",
};

type TaxonomyArtifactRow = typeof taxonomyArtifacts.$inferSelect;

export interface TaxonomyArtifactDocument {
	body: string;
	byteSize: number;
	contentHash: string;
	entityId: string;
	entityType: ArtifactFamily;
	metadata: AuthoredMetadata;
	relativePath: string;
	rootId: string;
	syncStatus: TaxonomyArtifactRow["syncStatus"];
}

export interface SaveTaxonomyArtifactInput {
	body: string;
	entityId: string;
	entityType: ArtifactFamily;
	expectedHash?: string;
	metadata: Omit<AuthoredMetadata, "id" | "kind" | "schemaVersion">;
	operational?: {
		featuredImage?: string | null;
		parentId?: string | null;
		shortcut?: string | null;
	};
	rootId?: string;
}

export interface RelocateTaxonomyArtifactInput {
	entityId: string;
	entityType: ArtifactFamily;
	expectedHash: string;
	fileName: string;
}

export interface DeleteTaxonomyArtifactInput {
	entityId: string;
	entityType: ArtifactFamily;
	expectedHash: string;
}

export interface SearchTaxonomyArtifactsInput {
	entityType?: ArtifactFamily;
	limit?: number;
	offset?: number;
	query: string;
}

export class TaxonomyArtifactServiceError extends Error {
	readonly code: "ARTIFACT_NOT_FOUND" | "ARTIFACT_TARGET_NOT_FOUND" | "ARTIFACT_VALIDATION";
	readonly status: number;

	constructor(code: TaxonomyArtifactServiceError["code"], message: string, status: number) {
		super(message);
		this.name = "TaxonomyArtifactServiceError";
		this.code = code;
		this.status = status;
	}
}

function canonicalRelativePath(entityType: ArtifactFamily, entityId: string): string {
	if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(entityId)) {
		throw new ArtifactValidationError("entityId no cumple el contrato portable.");
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
		throw new ArtifactConflictError("La identidad portable del archivo no coincide con su binding.");
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

export async function assertInlineTaxonomyMutationAllowed(entityType: ArtifactFamily, entityId: string): Promise<void> {
	if (await getBinding(entityType, entityId)) {
		throw new ArtifactConflictError(
			"La entidad es file-backed; use /api/taxonomy-artifacts para modificar contenido o lifecycle.",
		);
	}
}

async function targetExists(entityType: ArtifactFamily, entityId: string): Promise<boolean> {
	let exists = false;
	switch (entityType) {
		case "prompt":
			exists = Boolean((await db.select({ id: prompts.id }).from(prompts).where(eq(prompts.id, entityId)).limit(1))[0]);
			break;
		case "note":
			exists = Boolean((await db.select({ id: notes.id }).from(notes).where(eq(notes.id, entityId)).limit(1))[0]);
			break;
		case "wildcard":
			exists = Boolean(
				(await db.select({ id: wildcards.id }).from(wildcards).where(eq(wildcards.id, entityId)).limit(1))[0],
			);
			break;
	}
	return exists;
}

async function assertTargetExists(entityType: ArtifactFamily, entityId: string): Promise<void> {
	if (!(await targetExists(entityType, entityId))) {
		throw new TaxonomyArtifactServiceError("ARTIFACT_TARGET_NOT_FOUND", "La entidad taxonomy no existe.", 404);
	}
}

async function applyEntityProjection(
	writer: Pick<typeof db, "update"> | FavoriteWriteTransaction,
	entityType: ArtifactFamily,
	entityId: string,
	metadata: AuthoredMetadata,
	body: string,
	operational?: SaveTaxonomyArtifactInput["operational"],
): Promise<void> {
	switch (entityType) {
		case "prompt":
			await writer
				.update(prompts)
				.set({
					category: metadata.category ?? null,
					color: metadata.color ?? null,
					content: body,
					description: metadata.summary ?? null,
					emoji: metadata.emoji ?? null,
					metadata: JSON.stringify({ parameters: metadata.parameters ?? [], purpose: metadata.purpose ?? null }),
					name: metadata.title,
				})
				.where(eq(prompts.id, entityId));
			break;
		case "note":
			await writer
				.update(notes)
				.set({ category: metadata.category ?? "general", content: body, title: metadata.title })
				.where(eq(notes.id, entityId));
			break;
		case "wildcard":
			await writer
				.update(wildcards)
				.set({
					category: metadata.category ?? null,
					children: JSON.stringify(body.split("\n")),
					color: metadata.color ?? null,
					description: metadata.summary ?? null,
					emoji: metadata.emoji ?? null,
					...(operational?.featuredImage !== undefined ? { featuredImage: operational.featuredImage } : {}),
					name: metadata.title,
					...(operational?.parentId !== undefined ? { parentId: operational.parentId } : {}),
					...(operational?.shortcut !== undefined ? { shortcut: operational.shortcut } : {}),
				})
				.where(eq(wildcards.id, entityId));
			break;
	}
}

async function persistProjection(input: {
	body: string;
	byteSize: number;
	contentHash: string;
	entityId: string;
	entityType: ArtifactFamily;
	metadata: AuthoredMetadata;
	operational?: SaveTaxonomyArtifactInput["operational"];
	relativePath: string;
	rootId: string;
}): Promise<void> {
	await db.transaction(async (tx: FavoriteWriteTransaction) => {
		await tx
			.insert(taxonomyArtifacts)
			.values({
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
				syncStatus: "synced",
			})
			.onConflictDoUpdate({
				set: {
					byteSize: input.byteSize,
					contentHash: input.contentHash,
					indexedBody: input.body,
					indexedSummary: input.metadata.summary ?? null,
					indexedTitle: input.metadata.title,
					lastSyncedAt: new Date(),
					relativePath: input.relativePath,
					rootId: input.rootId,
					syncStatus: "synced",
				},
				target: [taxonomyArtifacts.entityType, taxonomyArtifacts.entityId],
			});
		await applyEntityProjection(tx, input.entityType, input.entityId, input.metadata, input.body, input.operational);
	});
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
	input: SaveTaxonomyArtifactInput,
): Promise<TaxonomyArtifactDocument> {
	if (input.entityType !== "wildcard" && input.operational !== undefined) {
		throw new ArtifactValidationError("operational sólo está permitido para Wildcard.");
	}
	await assertTargetExists(input.entityType, input.entityId);
	const existing = await getBinding(input.entityType, input.entityId);
	const document = generateFrontmatter(canonicalMetadata(input), input.body);
	const canonical = extractFrontmatter(document);
	const metadata = canonical.metadata;
	const body = canonical.body;

	if (existing && input.expectedHash === undefined) {
		throw new ArtifactConflictError("expectedHash es obligatorio para actualizar un artefacto file-backed.");
	}
	if (existing && input.rootId !== undefined && input.rootId !== existing.rootId) {
		throw new ArtifactConflictError("Use relocate para cambiar el root de un artefacto existente.");
	}

	const rootId = existing?.rootId ?? input.rootId;
	if (!rootId) throw new ArtifactValidationError("rootId es obligatorio al externalizar un artefacto.");
	await assertTaxonomyRootExists(rootId);
	const relativePath = existing?.relativePath ?? canonicalRelativePath(input.entityType, input.entityId);
	const resolved = await registry.resolve({ relativePath, rootId }, "write", "create");
	const previousContent = existing ? await readArtifactFile(resolved.absolutePath) : null;
	const write = await writeArtifactFile(resolved.absolutePath, document, {
		createOnly: !existing,
		expectedHash: existing ? input.expectedHash : undefined,
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
			await rmCreatedArtifactAfterDatabaseFailure(resolved.absolutePath, write.contentHash);
		} else {
			await writeArtifactFile(resolved.absolutePath, previousContent, { expectedHash: write.contentHash });
		}
		throw error;
	}

	const row = await getBinding(input.entityType, input.entityId);
	if (!row) throw new Error("TaxonomyArtifact no quedó persistido.");
	return toDocument(row, metadata, body);
}

async function rmCreatedArtifactAfterDatabaseFailure(filePath: string, expectedHash: string): Promise<void> {
	const quarantine = await quarantineArtifactFile(filePath, expectedHash);
	await commitQuarantinedArtifact(quarantine);
}

export async function deleteTaxonomyArtifactWithEntity(
	registry: AuthorizedRootRegistry,
	input: DeleteTaxonomyArtifactInput,
	deleteEntity: () => Promise<void>,
): Promise<void> {
	const binding = await getBinding(input.entityType, input.entityId);
	if (!binding) throw new TaxonomyArtifactServiceError("ARTIFACT_NOT_FOUND", "Artefacto no encontrado.", 404);
	const resolved = await registry.resolve(
		{ relativePath: binding.relativePath, rootId: binding.rootId },
		"delete",
		"existing",
	);
	const quarantine = await quarantineArtifactFile(resolved.absolutePath, input.expectedHash);
	try {
		await deleteEntity();
		await commitQuarantinedArtifact(quarantine);
	} catch (error) {
		await restoreQuarantinedArtifact(quarantine);
		throw error;
	}
}

export async function readAndReconcileTaxonomyArtifact(
	registry: AuthorizedRootRegistry,
	entityType: ArtifactFamily,
	entityId: string,
): Promise<TaxonomyArtifactDocument | null> {
	const binding = await getBinding(entityType, entityId);
	if (!binding) return null;
	let resolved: Awaited<ReturnType<AuthorizedRootRegistry["resolve"]>>;
	try {
		resolved = await registry.resolve(
			{ relativePath: binding.relativePath, rootId: binding.rootId },
			"read",
			"existing",
		);
	} catch (error) {
		if ((error as { code?: string }).code === "ROOT_PATH_NOT_FOUND") {
			await db
				.update(taxonomyArtifacts)
				.set({ syncStatus: "missing" })
				.where(and(eq(taxonomyArtifacts.entityType, entityType), eq(taxonomyArtifacts.entityId, entityId)));
			return { ...toDocument(binding, { title: binding.indexedTitle }, binding.indexedBody), syncStatus: "missing" };
		}
		throw error;
	}

	const sync = await checkArtifactChanged(resolved.absolutePath, binding.contentHash);
	if (sync.content === null) {
		await db
			.update(taxonomyArtifacts)
			.set({ syncStatus: "missing" })
			.where(and(eq(taxonomyArtifacts.entityType, entityType), eq(taxonomyArtifacts.entityId, entityId)));
		return { ...toDocument(binding, { title: binding.indexedTitle }, binding.indexedBody), syncStatus: "missing" };
	}
	const parsed = extractFrontmatter(sync.content);
	assertDocumentIdentity(parsed.metadata, entityType, entityId);
	if (sync.needsReindex && sync.currentHash) {
		await persistProjection({
			body: parsed.body,
			byteSize: Buffer.byteLength(sync.content, "utf8"),
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
	input: RelocateTaxonomyArtifactInput,
): Promise<TaxonomyArtifactDocument> {
	if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}\.md$/.test(input.fileName)) {
		throw new ArtifactValidationError("fileName no cumple el contrato portable Markdown.");
	}
	const binding = await getBinding(input.entityType, input.entityId);
	if (!binding) throw new TaxonomyArtifactServiceError("ARTIFACT_NOT_FOUND", "Artefacto no encontrado.", 404);
	const destinationPath = `taxonomy/${FAMILY_DIRECTORY[input.entityType]}/${input.fileName}`;
	const source = await registry.resolve(
		{ relativePath: binding.relativePath, rootId: binding.rootId },
		"write",
		"existing",
	);
	const destination = await registry.resolve(
		{ relativePath: destinationPath, rootId: binding.rootId },
		"write",
		"create",
	);
	await renameArtifactFile(source.absolutePath, destination.absolutePath, input.expectedHash);
	try {
		await db
			.update(taxonomyArtifacts)
			.set({ relativePath: destinationPath })
			.where(and(eq(taxonomyArtifacts.entityType, input.entityType), eq(taxonomyArtifacts.entityId, input.entityId)));
	} catch (error) {
		await renameArtifactFile(destination.absolutePath, source.absolutePath, input.expectedHash);
		throw error;
	}
	const document = await readAndReconcileTaxonomyArtifact(registry, input.entityType, input.entityId);
	if (!document) throw new Error("TaxonomyArtifact desapareció después del rename.");
	return document;
}

function boundedPage(value: number | undefined, fallback: number, max: number): number {
	return Number.isSafeInteger(value) && (value ?? -1) >= 0 ? Math.min(value ?? fallback, max) : fallback;
}

function escapedPattern(query: string): string {
	return `%${query.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
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
	if (!query || query.length > 512) throw new ArtifactValidationError("query no cumple el contrato de búsqueda.");
	const limit = boundedPage(input.limit, 50, 100);
	const offset = boundedPage(input.offset, 0, 1_000_000);
	const pattern = escapedPattern(query);
	const textPredicate = or(
		escapedLike(taxonomyArtifacts.indexedTitle, pattern),
		escapedLike(taxonomyArtifacts.indexedSummary, pattern),
		escapedLike(taxonomyArtifacts.indexedBody, pattern),
	);
	const where = input.entityType
		? and(eq(taxonomyArtifacts.entityType, input.entityType), textPredicate)
		: textPredicate;
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

interface RebuildResult {
	adopted: number;
	conflict: number;
	error: number;
	finalizedDeletes: number;
	missing: number;
	recoveredDeletes: number;
	relocated: number;
	synced: number;
	total: number;
}

function isRootError(error: unknown, code: string): boolean {
	return (error as { code?: string }).code === code;
}

async function markBindingConflict(binding: TaxonomyArtifactRow | null): Promise<void> {
	if (!binding) return;
	await db
		.update(taxonomyArtifacts)
		.set({ syncStatus: "conflict" })
		.where(and(eq(taxonomyArtifacts.entityType, binding.entityType), eq(taxonomyArtifacts.entityId, binding.entityId)));
}

async function recoverQuarantine(
	registry: AuthorizedRootRegistry,
	rootId: string,
	directoryPath: string,
	fileName: string,
	result: RebuildResult,
): Promise<void> {
	const match = fileName.match(QUARANTINE_FILE);
	if (!match || !PORTABLE_MARKDOWN_FILE.test(match[1])) return;
	const quarantineRelativePath = `${directoryPath}/${fileName}`;
	const quarantineResolved = await registry.resolve(
		{ relativePath: quarantineRelativePath, rootId },
		"delete",
		"existing",
	);
	const content = await readArtifactFile(quarantineResolved.absolutePath);
	const parsed = extractFrontmatter(content);
	if (!(parsed.metadata.kind && parsed.metadata.id))
		throw new ArtifactValidationError("Quarantine sin identidad portable.");
	const binding = await getBinding(parsed.metadata.kind, parsed.metadata.id);
	const entityPresent = await targetExists(parsed.metadata.kind, parsed.metadata.id);
	const originalRelativePath = `${directoryPath}/${match[1]}`;
	const quarantine: QuarantinedArtifact = {
		contentHash: computeArtifactHash(content),
		originalPath: (await registry.resolve({ relativePath: originalRelativePath, rootId }, "write", "create"))
			.absolutePath,
		quarantinePath: quarantineResolved.absolutePath,
	};

	if (binding && entityPresent && binding.rootId === rootId && binding.relativePath === originalRelativePath) {
		await restoreQuarantinedArtifact(quarantine);
		result.recoveredDeletes += 1;
		return;
	}
	if (!binding && !entityPresent) {
		await commitQuarantinedArtifact(quarantine);
		result.finalizedDeletes += 1;
		return;
	}
	await markBindingConflict(binding);
	result.conflict += 1;
}

async function discoverArtifact(
	registry: AuthorizedRootRegistry,
	rootId: string,
	entityType: ArtifactFamily,
	relativePath: string,
	result: RebuildResult,
): Promise<string | null> {
	const resolved = await registry.resolve({ relativePath, rootId }, "read", "existing");
	const content = await readArtifactFile(resolved.absolutePath);
	const parsed = extractFrontmatter(content);
	if (!(parsed.metadata.id && parsed.metadata.kind))
		throw new ArtifactValidationError("Artefacto sin identidad portable.");
	assertDocumentIdentity(parsed.metadata, entityType, parsed.metadata.id);
	if (!(await targetExists(entityType, parsed.metadata.id))) {
		throw new TaxonomyArtifactServiceError(
			"ARTIFACT_TARGET_NOT_FOUND",
			"El artefacto descubierto no tiene entidad taxonomy.",
			404,
		);
	}

	const binding = await getBinding(entityType, parsed.metadata.id);
	if (binding && (binding.rootId !== rootId || binding.relativePath !== relativePath)) {
		try {
			await registry.resolve({ relativePath: binding.relativePath, rootId: binding.rootId }, "read", "existing");
			await markBindingConflict(binding);
			result.conflict += 1;
			return null;
		} catch (error) {
			if (!isRootError(error, "ROOT_PATH_NOT_FOUND")) throw error;
			result.relocated += 1;
		}
	} else if (!binding) {
		result.adopted += 1;
	}

	await persistProjection({
		body: parsed.body,
		byteSize: Buffer.byteLength(content, "utf8"),
		contentHash: computeArtifactHash(content),
		entityId: parsed.metadata.id,
		entityType,
		metadata: parsed.metadata,
		relativePath,
		rootId,
	});
	return `${entityType}:${parsed.metadata.id}`;
}

async function discoverTaxonomyArtifacts(
	registry: AuthorizedRootRegistry,
	entityTypes: ArtifactFamily[],
	result: RebuildResult,
): Promise<Set<string>> {
	const seen = new Set<string>();
	let discovered = 0;
	const persistedRootIds = new Set(
		(await db.select({ id: mediaRoots.id }).from(mediaRoots)).map((row: { id: string }) => row.id),
	);

	for (const root of registry.list()) {
		if (!(persistedRootIds.has(root.id) && root.permissions.includes("index") && root.permissions.includes("read"))) {
			continue;
		}
		for (const entityType of entityTypes) {
			const directoryPath = `taxonomy/${FAMILY_DIRECTORY[entityType]}`;
			let directory: Awaited<ReturnType<AuthorizedRootRegistry["resolve"]>>;
			try {
				directory = await registry.resolve({ relativePath: directoryPath, rootId: root.id }, "index", "existing");
			} catch (error) {
				if (isRootError(error, "ROOT_PATH_NOT_FOUND")) continue;
				throw error;
			}
			for (const entry of await readdir(directory.absolutePath, { withFileTypes: true })) {
				if (!entry.isFile()) continue;
				if (PORTABLE_MARKDOWN_FILE.test(entry.name)) {
					discovered += 1;
					if (discovered > MAX_DISCOVERED_ARTIFACTS) {
						throw new ArtifactValidationError(`Rebuild excede ${MAX_DISCOVERED_ARTIFACTS} archivos gobernados.`);
					}
				}
				try {
					if (QUARANTINE_FILE.test(entry.name)) {
						await recoverQuarantine(registry, root.id, directoryPath, entry.name, result);
						continue;
					}
					if (!PORTABLE_MARKDOWN_FILE.test(entry.name)) continue;
					const key = await discoverArtifact(registry, root.id, entityType, `${directoryPath}/${entry.name}`, result);
					if (key) seen.add(key);
				} catch {
					result.error += 1;
				}
			}
		}
	}
	return seen;
}

export async function rebuildTaxonomyArtifactIndex(
	registry: AuthorizedRootRegistry,
	entityType?: ArtifactFamily,
): Promise<RebuildResult> {
	const entityTypes: ArtifactFamily[] = entityType ? [entityType] : ["prompt", "note", "wildcard"];
	const result: RebuildResult = {
		adopted: 0,
		conflict: 0,
		error: 0,
		finalizedDeletes: 0,
		missing: 0,
		recoveredDeletes: 0,
		relocated: 0,
		synced: 0,
		total: 0,
	};
	const discovered = await discoverTaxonomyArtifacts(registry, entityTypes, result);
	const rows = entityType
		? await db.select().from(taxonomyArtifacts).where(eq(taxonomyArtifacts.entityType, entityType))
		: await db.select().from(taxonomyArtifacts);
	result.total = rows.length;

	for (const row of rows) {
		const rowType = row.entityType as ArtifactFamily;
		if (discovered.has(`${rowType}:${row.entityId}`)) {
			result.synced += 1;
			continue;
		}
		try {
			const document = await readAndReconcileTaxonomyArtifact(registry, rowType, row.entityId);
			if (document?.syncStatus === "missing") result.missing += 1;
			else result.synced += 1;
		} catch (error) {
			const syncStatus = error instanceof ArtifactConflictError ? "conflict" : "error";
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
	if (!root) throw new ArtifactValidationError("rootId no pertenece al catálogo persistente.");
}
