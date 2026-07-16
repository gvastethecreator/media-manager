import { eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { favorites, folders, images, profiles } from '@/lib/drizzle/schema';
import { streamFolderFiles } from '@/services/folder-files/folder-files-stream.service';
import { FavoriteEntityType } from '@/types/entities/favorite';

const profileId = `folder-stream-favorite-${crypto.randomUUID()}`;
const folderId = crypto.randomUUID();
let previousActiveProfileIds: string[] = [];
const imageIds: string[] = [];

beforeAll(async () => {
	const activeProfiles = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.isActive, true));
	previousActiveProfileIds = activeProfiles.map((profile: { id: string }) => profile.id);
	if (previousActiveProfileIds.length > 0) {
		await db.update(profiles).set({ isActive: false }).where(inArray(profiles.id, previousActiveProfileIds));
	}
	await db.insert(profiles).values({
		id: profileId,
		name: 'Folder Stream Favorite Profile',
		emoji: 'S',
		color: '#3b82f6',
		description: 'Isolated stream projection profile',
		isActive: true,
		settingsId: null,
		imageId: null,
	});
	await db.insert(folders).values({
		id: folderId,
		name: 'folder-stream-favorite',
		path: `/folder-stream-favorite/${folderId}`,
		parentId: null,
		isFavorite: false,
		presetId: null,
		createdAt: new Date(),
		updatedAt: new Date(),
	});
});

afterEach(async () => {
	await db.delete(favorites).where(eq(favorites.profileId, profileId));
	if (imageIds.length > 0) {
		await db.delete(images).where(inArray(images.id, imageIds));
		imageIds.length = 0;
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

it('projects canonical Favorite state and ignores stale embedded flags', async () => {
	const canonicalFavoriteId = crypto.randomUUID();
	const staleEmbeddedId = crypto.randomUUID();
	imageIds.push(canonicalFavoriteId, staleEmbeddedId);
	const hash = crypto.randomUUID().replaceAll('-', '').repeat(2);
	const now = new Date();
	await db.insert(images).values([
		{
			id: canonicalFavoriteId,
			name: 'canonical-stream-favorite.jpg',
			path: `/folder-stream-favorite/${canonicalFavoriteId}.jpg`,
			hash,
			size: 100,
			width: 10,
			height: 10,
			folderId,
			isFavorite: false,
			createdAt: now,
			updatedAt: now,
			addedAt: now,
		},
		{
			id: staleEmbeddedId,
			name: 'stale-stream-favorite.jpg',
			path: `/folder-stream-favorite/${staleEmbeddedId}.jpg`,
			hash,
			size: 100,
			width: 10,
			height: 10,
			folderId,
			isFavorite: true,
			createdAt: now,
			updatedAt: now,
			addedAt: now,
		},
	]);
	await db.insert(favorites).values({
		id: crypto.randomUUID(),
		profileId,
		entityType: FavoriteEntityType.IMAGE,
		entityId: canonicalFavoriteId,
		addedAt: now,
	});

	const streamed = [];
	for await (const chunk of streamFolderFiles({ folderId, fileTypes: ['image'], batchSize: 20, delayMs: 0 })) {
		streamed.push(...(chunk.data ?? []));
	}

	expect(streamed).toHaveLength(2);
	expect(streamed.find((item) => item.id === canonicalFavoriteId)?.stats?.isFavorite).toBe(true);
	expect(streamed.find((item) => item.id === staleEmbeddedId)?.stats?.isFavorite).toBe(false);
});
