import { extname, resolve } from 'node:path';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { assets, folders, images, sourceFiles } from '@/lib/drizzle/schema';
import { isPathInsideDirectory } from '@/lib/filesystem/path-containment';
import { getAuthorizedPathProof } from '@/lib/filesystem/authorized-path-proof';
import { serverLogger } from '@/lib/logger/server-logger';

const logger = serverLogger.withContext('ImageCanonicalPersistence');
const SHA256_HEX = /^[0-9a-f]{64}$/;
const ROOT_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;
const WINDOWS_DEVICE_NAME = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i;
const ENCODED_PATH_TOKEN = /%(?:[0-9a-fA-F]{2})/;

export const IMAGE_CANONICAL_STATES = ['canonical', 'legacy_only', 'diverged'] as const;
export type ImageCanonicalState = (typeof IMAGE_CANONICAL_STATES)[number];

export interface ImageCanonicalSourceInput {
	fileCreatedAt?: Date | null;
	fileIdentity?: string | null;
	fileModifiedAt?: Date | null;
	mimeType?: string | null;
	relativePath: string;
	rootId: string;
}

export interface ImageCreateCommand {
	aiEngine?: string | null;
	aiModel?: string | null;
	aiOriginDetected?: boolean;
	description?: string | null;
	folderId: string;
	hash: string;
	height: number;
	metadata?: string | null;
	name: string;
	noteId?: string | null;
	path: string;
	size: number;
	source: ImageCanonicalSourceInput;
	thumbnail?: string | null;
	thumbnailHeight?: number | null;
	thumbnailMimeType?: string | null;
	thumbnailSize?: number | null;
	thumbnailWidth?: number | null;
	width: number;
}

export interface ImageFingerprintUpdate {
	fileModifiedAt?: Date | null;
	hash: string;
	size: number;
}

export type CanonicallyProjectedImage = typeof images.$inferSelect & {
	canonicalDivergences: string[];
	canonicalState: ImageCanonicalState;
	legacyId: string;
};

type CanonicalReadMetrics = {
	canonical: number;
	diverged: number;
	legacyOnly: number;
	reads: number;
};

const canonicalReadMetrics: CanonicalReadMetrics = {
	canonical: 0,
	diverged: 0,
	legacyOnly: 0,
	reads: 0,
};

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

export function assertImageCanonicalSource(source: ImageCanonicalSourceInput): void {
	if (!(source && typeof source === 'object')) throw new Error('source es obligatorio para crear una Image.');
	if (!ROOT_ID.test(source.rootId)) throw new Error('source.rootId no es válido.');
	validateRelativePath(source.relativePath);
	if (source.fileIdentity !== undefined && source.fileIdentity !== null && source.fileIdentity.length === 0) {
		throw new Error('source.fileIdentity no puede estar vacío.');
	}
}

export function assertCanonicalImageCreateCommand(command: Pick<ImageCreateCommand, 'hash' | 'path' | 'source'>): void {
	assertImageCanonicalSource(command.source);
	if (!SHA256_HEX.test(command.hash)) throw new Error('hash debe ser SHA-256 hexadecimal lowercase.');
	const proof = getAuthorizedPathProof(command.source);
	if (!proof) throw new Error('source no conserva una prueba de autorización runtime.');
	if (proof.rootId !== command.source.rootId || proof.relativePath !== command.source.relativePath) {
		throw new Error('source diverge de su prueba de autorización runtime.');
	}
	if (resolve(proof.absolutePath) !== resolve(command.path)) {
		throw new Error('source y path no representan la misma ubicación física autorizada.');
	}
}

export function getImageCanonicalReadMetrics(): CanonicalReadMetrics {
	return { ...canonicalReadMetrics };
}

export function resetImageCanonicalReadMetrics(): void {
	canonicalReadMetrics.canonical = 0;
	canonicalReadMetrics.diverged = 0;
	canonicalReadMetrics.legacyOnly = 0;
	canonicalReadMetrics.reads = 0;
}

function compareCanonicalImage(
	image: typeof images.$inferSelect,
	asset: typeof assets.$inferSelect | undefined,
	source: typeof sourceFiles.$inferSelect | undefined
): string[] {
	if (!image.assetId) return [];
	const divergences: string[] = [];
	if (!asset) return ['asset.missing'];
	if (asset.id !== image.assetId) divergences.push('asset.id');
	if (asset.assetType !== 'image') divergences.push('asset.assetType');
	if (asset.title !== image.name) divergences.push('asset.title');
	if (!source) return [...divergences, 'source.missing'];
	if (source.id !== asset.primarySourceFileId) divergences.push('source.primary');
	if (source.assetId !== asset.id) divergences.push('source.assetId');
	if (source.contentHash !== image.hash) divergences.push('source.contentHash');
	if (source.byteSize !== image.size) divergences.push('source.byteSize');
	if (source.folderId !== image.folderId) divergences.push('source.folderId');
	return divergences;
}

export async function projectCanonicalImages(
	rows: readonly (typeof images.$inferSelect)[]
): Promise<CanonicallyProjectedImage[]> {
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

	return rows
		.map((row): CanonicallyProjectedImage | null => {
			const asset = row.assetId ? assetById.get(row.assetId) : undefined;
			if (asset?.status === 'deleted') return null;
			const source = asset ? sourceById.get(asset.primarySourceFileId) : undefined;
			const canonicalDivergences = compareCanonicalImage(row, asset, source);
			const canonicalState: ImageCanonicalState = !row.assetId
				? 'legacy_only'
				: canonicalDivergences.length > 0
					? 'diverged'
					: 'canonical';
			canonicalReadMetrics.reads += 1;
			if (canonicalState === 'canonical') canonicalReadMetrics.canonical += 1;
			else if (canonicalState === 'legacy_only') canonicalReadMetrics.legacyOnly += 1;
			else canonicalReadMetrics.diverged += 1;
			if (
				canonicalState === 'diverged' ||
				(canonicalState === 'legacy_only' && canonicalReadMetrics.legacyOnly === 1)
			) {
				logger.warn('Image canonical dual-read detected a non-canonical row', {
					canonicalState,
					divergences: canonicalDivergences,
					imageId: row.id,
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
		.filter((row): row is CanonicallyProjectedImage => row !== null);
}

export async function projectCanonicalImage(
	row: typeof images.$inferSelect
): Promise<CanonicallyProjectedImage | null> {
	const [projected] = await projectCanonicalImages([row]);
	return projected ?? null;
}

export async function createCanonicalImage(command: ImageCreateCommand): Promise<typeof images.$inferSelect> {
	assertCanonicalImageCreateCommand(command);
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
			throw new Error('La ubicación física de Image no pertenece al Folder declarado.');
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
			assetType: 'image',
			title: command.name,
			primarySourceFileId: sourceFileId,
			status: 'active',
			createdAt: now,
			updatedAt: now,
		});
		const [created] = await transaction
			.insert(images)
			.values({
				id: assetId,
				assetId,
				name: command.name,
				description: command.description ?? null,
				path: command.path,
				hash: command.hash,
				size: command.size,
				width: command.width,
				height: command.height,
				metadata: command.metadata ?? null,
				thumbnail: command.thumbnail ?? null,
				thumbnailSize: command.thumbnailSize ?? null,
				thumbnailWidth: command.thumbnailWidth ?? null,
				thumbnailHeight: command.thumbnailHeight ?? null,
				thumbnailMimeType: command.thumbnailMimeType ?? null,
				thumbnailError: null,
				thumbnailErrorAt: null,
				thumbnailOptimizedAt: null,
				aiEngine: command.aiEngine ?? null,
				aiModel: command.aiModel ?? null,
				aiOriginDetected: command.aiOriginDetected ?? false,
				folderId: command.folderId,
				noteId: command.noteId ?? null,
				createdAt: now,
				updatedAt: now,
				addedAt: now,
			})
			.returning();
		return created;
	});
}

export async function updateCanonicalImageFingerprint(imageId: string, update: ImageFingerprintUpdate): Promise<void> {
	if (!SHA256_HEX.test(update.hash)) throw new Error('hash debe ser SHA-256 hexadecimal lowercase.');
	if (!Number.isSafeInteger(update.size) || update.size < 0 || update.size > 107_374_182_400) {
		throw new Error('size no cumple el contrato canónico.');
	}
	const now = new Date();
	await db.transaction(async (transaction: typeof db) => {
		const [image] = await transaction
			.select({ assetId: images.assetId })
			.from(images)
			.where(eq(images.id, imageId))
			.limit(1);
		if (!image) throw new Error(`Image ${imageId} no existe.`);
		await transaction
			.update(images)
			.set({
				hash: update.hash,
				size: update.size,
				thumbnailError: null,
				thumbnailErrorAt: null,
				updatedAt: now,
			})
			.where(eq(images.id, imageId));
		if (!image.assetId) return;

		const [asset] = await transaction
			.select({ primarySourceFileId: assets.primarySourceFileId })
			.from(assets)
			.where(eq(assets.id, image.assetId))
			.limit(1);
		if (!asset) throw new Error(`Asset canónico de Image ${imageId} no existe.`);
		const updatedSources = await transaction
			.update(sourceFiles)
			.set({
				availability: 'available',
				byteSize: update.size,
				contentHash: update.hash,
				...(update.fileModifiedAt !== undefined ? { fileModifiedAt: update.fileModifiedAt } : {}),
				observedAt: now,
				updatedAt: now,
			})
			.where(and(eq(sourceFiles.id, asset.primarySourceFileId), eq(sourceFiles.assetId, image.assetId)))
			.returning({ id: sourceFiles.id });
		if (updatedSources.length !== 1) throw new Error(`SourceFile primario de Image ${imageId} no existe.`);
	});
}
