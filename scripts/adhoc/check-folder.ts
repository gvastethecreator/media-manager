import { sql } from 'drizzle-orm';
import { db } from './src/lib/drizzle';
import { folders } from './src/lib/drizzle/schema/index';

async function checkFolder() {
	try {
		const result = await db
			.select()
			.from(folders)
			.where(sql`${folders.id} = 'comfy'`);
		console.log('Folder:', result);
	} catch (error) {
		console.error(error);
	}
}

checkFolder();
