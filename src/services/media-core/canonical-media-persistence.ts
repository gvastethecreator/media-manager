import { extname, resolve } from 'node:path';
import { and, eq, inArray, isNull, notInArray, or } from 'drizzle-orm';
import type { AnySQLiteColumn } from 'drizzle-orm/sqlite-core';
import { db } from '@/lib/drizzle';
import { getAuthorizedPathProof } from '@/lib/filesystem/authorized-path-proof';
import { isPathInsideDirectory } from '@/lib/filesystem/path-containment';
import { assets, sourceFiles } from '@/lib/drizzle/schema/media-core/assets';
import { folders } from '@/lib/drizzle/schema/organization/folders';
import { serverLogger } from '@/lib/logger/server-logger';

const logger = serverLogger.withContext('CanonicalMediaPersistence');
const SHA256_HEX = /^[0-9a-f]{64}$/;
const ROOT_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;
const WINDOWS_DEVICE_NAME = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i;
const ENCODED_PATH_TOKEN = /%(?:[0-9a-fA-F]{2})/;

export const CANONICAL_MEDIA_TYPES = ['image', 'video', 'audio', 'document', 'json', 'file3d'] as const;
export type CanonicalMediaType = (typeof CANONICAL_MEDIA_TYPES)[number];
export const CANONICAL_MEDIA_STATES = ['canonical', 'legacy_only', 'diverged'] as const;
export type CanonicalMediaState = (typeof CANONICAL_MEDIA_STATES)[number];

export interface CanonicalMediaSourceInput {
	fileCreatedAt?: Date | null;
	fileIdentity?: string | null;
	fileModifiedAt?: Date | null;
	mimeType?: string | null;
	relativePath: string;
	rootId: string;
}

export interface CanonicalMediaCreateCommand {
	assetType: CanonicalMediaType;
	folderId: string;
	hash: string;
	name: string;
	path: string;
	size: number;
	source: CanonicalMediaSourceInput;
}

export interface CanonicalMediaInsertContext {
	assetId: string;
	now: Date;
	sourceFileId: string;
	transaction: typeof db;
}

export interface CanonicalMediaRow {
	assetId: string | null;
	folderId: string;
	hash: string;
	id: string;
	name: string;
	path: string;
	size: number;
}

export type CanonicallyProjectedMedia<T extends CanonicalMediaRow> = T & {
	canonicalDivergences: string[];
	canonicalState: CanonicalMediaState;
	legacyId: string;
};

type CanonicalReadMetrics = {
	canonical: number;
	diverged: number;
	legacyOnly: number;
	reads: number;
};

const metricsByType = new Map<CanonicalMediaType, CanonicalReadMetrics>();

function metricsFor(assetType: CanonicalMediaType): CanonicalReadMetrics {
	const existing = metricsByType.get(assetType);
	if (existing) return existing;
	const created = { canonical: 0, diverged: 0, legacyOnly: 0, reads: 0 };
	metricsByType.set(assetType, created);
	return created;
}

function validateRelativePath(relativePath: string): void {
	if (
		relativePath.length < 1 ||
		relativePath.length > 2048 ||
		relativePath !== relativePath.trim() ||
		relativePath.startsWith('/') ||
		relativePath.includes('\\') ||
		relativePath.includes(':') ||
		relativePath.includes('\0') ||
		relativePath.includes('//') ||
		ENCODED_PATH_TOKEN.test(relativePath)
	) {
		throw new Error('source.relativePath no cumple el contrato portable.');
	}
	const segments = relativePath.split('/');
	if (
		segments.some(
			(segment) =>
				!segment ||
				segment === '.' ||
				segment === '..' ||
				segment.endsWith('.') ||
				segment.endsWith(' ') ||
				/[<>"|?*]/.test(segment) ||
				WINDOWS_DEVICE_NAME.test(segment)
		)
	) {
		throw new Error('source.relativePath contiene traversal o segmentos vacíos.');
	}
}

export function assertCanonicalMediaSource(source: CanonicalMediaSourceInput): void {
	if (!(source && typeof source === 'object')) throw new Error('source es obligatorio para crear media.');
	if (!ROOT_ID.test(source.rootId)) throw new Error('source.rootId no es válido.');
	validateRelativePath(source.relativePath);
	if (source.fileIdentity !== undefined && source.fileIdentity !== null && source.fileIdentity.length === 0) {
		throw new Error('source.fileIdentity no puede estar vacío.');
	}
}

export function assertCanonicalMediaCreateCommand(command: CanonicalMediaCreateCommand): void {
	assertCanonicalMediaSource(command.source);
	if (!CANONICAL_MEDIA_TYPES.includes(command.assetType)) throw new Error('assetType no es canónico.');
	if (!SHA256_HEX.test(command.hash)) throw new Error('hash debe ser SHA-256 hexadecimal lowercase.');
	if (!Number.isSafeInteger(command.size) || command.size < 0 || command.size > 107_374_182_400) {
		throw new Error('size no cumple el contrato canónico.');
	}
	const proof = getAuthorizedPathProof(command.source);
	if (!proof) throw new Error('source no conserva una prueba de autorización runtime.');
	if (proof.rootId !== command.source.rootId || proof.relativePath !== command.source.relativePath) {
		throw new Error('source diverge de su prueba de autorización runtime.');
	}
	if (resolve(proof.absolutePath) !== resolve(command.path)) {
		throw new Error('source y path no representan la misma ubicación física autorizada.');
	}
}

export async function createCanonicalMedia<T>(
	command: CanonicalMediaCreateCommand,
	insertSpecialization: (context: CanonicalMediaInsertContext) => Promise<T>
): Promise<T> {
	assertCanonicalMediaCreateCommand(command);
	const assetId = crypto.randomUUID();
	const sourceFileId = crypto.randomUUID();
	const now = new Date();
	const extension = extname(command.source.relativePath).slice(1).toLowerCase() || null;

	return db.transaction(async (transaction: typeof db) => {
		const [folder] = await transaction
			.select({ path: folders.path })
			.from(folders)
			.where(eq(folders.id, command.folderId))
			.limit(1);
		if (!folder) throw new Error(`Folder ${command.folderId} no existe.`);
		if (!isPathInsideDirectory(folder.path, command.path)) {
			throw new Error('La ubicación física no pertenece al Folder declarado.');
		}
		await transaction.insert(sourceFiles).values({
			id: sourceFileId,
			assetId,
			rootId: command.source.rootId,
			relativePath: command.source.relativePath,
			folderId: command.folderId,
			contentHash: command.hash,
			byteSize: command.size,
			availability: 'available',
			fileIdentity: command.source.fileIdentity ?? null,
			mimeType: command.source.mimeType ?? null,
			extension,
			fileCreatedAt: command.source.fileCreatedAt ?? null,
			fileModifiedAt: command.source.fileModifiedAt ?? null,
			observedAt: now,
			createdAt: now,
			updatedAt: now,
		});
		await transaction.insert(assets).values({
			id: assetId,
			assetType: command.assetType,
			title: command.name,
			primarySourceFileId: sourceFileId,
			status: 'active',
			createdAt: now,
			updatedAt: now,
		});
		return insertSpecialization({ assetId, now, sourceFileId, transaction });
	});
}

function compareCanonicalMedia<T extends CanonicalMediaRow>(
	row: T,
	assetType: CanonicalMediaType,
	asset: typeof assets.$inferSelect | undefined,
	source: typeof sourceFiles.$inferSelect | undefined
): string[] {
	if (!row.assetId) return [];
	const divergences: string[] = [];
	if (!asset) return ['asset.missing'];
	if (asset.id !== row.assetId) divergences.push('asset.id');
	if (asset.assetType !== assetType) divergences.push('asset.assetType');
	if (asset.title !== row.name) divergences.push('asset.title');
	if (!source) return [...divergences, 'source.missing'];
	if (source.id !== asset.primarySourceFileId) divergences.push('source.primary');
	if (source.assetId !== asset.id) divergences.push('source.assetId');
	if (source.contentHash !== row.hash) divergences.push('source.contentHash');
	if (source.byteSize !== row.size) divergences.push('source.byteSize');
	if (source.folderId !== row.folderId) divergences.push('source.folderId');
	return divergences;
}

export async function projectCanonicalMediaRows<T extends CanonicalMediaRow>(
	rows: readonly T[],
	assetType: CanonicalMediaType
): Promise<Array<CanonicallyProjectedMedia<T>>> {
	if (rows.length === 0) return [];
	const assetIds = [...new Set(rows.flatMap((row) => (row.assetId ? [row.assetId] : [])))];
	const [assetRows, sourceRows] =
		assetIds.length === 0
			? [[], []]
			: await Promise.all([
					db.select().from(assets).where(inArray(assets.id, assetIds)),
					db.select().from(sourceFiles).where(inArray(sourceFiles.assetId, assetIds)),
				]);
	const assetById = new Map<string, typeof assets.$inferSelect>(
		assetRows.map((asset: typeof assets.$inferSelect) => [asset.id, asset])
	);
	const sourceById = new Map<string, typeof sourceFiles.$inferSelect>(
		sourceRows.map((source: typeof sourceFiles.$inferSelect) => [source.id, source])
	);
	const metrics = metricsFor(assetType);

	return rows
		.map((row): CanonicallyProjectedMedia<T> | null => {
			const asset = row.assetId ? assetById.get(row.assetId) : undefined;
			if (asset?.status === 'deleted') return null;
			const source = asset ? sourceById.get(asset.primarySourceFileId) : undefined;
			const canonicalDivergences = compareCanonicalMedia(row, assetType, asset, source);
			const canonicalState: CanonicalMediaState = !row.assetId
				? 'legacy_only'
				: canonicalDivergences.length > 0
					? 'diverged'
					: 'canonical';
			metrics.reads += 1;
			if (canonicalState === 'canonical') metrics.canonical += 1;
			else if (canonicalState === 'legacy_only') metrics.legacyOnly += 1;
			else metrics.diverged += 1;
			if (canonicalState === 'diverged' || (canonicalState === 'legacy_only' && metrics.legacyOnly === 1)) {
				logger.warn('Canonical media dual-read detected a non-canonical row', {
					assetType,
					canonicalState,
					divergences: canonicalDivergences,
					mediaId: row.id,
				});
			}
			return {
				...row,
				id: row.assetId ?? row.id,
				canonicalDivergences,
				canonicalState,
				legacyId: row.id,
			};
		})
		.filter((row): row is CanonicallyProjectedMedia<T> => row !== null);
}

export async function projectCanonicalMediaRow<T extends CanonicalMediaRow>(
	row: T,
	assetType: CanonicalMediaType
): Promise<CanonicallyProjectedMedia<T> | null> {
	const [projected] = await projectCanonicalMediaRows([row], assetType);
	return projected ?? null;
}

export function getCanonicalMediaReadMetrics(assetType: CanonicalMediaType): CanonicalReadMetrics {
	return { ...metricsFor(assetType) };
}

export function resetCanonicalMediaReadMetrics(assetType?: CanonicalMediaType): void {
	if (assetType) metricsByType.delete(assetType);
	else metricsByType.clear();
}

/** Legacy rows remain visible; linked rows disappear from normal reads after their Asset is tombstoned. */
export const visibleAssetLifecycleCondition = (assetIdColumn: AnySQLiteColumn) =>
	or(
		isNull(assetIdColumn),
		notInArray(assetIdColumn, db.select({ id: assets.id }).from(assets).where(eq(assets.status, 'deleted')))
	);

export async function tombstoneCanonicalAsset(assetId: string, transaction: typeof db = db): Promise<void> {
	const [asset] = await transaction
		.select({ status: assets.status })
		.from(assets)
		.where(eq(assets.id, assetId))
		.limit(1);
	if (!(asset && (asset.status === 'active' || asset.status === 'archived'))) {
		throw new Error('El Asset canónico no tiene un lifecycle borrable.');
	}
	const now = new Date();
	const transitioned = await transaction
		.update(assets)
		.set({ deletedAt: now, status: 'deleted', statusBeforeDeletion: asset.status, updatedAt: now })
		.where(and(eq(assets.id, assetId), eq(assets.status, asset.status)))
		.returning({ id: assets.id });
	if (transitioned.length !== 1) throw new Error('El lifecycle de Asset cambió durante el tombstone.');
}

export async function tombstoneCanonicalAssets(
	assetIds: readonly string[],
	transaction: typeof db = db
): Promise<number> {
	const uniqueAssetIds = [...new Set(assetIds)];
	if (uniqueAssetIds.length === 0) return 0;
	const rows: Array<{ id: string; status: string }> = await transaction
		.select({ id: assets.id, status: assets.status })
		.from(assets)
		.where(inArray(assets.id, uniqueAssetIds));
	if (
		rows.length !== uniqueAssetIds.length ||
		rows.some((asset) => !(asset.status === 'active' || asset.status === 'archived'))
	) {
		throw new Error('Al menos un Asset canónico no tiene un lifecycle borrable.');
	}
	for (const asset of rows) await tombstoneCanonicalAsset(asset.id, transaction);
	return rows.length;
}

export async function restoreCanonicalAsset(assetId: string, transaction: typeof db = db): Promise<void> {
	const [asset] = await transaction
		.select({ status: assets.status, statusBeforeDeletion: assets.statusBeforeDeletion })
		.from(assets)
		.where(eq(assets.id, assetId))
		.limit(1);
	if (
		!(
			asset?.status === 'deleted' &&
			(asset.statusBeforeDeletion === 'active' || asset.statusBeforeDeletion === 'archived')
		)
	) {
		throw new Error('El Asset canónico no es un tombstone restaurable.');
	}
	const restored = await transaction
		.update(assets)
		.set({ deletedAt: null, status: asset.statusBeforeDeletion, statusBeforeDeletion: null, updatedAt: new Date() })
		.where(and(eq(assets.id, assetId), eq(assets.status, 'deleted')))
		.returning({ id: assets.id });
	if (restored.length !== 1) throw new Error('El lifecycle de Asset cambió durante la restauración.');
}

export async function updateCanonicalAssetTitle(
	assetId: string,
	title: string,
	transaction: typeof db = db
): Promise<void> {
	const updated = await transaction
		.update(assets)
		.set({ title, updatedAt: new Date() })
		.where(eq(assets.id, assetId))
		.returning({ id: assets.id });
	if (updated.length !== 1) throw new Error('El Asset canónico no existe.');
}
