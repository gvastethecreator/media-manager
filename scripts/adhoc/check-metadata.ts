import { sql } from 'drizzle-orm';
import { db } from './src/lib/drizzle';
import { jsonFiles } from './src/lib/drizzle/schema/files';

async function checkMetadataSize() {
	try {
		const result = await db
			.select({
				maxMetadataLength: sql`MAX(length(${jsonFiles.metadata}))`,
				avgMetadataLength: sql`AVG(length(${jsonFiles.metadata}))`,
				count: sql`COUNT(*)`,
			})
			.from(jsonFiles);

		console.log(result);
	} catch (error) {
		console.error(error);
	}
}

checkMetadataSize();
