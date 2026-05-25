import { eq } from 'drizzle-orm';
import { Effect } from 'effect';
import { db } from '@/lib/drizzle';
import { characters, favorites, profiles } from '@/lib/drizzle/schema';
import { favoriteService } from '@/services/favorite/favorite.service';
import { FavoriteEntityType } from '@/types/entities/favorite';
import { CharacterService, CharacterServiceLive } from '../character.service.effect';

const runEffect = <A, E>(effect: Effect.Effect<A, E, CharacterService>) =>
	Effect.runPromise(Effect.either(effect.pipe(Effect.provide(CharacterServiceLive))));

const expectSuccess = async <A, E>(effect: Effect.Effect<A, E, CharacterService>) => {
	const either = await runEffect(effect);
	if (either._tag === 'Right') {
		return either.right;
	}

	throw new Error('Expected success but got failure');
};

let createdActiveProfileId: string | null = null;

const ensureActiveProfile = async () => {
	const [activeProfile] = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.isActive, true)).limit(1);

	if (activeProfile) {
		return activeProfile.id;
	}

	const profileId = `character-test-profile-${Date.now()}-${Math.random().toString(16).slice(2)}`;
	createdActiveProfileId = profileId;

	await db.insert(profiles).values({
		id: profileId,
		name: 'Character Service Test Profile',
		emoji: '👤',
		color: '#a855f7',
		description: 'Perfil activo para tests de characters',
		isActive: true,
		settingsId: null,
		imageId: null,
	});

	return profileId;
};

const createCharacter = async (name: string, input?: { isFavorite?: boolean }) =>
	expectSuccess(
		Effect.gen(function* () {
			const characterService = yield* CharacterService;
			return yield* characterService.create({
				name: `${name}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
				isFavorite: input?.isFavorite,
			});
		})
	);

afterEach(async () => {
	await db.delete(favorites).where(eq(favorites.entityType, FavoriteEntityType.CHARACTER));
	await db.delete(characters);

	if (createdActiveProfileId) {
		await db.delete(profiles).where(eq(profiles.id, createdActiveProfileId));
		createdActiveProfileId = null;
	}
});

describe('CharacterService favorites convergence', () => {
	it('create persists favorite state through the canonical favorite bridge', async () => {
		await ensureActiveProfile();

		const created = await createCharacter('create-canonical-favorite', { isFavorite: true });

		expect(await favoriteService.isFavorite(FavoriteEntityType.CHARACTER, created.id)).toBe(true);
	});

	it('uses canonical favorites for onlyFavorites and ignores stale projection', async () => {
		await ensureActiveProfile();
		const canonicalFavorite = await createCharacter('canonical-favorite');
		const staleProjection = await createCharacter('stale-projection');
		await createCharacter('regular-character');

		await db.update(characters).set({ isFavorite: true }).where(eq(characters.id, staleProjection.id));
		await favoriteService.set(FavoriteEntityType.CHARACTER, canonicalFavorite.id, true);

		const result = await expectSuccess(
			Effect.gen(function* () {
				const characterService = yield* CharacterService;
				return yield* characterService.getAll({ onlyFavorites: true, limit: 50, offset: 0 });
			})
		);

		expect(result.total).toBe(1);
		expect(result.characters).toHaveLength(1);
		expect(result.characters[0]?.id).toBe(canonicalFavorite.id);
		expect(await favoriteService.isFavorite(FavoriteEntityType.CHARACTER, result.characters[0]!.id)).toBe(true);
	});

	it('update persists favorite state through the canonical favorite bridge', async () => {
		await ensureActiveProfile();
		const character = await createCharacter('update-target');

		const updated = await expectSuccess(
			Effect.gen(function* () {
				const characterService = yield* CharacterService;
				return yield* characterService.update(character.id, { isFavorite: true });
			})
		);

		expect(updated.id).toBe(character.id);
		expect(await favoriteService.isFavorite(FavoriteEntityType.CHARACTER, character.id)).toBe(true);
	});

	it('toggleFavorite delegates to the canonical favorite bridge', async () => {
		await ensureActiveProfile();
		const character = await createCharacter('toggle-target');

		const toggled = await expectSuccess(
			Effect.gen(function* () {
				const characterService = yield* CharacterService;
				return yield* characterService.toggleFavorite(character.id);
			})
		);

		expect(toggled.id).toBe(character.id);
		expect(await favoriteService.isFavorite(FavoriteEntityType.CHARACTER, character.id)).toBe(true);
	});

	it('toggleFavorite can remove the canonical favorite again', async () => {
		await ensureActiveProfile();
		const character = await createCharacter('toggle-roundtrip-target');

		const favorited = await expectSuccess(
			Effect.gen(function* () {
				const characterService = yield* CharacterService;
				return yield* characterService.toggleFavorite(character.id);
			})
		);

		expect(await favoriteService.isFavorite(FavoriteEntityType.CHARACTER, character.id)).toBe(true);

		const unfavorited = await expectSuccess(
			Effect.gen(function* () {
				const characterService = yield* CharacterService;
				return yield* characterService.toggleFavorite(character.id);
			})
		);

		expect(await favoriteService.isFavorite(FavoriteEntityType.CHARACTER, character.id)).toBe(false);
	});
});