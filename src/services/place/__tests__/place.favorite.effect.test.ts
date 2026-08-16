import { eq } from 'drizzle-orm';
import { Effect } from 'effect';
import { afterEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/drizzle';
import { favorites, places, profiles } from '@/lib/drizzle/schema';
import { favoriteService } from '@/services/favorite/favorite.service';
import { FavoriteEntityType } from '@/types/entities/favorite';
import { PlaceService, PlaceServiceLive } from '../place.service.effect';

const runEffect = <A, E>(effect: Effect.Effect<A, E, PlaceService>) =>
	Effect.runPromise(Effect.either(effect.pipe(Effect.provide(PlaceServiceLive))));

const expectSuccess = async <A, E>(effect: Effect.Effect<A, E, PlaceService>) => {
	const either = await runEffect(effect);
	if (either._tag === 'Right') {
		return either.right;
	}

	throw new Error('Expected success but got failure');
};

let createdActiveProfileId: string | null = null;

const ensureActiveProfile = async () => {
	const [activeProfile] = await db
		.select({ id: profiles.id })
		.from(profiles)
		.where(eq(profiles.isActive, true))
		.limit(1);

	if (activeProfile) {
		return activeProfile.id;
	}

	const profileId = `place-test-profile-${Date.now()}-${Math.random().toString(16).slice(2)}`;
	createdActiveProfileId = profileId;

	await db.insert(profiles).values({
		id: profileId,
		name: 'Place Service Test Profile',
		emoji: '📍',
		color: '#22c55e',
		description: 'Perfil activo para tests de places',
		isActive: true,
		settingsId: null,
		imageId: null,
	});

	return profileId;
};

const createPlace = async (name: string) =>
	expectSuccess(
		Effect.gen(function* () {
			const placeService = yield* PlaceService;
			return yield* placeService.create({
				name: `${name}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
			});
		})
	);

afterEach(async () => {
	await db.delete(favorites).where(eq(favorites.entityType, FavoriteEntityType.PLACE));
	await db.delete(places);

	if (createdActiveProfileId) {
		await db.delete(profiles).where(eq(profiles.id, createdActiveProfileId));
		createdActiveProfileId = null;
	}
});

describe('PlaceService favorites convergence', () => {
	it('create inicia fuera de favoritos y exige la acción dedicada', async () => {
		await ensureActiveProfile();

		const created = await createPlace('create-canonical-favorite');

		expect(created.isFavorite).toBe(false);
		expect(await favoriteService.isFavorite(FavoriteEntityType.PLACE, created.id)).toBe(false);
	});

	it('uses canonical favorites for onlyFavorites and ignores stale projection', async () => {
		await ensureActiveProfile();
		const canonicalFavorite = await createPlace('canonical-favorite');
		const staleProjection = await createPlace('stale-projection');
		await createPlace('regular-place');

		await db.update(places).set({ isFavorite: true }).where(eq(places.id, staleProjection.id));
		await favoriteService.set(FavoriteEntityType.PLACE, canonicalFavorite.id, true);

		const result = await expectSuccess(
			Effect.gen(function* () {
				const placeService = yield* PlaceService;
				return yield* placeService.getAll({ onlyFavorites: true, limit: 50, offset: 0 });
			})
		);

		expect(result.total).toBe(1);
		expect(result.places).toHaveLength(1);
		expect(result.places[0]?.id).toBe(canonicalFavorite.id);
		expect(await favoriteService.isFavorite(FavoriteEntityType.PLACE, result.places[0]!.id)).toBe(true);
	});

	it('update no cambia el favorito canónico sin la acción dedicada', async () => {
		await ensureActiveProfile();
		const place = await createPlace('update-target');

		const updated = await expectSuccess(
			Effect.gen(function* () {
				const placeService = yield* PlaceService;
				return yield* placeService.update(place.id, { description: 'updated description' });
			})
		);

		expect(updated.id).toBe(place.id);
		expect(updated.description).toBe('updated description');
		expect(updated.isFavorite).toBe(false);
		expect(await favoriteService.isFavorite(FavoriteEntityType.PLACE, place.id)).toBe(false);
	});

	it('toggleFavorite delegates to the canonical favorite bridge', async () => {
		await ensureActiveProfile();
		const place = await createPlace('toggle-target');

		const toggled = await expectSuccess(
			Effect.gen(function* () {
				const placeService = yield* PlaceService;
				return yield* placeService.toggleFavorite(place.id);
			})
		);

		expect(toggled.id).toBe(place.id);
		expect(toggled.isFavorite).toBe(true);
		expect(await favoriteService.isFavorite(FavoriteEntityType.PLACE, place.id)).toBe(true);
	});

	it('toggleFavorite can remove the canonical favorite again', async () => {
		await ensureActiveProfile();
		const place = await createPlace('toggle-roundtrip-target');

		const favorited = await expectSuccess(
			Effect.gen(function* () {
				const placeService = yield* PlaceService;
				return yield* placeService.toggleFavorite(place.id);
			})
		);

		expect(favorited.isFavorite).toBe(true);
		expect(await favoriteService.isFavorite(FavoriteEntityType.PLACE, place.id)).toBe(true);

		const unfavorited = await expectSuccess(
			Effect.gen(function* () {
				const placeService = yield* PlaceService;
				return yield* placeService.toggleFavorite(place.id);
			})
		);

		expect(unfavorited.isFavorite).toBe(false);
		expect(await favoriteService.isFavorite(FavoriteEntityType.PLACE, place.id)).toBe(false);
	});
});
