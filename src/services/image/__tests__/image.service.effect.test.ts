/**
 * @file Tests para ImageService con Effect
 * @module services/image/__tests__/image.service.effect.test
 * @description Test suite completo para ImageService usando Effect-TS
 * @created 2025-10-11 - Phase 6: Image Test Suite
 */

import { Effect } from 'effect';
import { eq, inArray } from 'drizzle-orm';
import { afterEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/drizzle';
import { albums, favorites, folders, imageAlbums, images, imageTags, profiles, tags } from '@/lib/drizzle/schema';
import { favoriteService } from '@/services/favorite/favorite.service';
import { FavoriteEntityType } from '@/types/entities/favorite';
import * as ImageService from '../image.service.effect';

// ============= Test Helpers =============

/**
 * Ejecuta un Effect y convierte el resultado a Either
 */
const runEffect = <A, E>(effect: Effect.Effect<A, E, never>) => Effect.runPromise(Effect.either(effect));

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

const createTestFolder = async () => {
	const now = new Date();
	const [folder] = await db
		.insert(folders)
		.values({
			id: crypto.randomUUID(),
			name: `test-folder-${Date.now()}`,
			path: `/test/folder-${Date.now()}`,
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
	await db.delete(imageTags);
	await db.delete(favorites).where(eq(favorites.entityType, FavoriteEntityType.IMAGE));
	await db.delete(images);
	await db.delete(albums);
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
});

// ============= CRUD TESTS =============

describe('ImageService - CRUD Operations', () => {
	describe('create', () => {
		it('should create an image successfully', async () => {
			const folder = await createTestFolder();
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
		});

		it('should persist favorite state through the canonical favorite bridge when a profile is active', async () => {
			const folder = await createTestFolder();
			const timestamp = Date.now().toString();
			const validHash = timestamp.padStart(64, '0');
			await ensureActiveProfile();

			const legacyInput: Parameters<typeof ImageService.create>[0] & { isFavorite: boolean } = {
				name: 'canonical-favorite-create.jpg',
				path: '/uploads/canonical-favorite-create.jpg',
				hash: validHash,
				size: 2_048_000,
				width: 1920,
				height: 1080,
				folderId: folder.id,
				isFavorite: true,
			};

			const result = await expectSuccess(
				ImageService.create(legacyInput)
			);

			expect(result.isFavorite).toBe(false);
			expect(await favoriteService.isFavorite(FavoriteEntityType.IMAGE, result.id)).toBe(false);
		});

		it('should create image with optional metadata', async () => {
			const folder = await createTestFolder();
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
			};

			const result = await expectSuccess(ImageService.create(input));

			expect(result.description).toBe(input.description);
			expect(result.metadata).toBe(input.metadata);
			expect(result.aiEngine).toBe(input.aiEngine);
			expect(result.aiModel).toBe(input.aiModel);
			expect(result.aiOriginDetected).toBe(true);
		});

		it('should fail with invalid hash length', async () => {
			const folder = await createTestFolder();

			const input = {
				name: 'invalid-hash.jpg',
				path: '/uploads/invalid.jpg',
				hash: 'short', // Invalid: must be exactly 64 chars
				size: 1024,
				width: 800,
				height: 600,
				folderId: folder.id,
			};

			const error = await expectError(ImageService.create(input));
			expect(error._tag).toBe('ImageValidationError');
		});

		it('should fail with dimensions exceeding limit', async () => {
			const folder = await createTestFolder();
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
			};

			const error = await expectError(ImageService.create(input));
			expect(error._tag).toBe('ImageValidationError');
		});

		it('should fail with size exceeding 100GB limit', async () => {
			const folder = await createTestFolder();
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

		it('should persist update favorite state through the canonical favorite bridge when a profile is active', async () => {
			const folder = await createTestFolder();
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
			const folder = await createTestFolder();
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
