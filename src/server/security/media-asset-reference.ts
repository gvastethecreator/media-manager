import { and, eq } from 'drizzle-orm';
import { resolve as resolvePath } from 'node:path';
import type {
	AuthorizedPathReference,
	AuthorizedRootRegistry,
	ResolvedAuthorizedPath,
	RootPermission,
} from './authorized-roots';
import { RootAuthorizationError } from './authorized-roots';

export const MEDIA_ASSET_TYPES = ['image', 'video', 'audio', 'document', 'json', 'file3d'] as const;
export type MediaAssetType = (typeof MEDIA_ASSET_TYPES)[number];

export interface MediaAssetReference {
	assetId: string;
	assetType: MediaAssetType;
}

export class MediaAssetLocationConflictError extends Error {
	readonly code = 'MEDIA_ASSET_LOCATION_CONFLICT';
	readonly status = 409;

	constructor() {
		super('El asset cambió durante la operación; no se modificó su ubicación.');
		this.name = 'MediaAssetLocationConflictError';
	}
}

export function parseMediaAssetReference(value: unknown): MediaAssetReference {
	if (!(value && typeof value === 'object' && !Array.isArray(value))) {
		throw new RootAuthorizationError('ROOT_PATH_INVALID', 'Se requiere assetType y assetId.', 400);
	}
	const candidate = value as Record<string, unknown>;
	if (
		typeof candidate.assetId !== 'string' ||
		!/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,191}$/.test(candidate.assetId) ||
		typeof candidate.assetType !== 'string' ||
		!MEDIA_ASSET_TYPES.includes(candidate.assetType as MediaAssetType)
	) {
		throw new RootAuthorizationError('ROOT_PATH_INVALID', 'La referencia de asset no es válida.', 400);
	}
	return { assetId: candidate.assetId, assetType: candidate.assetType as MediaAssetType };
}

interface MediaAssetRecord {
	assetId: string | null;
	folderId: string;
	hash: string;
	id: string;
	name: string;
	path: string;
	size: number;
}

async function findMediaAssetRecord(reference: MediaAssetReference): Promise<MediaAssetRecord | null> {
	switch (reference.assetType) {
		case 'image': {
			const [{ db }, { images }] = await Promise.all([
				import('@/lib/drizzle'),
				import('@/lib/drizzle/schema/files/images'),
			]);
			const [record] = await db
				.select({
					assetId: images.assetId,
					folderId: images.folderId,
					hash: images.hash,
					id: images.id,
					name: images.name,
					path: images.path,
					size: images.size,
				})
				.from(images)
				.where(eq(images.id, reference.assetId))
				.limit(1);
			return record ?? null;
		}
		case 'video': {
			const [{ db }, { videos }] = await Promise.all([
				import('@/lib/drizzle'),
				import('@/lib/drizzle/schema/files/videos'),
			]);
			const [record] = await db
				.select({
					assetId: videos.assetId,
					folderId: videos.folderId,
					hash: videos.hash,
					id: videos.id,
					name: videos.name,
					path: videos.path,
					size: videos.size,
				})
				.from(videos)
				.where(eq(videos.id, reference.assetId))
				.limit(1);
			return record ?? null;
		}
		case 'audio': {
			const [{ db }, { audios }] = await Promise.all([
				import('@/lib/drizzle'),
				import('@/lib/drizzle/schema/files/audio'),
			]);
			const [record] = await db
				.select({
					assetId: audios.assetId,
					folderId: audios.folderId,
					hash: audios.hash,
					id: audios.id,
					name: audios.name,
					path: audios.path,
					size: audios.size,
				})
				.from(audios)
				.where(eq(audios.id, reference.assetId))
				.limit(1);
			return record ?? null;
		}
		case 'document': {
			const [{ db }, { documents }] = await Promise.all([
				import('@/lib/drizzle'),
				import('@/lib/drizzle/schema/files/documents'),
			]);
			const [record] = await db
				.select({
					assetId: documents.assetId,
					folderId: documents.folderId,
					hash: documents.hash,
					id: documents.id,
					name: documents.name,
					path: documents.path,
					size: documents.size,
				})
				.from(documents)
				.where(eq(documents.id, reference.assetId))
				.limit(1);
			return record ?? null;
		}
		case 'json': {
			const [{ db }, { jsonFiles }] = await Promise.all([
				import('@/lib/drizzle'),
				import('@/lib/drizzle/schema/files/jsonFiles'),
			]);
			const [record] = await db
				.select({
					assetId: jsonFiles.assetId,
					folderId: jsonFiles.folderId,
					hash: jsonFiles.hash,
					id: jsonFiles.id,
					name: jsonFiles.name,
					path: jsonFiles.path,
					size: jsonFiles.size,
				})
				.from(jsonFiles)
				.where(eq(jsonFiles.id, reference.assetId))
				.limit(1);
			return record ?? null;
		}
		case 'file3d': {
			const [{ db }, { file3Ds }] = await Promise.all([
				import('@/lib/drizzle'),
				import('@/lib/drizzle/schema/files/file3Ds'),
			]);
			const [record] = await db
				.select({
					assetId: file3Ds.assetId,
					folderId: file3Ds.folderId,
					hash: file3Ds.hash,
					id: file3Ds.id,
					name: file3Ds.name,
					path: file3Ds.path,
					size: file3Ds.size,
				})
				.from(file3Ds)
				.where(eq(file3Ds.id, reference.assetId))
				.limit(1);
			return record ?? null;
		}
	}
}

export async function resolveMediaAssetReference(
	registry: AuthorizedRootRegistry,
	reference: MediaAssetReference,
	permission: RootPermission,
	options: { allowDeleted?: boolean; allowMissing?: boolean } = {}
): Promise<ResolvedAuthorizedPath> {
	const record = await findMediaAssetRecord(reference);
	if (!record) throw new RootAuthorizationError('ROOT_PATH_NOT_FOUND', 'Asset no encontrado.', 404);
	if (!record.assetId) return registry.authorizeAbsolutePath(record.path, permission);

	const [{ db }, { assets, sourceFiles }] = await Promise.all([
		import('@/lib/drizzle'),
		import('@/lib/drizzle/schema'),
	]);
	const [asset] = await db
		.select({
			assetId: assets.id,
			assetStatus: assets.status,
			assetType: assets.assetType,
			primarySourceFileId: assets.primarySourceFileId,
			title: assets.title,
		})
		.from(assets)
		.where(eq(assets.id, record.assetId))
		.limit(1);
	const [source] = asset
		? await db
				.select({
					assetId: sourceFiles.assetId,
					byteSize: sourceFiles.byteSize,
					contentHash: sourceFiles.contentHash,
					folderId: sourceFiles.folderId,
					id: sourceFiles.id,
					relativePath: sourceFiles.relativePath,
					rootId: sourceFiles.rootId,
				})
				.from(sourceFiles)
				.where(eq(sourceFiles.id, asset.primarySourceFileId))
				.limit(1)
		: [];
	if (asset?.assetStatus === 'deleted' && !options.allowDeleted) {
		throw new RootAuthorizationError('ROOT_PATH_NOT_FOUND', 'Asset no encontrado.', 404);
	}
	if (
		!asset ||
		!source ||
		asset.assetId !== record.assetId ||
		asset.assetType !== reference.assetType ||
		asset.title !== record.name ||
		source.id !== asset.primarySourceFileId ||
		source.assetId !== asset.assetId ||
		source.contentHash !== record.hash ||
		source.byteSize !== record.size ||
		source.folderId !== record.folderId
	) {
		throw new RootAuthorizationError('ROOT_PATH_CONFLICT', 'La identidad canónica del asset está divergida.', 409);
	}
	const canonical = await registry.resolve(
		{ relativePath: source.relativePath, rootId: source.rootId },
		permission,
		options.allowMissing ? 'create' : 'existing'
	);
	let legacyAbsolutePath: string;
	try {
		legacyAbsolutePath = (await registry.authorizeAbsolutePath(record.path, permission)).absolutePath;
	} catch (error) {
		if (!(options.allowMissing && error instanceof RootAuthorizationError && error.code === 'ROOT_PATH_NOT_FOUND')) {
			throw error;
		}
		legacyAbsolutePath = resolvePath(record.path);
	}
	const normalizeAbsolutePath = (value: string) =>
		process.platform === 'win32' ? resolvePath(value).toLocaleLowerCase('en-US') : resolvePath(value);
	if (normalizeAbsolutePath(canonical.absolutePath) !== normalizeAbsolutePath(legacyAbsolutePath)) {
		throw new RootAuthorizationError(
			'ROOT_PATH_CONFLICT',
			'La ubicación canónica y la ubicación legacy del asset divergen.',
			409
		);
	}
	return canonical;
}

async function updateCanonicalLocationContract(
	transaction: typeof import('@/lib/drizzle').db,
	assetId: string,
	changes: { folderId?: string; name?: string; source?: AuthorizedPathReference }
): Promise<void> {
	if (!changes.source) throw new MediaAssetLocationConflictError();
	const { assets, sourceFiles } = await import('@/lib/drizzle/schema');
	const [asset] = await transaction
		.select({ primarySourceFileId: assets.primarySourceFileId })
		.from(assets)
		.where(eq(assets.id, assetId))
		.limit(1);
	if (!asset) throw new MediaAssetLocationConflictError();
	const sourceUpdated = await transaction
		.update(sourceFiles)
		.set({
			...(changes.folderId !== undefined ? { folderId: changes.folderId } : {}),
			relativePath: changes.source.relativePath,
			rootId: changes.source.rootId,
			updatedAt: new Date(),
		})
		.where(and(eq(sourceFiles.id, asset.primarySourceFileId), eq(sourceFiles.assetId, assetId)))
		.returning({ id: sourceFiles.id });
	if (sourceUpdated.length !== 1) throw new MediaAssetLocationConflictError();
	if (changes.name !== undefined) {
		const assetUpdated = await transaction
			.update(assets)
			.set({ title: changes.name, updatedAt: new Date() })
			.where(eq(assets.id, assetId))
			.returning({ id: assets.id });
		if (assetUpdated.length !== 1) throw new MediaAssetLocationConflictError();
	}
}

export async function updateMediaAssetLocation(
	reference: MediaAssetReference,
	expectedPath: string,
	changes: { folderId?: string; name?: string; path: string; source?: AuthorizedPathReference }
): Promise<void> {
	const { source: _source, ...legacyChanges } = changes;
	const values = { ...legacyChanges, updatedAt: new Date() };
	switch (reference.assetType) {
		case 'image': {
			const [{ db }, { assets, images, sourceFiles }] = await Promise.all([
				import('@/lib/drizzle'),
				import('@/lib/drizzle/schema'),
			]);
			await db.transaction(async (transaction: typeof db) => {
				const [current] = await transaction
					.select({ assetId: images.assetId })
					.from(images)
					.where(and(eq(images.id, reference.assetId), eq(images.path, expectedPath)))
					.limit(1);
				if (!current) throw new MediaAssetLocationConflictError();
				const updated = await transaction
					.update(images)
					.set(values)
					.where(and(eq(images.id, reference.assetId), eq(images.path, expectedPath)))
					.returning({ id: images.id });
				if (updated.length !== 1) throw new MediaAssetLocationConflictError();
				if (!current.assetId) return;
				if (!changes.source) throw new MediaAssetLocationConflictError();
				const [asset] = await transaction
					.select({ primarySourceFileId: assets.primarySourceFileId })
					.from(assets)
					.where(eq(assets.id, current.assetId))
					.limit(1);
				if (!asset) throw new MediaAssetLocationConflictError();
				const sourceUpdated = await transaction
					.update(sourceFiles)
					.set({
						folderId: changes.folderId,
						relativePath: changes.source.relativePath,
						rootId: changes.source.rootId,
						updatedAt: new Date(),
					})
					.where(eq(sourceFiles.id, asset.primarySourceFileId))
					.returning({ id: sourceFiles.id });
				if (sourceUpdated.length !== 1) throw new MediaAssetLocationConflictError();
				if (changes.name !== undefined) {
					await transaction
						.update(assets)
						.set({ title: changes.name, updatedAt: new Date() })
						.where(eq(assets.id, current.assetId));
				}
			});
			return;
		}
		case 'video': {
			const [{ db }, { videos }] = await Promise.all([
				import('@/lib/drizzle'),
				import('@/lib/drizzle/schema/files/videos'),
			]);
			await db.transaction(async (transaction: typeof db) => {
				const [current] = await transaction
					.select({ assetId: videos.assetId })
					.from(videos)
					.where(and(eq(videos.id, reference.assetId), eq(videos.path, expectedPath)))
					.limit(1);
				if (!current) throw new MediaAssetLocationConflictError();
				const updated = await transaction
					.update(videos)
					.set(values)
					.where(and(eq(videos.id, reference.assetId), eq(videos.path, expectedPath)))
					.returning({ id: videos.id });
				if (updated.length !== 1) throw new MediaAssetLocationConflictError();
				if (current.assetId) await updateCanonicalLocationContract(transaction, current.assetId, changes);
			});
			return;
		}
		case 'audio': {
			const [{ db }, { audios }] = await Promise.all([
				import('@/lib/drizzle'),
				import('@/lib/drizzle/schema/files/audio'),
			]);
			const updated = await db
				.update(audios)
				.set(values)
				.where(and(eq(audios.id, reference.assetId), eq(audios.path, expectedPath)))
				.returning({ id: audios.id });
			if (updated.length !== 1) throw new MediaAssetLocationConflictError();
			return;
		}
		case 'document': {
			const [{ db }, { documents }] = await Promise.all([
				import('@/lib/drizzle'),
				import('@/lib/drizzle/schema/files/documents'),
			]);
			const updated = await db
				.update(documents)
				.set(values)
				.where(and(eq(documents.id, reference.assetId), eq(documents.path, expectedPath)))
				.returning({ id: documents.id });
			if (updated.length !== 1) throw new MediaAssetLocationConflictError();
			return;
		}
		case 'json': {
			const [{ db }, { jsonFiles }] = await Promise.all([
				import('@/lib/drizzle'),
				import('@/lib/drizzle/schema/files/jsonFiles'),
			]);
			const updated = await db
				.update(jsonFiles)
				.set(values)
				.where(and(eq(jsonFiles.id, reference.assetId), eq(jsonFiles.path, expectedPath)))
				.returning({ id: jsonFiles.id });
			if (updated.length !== 1) throw new MediaAssetLocationConflictError();
			return;
		}
		case 'file3d': {
			const [{ db }, { file3Ds }] = await Promise.all([
				import('@/lib/drizzle'),
				import('@/lib/drizzle/schema/files/file3Ds'),
			]);
			const updated = await db
				.update(file3Ds)
				.set(values)
				.where(and(eq(file3Ds.id, reference.assetId), eq(file3Ds.path, expectedPath)))
				.returning({ id: file3Ds.id });
			if (updated.length !== 1) throw new MediaAssetLocationConflictError();
			return;
		}
	}
}

export interface MediaAssetLocation {
	folderId: string;
	name: string;
	path: string;
	source?: AuthorizedPathReference;
}

export async function getMediaAssetLocation(reference: MediaAssetReference): Promise<MediaAssetLocation> {
	const record = await findMediaAssetRecord(reference);
	if (!record) throw new RootAuthorizationError('ROOT_PATH_NOT_FOUND', 'Asset no encontrado.', 404);
	if (!record.assetId) return { folderId: record.folderId, name: record.name, path: record.path };
	const [{ db }, { assets, sourceFiles }] = await Promise.all([
		import('@/lib/drizzle'),
		import('@/lib/drizzle/schema'),
	]);
	const [asset] = await db
		.select({ primarySourceFileId: assets.primarySourceFileId })
		.from(assets)
		.where(eq(assets.id, record.assetId))
		.limit(1);
	const [source] = asset
		? await db
				.select({ relativePath: sourceFiles.relativePath, rootId: sourceFiles.rootId })
				.from(sourceFiles)
				.where(eq(sourceFiles.id, asset.primarySourceFileId))
				.limit(1)
		: [];
	if (!source) throw new MediaAssetLocationConflictError();
	return { folderId: record.folderId, name: record.name, path: record.path, source };
}

async function findAssetIds(assetType: MediaAssetType, folderId?: string): Promise<string[]> {
	switch (assetType) {
		case 'image': {
			const [{ db }, { images }] = await Promise.all([
				import('@/lib/drizzle'),
				import('@/lib/drizzle/schema/files/images'),
			]);
			const query = db.select({ id: images.id }).from(images);
			return (folderId ? await query.where(eq(images.folderId, folderId)) : await query).map(
				(row: { id: string }) => row.id
			);
		}
		case 'video': {
			const [{ db }, { videos }] = await Promise.all([
				import('@/lib/drizzle'),
				import('@/lib/drizzle/schema/files/videos'),
			]);
			const query = db.select({ id: videos.id }).from(videos);
			return (folderId ? await query.where(eq(videos.folderId, folderId)) : await query).map(
				(row: { id: string }) => row.id
			);
		}
		case 'audio': {
			const [{ db }, { audios }] = await Promise.all([
				import('@/lib/drizzle'),
				import('@/lib/drizzle/schema/files/audio'),
			]);
			const query = db.select({ id: audios.id }).from(audios);
			return (folderId ? await query.where(eq(audios.folderId, folderId)) : await query).map(
				(row: { id: string }) => row.id
			);
		}
		case 'document': {
			const [{ db }, { documents }] = await Promise.all([
				import('@/lib/drizzle'),
				import('@/lib/drizzle/schema/files/documents'),
			]);
			const query = db.select({ id: documents.id }).from(documents);
			return (folderId ? await query.where(eq(documents.folderId, folderId)) : await query).map(
				(row: { id: string }) => row.id
			);
		}
		case 'json': {
			const [{ db }, { jsonFiles }] = await Promise.all([
				import('@/lib/drizzle'),
				import('@/lib/drizzle/schema/files/jsonFiles'),
			]);
			const query = db.select({ id: jsonFiles.id }).from(jsonFiles);
			return (folderId ? await query.where(eq(jsonFiles.folderId, folderId)) : await query).map(
				(row: { id: string }) => row.id
			);
		}
		case 'file3d': {
			const [{ db }, { file3Ds }] = await Promise.all([
				import('@/lib/drizzle'),
				import('@/lib/drizzle/schema/files/file3Ds'),
			]);
			const query = db.select({ id: file3Ds.id }).from(file3Ds);
			return (folderId ? await query.where(eq(file3Ds.folderId, folderId)) : await query).map(
				(row: { id: string }) => row.id
			);
		}
	}
}

export async function countAuthorizedMediaAssetsByFolder(
	registry: AuthorizedRootRegistry,
	assetType: MediaAssetType,
	folderId: string,
	permission: RootPermission = 'read'
): Promise<number> {
	return countAuthorizedMediaAssetPaths(registry, assetType, permission, folderId);
}

async function countAuthorizedMediaAssetPaths(
	registry: AuthorizedRootRegistry,
	assetType: MediaAssetType,
	permission: RootPermission,
	folderId?: string
): Promise<number> {
	const assetIds = await findAssetIds(assetType, folderId);
	const decisions = await Promise.all(
		assetIds.map(async (assetId) => {
			try {
				await resolveMediaAssetReference(registry, { assetId, assetType }, permission);
				return true;
			} catch (error) {
				if (error instanceof RootAuthorizationError) return false;
				throw error;
			}
		})
	);
	return decisions.filter(Boolean).length;
}

export async function countAuthorizedMediaAssets(
	registry: AuthorizedRootRegistry,
	assetType: MediaAssetType,
	permission: RootPermission = 'read'
): Promise<number> {
	return countAuthorizedMediaAssetPaths(registry, assetType, permission);
}
