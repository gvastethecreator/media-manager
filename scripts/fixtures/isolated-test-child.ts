import { Database } from 'bun:sqlite';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { assertIsolatedTestDatabase } from '../../tests/safety/test-database-guard';

const resultPath = process.argv[2];
const exitCode = Number.parseInt(process.argv[3] ?? '0', 10);
const databaseUrl = process.env.DATABASE_URL;

if (!resultPath || !databaseUrl) {
	process.exit(2);
}

const databasePath = fileURLToPath(databaseUrl);
assertIsolatedTestDatabase();
const database = new Database(databasePath);
database.exec('CREATE TABLE isolated_child_proof (id TEXT PRIMARY KEY)');
database.query('INSERT INTO isolated_child_proof (id) VALUES (?)').run('child-proof');
const migrationCount = Number(
	(database.query('SELECT count(*) AS count FROM __media_manager_migrations').get() as { count: number }).count
);
const profileCount = Number((database.query('SELECT count(*) AS count FROM Profile').get() as { count: number }).count);
database.close();
await writeFile(
	resultPath,
	JSON.stringify({
		databasePath,
		markerEnabled: process.env.MEDIA_MANAGER_TEST_DB === '1',
		migrationCount,
		profileCount,
		testRoot: process.env.MEDIA_MANAGER_TEST_DB_ROOT,
	}),
	'utf8'
);
process.exit(Number.isNaN(exitCode) ? 1 : exitCode);
