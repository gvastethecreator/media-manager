import { eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { videos } from '@/lib/drizzle/schema';

export async function persistGeneratedVideoThumbnail(input: {
	height: number;
	id: string;
	thumbnail: Buffer;
	width: number;
}): Promise<void> {
	await db
		.update(videos)
		.set({
			thumbnail: input.thumbnail.toString('base64'),
			thumbnailHeight: input.height,
			thumbnailSize: input.thumbnail.length,
			thumbnailWidth: input.width,
			updatedAt: new Date(),
		})
		.where(eq(videos.id, input.id));
}
