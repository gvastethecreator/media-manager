import { db } from './src/lib/drizzle';
import { images } from './src/lib/drizzle/schema/files';

async function checkInvalidJson() {
	try {
		const rows = await db
			.select({
				id: images.id,
				metadata: images.metadata,
			})
			.from(images)
			.limit(100);

		let errors = 0;
		for (const row of rows) {
			try {
				if (typeof row.metadata === 'string') {
					JSON.parse(row.metadata);
				}
			} catch (e) {
				console.error(`Invalid JSON for image ${row.id}:`, e.message);
				errors++;
			}
		}
		console.log(`Checked 100 rows, found ${errors} errors.`);
	} catch (error) {
		console.error(error);
	}
}

checkInvalidJson();
