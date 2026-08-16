import { eq } from 'drizzle-orm';
import { Effect } from 'effect';
import { afterEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/drizzle';
import { concepts, favorites, profiles } from '@/lib/drizzle/schema';
import { favoriteService } from '@/services/favorite/favorite.service';
import { FavoriteEntityType } from '@/types/entities/favorite';
import { ConceptService, ConceptServiceLive } from '../concept.service.effect';

const runEffect = <A, E>(effect: Effect.Effect<A, E, ConceptService>) =>
	Effect.runPromise(Effect.either(effect.pipe(Effect.provide(ConceptServiceLive))));

const expectSuccess = async <A, E>(effect: Effect.Effect<A, E, ConceptService>) => {
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

	const profileId = `concept-test-profile-${Date.now()}-${Math.random().toString(16).slice(2)}`;
	createdActiveProfileId = profileId;

	await db.insert(profiles).values({
		id: profileId,
		name: 'Concept Service Test Profile',
		emoji: '💡',
		color: '#f59e0b',
		description: 'Perfil activo para tests de concepts',
		isActive: true,
		settingsId: null,
		imageId: null,
	});

	return profileId;
};

const createConcept = async (name: string) =>
	expectSuccess(
		Effect.gen(function* () {
			const conceptService = yield* ConceptService;
			return yield* conceptService.create({
				name: `${name}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
			});
		})
	);

afterEach(async () => {
	await db.delete(favorites).where(eq(favorites.entityType, FavoriteEntityType.CONCEPT));
	await db.delete(concepts);

	if (createdActiveProfileId) {
		await db.delete(profiles).where(eq(profiles.id, createdActiveProfileId));
		createdActiveProfileId = null;
	}
});

describe('ConceptService favorites convergence', () => {
	it('create inicia fuera de favoritos y exige la acción dedicada', async () => {
		await ensureActiveProfile();

		const created = await createConcept('create-canonical-favorite');

		expect(created.isFavorite).toBe(false);
		expect(await favoriteService.isFavorite(FavoriteEntityType.CONCEPT, created.id)).toBe(false);
	});

	it('uses canonical favorites for onlyFavorites and ignores stale projection', async () => {
		await ensureActiveProfile();
		const canonicalFavorite = await createConcept('canonical-favorite');
		const staleProjection = await createConcept('stale-projection');
		await createConcept('regular-concept');

		await db.update(concepts).set({ isFavorite: true }).where(eq(concepts.id, staleProjection.id));
		await favoriteService.set(FavoriteEntityType.CONCEPT, canonicalFavorite.id, true);

		const result = await expectSuccess(
			Effect.gen(function* () {
				const conceptService = yield* ConceptService;
				return yield* conceptService.getAll({ onlyFavorites: true, limit: 50, offset: 0 });
			})
		);

		expect(result.total).toBe(1);
		expect(result.concepts).toHaveLength(1);
		expect(result.concepts[0]?.id).toBe(canonicalFavorite.id);
		expect(await favoriteService.isFavorite(FavoriteEntityType.CONCEPT, result.concepts[0]!.id)).toBe(true);
	});

	it('update no cambia el favorito canónico sin la acción dedicada', async () => {
		await ensureActiveProfile();
		const concept = await createConcept('update-target');

		const updated = await expectSuccess(
			Effect.gen(function* () {
				const conceptService = yield* ConceptService;
				return yield* conceptService.update(concept.id, { description: 'updated description' });
			})
		);

		expect(updated.id).toBe(concept.id);
		expect(updated.description).toBe('updated description');
		expect(updated.isFavorite).toBe(false);
		expect(await favoriteService.isFavorite(FavoriteEntityType.CONCEPT, concept.id)).toBe(false);
	});

	it('toggleFavorite delegates to the canonical favorite bridge', async () => {
		await ensureActiveProfile();
		const concept = await createConcept('toggle-target');

		const toggled = await expectSuccess(
			Effect.gen(function* () {
				const conceptService = yield* ConceptService;
				return yield* conceptService.toggleFavorite(concept.id);
			})
		);

		expect(toggled.id).toBe(concept.id);
		expect(toggled.isFavorite).toBe(true);
		expect(await favoriteService.isFavorite(FavoriteEntityType.CONCEPT, concept.id)).toBe(true);
	});

	it('toggleFavorite can remove the canonical favorite again', async () => {
		await ensureActiveProfile();
		const concept = await createConcept('toggle-roundtrip-target');

		const favorited = await expectSuccess(
			Effect.gen(function* () {
				const conceptService = yield* ConceptService;
				return yield* conceptService.toggleFavorite(concept.id);
			})
		);

		expect(favorited.isFavorite).toBe(true);
		expect(await favoriteService.isFavorite(FavoriteEntityType.CONCEPT, concept.id)).toBe(true);

		const unfavorited = await expectSuccess(
			Effect.gen(function* () {
				const conceptService = yield* ConceptService;
				return yield* conceptService.toggleFavorite(concept.id);
			})
		);

		expect(unfavorited.isFavorite).toBe(false);
		expect(await favoriteService.isFavorite(FavoriteEntityType.CONCEPT, concept.id)).toBe(false);
	});
});
