import { eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { audios } from '@/lib/drizzle/schema';

export async function getAudioRecordById(
	id: string
): Promise<{ metadata: string | null; path: string } | null> {
	const rows = await db
		.select({ metadata: audios.metadata, path: audios.path })
		.from(audios)
		.where(eq(audios.id, id))
		.limit(1);
	return rows[0] ?? null;
}
