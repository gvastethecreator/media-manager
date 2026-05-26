import { eq } from 'drizzle-orm';
import { Effect } from 'effect';
import { afterEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/drizzle';
import { favorites, folders, profiles } from '@/lib/drizzle/schema';
import { favoriteService } from '@/services/favorite/favorite.service';
import { FavoriteEntityType } from '@/types/entities/favorite';
import { FolderService, FolderServiceLive } from '../folder.service.effect';

const runEffect = <A, E>(effect: Effect.Effect<A, E, FolderService>) =>
	Effect.runPromise(Effect.either(effect.pipe(Effect.provide(FolderServiceLive))));

const expectSuccess = async <A, E>(effect: Effect.Effect<A, E, FolderService>) => {
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

	const profileId = `folder-test-profile-${Date.now()}-${Math.random().toString(16).slice(2)}`;
	createdActiveProfileId = profileId;

	await db.insert(profiles).values({
		id: profileId,
		name: 'Folder Service Test Profile',
		emoji: '📁',
		color: '#3b82f6',
		description: 'Perfil activo para tests de carpetas',
		isActive: true,
		settingsId: null,
		imageId: null,
	});

	return profileId;
};

const createFolder = async (name: string, input?: { isFavorite?: boolean }) =>
	expectSuccess(
		Effect.gen(function* () {
			const folderService = yield* FolderService;
			const payload: Record<string, unknown> = {
				name: `${name}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
				path: `/${name}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
				parentId: null,
			};

			if (input?.isFavorite !== undefined) {
				payload.isFavorite = input.isFavorite;
			}

			return yield* folderService.create({
				...(payload as any),
			});
		})
	);

afterEach(async () => {
	await db.delete(favorites).where(eq(favorites.entityType, FavoriteEntityType.FOLDER));
	await db.delete(folders);

	if (createdActiveProfileId) {
		await db.delete(profiles).where(eq(profiles.id, createdActiveProfileId));
		createdActiveProfileId = null;
	}
});

describe('FolderService favorites convergence', () => {
	it('create ignores legacy authored isFavorite even when a profile is active', async () => {
		await ensureActiveProfile();

		const created = await createFolder('create-canonical-favorite', { isFavorite: true });

		expect(created.isFavorite).toBe(false);
		expect(await favoriteService.isFavorite(FavoriteEntityType.FOLDER, created.id)).toBe(false);
	});

	it('getById uses canonical favorites and ignores stale embedded projection', async () => {
		await ensureActiveProfile();
		const folder = await createFolder('stale-by-id');

		await db.update(folders).set({ isFavorite: true }).where(eq(folders.id, folder.id));

		const result = await expectSuccess(
			Effect.gen(function* () {
				const folderService = yield* FolderService;
				return yield* folderService.getById(folder.id);
			})
		);

		expect(result.id).toBe(folder.id);
		expect(result.isFavorite).toBe(false);
	});

	it('uses canonical favorites for onlyFavorites and ignores stale projection', async () => {
		await ensureActiveProfile();
		const canonicalFavorite = await createFolder('canonical-favorite');
		const staleProjection = await createFolder('stale-projection');
		await createFolder('regular-folder');

		await db.update(folders).set({ isFavorite: true }).where(eq(folders.id, staleProjection.id));
		await favoriteService.set(FavoriteEntityType.FOLDER, canonicalFavorite.id, true);

		const result = await expectSuccess(
			Effect.gen(function* () {
				const folderService = yield* FolderService;
				return yield* folderService.getAll({ onlyFavorites: true, limit: 50, offset: 0 });
			})
		);

		expect(result.total).toBe(1);
		expect(result.folders).toHaveLength(1);
		expect(result.folders[0]?.id).toBe(canonicalFavorite.id);
		expect(result.folders[0]?.isFavorite).toBe(true);
	});

	it('update ignores legacy authored isFavorite and preserves canonical favorite state', async () => {
		await ensureActiveProfile();
		const folder = await createFolder('update-target');
		await favoriteService.set(FavoriteEntityType.FOLDER, folder.id, true);

		const updated = await expectSuccess(
			Effect.gen(function* () {
				const folderService = yield* FolderService;
				return yield* folderService.update(folder.id, { isFavorite: false } as any);
			})
		);

		expect(updated.id).toBe(folder.id);
		expect(updated.isFavorite).toBe(true);
		expect(await favoriteService.isFavorite(FavoriteEntityType.FOLDER, folder.id)).toBe(true);
	});

	it('toggleFavorite delegates to the canonical favorite bridge when a profile is active', async () => {
		await ensureActiveProfile();
		const folder = await createFolder('toggle-target');

		const toggled = await expectSuccess(
			Effect.gen(function* () {
				const folderService = yield* FolderService;
				return yield* folderService.toggleFavorite(folder.id);
			})
		);

		expect(toggled.id).toBe(folder.id);
		expect(toggled.isFavorite).toBe(true);
		expect(await favoriteService.isFavorite(FavoriteEntityType.FOLDER, folder.id)).toBe(true);
	});

	it('toggleFavorite can remove the canonical favorite again when a profile is active', async () => {
		await ensureActiveProfile();
		const folder = await createFolder('toggle-roundtrip-target');

		const favorited = await expectSuccess(
			Effect.gen(function* () {
				const folderService = yield* FolderService;
				return yield* folderService.toggleFavorite(folder.id);
			})
		);

		expect(favorited.isFavorite).toBe(true);
		expect(await favoriteService.isFavorite(FavoriteEntityType.FOLDER, folder.id)).toBe(true);

		const unfavorited = await expectSuccess(
			Effect.gen(function* () {
				const folderService = yield* FolderService;
				return yield* folderService.toggleFavorite(folder.id);
			})
		);

		expect(unfavorited.isFavorite).toBe(false);
		expect(await favoriteService.isFavorite(FavoriteEntityType.FOLDER, folder.id)).toBe(false);
	});
});