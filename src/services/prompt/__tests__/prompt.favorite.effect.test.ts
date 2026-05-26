import { eq } from 'drizzle-orm';
import { Effect } from 'effect';
import { afterEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/drizzle';
import { favorites, profiles, prompts } from '@/lib/drizzle/schema';
import { favoriteService } from '@/services/favorite/favorite.service';
import { FavoriteEntityType } from '@/types/entities/favorite';
import { PromptService, PromptServiceLive } from '../prompt.service.effect';

const runEffect = <A, E>(effect: Effect.Effect<A, E, PromptService>) =>
	Effect.runPromise(Effect.either(effect.pipe(Effect.provide(PromptServiceLive))));

const expectSuccess = async <A, E>(effect: Effect.Effect<A, E, PromptService>) => {
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

	const profileId = `prompt-test-profile-${Date.now()}-${Math.random().toString(16).slice(2)}`;
	createdActiveProfileId = profileId;

	await db.insert(profiles).values({
		id: profileId,
		name: 'Prompt Service Test Profile',
		emoji: '🤖',
		color: '#06b6d4',
		description: 'Perfil activo para tests de prompts',
		isActive: true,
		settingsId: null,
		imageId: null,
	});

	return profileId;
};

const createPrompt = async (name: string) =>
	expectSuccess(
		Effect.gen(function* () {
			const promptService = yield* PromptService;
			return yield* promptService.create({
				name: `${name}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
			});
		})
	);

afterEach(async () => {
	await db.delete(favorites).where(eq(favorites.entityType, FavoriteEntityType.PROMPT));
	await db.delete(prompts);

	if (createdActiveProfileId) {
		await db.delete(profiles).where(eq(profiles.id, createdActiveProfileId));
		createdActiveProfileId = null;
	}
});

describe('PromptService favorites convergence', () => {
	it('create inicia fuera de favoritos y exige la acción dedicada', async () => {
		await ensureActiveProfile();

		const created = await createPrompt('create-canonical-favorite');

		expect(created.isFavorite).toBe(false);
		expect(await favoriteService.isFavorite(FavoriteEntityType.PROMPT, created.id)).toBe(false);
	});

	it('uses canonical favorites for onlyFavorites and ignores stale projection', async () => {
		await ensureActiveProfile();
		const canonicalFavorite = await createPrompt('canonical-favorite');
		const staleProjection = await createPrompt('stale-projection');
		await createPrompt('regular-prompt');

		await db.update(prompts).set({ isFavorite: true }).where(eq(prompts.id, staleProjection.id));
		await favoriteService.set(FavoriteEntityType.PROMPT, canonicalFavorite.id, true);

		const result = await expectSuccess(
			Effect.gen(function* () {
				const promptService = yield* PromptService;
				return yield* promptService.getAll({ onlyFavorites: true, limit: 50, offset: 0 });
			})
		);

		expect(result.total).toBe(1);
		expect(result.prompts).toHaveLength(1);
		expect(result.prompts[0]?.id).toBe(canonicalFavorite.id);
		expect(result.prompts[0]?.isFavorite).toBe(true);
	});

	it('update no cambia el favorito canónico sin la acción dedicada', async () => {
		await ensureActiveProfile();
		const prompt = await createPrompt('update-target');

		const updated = await expectSuccess(
			Effect.gen(function* () {
				const promptService = yield* PromptService;
				return yield* promptService.update(prompt.id, { description: 'updated description' });
			})
		);

		expect(updated.id).toBe(prompt.id);
		expect(updated.description).toBe('updated description');
		expect(updated.isFavorite).toBe(false);
		expect(await favoriteService.isFavorite(FavoriteEntityType.PROMPT, prompt.id)).toBe(false);
	});

	it('toggleFavorite delegates to the canonical favorite bridge', async () => {
		await ensureActiveProfile();
		const prompt = await createPrompt('toggle-target');

		const toggled = await expectSuccess(
			Effect.gen(function* () {
				const promptService = yield* PromptService;
				return yield* promptService.toggleFavorite(prompt.id);
			})
		);

		expect(toggled.id).toBe(prompt.id);
		expect(toggled.isFavorite).toBe(true);
		expect(await favoriteService.isFavorite(FavoriteEntityType.PROMPT, prompt.id)).toBe(true);
	});

	it('toggleFavorite can remove the canonical favorite again', async () => {
		await ensureActiveProfile();
		const prompt = await createPrompt('toggle-roundtrip-target');

		const favorited = await expectSuccess(
			Effect.gen(function* () {
				const promptService = yield* PromptService;
				return yield* promptService.toggleFavorite(prompt.id);
			})
		);

		expect(favorited.isFavorite).toBe(true);
		expect(await favoriteService.isFavorite(FavoriteEntityType.PROMPT, prompt.id)).toBe(true);

		const unfavorited = await expectSuccess(
			Effect.gen(function* () {
				const promptService = yield* PromptService;
				return yield* promptService.toggleFavorite(prompt.id);
			})
		);

		expect(unfavorited.isFavorite).toBe(false);
		expect(await favoriteService.isFavorite(FavoriteEntityType.PROMPT, prompt.id)).toBe(false);
	});
});