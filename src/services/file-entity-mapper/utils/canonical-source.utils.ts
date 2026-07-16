import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { sourceFiles } from '@/lib/drizzle/schema';
import type { FileInfo } from '@/types/file-entity-mapper';

/**
 * Physical identity is the authorized root plus relative location. Content hashes
 * are duplicate candidates only and must never collapse distinct placements.
 */
export async function isCanonicalSourceIndexed(fileInfo: FileInfo): Promise<boolean> {
	if (!fileInfo.source) return false;
	const [existing] = await db
		.select({ assetId: sourceFiles.assetId })
		.from(sourceFiles)
		.where(
			and(
				eq(sourceFiles.rootId, fileInfo.source.rootId),
				sql`${sourceFiles.relativePath} COLLATE NOCASE = ${fileInfo.source.relativePath}`
			)
		)
		.limit(1);
	return Boolean(existing);
}
