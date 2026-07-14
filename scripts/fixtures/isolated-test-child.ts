import { appendFile, writeFile } from 'node:fs/promises';
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
await appendFile(databasePath, '-mutated', 'utf8');
await writeFile(
	resultPath,
	JSON.stringify({
		databasePath,
		markerEnabled: process.env.MEDIA_MANAGER_TEST_DB === '1',
		testRoot: process.env.MEDIA_MANAGER_TEST_DB_ROOT,
	}),
	'utf8'
);
process.exit(Number.isNaN(exitCode) ? 1 : exitCode);
