import { eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { jsonFiles } from '@/lib/drizzle/schema';

export async function getJsonFileMetadataById(id: string): Promise<{ metadata: string | null } | null> {
	const rows = await db.select({ metadata: jsonFiles.metadata }).from(jsonFiles).where(eq(jsonFiles.id, id)).limit(1);
	return rows[0] ?? null;
}
