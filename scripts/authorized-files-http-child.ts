import { Database } from 'bun:sqlite';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import express from 'express';
import request from 'supertest';

const container = process.argv[2];
if (!container) throw new Error('fixture directory is required');

const rootPath = resolve(container, 'root');
const targetPath = resolve(rootPath, 'target');
const databasePath = resolve(container, 'route-contract.sqlite');
await mkdir(targetPath, { recursive: true });
await writeFile(resolve(rootPath, 'source.txt'), 'source-content', 'utf8');
await writeFile(resolve(targetPath, 'source.txt'), 'existing-move-content', 'utf8');
await writeFile(resolve(rootPath, 'collision.txt'), 'existing-rename-content', 'utf8');
await writeFile(resolve(rootPath, 'zero.txt'), 'zero-source-content', 'utf8');

const fixtureDatabase = new Database(databasePath, { create: true });
fixtureDatabase.exec(`
	CREATE TABLE Folder (id TEXT PRIMARY KEY, name TEXT NOT NULL, path TEXT NOT NULL);
	CREATE TABLE Image (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		path TEXT NOT NULL,
		folderId TEXT NOT NULL,
		updatedAt INTEGER
	);
`);
fixtureDatabase
	.query('INSERT INTO Folder (id, name, path) VALUES (?, ?, ?)')
	.run('target-folder', 'Target', targetPath);
fixtureDatabase
	.query('INSERT INTO Image (id, name, path, folderId) VALUES (?, ?, ?, ?)')
	.run('asset-1', 'source.txt', resolve(rootPath, 'source.txt'), 'source-folder');
fixtureDatabase
	.query('INSERT INTO Image (id, name, path, folderId) VALUES (?, ?, ?, ?)')
	.run('asset-zero', 'zero.txt', resolve(rootPath, 'zero.txt'), 'source-folder');
fixtureDatabase.exec(`
	CREATE TRIGGER delete_asset_zero_before_update
	BEFORE UPDATE ON Image
	WHEN OLD.id = 'asset-zero'
	BEGIN
		DELETE FROM Image WHERE id = OLD.id;
		SELECT RAISE(IGNORE);
	END;
`);
fixtureDatabase.close();

process.env.DATABASE_URL = pathToFileURL(databasePath).href;
const [
	{ default: filesRouter },
	{ createAuthorizedRootRegistry },
	{ prepareFileMutationRecovery, reconcilePendingFileMutations },
] = await Promise.all([
	import('../src/server/routes/files.effect'),
	import('../src/server/security/authorized-roots'),
	import('../src/server/security/file-mutation-recovery'),
]);
const registry = await createAuthorizedRootRegistry([
	{
		id: 'primary',
		path: rootPath,
		permissions: ['read', 'index', 'write', 'delete'],
	},
]);
const app = express();
app.locals.authorizedRootRegistry = registry;
app.use(express.json());
app.use('/api/files', filesRouter);

const move = await request(app)
	.post('/api/files/assets/move')
	.send({ assets: [{ assetId: 'asset-1', assetType: 'image' }], targetFolderId: 'target-folder' });
const rename = await request(app)
	.put('/api/files/assets/rename')
	.send({ renames: [{ asset: { assetId: 'asset-1', assetType: 'image' }, newName: 'collision.txt' }] });
const zeroRowCommit = await request(app)
	.put('/api/files/assets/rename')
	.send({ renames: [{ asset: { assetId: 'asset-zero', assetType: 'image' }, newName: 'zero-renamed.txt' }] });
await prepareFileMutationRecovery({
	asset: { assetId: 'asset-1', assetType: 'image' },
	destination: { relativePath: 'target/recovery-none.txt', rootId: 'primary' },
	source: { relativePath: 'source.txt', rootId: 'primary' },
});
const reconciliation = await reconcilePendingFileMutations(registry);

const verificationDatabase = new Database(databasePath, { readonly: true });
const row = verificationDatabase.query('SELECT name, path, folderId FROM Image WHERE id = ?').get('asset-1') as {
	folderId: string;
	name: string;
	path: string;
};
verificationDatabase.close();

const result = {
	moveCode: move.body.code,
	moveStatus: move.status,
	renameCode: rename.body.code,
	renameStatus: rename.status,
	reconciledPrepared: reconciliation.completed >= 1,
	databaseUnchanged:
		row.name === 'source.txt' && row.path === resolve(rootPath, 'source.txt') && row.folderId === 'source-folder',
	moveDestinationUnchanged: (await readFile(resolve(targetPath, 'source.txt'), 'utf8')) === 'existing-move-content',
	renameDestinationUnchanged:
		(await readFile(resolve(rootPath, 'collision.txt'), 'utf8')) === 'existing-rename-content',
	sourceUnchanged: (await readFile(resolve(rootPath, 'source.txt'), 'utf8')) === 'source-content',
	zeroDestinationAbsent: await readFile(resolve(rootPath, 'zero-renamed.txt'), 'utf8').then(
		() => false,
		(error) => (error as NodeJS.ErrnoException).code === 'ENOENT'
	),
	zeroRowCode: zeroRowCommit.body.code,
	zeroRowSourceUnchanged: (await readFile(resolve(rootPath, 'zero.txt'), 'utf8')) === 'zero-source-content',
	zeroRowStatus: zeroRowCommit.status,
};

await new Promise<void>((done) => {
	process.stdout.write(`HTTP_CONTRACT_RESULT:${JSON.stringify(result)}\n`, () => done());
});
process.exit(0);
