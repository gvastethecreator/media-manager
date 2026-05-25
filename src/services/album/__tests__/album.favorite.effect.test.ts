import { eq } from 'drizzle-orm';
import { Effect } from 'effect';
import { db } from '@/lib/drizzle';
import { albums, favorites, imageAlbums, profiles } from '@/lib/drizzle/schema';
import { favoriteService } from '@/services/favorite/favorite.service';
import { FavoriteEntityType } from '@/types/entities/favorite';
import { AlbumService, AlbumServiceLive } from '../album.service.effect';

const runEffect = <A, E>(effect: Effect.Effect<A, E, AlbumService>) =>
	Effect.runPromise(Effect.either(effect.pipe(Effect.provide(AlbumServiceLive))));

const expectSuccess = async <A, E>(effect: Effect.Effect<A, E, AlbumService>) => {
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

	const profileId = `album-test-profile-${Date.now()}-${Math.random().toString(16).slice(2)}`;
	createdActiveProfileId = profileId;

	await db.insert(profiles).values({
		id: profileId,
		name: 'Album Service Test Profile',
		emoji: '📸',
		color: '#f59e0b',
		description: 'Perfil activo para tests de álbumes',
		isActive: true,
		settingsId: null,
		imageId: null,
	});

	return profileId;
};

const createAlbum = async (name: string, input?: { isFavorite?: boolean }) =>
	expectSuccess(
		Effect.gen(function* () {
			const albumService = yield* AlbumService;
			return yield* albumService.create({
				name: `${name}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
				isFavorite: input?.isFavorite,
			});
		})
	);

afterEach(async () => {
	await db.delete(favorites).where(eq(favorites.entityType, FavoriteEntityType.ALBUM));
	await db.delete(imageAlbums);
	await db.delete(albums);

	if (createdActiveProfileId) {
		await db.delete(profiles).where(eq(profiles.id, createdActiveProfileId));
		createdActiveProfileId = null;
	}
});

describe('AlbumService favorites convergence', () => {
	it('create persists favorite state through the canonical favorite bridge when a profile is active', async () => {
		await ensureActiveProfile();

		const created = await createAlbum('create-canonical-favorite', { isFavorite: true });

		expect(created.isFavorite).toBe(true);
		expect(await favoriteService.isFavorite(FavoriteEntityType.ALBUM, created.id)).toBe(true);
	});

	it('uses canonical favorites for onlyFavorites and ignores stale projection', async () => {
		await ensureActiveProfile();
		const canonicalFavorite = await createAlbum('canonical-favorite');
		const staleProjection = await createAlbum('stale-projection');
		await createAlbum('regular-album');

		await db.update(albums).set({ isFavorite: true }).where(eq(albums.id, staleProjection.id));
		await favoriteService.set(FavoriteEntityType.ALBUM, canonicalFavorite.id, true);

		const result = await expectSuccess(
			Effect.gen(function* () {
				const albumService = yield* AlbumService;
				return yield* albumService.getAll({ onlyFavorites: true, limit: 50, offset: 0 });
			})
		);

		expect(result.total).toBe(1);
		expect(result.albums).toHaveLength(1);
		expect(result.albums[0]?.id).toBe(canonicalFavorite.id);
		expect(result.albums[0]?.isFavorite).toBe(true);
	});

	it('update persists favorite state through the canonical favorite bridge when a profile is active', async () => {
		await ensureActiveProfile();
		const album = await createAlbum('update-target');

		const updated = await expectSuccess(
			Effect.gen(function* () {
				const albumService = yield* AlbumService;
				return yield* albumService.update(album.id, { isFavorite: true });
			})
		);

		expect(updated.id).toBe(album.id);
		expect(updated.isFavorite).toBe(true);
		expect(await favoriteService.isFavorite(FavoriteEntityType.ALBUM, album.id)).toBe(true);
	});

	it('toggleFavorite delegates to the canonical favorite bridge when a profile is active', async () => {
		await ensureActiveProfile();
		const album = await createAlbum('toggle-target');

		const toggled = await expectSuccess(
			Effect.gen(function* () {
				const albumService = yield* AlbumService;
				return yield* albumService.toggleFavorite(album.id);
			})
		);

		expect(toggled.id).toBe(album.id);
		expect(toggled.isFavorite).toBe(true);
		expect(await favoriteService.isFavorite(FavoriteEntityType.ALBUM, album.id)).toBe(true);
	});

	it('toggleFavorite can remove the canonical favorite again when a profile is active', async () => {
		await ensureActiveProfile();
		const album = await createAlbum('toggle-roundtrip-target');

		const favorited = await expectSuccess(
			Effect.gen(function* () {
				const albumService = yield* AlbumService;
				return yield* albumService.toggleFavorite(album.id);
			})
		);

		expect(favorited.isFavorite).toBe(true);
		expect(await favoriteService.isFavorite(FavoriteEntityType.ALBUM, album.id)).toBe(true);

		const unfavorited = await expectSuccess(
			Effect.gen(function* () {
				const albumService = yield* AlbumService;
				return yield* albumService.toggleFavorite(album.id);
			})
		);

		expect(unfavorited.isFavorite).toBe(false);
		expect(await favoriteService.isFavorite(FavoriteEntityType.ALBUM, album.id)).toBe(false);
	});
});