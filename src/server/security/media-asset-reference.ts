import { and, eq, isNull, ne, or } from 'drizzle-orm';
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

async function findAssetPath(reference: MediaAssetReference): Promise<string | null> {
	switch (reference.assetType) {
		case 'image': {
			const [{ db }, { images }] = await Promise.all([
				import('@/lib/drizzle'),
				import('@/lib/drizzle/schema/files/images'),
			]);
			const [record] = await db
				.select({ path: images.path })
				.from(images)
				.where(eq(images.id, reference.assetId))
				.limit(1);
			return record?.path ?? null;
		}
		case 'video': {
			const [{ db }, { videos }] = await Promise.all([
				import('@/lib/drizzle'),
				import('@/lib/drizzle/schema/files/videos'),
			]);
			const [record] = await db
				.select({ path: videos.path })
				.from(videos)
				.where(eq(videos.id, reference.assetId))
				.limit(1);
			return record?.path ?? null;
		}
		case 'audio': {
			const [{ db }, { audios }] = await Promise.all([
				import('@/lib/drizzle'),
				import('@/lib/drizzle/schema/files/audio'),
			]);
			const [record] = await db
				.select({ path: audios.path })
				.from(audios)
				.where(eq(audios.id, reference.assetId))
				.limit(1);
			return record?.path ?? null;
		}
		case 'document': {
			const [{ db }, { documents }] = await Promise.all([
				import('@/lib/drizzle'),
				import('@/lib/drizzle/schema/files/documents'),
			]);
			const [record] = await db
				.select({ path: documents.path })
				.from(documents)
				.where(eq(documents.id, reference.assetId))
				.limit(1);
			return record?.path ?? null;
		}
		case 'json': {
			const [{ db }, { jsonFiles }] = await Promise.all([
				import('@/lib/drizzle'),
				import('@/lib/drizzle/schema/files/jsonFiles'),
			]);
			const [record] = await db
				.select({ path: jsonFiles.path })
				.from(jsonFiles)
				.where(eq(jsonFiles.id, reference.assetId))
				.limit(1);
			return record?.path ?? null;
		}
		case 'file3d': {
			const [{ db }, { file3Ds }] = await Promise.all([
				import('@/lib/drizzle'),
				import('@/lib/drizzle/schema/files/file3Ds'),
			]);
			const [record] = await db
				.select({ path: file3Ds.path })
				.from(file3Ds)
				.where(eq(file3Ds.id, reference.assetId))
				.limit(1);
			return record?.path ?? null;
		}
	}
}

export async function resolveMediaAssetReference(
	registry: AuthorizedRootRegistry,
	reference: MediaAssetReference,
	permission: RootPermission,
	options: { allowDeleted?: boolean; allowMissing?: boolean } = {}
): Promise<ResolvedAuthorizedPath> {
	if (reference.assetType === 'image') {
		const [{ db }, { assets, images, sourceFiles }] = await Promise.all([
			import('@/lib/drizzle'),
			import('@/lib/drizzle/schema'),
		]);
		const [image] = await db
			.select({
				assetId: images.assetId,
				path: images.path,
			})
			.from(images)
			.where(eq(images.id, reference.assetId))
			.limit(1);
		if (!image) throw new RootAuthorizationError('ROOT_PATH_NOT_FOUND', 'Asset no encontrado.', 404);
		if (!image.assetId) return registry.authorizeAbsolutePath(image.path, permission);

		const [contract] = await db
			.select({
				assetId: assets.id,
				assetStatus: assets.status,
				assetType: assets.assetType,
				byteSize: sourceFiles.byteSize,
				contentHash: sourceFiles.contentHash,
				imageFolderId: images.folderId,
				imageHash: images.hash,
				imageName: images.name,
				imagePath: images.path,
				imageSize: images.size,
				primarySourceFileId: assets.primarySourceFileId,
				relativePath: sourceFiles.relativePath,
				rootId: sourceFiles.rootId,
				sourceAssetId: sourceFiles.assetId,
				sourceFolderId: sourceFiles.folderId,
				sourceId: sourceFiles.id,
				title: assets.title,
			})
			.from(images)
			.leftJoin(assets, eq(assets.id, images.assetId))
			.leftJoin(sourceFiles, eq(sourceFiles.id, assets.primarySourceFileId))
			.where(eq(images.id, reference.assetId))
			.limit(1);
		if (contract?.assetStatus === 'deleted' && !options.allowDeleted) {
			throw new RootAuthorizationError('ROOT_PATH_NOT_FOUND', 'Asset no encontrado.', 404);
		}
		if (
			!contract ||
			contract.assetId !== image.assetId ||
			contract.assetType !== 'image' ||
			contract.title !== contract.imageName ||
			contract.sourceId !== contract.primarySourceFileId ||
			contract.sourceAssetId !== contract.assetId ||
			contract.contentHash !== contract.imageHash ||
			contract.byteSize !== contract.imageSize ||
			contract.sourceFolderId !== contract.imageFolderId ||
			!contract.rootId ||
			!contract.relativePath
		) {
			throw new RootAuthorizationError('ROOT_PATH_CONFLICT', 'La identidad canónica de la imagen está divergida.', 409);
		}
		const canonical = await registry.resolve(
			{ relativePath: contract.relativePath, rootId: contract.rootId },
			permission,
			options.allowMissing ? 'create' : 'existing'
		);
		let legacyAbsolutePath: string;
		try {
			legacyAbsolutePath = (await registry.authorizeAbsolutePath(contract.imagePath, permission)).absolutePath;
		} catch (error) {
			if (!(options.allowMissing && error instanceof RootAuthorizationError && error.code === 'ROOT_PATH_NOT_FOUND')) {
				throw error;
			}
			legacyAbsolutePath = resolvePath(contract.imagePath);
		}
		const normalizeAbsolutePath = (value: string) =>
			process.platform === 'win32' ? resolvePath(value).toLocaleLowerCase('en-US') : resolvePath(value);
		if (normalizeAbsolutePath(canonical.absolutePath) !== normalizeAbsolutePath(legacyAbsolutePath)) {
			throw new RootAuthorizationError(
				'ROOT_PATH_CONFLICT',
				'La ubicación canónica y la ubicación legacy de la imagen divergen.',
				409
			);
		}
		return canonical;
	}
	const assetPath = await findAssetPath(reference);
	if (!assetPath) throw new RootAuthorizationError('ROOT_PATH_NOT_FOUND', 'Asset no encontrado.', 404);
	return registry.authorizeAbsolutePath(assetPath, permission);
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
			const updated = await db
				.update(videos)
				.set(values)
				.where(and(eq(videos.id, reference.assetId), eq(videos.path, expectedPath)))
				.returning({ id: videos.id });
			if (updated.length !== 1) throw new MediaAssetLocationConflictError();
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
	switch (reference.assetType) {
		case 'image': {
			const [{ db }, { assets, images, sourceFiles }] = await Promise.all([
				import('@/lib/drizzle'),
				import('@/lib/drizzle/schema'),
			]);
			const [record] = await db
				.select({ assetId: images.assetId, folderId: images.folderId, name: images.name, path: images.path })
				.from(images)
				.where(eq(images.id, reference.assetId))
				.limit(1);
			if (record?.assetId) {
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
			if (record) return { folderId: record.folderId, name: record.name, path: record.path };
			break;
		}
		case 'video': {
			const [{ db }, { videos }] = await Promise.all([
				import('@/lib/drizzle'),
				import('@/lib/drizzle/schema/files/videos'),
			]);
			const [record] = await db
				.select({ folderId: videos.folderId, name: videos.name, path: videos.path })
				.from(videos)
				.where(eq(videos.id, reference.assetId))
				.limit(1);
			if (record) return record;
			break;
		}
		case 'audio': {
			const [{ db }, { audios }] = await Promise.all([
				import('@/lib/drizzle'),
				import('@/lib/drizzle/schema/files/audio'),
			]);
			const [record] = await db
				.select({ folderId: audios.folderId, name: audios.name, path: audios.path })
				.from(audios)
				.where(eq(audios.id, reference.assetId))
				.limit(1);
			if (record) return record;
			break;
		}
		case 'document': {
			const [{ db }, { documents }] = await Promise.all([
				import('@/lib/drizzle'),
				import('@/lib/drizzle/schema/files/documents'),
			]);
			const [record] = await db
				.select({ folderId: documents.folderId, name: documents.name, path: documents.path })
				.from(documents)
				.where(eq(documents.id, reference.assetId))
				.limit(1);
			if (record) return record;
			break;
		}
		case 'json': {
			const [{ db }, { jsonFiles }] = await Promise.all([
				import('@/lib/drizzle'),
				import('@/lib/drizzle/schema/files/jsonFiles'),
			]);
			const [record] = await db
				.select({ folderId: jsonFiles.folderId, name: jsonFiles.name, path: jsonFiles.path })
				.from(jsonFiles)
				.where(eq(jsonFiles.id, reference.assetId))
				.limit(1);
			if (record) return record;
			break;
		}
		case 'file3d': {
			const [{ db }, { file3Ds }] = await Promise.all([
				import('@/lib/drizzle'),
				import('@/lib/drizzle/schema/files/file3Ds'),
			]);
			const [record] = await db
				.select({ folderId: file3Ds.folderId, name: file3Ds.name, path: file3Ds.path })
				.from(file3Ds)
				.where(eq(file3Ds.id, reference.assetId))
				.limit(1);
			if (record) return record;
			break;
		}
	}
	throw new RootAuthorizationError('ROOT_PATH_NOT_FOUND', 'Asset no encontrado.', 404);
}

async function findAssetPaths(assetType: MediaAssetType, folderId?: string): Promise<string[]> {
	switch (assetType) {
		case 'image': {
			const [{ db }, { images }] = await Promise.all([
				import('@/lib/drizzle'),
				import('@/lib/drizzle/schema/files/images'),
			]);
			const query = db.select({ path: images.path }).from(images);
			return (folderId ? await query.where(eq(images.folderId, folderId)) : await query).map(
				(row: { path: string }) => row.path
			);
		}
		case 'video': {
			const [{ db }, { videos }] = await Promise.all([
				import('@/lib/drizzle'),
				import('@/lib/drizzle/schema/files/videos'),
			]);
			const query = db.select({ path: videos.path }).from(videos);
			return (folderId ? await query.where(eq(videos.folderId, folderId)) : await query).map(
				(row: { path: string }) => row.path
			);
		}
		case 'audio': {
			const [{ db }, { audios }] = await Promise.all([
				import('@/lib/drizzle'),
				import('@/lib/drizzle/schema/files/audio'),
			]);
			const query = db.select({ path: audios.path }).from(audios);
			return (folderId ? await query.where(eq(audios.folderId, folderId)) : await query).map(
				(row: { path: string }) => row.path
			);
		}
		case 'document': {
			const [{ db }, { documents }] = await Promise.all([
				import('@/lib/drizzle'),
				import('@/lib/drizzle/schema/files/documents'),
			]);
			const query = db.select({ path: documents.path }).from(documents);
			return (folderId ? await query.where(eq(documents.folderId, folderId)) : await query).map(
				(row: { path: string }) => row.path
			);
		}
		case 'json': {
			const [{ db }, { jsonFiles }] = await Promise.all([
				import('@/lib/drizzle'),
				import('@/lib/drizzle/schema/files/jsonFiles'),
			]);
			const query = db.select({ path: jsonFiles.path }).from(jsonFiles);
			return (folderId ? await query.where(eq(jsonFiles.folderId, folderId)) : await query).map(
				(row: { path: string }) => row.path
			);
		}
		case 'file3d': {
			const [{ db }, { file3Ds }] = await Promise.all([
				import('@/lib/drizzle'),
				import('@/lib/drizzle/schema/files/file3Ds'),
			]);
			const query = db.select({ path: file3Ds.path }).from(file3Ds);
			return (folderId ? await query.where(eq(file3Ds.folderId, folderId)) : await query).map(
				(row: { path: string }) => row.path
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
	if (assetType === 'image') {
		const [{ db }, { assets, images }] = await Promise.all([import('@/lib/drizzle'), import('@/lib/drizzle/schema')]);
		const lifecycleCondition = or(isNull(images.assetId), isNull(assets.id), ne(assets.status, 'deleted'));
		const query = db.select({ id: images.id }).from(images).leftJoin(assets, eq(assets.id, images.assetId));
		const rows = folderId
			? await query.where(and(eq(images.folderId, folderId), lifecycleCondition))
			: await query.where(lifecycleCondition);
		const decisions = await Promise.all(
			rows.map(async ({ id }: { id: string }) => {
				try {
					await resolveMediaAssetReference(registry, { assetId: id, assetType: 'image' }, permission);
					return true;
				} catch (error) {
					if (error instanceof RootAuthorizationError) return false;
					throw error;
				}
			})
		);
		return decisions.filter(Boolean).length;
	}
	const paths = await findAssetPaths(assetType, folderId);
	const decisions = await Promise.all(
		paths.map(async (path) => {
			try {
				await registry.authorizeAbsolutePath(path, permission);
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
