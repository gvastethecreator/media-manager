import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { db } from '@/lib/drizzle';
import { folders, videos } from '@/lib/drizzle/schema';
import { persistGeneratedVideoThumbnail } from './video-thumbnail-persist.service';

describe('persistGeneratedVideoThumbnail', () => {
	it('writes thumbnail bytes and dimensions onto an existing video row', async () => {
		const folderId = crypto.randomUUID();
		const videoId = crypto.randomUUID();
		const now = new Date();
		await db.insert(folders).values({
			id: folderId,
			isFavorite: false,
			name: `persist-folder-${folderId}`,
			path: `/test/persist-folder-${folderId}`,
			createdAt: now,
			updatedAt: now,
		});
		await db.insert(videos).values({
			createdAt: now,
			duration: 12,
			folderId,
			hash: videoId.replaceAll('-', '').padStart(64, '0'),
			id: videoId,
			isFavorite: false,
			name: `persist-${videoId}.mp4`,
			path: `/test/persist-${videoId}.mp4`,
			size: 1024,
			updatedAt: now,
		});

		const thumbnail = Buffer.from(`webp-${videoId}`);
		const width = 320;
		const height = 240;
		await persistGeneratedVideoThumbnail({ height, id: videoId, thumbnail, width });

		const [row] = await db
			.select({
				thumbnail: videos.thumbnail,
				thumbnailHeight: videos.thumbnailHeight,
				thumbnailSize: videos.thumbnailSize,
				thumbnailWidth: videos.thumbnailWidth,
			})
			.from(videos)
			.where(eq(videos.id, videoId))
			.limit(1);

		expect(row).toBeDefined();
		expect(row.thumbnail).toBe(thumbnail.toString('base64'));
		expect(row.thumbnailWidth).toBe(width);
		expect(row.thumbnailHeight).toBe(height);
		expect(row.thumbnailSize).toBe(thumbnail.length);
	});
});
