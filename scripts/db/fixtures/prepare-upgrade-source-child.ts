import { Database } from 'bun:sqlite';
import { migrateDatabase } from '../migrations';

const [databasePath, migrationsDirectory, fixtureKind] = process.argv.slice(2);
if (!(databasePath && migrationsDirectory && fixtureKind)) {
	console.error('prepare upgrade source requires database, migrations directory and fixture kind');
	process.exit(2);
}

try {
	await migrateDatabase({ databasePath, migrationsDirectory });
	const database = new Database(databasePath, { strict: true });
	try {
		if (fixtureKind === 'profile') {
			database.exec("INSERT INTO Profile(id, name, createdAt) VALUES ('legacy-profile', 'Legacy', CURRENT_TIMESTAMP)");
		} else if (fixtureKind === 'stable') {
			database.exec("INSERT INTO stable(id, value) VALUES ('keep', 'source-data')");
		} else {
			throw new Error(`unknown fixture kind: ${fixtureKind}`);
		}
		database.query('PRAGMA wal_checkpoint(TRUNCATE)').get();
		database.query('PRAGMA journal_mode = DELETE').get();
	} finally {
		database.clearQueryCache();
		database.close();
	}
} catch (error) {
	console.error(error instanceof Error ? error.message : String(error));
	process.exitCode = 1;
}
