import { eq } from 'drizzle-orm';
import { Effect } from 'effect';
import { afterEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/drizzle';
import { albums, folders, imageAlbums, images } from '@/lib/drizzle/schema';
import { AlbumService, runAlbumService } from '../album.service.effect';

const ids = {
	album: 'album-atomic-relations-test',
	folder: 'folder-atomic-relations-test',
	image: 'image-atomic-relations-test',
};

afterEach(async () => {
	await db.delete(imageAlbums).where(eq(imageAlbums.B, ids.album));
	await db.delete(images).where(eq(images.id, ids.image));
	await db.delete(albums).where(eq(albums.id, ids.album));
	await db.delete(folders).where(eq(folders.id, ids.folder));
});

describe('AlbumService atomic relation batches', () => {
	it('rolls back the complete batch when one image foreign key is invalid', async () => {
		await db.insert(folders).values({ id: ids.folder, name: 'Atomic album folder', path: '/tests/album-atomic' });
		await db.insert(albums).values({ id: ids.album, name: `Atomic album ${crypto.randomUUID()}` });
		await db.insert(images).values({
			folderId: ids.folder,
			hash: 'a'.repeat(64),
			height: 10,
			id: ids.image,
			name: 'atomic.jpg',
			path: '/tests/album-atomic/atomic.jpg',
			size: 10,
			width: 10,
		});

		const effect = Effect.flatMap(AlbumService, (service) =>
			service.addImages(ids.album, [ids.image, 'missing-image-atomic-test'])
		);
		await expect(Effect.runPromise(runAlbumService(effect))).rejects.toThrow();

		const relations = await db.select().from(imageAlbums).where(eq(imageAlbums.B, ids.album));
		expect(relations).toEqual([]);
	});

	it('deduplicates an idempotent batch and reports only inserted links', async () => {
		await db.insert(folders).values({ id: ids.folder, name: 'Atomic album folder', path: '/tests/album-atomic' });
		await db.insert(albums).values({ id: ids.album, name: `Atomic album ${crypto.randomUUID()}` });
		await db.insert(images).values({
			folderId: ids.folder,
			hash: 'b'.repeat(64),
			height: 10,
			id: ids.image,
			name: 'atomic.jpg',
			path: '/tests/album-atomic/atomic.jpg',
			size: 10,
			width: 10,
		});

		const add = (imageIds: string[]) =>
			Effect.runPromise(
				runAlbumService(Effect.flatMap(AlbumService, (service) => service.addImages(ids.album, imageIds)))
			);
		expect(await add([ids.image, ids.image])).toEqual({ added: 1 });
		expect(await add([ids.image])).toEqual({ added: 0 });
	});
});
