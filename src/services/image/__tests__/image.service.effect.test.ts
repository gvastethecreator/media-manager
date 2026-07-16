/**
 * @file Tests para ImageService con Effect
 * @module services/image/__tests__/image.service.effect.test
 * @description Test suite completo para ImageService usando Effect-TS
 * @created 2025-10-11 - Phase 6: Image Test Suite
 */

import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { eq, inArray } from 'drizzle-orm';
import { Effect } from 'effect';
import { afterEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/drizzle';
import { FileSyncService } from '@/lib/filesystem/file-sync.service';
import { syncSpecificFolder } from '@/lib/filesystem/folder-sync';
import { createAuthorizedPathInput } from '@/lib/filesystem/authorized-path-proof';
import {
	albums,
	assets,
	collections,
	favorites,
	folders,
	imageAlbums,
	imageCollections,
	images,
	imageTags,
	mediaRoots,
	profiles,
	sourceFiles,
	tags,
} from '@/lib/drizzle/schema';
import { favoriteService } from '@/services/favorite/favorite.service';
import { createAuthorizedRootRegistry } from '@/server/security/authorized-roots';
import { AlbumService, AlbumServiceLive } from '@/services/album/album.service.effect';
import { CollectionService, CollectionServiceLive } from '@/services/collection/collection.service.effect';
import {
	FileChangeDetectorService,
	FileChangeDetectorServiceLive,
} from '@/services/file-changes/file-change-detector.service.effect';
import { ImageProcessor } from '@/services/file-entity-mapper/processors/image.processor';
import {
	ReindexIncrementalService,
	ReindexIncrementalServiceLive,
} from '@/services/folder/reindex/reindex-incremental.service.effect';
import { FolderService, FolderServiceLive } from '@/services/folder/folder.service.effect';
import { getFolderFileStats, getFolderFiles } from '@/services/folder-files/folder-files.service';
import { streamFolderFiles } from '@/services/folder-files/folder-files-stream.service';
import { performSearch } from '@/server/services/search.service';
import { fetchMediaCounts } from '@/server/services/stats/stats.queries';
import { getNavigationData } from '@/server/services/system/system.navigation';
import { TagService, TagServiceLive } from '@/services/tag/tag.service.effect';
import { FavoriteEntityType } from '@/types/entities/favorite';
import * as ImageService from '../image.service.effect';

// ============= Test Helpers =============

/**
 * Ejecuta un Effect y convierte el resultado a Either
 */
const runEffect = <A, E>(effect: Effect.Effect<A, E, never>) => Effect.runPromise(Effect.either(effect));
const temporaryDirectories: string[] = [];

/**
 * Helper para esperar éxito
 */
const expectSuccess = async <A, E>(effect: Effect.Effect<A, E, never>) => {
	const either = await runEffect(effect);
	if (either._tag === 'Right') {
		return either.right;
	}
	throw new Error('Expected success but got failure');
};

/**
 * Helper para esperar error
 */
const expectError = async <A, E>(effect: Effect.Effect<A, E, never>) => {
	const either = await runEffect(effect);
	if (either._tag === 'Left') {
		return either.left;
	}
	throw new Error('Expected failure but got success');
};

// ============= Test Data Helpers =============

const createTestFolder = async (path = `/test/folder-${Date.now()}-${crypto.randomUUID()}`) => {
	const now = new Date();
	const [folder] = await db
		.insert(folders)
		.values({
			id: crypto.randomUUID(),
			name: `test-folder-${Date.now()}`,
			path,
			depth: 0,
			parentId: null,
			isFavorite: false,
			presetId: null,
			createdAt: now,
			updatedAt: now,
		})
		.returning();
	return folder;
};

const createTestCanonicalSource = async (relativePath: string, absolutePath = resolve('/', relativePath)) => {
	const rootId = `root-${crypto.randomUUID()}`;
	await db.insert(mediaRoots).values({ id: rootId, label: 'Image service test root' });
	return createAuthorizedPathInput({ absolutePath: resolve(absolutePath), relativePath, rootId });
};

const createTestImage = async (folderId: string, overrides?: Partial<typeof images.$inferInsert>) => {
	const now = new Date();
	const timestamp = Date.now().toString();
	const validHash = timestamp.padStart(64, '0'); // SHA-256: exactly 64 hex chars

	const [image] = await db
		.insert(images)
		.values({
			id: crypto.randomUUID(),
			name: `test-image-${Date.now()}.jpg`,
			path: `/test/image-${Date.now()}.jpg`,
			hash: validHash,
			size: 1_024_000, // 1MB
			width: 1920,
			height: 1080,
			folderId,
			isFavorite: false,
			createdAt: now,
			updatedAt: now,
			addedAt: now,
			...overrides,
		})
		.returning();
	return image;
};

const createTestAlbum = async () => {
	const now = new Date();
	const [album] = await db
		.insert(albums)
		.values({
			id: crypto.randomUUID(),
			name: `test-album-${Date.now()}`,
			isFavorite: false,
			createdAt: now,
			updatedAt: now,
		})
		.returning();
	return album;
};

const createTestTag = async () => {
	const now = new Date();
	const [tag] = await db
		.insert(tags)
		.values({
			id: crypto.randomUUID(),
			name: `test-tag-${Date.now()}`,
			isFavorite: false,
			createdAt: now,
			updatedAt: now,
		})
		.returning();
	return tag;
};

const createTestCollection = async () => {
	const now = new Date();
	const [collection] = await db
		.insert(collections)
		.values({ id: crypto.randomUUID(), name: `test-collection-${Date.now()}`, createdAt: now, updatedAt: now })
		.returning();
	return collection;
};

let createdActiveProfileId: string | null = null;
let previousActiveProfileIds: string[] = [];

const ensureActiveProfile = async () => {
	if (createdActiveProfileId) {
		return createdActiveProfileId;
	}

	const activeProfiles = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.isActive, true));
	previousActiveProfileIds = activeProfiles.map((profile: { id: string }) => profile.id);

	if (previousActiveProfileIds.length > 0) {
		await db.update(profiles).set({ isActive: false }).where(inArray(profiles.id, previousActiveProfileIds));
	}

	const profileId = `image-test-profile-${Date.now()}-${Math.random().toString(16).slice(2)}`;
	createdActiveProfileId = profileId;

	await db.insert(profiles).values({
		id: profileId,
		name: 'Image Service Test Profile',
		emoji: '🖼️',
		color: '#3b82f6',
		description: 'Perfil activo para tests de imágenes',
		isActive: true,
		settingsId: null,
		imageId: null,
	});

	return profileId;
};

// ============= Cleanup =============

afterEach(async () => {
	// Clean up test data in correct order (relations first, then entities)
	await db.delete(imageAlbums);
	await db.delete(imageCollections);
	await db.delete(imageTags);
	await db.delete(favorites).where(eq(favorites.entityType, FavoriteEntityType.IMAGE));
	await db.delete(images);
	await db.delete(assets);
	await db.delete(mediaRoots);
	await db.delete(albums);
	await db.delete(collections);
	await db.delete(tags);
	await db.delete(folders);

	if (createdActiveProfileId) {
		await db.delete(profiles).where(eq(profiles.id, createdActiveProfileId));
		createdActiveProfileId = null;
	}

	if (previousActiveProfileIds.length > 0) {
		await db.update(profiles).set({ isActive: true }).where(inArray(profiles.id, previousActiveProfileIds));
		previousActiveProfileIds = [];
	}
	for (const directory of temporaryDirectories.splice(0)) {
		await rm(directory, { force: true, recursive: true });
	}
});

// ============= CRUD TESTS =============

describe('ImageService - CRUD Operations', () => {
	describe('create', () => {
		it('should create an image successfully', async () => {
			const folder = await createTestFolder('/uploads');
			const source = await createTestCanonicalSource('uploads/test-photo.jpg');
			const timestamp = Date.now().toString();
			const validHash = timestamp.padStart(64, '0');

			const input = {
				name: 'test-photo.jpg',
				path: '/uploads/test-photo.jpg',
				hash: validHash,
				size: 2_048_000, // 2MB
				width: 3840,
				height: 2160,
				folderId: folder.id,
				source,
			};

			const result = await expectSuccess(ImageService.create(input));

			expect(result.name).toBe(input.name);
			expect(result.path).toBe(input.path);
			expect(result.hash).toBe(input.hash);
			expect(result.size).toBe(input.size);
			expect(result.width).toBe(input.width);
			expect(result.height).toBe(input.height);
			expect(result.folderId).toBe(input.folderId);
			expect(result.isFavorite).toBe(false);
			expect(result.assetId).toBe(result.id);
			expect(result.legacyId).toBe(result.id);
			expect(result.canonicalState).toBe('canonical');
			expect(result.canonicalDivergences).toEqual([]);

			const [asset] = await db.select().from(assets).where(eq(assets.id, result.id));
			const [sourceFile] = await db.select().from(sourceFiles).where(eq(sourceFiles.assetId, result.id));
			expect(asset).toEqual(expect.objectContaining({ assetType: 'image', id: result.id, title: input.name }));
			expect(sourceFile).toEqual(
				expect.objectContaining({
					assetId: result.id,
					contentHash: input.hash,
					relativePath: source.relativePath,
					rootId: source.rootId,
				})
			);
		});

		it('should persist favorite state through the canonical favorite bridge when a profile is active', async () => {
			const folder = await createTestFolder('/uploads');
			const timestamp = Date.now().toString();
			const validHash = timestamp.padStart(64, '0');
			await ensureActiveProfile();
			const source = await createTestCanonicalSource('uploads/canonical-favorite-create.jpg');

			const legacyInput: Parameters<typeof ImageService.create>[0] & { isFavorite: boolean } = {
				name: 'canonical-favorite-create.jpg',
				path: '/uploads/canonical-favorite-create.jpg',
				hash: validHash,
				size: 2_048_000,
				width: 1920,
				height: 1080,
				folderId: folder.id,
				isFavorite: true,
				source,
			};

			const result = await expectSuccess(ImageService.create(legacyInput));

			expect(result.isFavorite).toBe(false);
			expect(await favoriteService.isFavorite(FavoriteEntityType.IMAGE, result.id)).toBe(false);
		});

		it('should create image with optional metadata', async () => {
			const folder = await createTestFolder('/uploads');
			const source = await createTestCanonicalSource('uploads/photo-meta.jpg');
			const timestamp = Date.now().toString();
			const validHash = timestamp.padStart(64, '0');

			const input = {
				name: 'photo-with-metadata.jpg',
				path: '/uploads/photo-meta.jpg',
				hash: validHash,
				size: 1_500_000,
				width: 1920,
				height: 1080,
				folderId: folder.id,
				description: 'Test description',
				metadata: JSON.stringify({ camera: 'Canon EOS R5', iso: 100 }),
				aiEngine: 'stable-diffusion',
				aiModel: 'sdxl-1.0',
				aiOriginDetected: true,
				source,
			};

			const result = await expectSuccess(ImageService.create(input));

			expect(result.description).toBe(input.description);
			expect(result.metadata).toBe(input.metadata);
			expect(result.aiEngine).toBe(input.aiEngine);
			expect(result.aiModel).toBe(input.aiModel);
			expect(result.aiOriginDetected).toBe(true);
		});

		it('creates distinct Assets for duplicate content at distinct authorized locations', async () => {
			const folder = await createTestFolder('/library');
			const rootId = `root-${crypto.randomUUID()}`;
			await db.insert(mediaRoots).values({ id: rootId, label: 'Duplicate candidate root' });
			const common = {
				folderId: folder.id,
				hash: 'a'.repeat(64),
				height: 600,
				size: 1024,
				width: 800,
			};

			const first = await expectSuccess(
				ImageService.create({
					...common,
					name: 'duplicate-one.jpg',
					path: '/library/duplicate-one.jpg',
					source: createAuthorizedPathInput({
						absolutePath: resolve('/library/duplicate-one.jpg'),
						relativePath: 'duplicate-one.jpg',
						rootId,
					}),
				})
			);
			const second = await expectSuccess(
				ImageService.create({
					...common,
					name: 'duplicate-two.jpg',
					path: '/library/duplicate-two.jpg',
					source: createAuthorizedPathInput({
						absolutePath: resolve('/library/duplicate-two.jpg'),
						relativePath: 'duplicate-two.jpg',
						rootId,
					}),
				})
			);

			expect(first.id).not.toBe(second.id);
			expect(
				await db
					.select()
					.from(assets)
					.where(inArray(assets.id, [first.id, second.id]))
			).toHaveLength(2);
		});

		it('treats canonical location aliases as the same ingestion source', async () => {
			const folder = await createTestFolder('/uploads');
			const source = await createTestCanonicalSource('uploads/Case-Alias.JPG');
			await expectSuccess(
				ImageService.create({
					folderId: folder.id,
					hash: '1'.repeat(64),
					height: 600,
					name: 'Case-Alias.JPG',
					path: '/uploads/Case-Alias.JPG',
					size: 1024,
					source,
					width: 800,
				})
			);

			const exists = await new ImageProcessor().checkExists({
				extension: '.jpg',
				folderId: crypto.randomUUID(),
				hash: '2'.repeat(64),
				lastModified: new Date(),
				name: 'case-alias.jpg',
				path: '/some/other/legacy/path.jpg',
				size: 1024,
				source: { relativePath: source.relativePath.toLowerCase(), rootId: source.rootId },
			});

			expect(exists).toBe(true);
		});

		it('rolls back Asset, SourceFile and Image when the canonical location conflicts', async () => {
			const folder = await createTestFolder('/library');
			const rootId = `root-${crypto.randomUUID()}`;
			await db.insert(mediaRoots).values({ id: rootId, label: 'Atomic conflict root' });
			const common = { folderId: folder.id, height: 600, size: 1024, width: 800 };
			await expectSuccess(
				ImageService.create({
					...common,
					hash: 'b'.repeat(64),
					name: 'location-owner.jpg',
					path: '/library/same/location.jpg',
					source: createAuthorizedPathInput({
						absolutePath: resolve('/library/same/location.jpg'),
						relativePath: 'same/location.jpg',
						rootId,
					}),
				})
			);
			const before = {
				assets: (await db.select().from(assets)).length,
				images: (await db.select().from(images)).length,
				sources: (await db.select().from(sourceFiles)).length,
			};

			const error = await expectError(
				ImageService.create({
					...common,
					hash: 'c'.repeat(64),
					name: 'location-conflict.jpg',
					path: '/library/same/location.jpg',
					source: createAuthorizedPathInput({
						absolutePath: resolve('/library/same/location.jpg'),
						relativePath: 'same/location.jpg',
						rootId,
					}),
				})
			);

			expect(error._tag).toBe('ImageDatabaseError');
			expect((await db.select().from(assets)).length).toBe(before.assets);
			expect((await db.select().from(images)).length).toBe(before.images);
			expect((await db.select().from(sourceFiles)).length).toBe(before.sources);
		});

		it('rejects a canonical source outside the declared physical Folder without partial rows', async () => {
			const folder = await createTestFolder('/declared-folder');
			const source = await createTestCanonicalSource('outside/image.jpg');

			const error = await expectError(
				ImageService.create({
					folderId: folder.id,
					hash: '0'.repeat(64),
					height: 1,
					name: 'image.jpg',
					path: '/outside/image.jpg',
					size: 1,
					source,
					width: 1,
				})
			);

			expect(error._tag).toBe('ImageDatabaseError');
			expect(await db.select().from(images)).toEqual([]);
			expect(await db.select().from(assets)).toEqual([]);
			expect(await db.select().from(sourceFiles)).toEqual([]);
		});

		it('rejects an internal source reference that resolves to a different path', async () => {
			const folder = await createTestFolder('/declared-folder');
			const source = await createTestCanonicalSource('actual.jpg', '/declared-folder/actual.jpg');

			const error = await expectError(
				ImageService.create({
					folderId: folder.id,
					hash: '0'.repeat(64),
					height: 1,
					name: 'forged.jpg',
					path: '/declared-folder/forged.jpg',
					size: 1,
					source,
					width: 1,
				})
			);

			expect(error._tag).toBe('ImageValidationError');
			expect(await db.select().from(images)).toEqual([]);
			expect(await db.select().from(assets)).toEqual([]);
			expect(await db.select().from(sourceFiles)).toEqual([]);
		});

		it('should fail with invalid hash length', async () => {
			const folder = await createTestFolder('/uploads');

			const input = {
				name: 'invalid-hash.jpg',
				path: '/uploads/invalid.jpg',
				hash: 'short', // Invalid: must be exactly 64 chars
				size: 1024,
				width: 800,
				height: 600,
				folderId: folder.id,
				source: { relativePath: 'uploads/invalid.jpg', rootId: 'root-invalid' },
			};

			const error = await expectError(ImageService.create(input));
			expect(error._tag).toBe('ImageValidationError');
		});

		it('should fail with dimensions exceeding limit', async () => {
			const folder = await createTestFolder('/uploads');
			const timestamp = Date.now().toString();
			const validHash = timestamp.padStart(64, '0');

			const input = {
				name: 'huge-image.jpg',
				path: '/uploads/huge.jpg',
				hash: validHash,
				size: 10_000_000,
				width: 50_000, // Exceeds 32,768 limit
				height: 1080,
				folderId: folder.id,
				source: { relativePath: 'uploads/huge.jpg', rootId: 'root-invalid' },
			};

			const error = await expectError(ImageService.create(input));
			expect(error._tag).toBe('ImageValidationError');
		});

		it('should fail with size exceeding 100GB limit', async () => {
			const folder = await createTestFolder('/uploads');
			const timestamp = Date.now().toString();
			const validHash = timestamp.padStart(64, '0');

			const input = {
				name: 'too-large.jpg',
				path: '/uploads/too-large.jpg',
				hash: validHash,
				size: 200_000_000_000, // 200GB exceeds 100GB limit
				width: 1920,
				height: 1080,
				folderId: folder.id,
				source: { relativePath: 'uploads/too-large.jpg', rootId: 'root-invalid' },
			};

			const error = await expectError(ImageService.create(input));
			expect(error._tag).toBe('ImageValidationError');
		});
	});

	describe('getById', () => {
		it('should retrieve an image by ID', async () => {
			const folder = await createTestFolder();
			const image = await createTestImage(folder.id);

			const result = await expectSuccess(ImageService.getById(image.id));

			expect(result.id).toBe(image.id);
			expect(result.name).toBe(image.name);
			expect(result.path).toBe(image.path);
			expect(result.assetId).toBeNull();
			expect(result.legacyId).toBe(image.id);
			expect(result.canonicalState).toBe('legacy_only');
		});

		it('reports canonical field divergence instead of silently falling back', async () => {
			const folder = await createTestFolder('/uploads');
			const source = await createTestCanonicalSource('uploads/diverged.jpg');
			const image = await expectSuccess(
				ImageService.create({
					folderId: folder.id,
					hash: 'd'.repeat(64),
					height: 600,
					name: 'diverged.jpg',
					path: '/uploads/diverged.jpg',
					size: 1024,
					source,
					width: 800,
				})
			);
			await db.update(sourceFiles).set({ byteSize: 2048 }).where(eq(sourceFiles.assetId, image.id));

			const result = await expectSuccess(ImageService.getById(image.id));

			expect(result.canonicalState).toBe('diverged');
			expect(result.canonicalDivergences).toContain('source.byteSize');
		});

		it('should project canonical favorite state instead of stale embedded flag', async () => {
			const folder = await createTestFolder();
			const image = await createTestImage(folder.id, { isFavorite: true });

			const result = await expectSuccess(ImageService.getById(image.id));

			expect(result.isFavorite).toBe(false);
		});

		it('should fail when image does not exist', async () => {
			const error = await expectError(ImageService.getById('non-existent-id'));

			expect(error._tag).toBe('ImageNotFound');
			if (error._tag === 'ImageNotFound') {
				expect(error.imageId).toBe('non-existent-id');
			}
		});
	});

	describe('getByIdWithStats', () => {
		it('should retrieve image with relation stats', async () => {
			const folder = await createTestFolder();
			const image = await createTestImage(folder.id);
			const album = await createTestAlbum();
			const tag = await createTestTag();

			// Add relations
			await db.insert(imageAlbums).values({ A: image.id, B: album.id });
			await db.insert(imageTags).values({ A: image.id, B: tag.id });

			const result = await expectSuccess(ImageService.getByIdWithStats(image.id));

			expect(result.id).toBe(image.id);
			expect(result.albumCount).toBe(1);
			expect(result.tagCount).toBe(1);
			expect(result.collectionCount).toBe(0);
		});

		it('should return zero stats for image without relations', async () => {
			const folder = await createTestFolder();
			const image = await createTestImage(folder.id);

			const result = await expectSuccess(ImageService.getByIdWithStats(image.id));

			expect(result.id).toBe(image.id);
			expect(result.albumCount).toBe(0);
			expect(result.tagCount).toBe(0);
			expect(result.collectionCount).toBe(0);
			expect(result.characterCount).toBe(0);
		});
	});

	describe('canonical fingerprint synchronization', () => {
		it('updates Image and SourceFile atomically during incremental reindex', async () => {
			const folder = await createTestFolder('/uploads');
			const source = await createTestCanonicalSource('uploads/reindexed.jpg');
			const image = await expectSuccess(
				ImageService.create({
					folderId: folder.id,
					hash: '3'.repeat(64),
					height: 600,
					name: 'reindexed.jpg',
					path: '/uploads/reindexed.jpg',
					size: 1024,
					source,
					width: 800,
				})
			);
			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const service = yield* ReindexIncrementalService;
					return yield* service.reindexChangedFiles([
						{
							currentHash: '4'.repeat(64),
							currentSize: 2048,
							entityType: 'image',
							fieldsToUpdate: ['all'],
							id: image.id,
							path: image.path,
							storedHash: image.hash,
							storedSize: image.size,
						},
					]);
				}).pipe(Effect.provide(ReindexIncrementalServiceLive))
			);

			expect(result).toEqual({ failed: 0, processed: 1 });
			expect(await db.select().from(images).where(eq(images.id, image.id))).toEqual([
				expect.objectContaining({ hash: '4'.repeat(64), size: 2048 }),
			]);
			expect(await db.select().from(sourceFiles).where(eq(sourceFiles.assetId, image.id))).toEqual([
				expect.objectContaining({ availability: 'available', byteSize: 2048, contentHash: '4'.repeat(64) }),
			]);
		});

		it('updates Image and SourceFile together when open-file detection sees new content', async () => {
			const directory = await mkdtemp(resolve(tmpdir(), 'media-manager-image-fingerprint-'));
			temporaryDirectories.push(directory);
			const filePath = resolve(directory, 'changed.jpg');
			const contents = 'canonical fingerprint changed';
			await writeFile(filePath, contents);
			const folder = await createTestFolder(directory);
			const source = await createTestCanonicalSource('uploads/changed.jpg', filePath);
			const image = await expectSuccess(
				ImageService.create({
					folderId: folder.id,
					hash: '5'.repeat(64),
					height: 600,
					name: 'changed.jpg',
					path: filePath,
					size: 1,
					source,
					width: 800,
				})
			);
			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const service = yield* FileChangeDetectorService;
					return yield* service.checkFileOnOpen(image.id, 'image');
				}).pipe(Effect.provide(FileChangeDetectorServiceLive))
			);

			expect(result.hasChanged).toBe(true);
			const [updatedImage] = await db.select().from(images).where(eq(images.id, image.id));
			const [updatedSource] = await db.select().from(sourceFiles).where(eq(sourceFiles.assetId, image.id));
			expect(updatedImage.hash).toBe(updatedSource.contentHash);
			expect(updatedImage.size).toBe(updatedSource.byteSize);
			expect(updatedImage.size).toBe(Buffer.byteLength(contents));
		});
	});

	describe('canonical availability synchronization', () => {
		it('marks a missing canonical file without deleting Image, Asset or authored data', async () => {
			const directory = await mkdtemp(resolve(tmpdir(), 'media-manager-image-missing-file-'));
			temporaryDirectories.push(directory);
			const folderId = crypto.randomUUID();
			const secondaryFolderId = crypto.randomUUID();
			await db.insert(folders).values({ id: folderId, name: 'Missing file folder', path: directory });
			await db
				.insert(folders)
				.values({ id: secondaryFolderId, name: 'Available secondary folder', path: `${directory}-secondary` });
			const source = await createTestCanonicalSource('missing-file.jpg', resolve(directory, 'missing-file.jpg'));
			const authorizedRootRegistry = await createAuthorizedRootRegistry([
				{ id: source.rootId, path: directory, permissions: ['index', 'read'] },
			]);
			const image = await expectSuccess(
				ImageService.create({
					folderId,
					hash: '6'.repeat(64),
					height: 600,
					name: 'missing-file.jpg',
					path: resolve(directory, 'missing-file.jpg'),
					size: 1024,
					source,
					width: 800,
				})
			);
			await db.insert(imageTags).values({ A: image.id, B: (await createTestTag()).id });
			const secondarySourceId = crypto.randomUUID();
			await db.insert(sourceFiles).values({
				assetId: image.id,
				availability: 'available',
				byteSize: 1024,
				contentHash: '6'.repeat(64),
				folderId: secondaryFolderId,
				id: secondarySourceId,
				relativePath: `uploads/secondary-${secondarySourceId}.jpg`,
				rootId: source.rootId,
			});

			await FileSyncService.getInstance().syncFolderFiles(folderId, { authorizedRootRegistry });

			expect(await db.select().from(images).where(eq(images.id, image.id))).toHaveLength(1);
			expect(await db.select().from(assets).where(eq(assets.id, image.id))).toHaveLength(1);
			expect(await db.select().from(imageTags).where(eq(imageTags.A, image.id))).toHaveLength(1);
			expect(await db.select().from(sourceFiles).where(eq(sourceFiles.id, secondarySourceId))).toEqual([
				expect.objectContaining({ availability: 'available' }),
			]);
			const [asset] = await db.select().from(assets).where(eq(assets.id, image.id));
			expect(await db.select().from(sourceFiles).where(eq(sourceFiles.id, asset.primarySourceFileId))).toEqual([
				expect.objectContaining({ availability: 'missing' }),
			]);

			await writeFile(resolve(directory, 'missing-file.jpg'), 'restored image');
			await FileSyncService.getInstance().syncFolderFiles(folderId, { authorizedRootRegistry });
			expect(await db.select().from(sourceFiles).where(eq(sourceFiles.id, asset.primarySourceFileId))).toEqual([
				expect.objectContaining({ availability: 'available' }),
			]);
			expect(await db.select().from(sourceFiles).where(eq(sourceFiles.id, secondarySourceId))).toEqual([
				expect.objectContaining({ availability: 'available' }),
			]);

			await syncSpecificFolder(secondaryFolderId);
			expect(await db.select().from(folders).where(eq(folders.id, secondaryFolderId))).toHaveLength(1);
			expect(await db.select().from(sourceFiles).where(eq(sourceFiles.id, secondarySourceId))).toEqual([
				expect.objectContaining({ availability: 'missing', folderId: secondaryFolderId }),
			]);
			expect(await db.select().from(sourceFiles).where(eq(sourceFiles.id, asset.primarySourceFileId))).toEqual([
				expect.objectContaining({ availability: 'available', folderId }),
			]);
		});

		it('preserves a missing canonical folder instead of cascading its Images', async () => {
			const folderId = crypto.randomUUID();
			const missingPath = resolve(tmpdir(), `media-manager-missing-folder-${crypto.randomUUID()}`);
			await db.insert(folders).values({ id: folderId, name: 'Temporarily missing folder', path: missingPath });
			const source = await createTestCanonicalSource(
				'uploads/missing-folder.jpg',
				resolve(missingPath, 'missing-folder.jpg')
			);
			const image = await expectSuccess(
				ImageService.create({
					folderId,
					hash: '7'.repeat(64),
					height: 600,
					name: 'missing-folder.jpg',
					path: resolve(missingPath, 'missing-folder.jpg'),
					size: 1024,
					source,
					width: 800,
				})
			);

			await syncSpecificFolder(folderId);

			expect(await db.select().from(folders).where(eq(folders.id, folderId))).toHaveLength(1);
			expect(await db.select().from(images).where(eq(images.id, image.id))).toHaveLength(1);
			expect(await db.select().from(sourceFiles).where(eq(sourceFiles.assetId, image.id))).toEqual([
				expect.objectContaining({ availability: 'missing' }),
			]);
		});

		it('preserves a missing parent subtree and marks descendant canonical placements missing', async () => {
			const parentId = crypto.randomUUID();
			const childId = crypto.randomUUID();
			const parentPath = resolve(tmpdir(), `media-manager-missing-parent-${crypto.randomUUID()}`);
			const childPath = resolve(parentPath, 'child');
			await db.insert(folders).values({ id: parentId, name: 'Missing parent', path: parentPath });
			await db.insert(folders).values({ id: childId, name: 'Missing child', parentId, path: childPath });
			const imagePath = resolve(childPath, 'descendant.jpg');
			const image = await expectSuccess(
				ImageService.create({
					folderId: childId,
					hash: 'a'.repeat(64),
					height: 1,
					name: 'descendant.jpg',
					path: imagePath,
					size: 1,
					source: await createTestCanonicalSource('descendant.jpg', imagePath),
					width: 1,
				})
			);

			await syncSpecificFolder(parentId);

			expect(
				await db
					.select()
					.from(folders)
					.where(inArray(folders.id, [parentId, childId]))
			).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ id: parentId }),
					expect.objectContaining({ id: childId, parentId }),
				])
			);
			expect(await db.select().from(sourceFiles).where(eq(sourceFiles.assetId, image.id))).toEqual([
				expect.objectContaining({ availability: 'missing', folderId: childId }),
			]);
		});
	});

	describe('update', () => {
		it('should update image fields', async () => {
			const folder = await createTestFolder();
			const image = await createTestImage(folder.id);

			const update = {
				name: 'updated-name.jpg',
				description: 'Updated description',
			};

			const result = await expectSuccess(ImageService.update(image.id, update));

			expect(result.id).toBe(image.id);
			expect(result.name).toBe(update.name);
			expect(result.description).toBe(update.description);
			expect(result.isFavorite).toBe(false);
		});

		it('updates canonical title without mutating primary placement', async () => {
			const sourceFolder = await createTestFolder('/uploads');
			const source = await createTestCanonicalSource('uploads/update-canonical.jpg');
			const image = await expectSuccess(
				ImageService.create({
					folderId: sourceFolder.id,
					hash: 'e'.repeat(64),
					height: 600,
					name: 'before.jpg',
					path: '/uploads/update-canonical.jpg',
					size: 1024,
					source,
					width: 800,
				})
			);

			const result = await expectSuccess(ImageService.update(image.id, { name: 'after.jpg' }));

			expect(result.canonicalState).toBe('canonical');
			expect(result.name).toBe('after.jpg');
			expect(await db.select().from(assets).where(eq(assets.id, image.id))).toEqual([
				expect.objectContaining({ title: 'after.jpg' }),
			]);
			expect(await db.select().from(sourceFiles).where(eq(sourceFiles.assetId, image.id))).toEqual([
				expect.objectContaining({ folderId: sourceFolder.id }),
			]);
		});

		it('should persist update favorite state through the canonical favorite bridge when a profile is active', async () => {
			const folder = await createTestFolder('/uploads');
			const image = await createTestImage(folder.id, { isFavorite: false });
			await ensureActiveProfile();
			await favoriteService.set(FavoriteEntityType.IMAGE, image.id, true);

			const legacyUpdate: Parameters<typeof ImageService.update>[1] & { isFavorite: boolean; name: string } = {
				name: 'keep-favorite-via-canonical.jpg',
				isFavorite: false,
			};

			const result = await expectSuccess(ImageService.update(image.id, legacyUpdate));

			expect(result.isFavorite).toBe(true);
			expect(await favoriteService.isFavorite(FavoriteEntityType.IMAGE, image.id)).toBe(true);
		});

		it('should update AI metadata', async () => {
			const folder = await createTestFolder('/uploads');
			const image = await createTestImage(folder.id);

			const update = {
				aiEngine: 'midjourney',
				aiModel: 'v6',
				aiOriginDetected: true,
			};

			const result = await expectSuccess(ImageService.update(image.id, update));

			expect(result.aiEngine).toBe(update.aiEngine);
			expect(result.aiModel).toBe(update.aiModel);
			expect(result.aiOriginDetected).toBe(true);
		});

		it('should fail when updating non-existent image', async () => {
			const error = await expectError(ImageService.update('non-existent-id', { name: 'test.jpg' }));

			expect(error._tag).toBe('ImageNotFound');
		});
	});

	describe('deleteById', () => {
		it('should delete image without relations', async () => {
			const folder = await createTestFolder();
			const image = await createTestImage(folder.id);

			await expectSuccess(ImageService.deleteById(image.id));

			// Verify deletion
			const error = await expectError(ImageService.getById(image.id));
			expect(error._tag).toBe('ImageNotFound');
		});

		it('tombstones and restores a canonical Image without losing source or authored relations', async () => {
			const folder = await createTestFolder('/uploads');
			const source = await createTestCanonicalSource('uploads/delete-canonical.jpg');
			const tag = await createTestTag();
			const album = await createTestAlbum();
			const collection = await createTestCollection();
			const image = await expectSuccess(
				ImageService.create({
					folderId: folder.id,
					hash: 'f'.repeat(64),
					height: 600,
					name: 'delete-canonical.jpg',
					path: '/uploads/delete-canonical.jpg',
					size: 1024,
					source,
					width: 800,
				})
			);
			await db.insert(imageTags).values({ A: image.id, B: tag.id });
			await db.insert(imageAlbums).values({ A: image.id, B: album.id });
			await db.insert(imageCollections).values({ A: image.id, B: collection.id });
			await db
				.update(images)
				.set({ thumbnail: 'thumbnail-data', thumbnailHeight: 1, thumbnailSize: 14, thumbnailWidth: 1 })
				.where(eq(images.id, image.id));

			await expectSuccess(ImageService.deleteById(image.id));

			expect((await expectError(ImageService.getById(image.id)))._tag).toBe('ImageNotFound');
			expect(await db.select().from(images).where(eq(images.id, image.id))).toHaveLength(1);
			expect(await db.select().from(assets).where(eq(assets.id, image.id))).toEqual([
				expect.objectContaining({ deletedAt: expect.any(Date), status: 'deleted', statusBeforeDeletion: 'active' }),
			]);
			expect(await db.select().from(sourceFiles).where(eq(sourceFiles.assetId, image.id))).toHaveLength(1);
			expect(await db.select().from(imageTags).where(eq(imageTags.A, image.id))).toHaveLength(1);
			expect((await expectSuccess(ImageService.getAll())).total).toBe(0);
			const folderStatsWhileDeleted = await Effect.runPromise(
				Effect.gen(function* () {
					const service = yield* FolderService;
					return yield* service.getById(folder.id);
				}).pipe(Effect.provide(FolderServiceLive))
			);
			expect(folderStatsWhileDeleted._count?.images).toBe(0);
			expect(folderStatsWhileDeleted.totalFiles).toBe(0);
			expect(folderStatsWhileDeleted.totalSize).toBe(0);
			expect(await getFolderFileStats(folder.id)).toEqual(
				expect.objectContaining({ images: 0, total: 0, totalSize: 0 })
			);
			expect((await performSearch('delete-canonical', 'image')).results).toEqual([]);
			expect((await fetchMediaCounts()).images).toBe(0);
			const navigationWhileDeleted = await getNavigationData();
			expect(navigationWhileDeleted.stats.totalImages).toBe(0);
			expect(navigationWhileDeleted.folders.find((entry) => entry.id === folder.id)?.itemCount).toBe(0);
			const albumStateWhileDeleted = await Effect.runPromise(
				Effect.gen(function* () {
					const service = yield* AlbumService;
					return {
						counts: yield* service.getRelationsCounts(album.id),
						images: yield* service.getImages(album.id),
					};
				}).pipe(Effect.provide(AlbumServiceLive))
			);
			expect(albumStateWhileDeleted.counts.images).toBe(0);
			expect(albumStateWhileDeleted.images).toEqual([]);
			const albumDeleteWhileImageDeleted = await runEffect(
				Effect.gen(function* () {
					const service = yield* AlbumService;
					return yield* service.delete(album.id);
				}).pipe(Effect.provide(AlbumServiceLive))
			);
			expect(albumDeleteWhileImageDeleted._tag).toBe('Left');
			if (albumDeleteWhileImageDeleted._tag === 'Left') {
				expect(albumDeleteWhileImageDeleted.left._tag).toBe('AlbumHasRelationsError');
			}
			expect(await db.select().from(imageAlbums).where(eq(imageAlbums.A, image.id))).toHaveLength(1);
			const collectionStateWhileDeleted = await Effect.runPromise(
				Effect.gen(function* () {
					const service = yield* CollectionService;
					return { collection: yield* service.getById(collection.id), images: yield* service.getImages(collection.id) };
				}).pipe(Effect.provide(CollectionServiceLive))
			);
			expect(collectionStateWhileDeleted.collection.totalImages).toBe(0);
			expect(collectionStateWhileDeleted.images).toEqual([]);
			const collectionDeleteWhileImageDeleted = await runEffect(
				Effect.gen(function* () {
					const service = yield* CollectionService;
					return yield* service.delete(collection.id);
				}).pipe(Effect.provide(CollectionServiceLive))
			);
			expect(collectionDeleteWhileImageDeleted._tag).toBe('Left');
			const tagStateWhileDeleted = await Effect.runPromise(
				Effect.gen(function* () {
					const service = yield* TagService;
					return {
						counts: yield* service.getRelationsCounts(tag.id),
						images: yield* service.getImages(tag.id),
						thumbnails: yield* service.getThumbnails(tag.id),
					};
				}).pipe(Effect.provide(TagServiceLive))
			);
			expect(tagStateWhileDeleted.counts.images).toBe(0);
			expect(tagStateWhileDeleted.images).toEqual([]);
			expect(tagStateWhileDeleted.thumbnails).toEqual([]);
			const tagDeleteWhileImageDeleted = await runEffect(
				Effect.gen(function* () {
					const service = yield* TagService;
					return yield* service.delete(tag.id);
				}).pipe(Effect.provide(TagServiceLive))
			);
			expect(tagDeleteWhileImageDeleted._tag).toBe('Left');
			expect(await db.select().from(imageCollections).where(eq(imageCollections.A, image.id))).toHaveLength(1);
			expect(await db.select().from(imageTags).where(eq(imageTags.A, image.id))).toHaveLength(1);
			expect(await getFolderFiles({ fileTypes: ['image'], folderId: folder.id })).toEqual(
				expect.objectContaining({ files: [], total: 0 })
			);
			const deletedStreamChunks = [];
			for await (const chunk of streamFolderFiles({ fileTypes: ['image'], folderId: folder.id })) {
				deletedStreamChunks.push(chunk);
			}
			expect(deletedStreamChunks.find((chunk) => chunk.type === 'metadata')?.metadata?.totalEstimate).toBe(0);
			expect(deletedStreamChunks.flatMap((chunk) => chunk.data ?? [])).toEqual([]);

			const restored = await expectSuccess(ImageService.restoreById(image.id));
			expect(restored.id).toBe(image.id);
			expect(await db.select().from(assets).where(eq(assets.id, image.id))).toEqual([
				expect.objectContaining({ deletedAt: null, status: 'active', statusBeforeDeletion: null }),
			]);
			expect(await db.select().from(imageTags).where(eq(imageTags.A, image.id))).toHaveLength(1);
			expect((await expectSuccess(ImageService.getAll())).total).toBe(1);
			expect((await getFolderFiles({ fileTypes: ['image'], folderId: folder.id })).total).toBe(1);
			expect(await getFolderFileStats(folder.id)).toEqual(
				expect.objectContaining({ images: 1, total: 1, totalSize: 1024 })
			);
			expect((await performSearch('delete-canonical', 'image')).results).toHaveLength(1);
			expect((await fetchMediaCounts()).images).toBe(1);
			const restoredTagCounts = await Effect.runPromise(
				Effect.gen(function* () {
					const service = yield* TagService;
					return yield* service.getRelationsCounts(tag.id);
				}).pipe(Effect.provide(TagServiceLive))
			);
			expect(restoredTagCounts.images).toBe(1);
		});

		it('should fail to delete image with relations (without force)', async () => {
			const folder = await createTestFolder();
			const image = await createTestImage(folder.id);
			const album = await createTestAlbum();

			// Add relation
			await db.insert(imageAlbums).values({ A: image.id, B: album.id });

			const error = await expectError(ImageService.deleteById(image.id));

			expect(error._tag).toBe('ImageHasRelationsError');
			if (error._tag === 'ImageHasRelationsError') {
				expect(error.relationCounts.albums).toBe(1);
			}
		});

		it('should delete image with relations when force=true', async () => {
			const folder = await createTestFolder();
			const image = await createTestImage(folder.id);
			const album = await createTestAlbum();

			// Add relation
			await db.insert(imageAlbums).values({ A: image.id, B: album.id });

			await expectSuccess(ImageService.deleteById(image.id, { force: true }));

			// Verify deletion
			const error = await expectError(ImageService.getById(image.id));
			expect(error._tag).toBe('ImageNotFound');
		});

		it('should fail when deleting non-existent image', async () => {
			const error = await expectError(ImageService.deleteById('non-existent-id'));

			expect(error._tag).toBe('ImageNotFound');
		});
	});

	describe('deleteManyByIds', () => {
		it('should delete multiple images', async () => {
			const folder = await createTestFolder();
			const image1 = await createTestImage(folder.id);
			const image2 = await createTestImage(folder.id);
			const image3 = await createTestImage(folder.id);

			const result = await expectSuccess(ImageService.deleteManyByIds([image1.id, image2.id, image3.id]));

			expect(result.deletedCount).toBe(3);

			// Verify deletions
			await expectError(ImageService.getById(image1.id));
			await expectError(ImageService.getById(image2.id));
			await expectError(ImageService.getById(image3.id));
		});

		it('batch-tombstones canonical Images without physically purging them', async () => {
			const folder = await createTestFolder('/uploads');
			const first = await expectSuccess(
				ImageService.create({
					folderId: folder.id,
					hash: '8'.repeat(64),
					height: 1,
					name: 'batch-one.jpg',
					path: '/uploads/batch-one.jpg',
					size: 1,
					source: await createTestCanonicalSource('uploads/batch-one.jpg'),
					width: 1,
				})
			);
			const second = await expectSuccess(
				ImageService.create({
					folderId: folder.id,
					hash: '9'.repeat(64),
					height: 1,
					name: 'batch-two.jpg',
					path: '/uploads/batch-two.jpg',
					size: 1,
					source: await createTestCanonicalSource('uploads/batch-two.jpg'),
					width: 1,
				})
			);

			const result = await expectSuccess(ImageService.deleteManyByIds([first.id, second.id]));

			expect(result.deletedCount).toBe(2);
			expect(
				await db
					.select()
					.from(images)
					.where(inArray(images.id, [first.id, second.id]))
			).toHaveLength(2);
			expect(
				await db
					.select()
					.from(assets)
					.where(inArray(assets.id, [first.id, second.id]))
			).toEqual([expect.objectContaining({ status: 'deleted' }), expect.objectContaining({ status: 'deleted' })]);
			expect((await expectSuccess(ImageService.getAll())).total).toBe(0);
		});

		it('should fail with empty IDs array', async () => {
			const error = await expectError(ImageService.deleteManyByIds([]));

			expect(error._tag).toBe('ImageValidationError');
		});

		it('should fail if any image has relations (without force)', async () => {
			const folder = await createTestFolder();
			const image1 = await createTestImage(folder.id);
			const image2 = await createTestImage(folder.id);
			const album = await createTestAlbum();

			// Add relation to image2
			await db.insert(imageAlbums).values({ A: image2.id, B: album.id });

			const error = await expectError(ImageService.deleteManyByIds([image1.id, image2.id]));

			expect(error._tag).toBe('ImageHasRelationsError');
		});

		it('should delete multiple images with relations when force=true', async () => {
			const folder = await createTestFolder();
			const image1 = await createTestImage(folder.id);
			const image2 = await createTestImage(folder.id);
			const album = await createTestAlbum();

			// Add relation
			await db.insert(imageAlbums).values({ A: image2.id, B: album.id });

			const result = await expectSuccess(ImageService.deleteManyByIds([image1.id, image2.id], { force: true }));

			expect(result.deletedCount).toBe(2);
		});
	});
});

// ============= QUERY OPERATIONS TESTS =============

describe('ImageService - Query Operations', () => {
	describe('getByHash', () => {
		it('should find image by hash', async () => {
			const folder = await createTestFolder();
			const timestamp = Date.now().toString();
			const validHash = timestamp.padStart(64, '0');
			const image = await createTestImage(folder.id, { hash: validHash });

			const result = await expectSuccess(ImageService.getByHash(validHash));

			expect(result.id).toBe(image.id);
			expect(result.hash).toBe(validHash);
		});

		it('should fail when hash not found', async () => {
			const validHash = '1'.padStart(64, '0');
			const error = await expectError(ImageService.getByHash(validHash));

			expect(error._tag).toBe('ImageNotFound');
		});
	});

	describe('getByPathAndFolder', () => {
		it('should find image by path and folder', async () => {
			const folder = await createTestFolder();
			const path = '/unique/path/image.jpg';
			const image = await createTestImage(folder.id, { path });

			const result = await expectSuccess(ImageService.getByPathAndFolder(path, folder.id));

			expect(result.id).toBe(image.id);
			expect(result.path).toBe(path);
			expect(result.folderId).toBe(folder.id);
		});

		it('should fail when path/folder combination not found', async () => {
			const folder = await createTestFolder();
			const error = await expectError(ImageService.getByPathAndFolder('/non-existent.jpg', folder.id));

			expect(error._tag).toBe('ImageNotFound');
		});
	});

	describe('getAll', () => {
		it('should list all images', async () => {
			const folder = await createTestFolder();
			await createTestImage(folder.id);
			await createTestImage(folder.id);
			await createTestImage(folder.id);

			const result = await expectSuccess(ImageService.getAll());

			expect(result.images.length).toBe(3);
			expect(result.total).toBe(3);
		});

		it('should paginate results', async () => {
			const folder = await createTestFolder();
			await createTestImage(folder.id);
			await createTestImage(folder.id);
			await createTestImage(folder.id);
			await createTestImage(folder.id);
			await createTestImage(folder.id);

			const page1 = await expectSuccess(ImageService.getAll({ limit: 2, offset: 0 }));
			expect(page1.images.length).toBe(2);
			expect(page1.total).toBe(5);

			const page2 = await expectSuccess(ImageService.getAll({ limit: 2, offset: 2 }));
			expect(page2.images.length).toBe(2);

			const page3 = await expectSuccess(ImageService.getAll({ limit: 2, offset: 4 }));
			expect(page3.images.length).toBe(1);
		});

		it('should filter by folderId', async () => {
			const folder1 = await createTestFolder();
			const folder2 = await createTestFolder();

			await createTestImage(folder1.id);
			await createTestImage(folder1.id);
			await createTestImage(folder2.id);

			const result = await expectSuccess(ImageService.getAll({ folderId: folder1.id }));

			expect(result.images.length).toBe(2);
			expect(result.total).toBe(2);
			expect(result.images.every((img: any) => img.folderId === folder1.id)).toBe(true);
		});

		it('should filter by isFavorite', async () => {
			const folder = await createTestFolder();
			await ensureActiveProfile();
			const favoriteImage = await createTestImage(folder.id, { isFavorite: false });
			await createTestImage(folder.id, { isFavorite: true });
			await createTestImage(folder.id, { isFavorite: false });

			await favoriteService.set(FavoriteEntityType.IMAGE, favoriteImage.id, true);

			const result = await expectSuccess(ImageService.getAll({ isFavorite: true }));

			expect(result.images.length).toBe(1);
			expect(result.images[0].id).toBe(favoriteImage.id);
			expect(result.images.every((img: any) => img.isFavorite === true)).toBe(true);
		});

		it('should return all images as isFavorite=false when no active profile exists', async () => {
			const folder = await createTestFolder();
			await createTestImage(folder.id, { isFavorite: true });
			await createTestImage(folder.id, { isFavorite: false });

			const result = await expectSuccess(ImageService.getAll({ isFavorite: false }));

			expect(result.total).toBe(2);
			expect(result.images.every((img) => img.isFavorite === false)).toBe(true);
		});

		it('should resolve isFavorite=false from canonical favorites instead of stale projection', async () => {
			const folder = await createTestFolder();
			await ensureActiveProfile();
			const canonicalFavorite = await createTestImage(folder.id, { isFavorite: false });
			const staleProjectedFavorite = await createTestImage(folder.id, { isFavorite: true });
			const regularImage = await createTestImage(folder.id, { isFavorite: false });

			await favoriteService.set(FavoriteEntityType.IMAGE, canonicalFavorite.id, true);

			const result = await expectSuccess(ImageService.getAll({ isFavorite: false }));

			expect(result.total).toBe(2);
			expect(result.images.map((img) => img.id).sort()).toEqual([regularImage.id, staleProjectedFavorite.id].sort());
			expect(result.images.every((img) => img.isFavorite === false)).toBe(true);
		});
	});

	describe('getAllFavorites', () => {
		it('should return only favorite images', async () => {
			const folder = await createTestFolder();
			await ensureActiveProfile();
			const firstFavorite = await createTestImage(folder.id, { isFavorite: false });
			const secondFavorite = await createTestImage(folder.id, { isFavorite: false });
			await createTestImage(folder.id, { isFavorite: true });
			await createTestImage(folder.id, { isFavorite: false });

			await favoriteService.set(FavoriteEntityType.IMAGE, firstFavorite.id, true);
			await favoriteService.set(FavoriteEntityType.IMAGE, secondFavorite.id, true);

			const result = await expectSuccess(ImageService.getAllFavorites());

			expect(result.length).toBe(2);
			expect(result.map((img) => img.id).sort()).toEqual([firstFavorite.id, secondFavorite.id].sort());
			expect(result.every((img) => img.isFavorite === true)).toBe(true);
		});

		it('should return empty array when no favorites', async () => {
			const folder = await createTestFolder();
			await createTestImage(folder.id, { isFavorite: true });

			const result = await expectSuccess(ImageService.getAllFavorites());

			expect(result.length).toBe(0);
		});
	});

	describe('getByFolder', () => {
		it('should return images from specific folder', async () => {
			const folder1 = await createTestFolder();
			const folder2 = await createTestFolder();

			await createTestImage(folder1.id);
			await createTestImage(folder1.id);
			await createTestImage(folder1.id);
			await createTestImage(folder2.id);

			const result = await expectSuccess(ImageService.getByFolder(folder1.id));

			expect(result.length).toBe(3);
			expect(result.every((img) => img.folderId === folder1.id)).toBe(true);
		});

		it('should paginate folder images', async () => {
			const folder = await createTestFolder();
			await createTestImage(folder.id);
			await createTestImage(folder.id);
			await createTestImage(folder.id);

			const result = await expectSuccess(ImageService.getByFolder(folder.id, { limit: 2, offset: 0 }));

			expect(result.length).toBe(2);
		});
	});

	describe('countByFolder', () => {
		it('should count images in folder', async () => {
			const folder = await createTestFolder();
			await createTestImage(folder.id);
			await createTestImage(folder.id);
			await createTestImage(folder.id);

			const count = await expectSuccess(ImageService.countByFolder(folder.id));

			expect(count).toBe(3);
		});

		it('should return zero for empty folder', async () => {
			const folder = await createTestFolder();

			const count = await expectSuccess(ImageService.countByFolder(folder.id));

			expect(count).toBe(0);
		});
	});
});

// ============= TOGGLE OPERATIONS TESTS =============

describe('ImageService - Toggle Operations', () => {
	describe('toggleFavorite', () => {
		it('should toggle favorite from false to true', async () => {
			const folder = await createTestFolder();
			const image = await createTestImage(folder.id, { isFavorite: false });
			await ensureActiveProfile();

			const result = await expectSuccess(ImageService.toggleFavorite(image.id));

			expect(result.isFavorite).toBe(true);
		});

		it('should toggle favorite from true to false', async () => {
			const folder = await createTestFolder();
			const image = await createTestImage(folder.id, { isFavorite: false });
			await ensureActiveProfile();

			const favorited = await expectSuccess(ImageService.toggleFavorite(image.id));
			expect(favorited.isFavorite).toBe(true);

			const result = await expectSuccess(ImageService.toggleFavorite(image.id));

			expect(result.isFavorite).toBe(false);
		});

		it('should fail when image does not exist', async () => {
			const error = await expectError(ImageService.toggleFavorite('non-existent-id'));

			expect(error._tag).toBe('ImageNotFound');
		});

		it('should delegate toggleFavorite to the canonical favorite bridge when a profile is active', async () => {
			const folder = await createTestFolder();
			const image = await createTestImage(folder.id, { isFavorite: false });
			await ensureActiveProfile();

			const result = await expectSuccess(ImageService.toggleFavorite(image.id));

			expect(result.isFavorite).toBe(true);
			expect(await favoriteService.isFavorite(FavoriteEntityType.IMAGE, image.id)).toBe(true);
		});
	});

	describe('setFavoriteMany', () => {
		it('should set favorite=true for multiple images', async () => {
			const folder = await createTestFolder();
			const image1 = await createTestImage(folder.id, { isFavorite: false });
			const image2 = await createTestImage(folder.id, { isFavorite: false });
			const image3 = await createTestImage(folder.id, { isFavorite: false });
			await ensureActiveProfile();

			const result = await expectSuccess(ImageService.setFavoriteMany([image1.id, image2.id, image3.id], true));

			expect(result.updatedCount).toBe(3);

			// Verify changes
			const img1 = await expectSuccess(ImageService.getById(image1.id));
			const img2 = await expectSuccess(ImageService.getById(image2.id));
			const img3 = await expectSuccess(ImageService.getById(image3.id));

			expect(img1.isFavorite).toBe(true);
			expect(img2.isFavorite).toBe(true);
			expect(img3.isFavorite).toBe(true);
		});

		it('should set favorite=false for multiple images', async () => {
			const folder = await createTestFolder();
			const image1 = await createTestImage(folder.id, { isFavorite: true });
			const image2 = await createTestImage(folder.id, { isFavorite: true });
			await ensureActiveProfile();

			const result = await expectSuccess(ImageService.setFavoriteMany([image1.id, image2.id], false));

			expect(result.updatedCount).toBe(2);

			// Verify changes
			const img1 = await expectSuccess(ImageService.getById(image1.id));
			const img2 = await expectSuccess(ImageService.getById(image2.id));

			expect(img1.isFavorite).toBe(false);
			expect(img2.isFavorite).toBe(false);
		});

		it('should fail with empty IDs array', async () => {
			const error = await expectError(ImageService.setFavoriteMany([], true));

			expect(error._tag).toBe('ImageValidationError');
		});

		it('should persist batch favorite state through the canonical favorite bridge when a profile is active', async () => {
			const folder = await createTestFolder();
			const image1 = await createTestImage(folder.id, { isFavorite: false });
			const image2 = await createTestImage(folder.id, { isFavorite: false });
			await ensureActiveProfile();

			const result = await expectSuccess(ImageService.setFavoriteMany([image1.id, image2.id], true));

			expect(result.updatedCount).toBe(2);
			expect(await favoriteService.isFavorite(FavoriteEntityType.IMAGE, image1.id)).toBe(true);
			expect(await favoriteService.isFavorite(FavoriteEntityType.IMAGE, image2.id)).toBe(true);
		});
	});
});
