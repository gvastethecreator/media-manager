/**
 * @file Tests para CollectionService con Effect
 * @module services/collection/__tests__/collection.service.effect.test
 * @description Test suite completo para CollectionService usando Effect-TS
 * @created 2025-10-11 - Phase 5.3: Collection Test Suite
 */

import { and, eq, inArray } from 'drizzle-orm';
import { Effect } from 'effect';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/drizzle';
import { collections, favorites, folders, imageCollections, images, profiles } from '@/lib/drizzle/schema';
import { favoriteService } from '@/services/favorite/favorite.service';
import { FavoriteEntityType } from '@/types/entities/favorite';
import {
	type CollectionServiceInterface,
	CollectionService,
	CollectionServiceLive,
} from '../collection.service.effect';
import { CollectionHasContentError, CollectionNotFound, CollectionValidationError } from '../collection-errors.effect';

// ============= Test Helpers =============

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isSqliteBusyError = (error: unknown) => {
	if (!(error instanceof Error)) {
		return false;
	}

	return error.message.includes('SQLITE_BUSY') || error.message.includes('database is locked');
};

const withSqliteRetry = async <T>(operation: () => Promise<T>, retries = 20): Promise<T> => {
	let lastError: unknown;

	for (let attempt = 0; attempt <= retries; attempt++) {
		try {
			return await operation();
		} catch (error) {
			lastError = error;
			if (!isSqliteBusyError(error) || attempt === retries) {
				throw error;
			}

			await wait(50 * (attempt + 1));
		}
	}

	throw lastError;
};

const cleanupTestData = () =>
	withSqliteRetry(async () => {
		await wait(50);
		await db.delete(favorites).where(eq(favorites.entityType, 'collection'));
		await db.delete(imageCollections);
		await db.delete(images);
		await db.delete(collections);
		await db.delete(folders);
		await wait(50);
	});

let previousActiveProfileIds: string[] = [];
let createdActiveProfileId: string | null = null;

const suspendActiveProfiles = () =>
	withSqliteRetry(async () => {
		const activeProfiles = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.isActive, true));
		previousActiveProfileIds = activeProfiles.map((profile: { id: string }) => profile.id);

		if (previousActiveProfileIds.length > 0) {
			await db.update(profiles).set({ isActive: false }).where(eq(profiles.isActive, true));
		}
	});

const restoreActiveProfiles = () =>
	withSqliteRetry(async () => {
		if (previousActiveProfileIds.length > 0) {
			await db.update(profiles).set({ isActive: true }).where(inArray(profiles.id, previousActiveProfileIds));
		}

		previousActiveProfileIds = [];
	});

const ensureActiveProfile = () =>
	withSqliteRetry(async () => {
		const [activeProfile] = await db
			.select({ id: profiles.id })
			.from(profiles)
			.where(eq(profiles.isActive, true))
			.limit(1);

		if (activeProfile) {
			return activeProfile.id;
		}

		const profileId = `collection-service-test-profile-${Date.now()}-${Math.random().toString(16).slice(2)}`;
		createdActiveProfileId = profileId;

		await db.insert(profiles).values({
			id: profileId,
			name: 'Collection Service Active Profile',
			emoji: '📚',
			color: '#3b82f6',
			description: 'Perfil activo para tests canónicos de Collection',
			isActive: true,
			settingsId: null,
			imageId: null,
		});

		return profileId;
	});

/**
 * Ejecuta un Effect con el CollectionService en el contexto
 */
const runEffect = <A, E>(effect: Effect.Effect<A, E, CollectionService>) =>
	Effect.runPromise(Effect.provide(effect, CollectionServiceLive));

/**
 * Ejecuta un Effect esperando que falle
 */
const runEffectExpectFailure = <A, E>(effect: Effect.Effect<A, E, CollectionService>) =>
	Effect.runPromise(Effect.flip(Effect.provide(effect, CollectionServiceLive)));

// ============= Test Data Helpers =============

const createTestCollection = async (data: {
	name: string;
	emoji?: string | null;
	color?: string | null;
	description?: string | null;
	isFavorite?: boolean;
	parentId?: string | null;
}) => {
	const now = new Date();
	const createdCollections = (await withSqliteRetry(() =>
		db
			.insert(collections)
			.values({
				id: crypto.randomUUID(),
				name: data.name,
				emoji: data.emoji ?? null,
				color: data.color ?? null,
				description: data.description ?? null,
				featuredImage: null,
				isFavorite: data.isFavorite ?? false,
				lastImageAddedAt: null,
				lastVideoAddedAt: null,
				parentId: data.parentId ?? null,
				createdAt: now,
				updatedAt: now,
			})
			.returning()
	)) as Array<typeof collections.$inferSelect>;
	const [collection] = createdCollections;
	await wait(10);
	return collection;
};

const createTestImage = async () => {
	const now = new Date();

	// Create a dummy folder first (required by folderId NOT NULL constraint)
	const createdFolders = (await withSqliteRetry(() =>
		db
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
			.returning()
	)) as Array<typeof folders.$inferSelect>;
	const [folder] = createdFolders;
	await wait(10);

	// Generate a valid SHA-256 hash (64 hex characters)
	const timestamp = Date.now().toString();
	const validHash = timestamp.padStart(64, '0'); // Pad with zeros to 64 chars

	const createdImages = (await withSqliteRetry(() =>
		db
			.insert(images)
			.values({
				id: crypto.randomUUID(),
				name: `test-image-${Date.now()}.jpg`,
				path: `/test/image-${Date.now()}.jpg`,
				url: `http://localhost/test/image-${Date.now()}.jpg`,
				size: 1024,
				width: 800,
				height: 600,
				format: 'jpg',
				entityType: 'image',
				hash: validHash, // SHA-256 format: exactly 64 hex characters
				folderId: folder.id, // Assign folderId to satisfy NOT NULL constraint
				createdAt: now,
				updatedAt: now,
			})
			.returning()
	)) as Array<typeof images.$inferSelect>;
	const [image] = createdImages;
	await wait(10);
	return image;
};

const linkImageToCollection = async (imageId: string, collectionId: string) =>
	withSqliteRetry(() =>
		db.insert(imageCollections).values({
			A: imageId,
			B: collectionId,
		})
	);

const linkImagesToCollection = async (pairs: Array<{ imageId: string; collectionId: string }>) =>
	withSqliteRetry(() =>
		db.insert(imageCollections).values(
			pairs.map(({ imageId, collectionId }) => ({
				A: imageId,
				B: collectionId,
			}))
		)
	);

// ============= Cleanup =============

beforeEach(async () => {
	await suspendActiveProfiles();
	await cleanupTestData();
});

afterEach(async () => {
	// Clean up test data in correct order (relations first, then entities)
	await cleanupTestData();

	const profileIdToDelete = createdActiveProfileId;
	if (profileIdToDelete) {
		await withSqliteRetry(() => db.delete(profiles).where(eq(profiles.id, profileIdToDelete)));
		createdActiveProfileId = null;
	}

	await restoreActiveProfiles();
});

// ============= CRUD TESTS =============

describe('CollectionService - CRUD Operations', () => {
	describe('create', () => {
		it('should create a collection successfully', async () => {
			const input = {
				name: 'Test Collection',
				emoji: '📚',
				color: '#3b82f6',
				description: 'Test description',
			};

			const result = await runEffect(Effect.flatMap(CollectionService, (service) => service.create(input)));

			expect(result.name).toBe(input.name);
			expect(result.emoji).toBe(input.emoji);
			expect(result.color).toBe(input.color);
			expect(result.description).toBe(input.description);
			expect(result.isFavorite).toBe(false);
			expect(result.totalImages).toBe(0);
			expect(result.totalVideos).toBe(0);
		});

		it('should create a collection with minimal fields', async () => {
			const input = {
				name: 'Minimal Collection',
			};

			const result = await runEffect(Effect.flatMap(CollectionService, (service) => service.create(input)));

			expect(result.name).toBe(input.name);
			expect(result.emoji).toBeNull();
			expect(result.color).toBeNull();
			expect(result.description).toBeNull();
		});

		it('should create a collection with parent', async () => {
			const parent = await createTestCollection({ name: 'Parent Collection' });

			const input = {
				name: 'Child Collection',
				parentId: parent.id,
			};

			const result = await runEffect(Effect.flatMap(CollectionService, (service) => service.create(input)));

			expect(result.name).toBe(input.name);
			expect(result.parentId).toBe(parent.id);
		});

		it('should fail when creating collection with duplicate name', async () => {
			await createTestCollection({ name: 'Duplicate Collection' });

			const input = {
				name: 'Duplicate Collection',
			};

			const error = await runEffectExpectFailure(Effect.flatMap(CollectionService, (service) => service.create(input)));

			expect(error).toBeInstanceOf(CollectionValidationError);
			if (error instanceof CollectionValidationError) {
				expect(error.field).toBe('name');
				expect(error.message).toContain('Ya existe una collection');
			}
		});

		it('should fail when creating collection with invalid parent', async () => {
			const input = {
				name: 'Test Collection',
				parentId: 'non-existent-id',
			};

			const error = await runEffectExpectFailure(Effect.flatMap(CollectionService, (service) => service.create(input)));

			expect(error).toBeInstanceOf(CollectionNotFound);
		});

		it('should persist authored favorite input through the canonical Favorite table', async () => {
			await ensureActiveProfile();

			const legacyInput: Parameters<CollectionServiceInterface['create']>[0] & { isFavorite: boolean } = {
				name: 'Favorite Collection',
				isFavorite: true,
			};

			const result = await runEffect(Effect.flatMap(CollectionService, (service) => service.create(legacyInput)));

			expect(result.isFavorite).toBe(true);
			expect(await favoriteService.isFavorite(FavoriteEntityType.COLLECTION, result.id)).toBe(true);
		});
	});

	describe('getById', () => {
		it('should get collection by id with stats', async () => {
			const collection = await createTestCollection({
				name: 'Test Collection',
				emoji: '📚',
			});

			const result = await runEffect(Effect.flatMap(CollectionService, (service) => service.getById(collection.id)));

			expect(result.id).toBe(collection.id);
			expect(result.name).toBe(collection.name);
			expect(result.emoji).toBe(collection.emoji);
			expect(result.totalImages).toBe(0);
			expect(result.totalVideos).toBe(0);
			expect(result.totalSize).toBe(0);
		});

		it('should fail when collection not found', async () => {
			const error = await runEffectExpectFailure(
				Effect.flatMap(CollectionService, (service) => service.getById('non-existent-id'))
			);

			expect(error).toBeInstanceOf(CollectionNotFound);
			if (error instanceof CollectionNotFound) {
				expect(error.collectionId).toBe('non-existent-id');
			}
		});

		it('should include image counts in stats', async () => {
			const collection = await createTestCollection({ name: 'Test Collection' });
			const image = await createTestImage();

			// Add image to collection
			await linkImageToCollection(image.id, collection.id);

			const result = await runEffect(Effect.flatMap(CollectionService, (service) => service.getById(collection.id)));

			expect(result.totalImages).toBe(1);
		});
	});

	describe('getAll', () => {
		it('should get all collections with default pagination', async () => {
			await createTestCollection({ name: 'Collection 1' });
			await createTestCollection({ name: 'Collection 2' });
			await createTestCollection({ name: 'Collection 3' });

			const result = await runEffect(Effect.flatMap(CollectionService, (service) => service.getAll()));

			expect(result.collections).toHaveLength(3);
			expect(result.total).toBe(3);
			expect(result.limit).toBe(50);
			expect(result.offset).toBe(0);
		});

		it('should paginate results', async () => {
			for (let i = 1; i <= 5; i++) {
				await createTestCollection({ name: `Collection ${i}` });
			}

			const result = await runEffect(
				Effect.flatMap(CollectionService, (service) => service.getAll({ limit: 2, offset: 2 }))
			);

			expect(result.collections).toHaveLength(2);
			expect(result.total).toBe(5);
			expect(result.limit).toBe(2);
			expect(result.offset).toBe(2);
		});

		it('should search collections by name', async () => {
			await createTestCollection({ name: 'Nature Photos' });
			await createTestCollection({ name: 'City Landscapes' });
			await createTestCollection({ name: 'Wildlife Nature' });

			const result = await runEffect(
				Effect.flatMap(CollectionService, (service) => service.getAll({ search: 'Nature' }))
			);

			expect(result.collections).toHaveLength(2);
			expect(result.collections.every((c) => c.name.includes('Nature'))).toBe(true);
		});

		it('should search collections by description', async () => {
			await createTestCollection({
				name: 'Collection 1',
				description: 'Beautiful nature shots',
			});
			await createTestCollection({
				name: 'Collection 2',
				description: 'City streets',
			});

			const result = await runEffect(
				Effect.flatMap(CollectionService, (service) => service.getAll({ search: 'nature' }))
			);

			expect(result.collections).toHaveLength(1);
			expect(result.collections[0].description).toContain('nature');
		});

		it('should filter by parentId', async () => {
			const parent = await createTestCollection({ name: 'Parent' });
			await createTestCollection({ name: 'Child 1', parentId: parent.id });
			await createTestCollection({ name: 'Child 2', parentId: parent.id });
			await createTestCollection({ name: 'Orphan' });

			const result = await runEffect(
				Effect.flatMap(CollectionService, (service) => service.getAll({ parentId: parent.id }))
			);

			expect(result.collections).toHaveLength(2);
			expect(result.collections.every((c) => c.parentId === parent.id)).toBe(true);
		});

		it('should filter root collections (parentId null)', async () => {
			const parent = await createTestCollection({ name: 'Parent' });
			await createTestCollection({ name: 'Child', parentId: parent.id });
			await createTestCollection({ name: 'Root 1' });
			await createTestCollection({ name: 'Root 2' });

			const result = await runEffect(
				Effect.flatMap(CollectionService, (service) => service.getAll({ parentId: null }))
			);

			expect(result.collections).toHaveLength(3); // Parent + Root 1 + Root 2
			expect(result.collections.every((c) => c.parentId === null)).toBe(true);
		});

		it('should return empty favorites when no active profile exists', async () => {
			await createTestCollection({ name: 'Favorite 1', isFavorite: true });
			await createTestCollection({ name: 'Regular', isFavorite: false });
			await createTestCollection({ name: 'Favorite 2', isFavorite: true });

			const result = await runEffect(
				Effect.flatMap(CollectionService, (service) => service.getAll({ onlyFavorites: true }))
			);

			expect(result.collections).toHaveLength(0);
			expect(result.total).toBe(0);
		});

		it('should order by name ascending', async () => {
			await createTestCollection({ name: 'Zebra' });
			await createTestCollection({ name: 'Apple' });
			await createTestCollection({ name: 'Mango' });

			const result = await runEffect(
				Effect.flatMap(CollectionService, (service) => service.getAll({ orderBy: 'name', orderDirection: 'asc' }))
			);

			expect(result.collections[0].name).toBe('Apple');
			expect(result.collections[1].name).toBe('Mango');
			expect(result.collections[2].name).toBe('Zebra');
		});

		it('should order by createdAt descending (default)', async () => {
			const first = await createTestCollection({ name: 'First' });
			// Small delay to ensure different timestamps
			await new Promise((resolve) => setTimeout(resolve, 10));
			const second = await createTestCollection({ name: 'Second' });
			await new Promise((resolve) => setTimeout(resolve, 10));
			const third = await createTestCollection({ name: 'Third' });

			const result = await runEffect(Effect.flatMap(CollectionService, (service) => service.getAll()));

			// Most recent first
			expect(result.collections[0].id).toBe(third.id);
			expect(result.collections[2].id).toBe(first.id);
		});
	});

	describe('update', () => {
		it('should update collection name', async () => {
			const collection = await createTestCollection({ name: 'Old Name' });

			const result = await runEffect(
				Effect.flatMap(CollectionService, (service) => service.update(collection.id, { name: 'New Name' }))
			);

			expect(result.name).toBe('New Name');
			expect(result.id).toBe(collection.id);
		});

		it('should update multiple fields', async () => {
			const collection = await createTestCollection({
				name: 'Test Collection',
				emoji: '📚',
			});

			const result = await runEffect(
				Effect.flatMap(CollectionService, (service) =>
					service.update(collection.id, {
						name: 'Updated Collection',
						emoji: '🎨',
						color: '#ff0000',
						description: 'New description',
					})
				)
			);

			expect(result.name).toBe('Updated Collection');
			expect(result.emoji).toBe('🎨');
			expect(result.color).toBe('#ff0000');
			expect(result.description).toBe('New description');
		});

		it('should update parent', async () => {
			const parent = await createTestCollection({ name: 'Parent' });
			const collection = await createTestCollection({ name: 'Child' });

			const result = await runEffect(
				Effect.flatMap(CollectionService, (service) => service.update(collection.id, { parentId: parent.id }))
			);

			expect(result.parentId).toBe(parent.id);
		});

		it('should fail when updating to duplicate name', async () => {
			await createTestCollection({ name: 'Existing Collection' });
			const collection = await createTestCollection({ name: 'My Collection' });

			const error = await runEffectExpectFailure(
				Effect.flatMap(CollectionService, (service) => service.update(collection.id, { name: 'Existing Collection' }))
			);

			expect(error).toBeInstanceOf(CollectionValidationError);
			if (error instanceof CollectionValidationError) {
				expect(error.field).toBe('name');
			}
		});

		it('should allow updating to same name', async () => {
			const collection = await createTestCollection({ name: 'Same Name' });

			const result = await runEffect(
				Effect.flatMap(CollectionService, (service) =>
					service.update(collection.id, {
						name: 'Same Name',
						description: 'New description',
					})
				)
			);

			expect(result.name).toBe('Same Name');
			expect(result.description).toBe('New description');
		});

		it('should fail when collection not found', async () => {
			const error = await runEffectExpectFailure(
				Effect.flatMap(CollectionService, (service) => service.update('non-existent-id', { name: 'New Name' }))
			);

			expect(error).toBeInstanceOf(CollectionNotFound);
		});

		it('should fail when updating with invalid parent', async () => {
			const collection = await createTestCollection({ name: 'Test' });

			const error = await runEffectExpectFailure(
				Effect.flatMap(CollectionService, (service) =>
					service.update(collection.id, { parentId: 'non-existent-parent' })
				)
			);

			expect(error).toBeInstanceOf(CollectionNotFound);
		});
	});

	describe('delete', () => {
		it('should delete empty collection', async () => {
			const collection = await createTestCollection({ name: 'Empty Collection' });

			await runEffect(Effect.flatMap(CollectionService, (service) => service.delete(collection.id)));

			// Verify deleted
			const error = await runEffectExpectFailure(
				Effect.flatMap(CollectionService, (service) => service.getById(collection.id))
			);

			expect(error).toBeInstanceOf(CollectionNotFound);
		});

		it('should fail when deleting collection with images without force', async () => {
			const collection = await createTestCollection({ name: 'Collection with Images' });
			const image = await createTestImage();

			await linkImageToCollection(image.id, collection.id);

			const error = await runEffectExpectFailure(
				Effect.flatMap(CollectionService, (service) => service.delete(collection.id, false))
			);

			expect(error).toBeInstanceOf(CollectionHasContentError);
			if (error instanceof CollectionHasContentError) {
				expect(error.collectionId).toBe(collection.id);
				expect(error.imagesCount).toBe(1);
			}
		});

		it('should force delete collection with images', async () => {
			const collection = await createTestCollection({ name: 'Collection with Images' });
			const image = await createTestImage();

			await linkImageToCollection(image.id, collection.id);

			await runEffect(Effect.flatMap(CollectionService, (service) => service.delete(collection.id, true)));

			// Verify deleted
			const error = await runEffectExpectFailure(
				Effect.flatMap(CollectionService, (service) => service.getById(collection.id))
			);

			expect(error).toBeInstanceOf(CollectionNotFound);
		});

		it('should fail when collection not found', async () => {
			const error = await runEffectExpectFailure(
				Effect.flatMap(CollectionService, (service) => service.delete('non-existent-id'))
			);

			expect(error).toBeInstanceOf(CollectionNotFound);
		});
	});
});

// ============= RELATION TESTS =============

describe('CollectionService - Relation Operations', () => {
	describe('addImages', () => {
		it('should add single image to collection', async () => {
			const collection = await createTestCollection({ name: 'Test Collection' });
			const image = await createTestImage();

			const result = await runEffect(
				Effect.flatMap(CollectionService, (service) => service.addImages(collection.id, [image.id]))
			);

			expect(result.added).toBe(1);

			// Verify relation exists
			const images = await runEffect(Effect.flatMap(CollectionService, (service) => service.getImages(collection.id)));
			expect(images).toHaveLength(1);
			expect(images[0].id).toBe(image.id);
		});

		it('should add multiple images to collection', async () => {
			const collection = await createTestCollection({ name: 'Test Collection' });
			const image1 = await createTestImage();
			const image2 = await createTestImage();
			const image3 = await createTestImage();

			const result = await runEffect(
				Effect.flatMap(CollectionService, (service) =>
					service.addImages(collection.id, [image1.id, image2.id, image3.id])
				)
			);

			expect(result.added).toBe(3);

			const images = await runEffect(Effect.flatMap(CollectionService, (service) => service.getImages(collection.id)));
			expect(images).toHaveLength(3);
		});

		it('should skip duplicate images', async () => {
			const collection = await createTestCollection({ name: 'Test Collection' });
			const image = await createTestImage();

			// Add first time
			await runEffect(Effect.flatMap(CollectionService, (service) => service.addImages(collection.id, [image.id])));

			// Try to add again
			const result = await runEffect(
				Effect.flatMap(CollectionService, (service) => service.addImages(collection.id, [image.id]))
			);

			expect(result.added).toBe(0);
		});

		it('should roll back the complete batch when one image id is invalid', async () => {
			const collection = await createTestCollection({ name: 'Atomic Collection' });
			const image = await createTestImage();

			await runEffectExpectFailure(
				Effect.flatMap(CollectionService, (service) =>
					service.addImages(collection.id, [image.id, 'missing-image-collection-atomic'])
				)
			);

			const relations = await db.select().from(imageCollections).where(eq(imageCollections.B, collection.id));
			expect(relations).toEqual([]);
		});

		it('should fail when collection not found', async () => {
			const image = await createTestImage();

			const error = await runEffectExpectFailure(
				Effect.flatMap(CollectionService, (service) => service.addImages('non-existent-id', [image.id]))
			);

			expect(error).toBeInstanceOf(CollectionNotFound);
		});
	});

	describe('removeImage', () => {
		it('should remove image from collection', async () => {
			const collection = await createTestCollection({ name: 'Test Collection' });
			const image = await createTestImage();

			// Add image first
			await linkImageToCollection(image.id, collection.id);

			await runEffect(Effect.flatMap(CollectionService, (service) => service.removeImage(collection.id, image.id)));

			// Verify removed
			const images = await runEffect(Effect.flatMap(CollectionService, (service) => service.getImages(collection.id)));
			expect(images).toHaveLength(0);
		});

		it('should not fail when removing non-existent relation', async () => {
			const collection = await createTestCollection({ name: 'Test Collection' });
			const image = await createTestImage();

			// Should not throw error
			await runEffect(Effect.flatMap(CollectionService, (service) => service.removeImage(collection.id, image.id)));
		});
	});

	describe('getImages', () => {
		it('should get all images from collection', async () => {
			const collection = await createTestCollection({ name: 'Test Collection' });
			const image1 = await createTestImage();
			const image2 = await createTestImage();

			await linkImagesToCollection([
				{ imageId: image1.id, collectionId: collection.id },
				{ imageId: image2.id, collectionId: collection.id },
			]);

			const result = await runEffect(Effect.flatMap(CollectionService, (service) => service.getImages(collection.id)));

			expect(result).toHaveLength(2);
			expect(result.find((img) => img.id === image1.id)).toBeDefined();
			expect(result.find((img) => img.id === image2.id)).toBeDefined();
		});

		it('should return empty array for collection with no images', async () => {
			const collection = await createTestCollection({ name: 'Empty Collection' });

			const result = await runEffect(Effect.flatMap(CollectionService, (service) => service.getImages(collection.id)));

			expect(result).toHaveLength(0);
		});
	});
});

// ============= STATS TESTS =============

describe('CollectionService - Stats Operations', () => {
	describe('toggleFavorite', () => {
		it('should toggle favorite from false to true', async () => {
			await ensureActiveProfile();
			const collection = await createTestCollection({ name: 'Test Collection' });

			const result = await runEffect(
				Effect.flatMap(CollectionService, (service) => service.toggleFavorite(collection.id))
			);

			expect(result.isFavorite).toBe(true);
			expect(await favoriteService.isFavorite(FavoriteEntityType.COLLECTION, collection.id)).toBe(true);
		});

		it('should toggle favorite from true to false', async () => {
			await ensureActiveProfile();
			const collection = await createTestCollection({ name: 'Test Collection' });
			await favoriteService.set(FavoriteEntityType.COLLECTION, collection.id, true);

			const result = await runEffect(
				Effect.flatMap(CollectionService, (service) => service.toggleFavorite(collection.id))
			);

			expect(result.isFavorite).toBe(false);
			expect(await favoriteService.isFavorite(FavoriteEntityType.COLLECTION, collection.id)).toBe(false);
		});

		it('should fail when collection not found', async () => {
			const error = await runEffectExpectFailure(
				Effect.flatMap(CollectionService, (service) => service.toggleFavorite('non-existent-id'))
			);

			expect(error).toBeInstanceOf(CollectionNotFound);
		});
	});
});

// ============= SEARCH TESTS =============

describe('CollectionService - Search Operations', () => {
	describe('search', () => {
		it('should search collections by name', async () => {
			await createTestCollection({ name: 'Nature Photography' });
			await createTestCollection({ name: 'Urban Landscapes' });
			await createTestCollection({ name: 'Wildlife Nature' });

			const result = await runEffect(Effect.flatMap(CollectionService, (service) => service.search('Nature')));

			expect(result).toHaveLength(2);
			expect(result.every((c) => c.name.includes('Nature'))).toBe(true);
		});

		it('should search collections by description', async () => {
			await createTestCollection({
				name: 'Collection A',
				description: 'Photos of beautiful sunsets',
			});
			await createTestCollection({
				name: 'Collection B',
				description: 'City streets at night',
			});
			await createTestCollection({
				name: 'Collection C',
				description: 'Sunset over mountains',
			});

			const result = await runEffect(Effect.flatMap(CollectionService, (service) => service.search('sunset')));

			expect(result).toHaveLength(2);
		});

		it('should return empty array when no matches', async () => {
			await createTestCollection({ name: 'Collection 1' });
			await createTestCollection({ name: 'Collection 2' });

			const result = await runEffect(Effect.flatMap(CollectionService, (service) => service.search('NonExistent')));

			expect(result).toHaveLength(0);
		});

		it('should return collections with stats', async () => {
			const collection = await createTestCollection({
				name: 'Test Collection',
			});
			const image = await createTestImage();

			await linkImageToCollection(image.id, collection.id);

			const result = await runEffect(Effect.flatMap(CollectionService, (service) => service.search('Test')));

			expect(result).toHaveLength(1);
			expect(result[0].totalImages).toBe(1);
			expect(result[0].totalVideos).toBe(0);
		});

		it('should limit results to 50', async () => {
			// Create 60 collections
			for (let i = 1; i <= 60; i++) {
				await createTestCollection({ name: `Match Collection ${i}` });
			}

			const result = await runEffect(Effect.flatMap(CollectionService, (service) => service.search('Match')));

			expect(result).toHaveLength(50);
		});
	});
});
