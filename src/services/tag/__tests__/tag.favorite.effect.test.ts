import { eq } from 'drizzle-orm';
import { Effect } from 'effect';
import { db } from '@/lib/drizzle';
import { favorites, profiles, tags } from '@/lib/drizzle/schema';
import { generateReadableId } from '@/lib/utils/id-generator';
import { favoriteService } from '@/services/favorite/favorite.service';
import { FavoriteEntityType } from '@/types/entities/favorite';
import { TagService, TagServiceLive } from '../tag.service.effect';

const runEffect = <A, E>(effect: Effect.Effect<A, E, TagService>) => Effect.runPromise(Effect.either(effect.pipe(Effect.provide(TagServiceLive))));

const expectSuccess = async <A, E>(effect: Effect.Effect<A, E, TagService>) => {
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

	const profileId = `tag-test-profile-${Date.now()}-${Math.random().toString(16).slice(2)}`;
	createdActiveProfileId = profileId;

	await db.insert(profiles).values({
		id: profileId,
		name: 'Tag Service Test Profile',
		emoji: '🏷️',
		color: '#22c55e',
		description: 'Perfil activo para tests de tags',
		isActive: true,
		settingsId: null,
		imageId: null,
	});

	return profileId;
};

const createTestTag = async (name: string, overrides?: Partial<typeof tags.$inferInsert>) => {
	const now = new Date();
	const uniqueName = `${name}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
	const [tag] = await db
		.insert(tags)
		.values({
			id: generateReadableId('tag', uniqueName, 1),
			name: uniqueName,
			description: null,
			emoji: '🏷️',
			color: '#22c55e',
			category: null,
			featuredImage: null,
			isFavorite: false,
			createdAt: now,
			updatedAt: now,
			...overrides,
		})
		.returning();

	return tag;
};

afterEach(async () => {
	await db.delete(favorites).where(eq(favorites.entityType, FavoriteEntityType.TAG));
	await db.delete(tags);

	if (createdActiveProfileId) {
		await db.delete(profiles).where(eq(profiles.id, createdActiveProfileId));
		createdActiveProfileId = null;
	}
});

describe('TagService favorites convergence', () => {
	it('create persists favorite state through the local favorite flag', async () => {
		await ensureActiveProfile();

		const created = await expectSuccess(
			Effect.gen(function* () {
				const tagService = yield* TagService;
				return yield* tagService.create({
					name: `create-canonical-favorite-${Date.now()}`,
					isFavorite: true,
				});
			})
		);

		expect(created.isFavorite).toBe(true);
		expect(await favoriteService.isFavorite(FavoriteEntityType.TAG, created.id)).toBe(false);
	});

	it('uses the embedded favorite flag for onlyFavorites and ignores stale canonical rows', async () => {
		await ensureActiveProfile();
		const localFavorite = await createTestTag('local-favorite', { isFavorite: true });
		const staleCanonical = await createTestTag('stale-canonical', { isFavorite: false });
		await createTestTag('regular-tag', { isFavorite: false });

		await favoriteService.set(FavoriteEntityType.TAG, staleCanonical.id, true);

		const result = await expectSuccess(
			Effect.gen(function* () {
				const tagService = yield* TagService;
				return yield* tagService.getAll({ onlyFavorites: true, limit: 50, offset: 0 });
			})
		);

		expect(result.total).toBe(1);
		expect(result.tags).toHaveLength(1);
		expect(result.tags[0]?.id).toBe(localFavorite.id);
		expect(result.tags[0]?.isFavorite).toBe(true);
	});

	it('update persists favorite state through the local favorite flag', async () => {
		await ensureActiveProfile();
		const tag = await createTestTag('update-target', { isFavorite: false });

		const updated = await expectSuccess(
			Effect.gen(function* () {
				const tagService = yield* TagService;
				return yield* tagService.update({ id: tag.id, isFavorite: true });
			})
		);

		expect(updated.id).toBe(tag.id);
		expect(updated.isFavorite).toBe(true);
		expect(await favoriteService.isFavorite(FavoriteEntityType.TAG, tag.id)).toBe(false);
	});

	it('toggleFavorite alternates the local favorite flag', async () => {
		await ensureActiveProfile();
		const tag = await createTestTag('toggle-target', { isFavorite: false });

		const toggled = await expectSuccess(
			Effect.gen(function* () {
				const tagService = yield* TagService;
				return yield* tagService.toggleFavorite(tag.id);
			})
		);

		expect(toggled.id).toBe(tag.id);
		expect(toggled.isFavorite).toBe(true);
		expect(await favoriteService.isFavorite(FavoriteEntityType.TAG, tag.id)).toBe(false);
	});
});