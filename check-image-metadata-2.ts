import { db } from './src/lib/drizzle';
import { images } from './src/lib/drizzle/schema/files';
import { sql } from 'drizzle-orm';

async function checkImageMetadata() {
	try {
		const result = await db
			.select({
				cleanMetadata: sql`json_remove(${images.metadata}, '$.thumbnail')`,
				originalLength: sql`length(${images.metadata})`,
				cleanLength: sql`length(json_remove(${images.metadata}, '$.thumbnail'))`,
			})
			.from(images)
			.limit(1);

		console.log('Original:', result[0].originalLength);
		console.log('Clean:', result[0].cleanLength);
	} catch (error) {
		console.error(error);
	}
}

checkImageMetadata();
