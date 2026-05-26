import { eq } from 'drizzle-orm';
import { Effect } from 'effect';
import { afterEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/drizzle';
import { collections, favorites, imageCollections, profiles } from '@/lib/drizzle/schema';
import { favoriteService } from '@/services/favorite/favorite.service';
import { FavoriteEntityType } from '@/types/entities/favorite';
import { CollectionService, CollectionServiceLive } from '../collection.service.effect';

const runEffect = <A, E>(effect: Effect.Effect<A, E, CollectionService>) =>
	Effect.runPromise(Effect.flip(Effect.provide(effect, CollectionServiceLive)));

const expectSuccess = <A, E>(effect: Effect.Effect<A, E, CollectionService>) =>
	Effect.runPromise(Effect.provide(effect, CollectionServiceLive));

let createdActiveProfileId: string | null = null;

const ensureActiveProfile = async () => {
	const [activeProfile] = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.isActive, true)).limit(1);

	if (activeProfile) {
		return activeProfile.id;
	}

	const profileId = `collection-test-profile-${Date.now()}-${Math.random().toString(16).slice(2)}`;
	createdActiveProfileId = profileId;

	await db.insert(profiles).values({
		id: profileId,
		name: 'Collection Service Test Profile',
		emoji: '📚',
		color: '#3b82f6',
		description: 'Perfil activo para tests de colecciones',
		isActive: true,
		settingsId: null,
		imageId: null,
	});

	return profileId;
};

const createCollection = async (name: string) =>
	expectSuccess(
		Effect.flatMap(CollectionService, (service) =>
			service.create({
				name: `${name}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
			})
		)
	);

afterEach(async () => {
	await db.delete(favorites).where(eq(favorites.entityType, FavoriteEntityType.COLLECTION));
	await db.delete(imageCollections);
	await db.delete(collections);

	if (createdActiveProfileId) {
		await db.delete(profiles).where(eq(profiles.id, createdActiveProfileId));
		createdActiveProfileId = null;
	}
});

describe('CollectionService favorites convergence', () => {
	it('create starts unfavorited even when a profile is active', async () => {
		await ensureActiveProfile();

		const created = await createCollection('create-canonical-favorite');

		expect(created.isFavorite).toBe(false);
		expect(await favoriteService.isFavorite(FavoriteEntityType.COLLECTION, created.id)).toBe(false);
	});

	it('uses canonical favorites for onlyFavorites and ignores stale projection', async () => {
		await ensureActiveProfile();
		const canonicalFavorite = await createCollection('canonical-favorite');
		const staleProjection = await createCollection('stale-projection');
		await createCollection('regular-collection');

		await db.update(collections).set({ isFavorite: true }).where(eq(collections.id, staleProjection.id));
		await favoriteService.set(FavoriteEntityType.COLLECTION, canonicalFavorite.id, true);

		const result = await expectSuccess(
			Effect.flatMap(CollectionService, (service) => service.getAll({ onlyFavorites: true, limit: 50, offset: 0 }))
		);

		expect(result.total).toBe(1);
		expect(result.collections).toHaveLength(1);
		expect(result.collections[0]?.id).toBe(canonicalFavorite.id);
		expect(result.collections[0]?.isFavorite).toBe(true);
	});

	it('update preserves canonical favorite state without authored isFavorite', async () => {
		await ensureActiveProfile();
		const collection = await createCollection('update-target');
		await favoriteService.set(FavoriteEntityType.COLLECTION, collection.id, true);

		const updated = await expectSuccess(
			Effect.flatMap(CollectionService, (service) =>
				service.update(collection.id, {
					name: `${collection.name}-renamed`,
				})
			)
		);

		expect(updated.id).toBe(collection.id);
		expect(updated.isFavorite).toBe(true);
		expect(await favoriteService.isFavorite(FavoriteEntityType.COLLECTION, collection.id)).toBe(true);
	});

	it('toggleFavorite delegates to the canonical favorite bridge when a profile is active', async () => {
		await ensureActiveProfile();
		const collection = await createCollection('toggle-target');

		const toggled = await expectSuccess(
			Effect.flatMap(CollectionService, (service) => service.toggleFavorite(collection.id))
		);

		expect(toggled.id).toBe(collection.id);
		expect(toggled.isFavorite).toBe(true);
		expect(await favoriteService.isFavorite(FavoriteEntityType.COLLECTION, collection.id)).toBe(true);
	});

	it('toggleFavorite can remove the canonical favorite again when a profile is active', async () => {
		await ensureActiveProfile();
		const collection = await createCollection('toggle-roundtrip-target');

		const favorited = await expectSuccess(
			Effect.flatMap(CollectionService, (service) => service.toggleFavorite(collection.id))
		);

		expect(favorited.isFavorite).toBe(true);
		expect(await favoriteService.isFavorite(FavoriteEntityType.COLLECTION, collection.id)).toBe(true);

		const unfavorited = await expectSuccess(
			Effect.flatMap(CollectionService, (service) => service.toggleFavorite(collection.id))
		);

		expect(unfavorited.isFavorite).toBe(false);
		expect(await favoriteService.isFavorite(FavoriteEntityType.COLLECTION, collection.id)).toBe(false);
	});
});