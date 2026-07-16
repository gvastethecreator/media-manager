import { eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import {
	characters,
	collections,
	concepts,
	favorites,
	folders,
	images,
	notes,
	places,
	profiles,
	prompts,
	videos,
	worldItems,
} from '@/lib/drizzle/schema';
import { OptimizedStatsService } from '@/services/stats/optimized-stats.service';
import { FavoriteEntityType } from '@/types/entities/favorite';

const profileId = `optimized-favorite-stats-${crypto.randomUUID()}`;
const folderId = crypto.randomUUID();
let previousActiveProfileIds: string[] = [];
const createdIds: string[] = [];

const uniqueId = () => {
	const id = crypto.randomUUID();
	createdIds.push(id);
	return id;
};

const insertFavorite = (entityType: FavoriteEntityType, entityId: string) =>
	db.insert(favorites).values({
		id: crypto.randomUUID(),
		profileId,
		entityType,
		entityId,
		addedAt: new Date(),
	});

beforeAll(async () => {
	const activeProfiles = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.isActive, true));
	previousActiveProfileIds = activeProfiles.map((profile: { id: string }) => profile.id);
	if (previousActiveProfileIds.length > 0) {
		await db.update(profiles).set({ isActive: false }).where(inArray(profiles.id, previousActiveProfileIds));
	}
	await db.insert(profiles).values({
		id: profileId,
		name: 'Optimized Favorite Stats Profile',
		emoji: 'S',
		color: '#3b82f6',
		description: 'Isolated canonical favorite stats profile',
		isActive: true,
		settingsId: null,
		imageId: null,
	});
	await db.insert(folders).values({
		id: folderId,
		name: 'optimized-favorite-stats-folder',
		path: `/optimized-favorite-stats/${folderId}`,
		parentId: null,
		isFavorite: false,
		presetId: null,
		createdAt: new Date(),
		updatedAt: new Date(),
	});
});

afterEach(async () => {
	await db.delete(favorites).where(eq(favorites.profileId, profileId));
	if (createdIds.length > 0) {
		await db.delete(images).where(inArray(images.id, createdIds));
		await db.delete(videos).where(inArray(videos.id, createdIds));
		await db.delete(characters).where(inArray(characters.id, createdIds));
		await db.delete(places).where(inArray(places.id, createdIds));
		await db.delete(worldItems).where(inArray(worldItems.id, createdIds));
		await db.delete(collections).where(inArray(collections.id, createdIds));
		await db.delete(concepts).where(inArray(concepts.id, createdIds));
		await db.delete(prompts).where(inArray(prompts.id, createdIds));
		await db.delete(notes).where(inArray(notes.id, createdIds));
		createdIds.length = 0;
	}
});

afterAll(async () => {
	await db.delete(favorites).where(eq(favorites.profileId, profileId));
	await db.delete(folders).where(eq(folders.id, folderId));
	await db.delete(profiles).where(eq(profiles.id, profileId));
	if (previousActiveProfileIds.length > 0) {
		await db.update(profiles).set({ isActive: true }).where(inArray(profiles.id, previousActiveProfileIds));
	}
});

describe('OptimizedStatsService canonical favorite projections', () => {
	it('global stats count canonical image/video favorites and ignore stale embedded flags', async () => {
		const canonicalImageId = uniqueId();
		const staleImageId = uniqueId();
		const canonicalVideoId = uniqueId();
		const staleVideoId = uniqueId();
		const hash = crypto.randomUUID().replaceAll('-', '').repeat(2);

		await db.insert(images).values([
			{
				id: canonicalImageId,
				name: 'canonical-stats-image.jpg',
				path: `/optimized-favorite-stats/${canonicalImageId}.jpg`,
				hash,
				size: 100,
				width: 10,
				height: 10,
				folderId,
				isFavorite: false,
				createdAt: new Date(),
				updatedAt: new Date(),
				addedAt: new Date(),
			},
			{
				id: staleImageId,
				name: 'stale-stats-image.jpg',
				path: `/optimized-favorite-stats/${staleImageId}.jpg`,
				hash,
				size: 100,
				width: 10,
				height: 10,
				folderId,
				isFavorite: true,
				createdAt: new Date(),
				updatedAt: new Date(),
				addedAt: new Date(),
			},
		]);
		await db.insert(videos).values([
			{
				id: canonicalVideoId,
				name: 'canonical-stats-video.mp4',
				path: `/optimized-favorite-stats/${canonicalVideoId}.mp4`,
				hash,
				size: 200,
				duration: 1,
				folderId,
				isFavorite: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				id: staleVideoId,
				name: 'stale-stats-video.mp4',
				path: `/optimized-favorite-stats/${staleVideoId}.mp4`,
				hash,
				size: 200,
				duration: 1,
				folderId,
				isFavorite: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		]);
		await insertFavorite(FavoriteEntityType.IMAGE, canonicalImageId);
		await insertFavorite(FavoriteEntityType.VIDEO, canonicalVideoId);

		const stats = await OptimizedStatsService.getInstance().getGlobalStatsOptimized();

		expect(stats.totalFavorites).toBe(2);
	});

	it('favorite stats count each canonical entity type and ignore stale embedded flags', async () => {
		const canonicalRows = [
			{ table: characters, type: FavoriteEntityType.CHARACTER, label: 'character' },
			{ table: places, type: FavoriteEntityType.PLACE, label: 'place' },
			{ table: worldItems, type: FavoriteEntityType.WORLD_ITEM, label: 'worldItem' },
			{ table: collections, type: FavoriteEntityType.COLLECTION, label: 'collection' },
			{ table: concepts, type: FavoriteEntityType.CONCEPT, label: 'concept' },
			{ table: prompts, type: FavoriteEntityType.PROMPT, label: 'prompt' },
		] as const;

		for (const row of canonicalRows) {
			const canonicalId = uniqueId();
			const staleId = uniqueId();
			await db.insert(row.table).values([
				{ id: canonicalId, name: `canonical-${row.label}-${canonicalId}`, isFavorite: false, createdAt: new Date() },
				{ id: staleId, name: `stale-${row.label}-${staleId}`, isFavorite: true, createdAt: new Date() },
			] as never);
			await insertFavorite(row.type, canonicalId);
		}

		const canonicalNoteId = uniqueId();
		const staleNoteId = uniqueId();
		await db.insert(notes).values([
			{ id: canonicalNoteId, title: `canonical-note-${canonicalNoteId}`, isFavorite: false },
			{ id: staleNoteId, title: `stale-note-${staleNoteId}`, isFavorite: true },
		]);
		await insertFavorite(FavoriteEntityType.NOTE, canonicalNoteId);

		const stats = await OptimizedStatsService.getInstance().getFavoriteStatsOptimized();

		expect(stats.total).toBe(7);
		expect(stats.byType).toEqual({
			character: 1,
			place: 1,
			'world-item': 1,
			collection: 1,
			concept: 1,
			prompt: 1,
			note: 1,
		});
	});
});
