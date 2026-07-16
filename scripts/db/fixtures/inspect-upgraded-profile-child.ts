import { Database } from 'bun:sqlite';

const [databasePath] = process.argv.slice(2);
if (!databasePath) process.exit(2);

const database = new Database(databasePath, { readonly: true, strict: true });
try {
	const row = database.query("SELECT typeof(createdAt) AS type FROM Profile WHERE id = 'legacy-profile'").get() as {
		type: string;
	} | null;
	console.log(JSON.stringify(row));
} finally {
	database.clearQueryCache();
	database.close();
}
