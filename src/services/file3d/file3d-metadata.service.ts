import { eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { file3Ds } from '@/lib/drizzle/schema';

export async function getFile3dMetadataById(
	id: string
): Promise<{ metadata: string | null; path: string } | null> {
	const rows = await db
		.select({ metadata: file3Ds.metadata, path: file3Ds.path })
		.from(file3Ds)
		.where(eq(file3Ds.id, id))
		.limit(1);
	return rows[0] ?? null;
}
