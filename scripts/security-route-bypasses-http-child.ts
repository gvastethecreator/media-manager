import { Database } from 'bun:sqlite';
import { mkdir, symlink, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import express from 'express';
import request from 'supertest';

const container = process.argv[2];
if (!container) throw new Error('fixture directory is required');

const rootPath = resolve(container, 'root');
const folderPath = resolve(rootPath, 'folder');
const outsidePath = resolve(container, 'outside');
await Promise.all([mkdir(folderPath, { recursive: true }), mkdir(outsidePath, { recursive: true })]);
await Promise.all([
	writeFile(resolve(rootPath, 'inside.jpg'), 'inside', 'utf8'),
	writeFile(resolve(outsidePath, 'outside.jpg'), 'outside', 'utf8'),
	writeFile(resolve(outsidePath, 'secret.json'), '{}', 'utf8'),
]);
await symlink(outsidePath, resolve(folderPath, 'escape'), process.platform === 'win32' ? 'junction' : 'dir');

const databasePath = resolve(container, 'security-routes.sqlite');
const database = new Database(databasePath, { create: true });
database.exec(`
	CREATE TABLE Profile (
		id TEXT PRIMARY KEY, name TEXT NOT NULL, emoji TEXT, color TEXT, description TEXT,
		isActive INTEGER NOT NULL, createdAt INTEGER, updatedAt INTEGER, settingsId TEXT, imageId TEXT
	);
	CREATE TABLE Favorite (
		id TEXT PRIMARY KEY, profileId TEXT NOT NULL, entityType TEXT NOT NULL,
		entityId TEXT NOT NULL, addedAt INTEGER NOT NULL
	);
	CREATE TABLE Folder (id TEXT PRIMARY KEY, name TEXT NOT NULL, path TEXT NOT NULL, parentId TEXT);
	CREATE TABLE Image (
		id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, path TEXT NOT NULL, hash TEXT NOT NULL,
		size INTEGER NOT NULL, width INTEGER NOT NULL, height INTEGER NOT NULL, metadata TEXT, thumbnail TEXT,
		thumbnailSize INTEGER, thumbnailWidth INTEGER, thumbnailHeight INTEGER, thumbnailMimeType TEXT,
		thumbnailError TEXT, thumbnailErrorAt INTEGER, thumbnailOptimizedAt INTEGER, aiEngine TEXT, aiModel TEXT,
		aiOriginDetected INTEGER, isFavorite INTEGER NOT NULL, folderId TEXT NOT NULL, noteId TEXT,
		createdAt INTEGER NOT NULL, updatedAt INTEGER, addedAt INTEGER NOT NULL
	);
	CREATE TABLE Video (
		id TEXT PRIMARY KEY, name TEXT, path TEXT, size INTEGER, createdAt INTEGER, updatedAt INTEGER,
		folderId TEXT, metadata TEXT, isFavorite INTEGER
	);
	CREATE TABLE Audio (
		id TEXT PRIMARY KEY, name TEXT, path TEXT, size INTEGER, createdAt INTEGER, updatedAt INTEGER,
		folderId TEXT, extension TEXT, isFavorite INTEGER
	);
	CREATE TABLE Document (
		id TEXT PRIMARY KEY, name TEXT, path TEXT, size INTEGER, createdAt INTEGER, updatedAt INTEGER,
		folderId TEXT, extension TEXT, isFavorite INTEGER
	);
	CREATE TABLE JsonFile (
		id TEXT PRIMARY KEY, name TEXT, path TEXT, size INTEGER, createdAt INTEGER, updatedAt INTEGER,
		folderId TEXT, extension TEXT, isFavorite INTEGER, metadata TEXT
	);
	CREATE TABLE File3D (
		id TEXT PRIMARY KEY, name TEXT, path TEXT, size INTEGER, createdAt INTEGER, updatedAt INTEGER,
		folderId TEXT, extension TEXT, isFavorite INTEGER
	);
	CREATE TABLE Album (
		id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, emoji TEXT, color TEXT, featuredImage TEXT,
		isFavorite INTEGER NOT NULL, filters TEXT, category TEXT, metadata TEXT, lastImageAddedAt INTEGER,
		lastVideoAddedAt INTEGER, createdAt INTEGER NOT NULL, updatedAt INTEGER
	);
	CREATE TABLE Collection (
		id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, emoji TEXT, color TEXT, featuredImage TEXT,
		isFavorite INTEGER NOT NULL, lastImageAddedAt INTEGER, lastVideoAddedAt INTEGER, parentId TEXT,
		createdAt INTEGER NOT NULL, updatedAt INTEGER
	);
	CREATE TABLE Tag (
		id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, emoji TEXT, color TEXT, category TEXT,
		featuredImage TEXT, isFavorite INTEGER NOT NULL, parentId TEXT, createdAt INTEGER NOT NULL, updatedAt INTEGER
	);
	CREATE TABLE _ImageToAlbum (A TEXT NOT NULL, B TEXT NOT NULL, UNIQUE (A, B));
	CREATE TABLE _ImageToCollection (A TEXT NOT NULL, B TEXT NOT NULL, UNIQUE (A, B));
	CREATE TABLE _ImageToTag (A TEXT NOT NULL, B TEXT NOT NULL, UNIQUE (A, B));
`);
const now = Date.now();
database
	.query('INSERT INTO Profile (id, name, isActive, createdAt) VALUES (?, ?, ?, ?)')
	.run('profile-1', 'Test', 1, now);
database
	.query('INSERT INTO Folder (id, name, path, parentId) VALUES (?, ?, ?, NULL)')
	.run('folder-1', 'Folder', folderPath);

const insertImage = database.query(`
	INSERT INTO Image (
		id, name, path, hash, size, width, height, isFavorite, folderId, createdAt, addedAt
	) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
insertImage.run(
	'outside-first',
	'outside-first.jpg',
	resolve(outsidePath, 'outside.jpg'),
	'a'.repeat(64),
	7,
	1,
	1,
	0,
	'folder-1',
	now + 30,
	now
);
insertImage.run(
	'inside-second',
	'inside-second.jpg',
	resolve(rootPath, 'inside.jpg'),
	'b'.repeat(64),
	6,
	1,
	1,
	0,
	'folder-1',
	now + 20,
	now
);
insertImage.run(
	'escape-asset',
	'escape.jpg',
	resolve(folderPath, 'escape', 'outside.jpg'),
	'c'.repeat(64),
	7,
	1,
	1,
	0,
	'folder-1',
	now + 10,
	now
);
database.query('UPDATE Image SET thumbnail = ? WHERE id IN (?, ?)').run('thumbnail', 'outside-first', 'inside-second');
database
	.query('INSERT INTO Album (id, name, isFavorite, createdAt) VALUES (?, ?, ?, ?)')
	.run('album-1', 'Album', 0, now);
database
	.query('INSERT INTO Collection (id, name, isFavorite, createdAt) VALUES (?, ?, ?, ?)')
	.run('collection-1', 'Collection', 0, now);
database
	.query('INSERT INTO Tag (id, name, isFavorite, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)')
	.run('tag-1', 'Tag', 0, now, now);
for (const imageId of ['outside-first', 'inside-second']) {
	database.query('INSERT INTO _ImageToAlbum (A, B) VALUES (?, ?)').run(imageId, 'album-1');
	database.query('INSERT INTO _ImageToCollection (A, B) VALUES (?, ?)').run(imageId, 'collection-1');
	database.query('INSERT INTO _ImageToTag (A, B) VALUES (?, ?)').run(imageId, 'tag-1');
}
database
	.query('INSERT INTO Favorite (id, profileId, entityType, entityId, addedAt) VALUES (?, ?, ?, ?, ?)')
	.run('favorite-outside', 'profile-1', 'image', 'outside-first', now);
database
	.query(
		'INSERT INTO JsonFile (id, name, path, size, createdAt, folderId, extension, isFavorite, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
	)
	.run(
		'json-outside',
		'secret.json',
		resolve(outsidePath, 'secret.json'),
		2,
		now,
		'folder-1',
		'.json',
		0,
		JSON.stringify({ thumbnail: '<svg>secret</svg>' })
	);
database.close();

process.env.DATABASE_URL = pathToFileURL(databasePath).href;
const [
	{ default: albumsRouter },
	{ default: collectionsRouter },
	{ default: favoritesRouter },
	{ default: foldersRouter },
	{ default: imagesRouter },
	{ default: jsonRouter },
	{ default: reindexRouter },
	{ default: tagsRouter },
	{ createAuthorizedRootRegistry },
] = await Promise.all([
	import('../src/server/routes/albums.effect'),
	import('../src/server/routes/collections.effect'),
	import('../src/server/routes/favorites.effect'),
	import('../src/server/routes/folders.effect'),
	import('../src/server/routes/images.effect'),
	import('../src/server/routes/json-thumbnails'),
	import('../src/server/routes/api/reindex-incremental'),
	import('../src/server/routes/tags.effect'),
	import('../src/server/security/authorized-roots'),
]);
const registry = await createAuthorizedRootRegistry([
	{ id: 'primary', path: rootPath, permissions: ['read', 'index', 'write', 'delete'] },
]);
const app = express();
app.locals.authorizedRootRegistry = registry;
app.use(express.json());
app.use('/api/albums', albumsRouter);
app.use('/api/collections', collectionsRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/folders', foldersRouter);
app.use('/api/images', imagesRouter);
app.use('/api/json', jsonRouter);
app.use('/api/reindex', reindexRouter);
app.use('/api/tags', tagsRouter);

const [
	albumImages,
	albumOutsideDelete,
	albumOutsideMutation,
	collectionImages,
	reindex,
	jsonPreview,
	folderFiles,
	folderStats,
	favorites,
	favoriteCounts,
	favoriteCheck,
	favoriteGet,
	favoriteToggle,
	favoriteDelete,
	imagePage,
	tagImages,
	tagThumbnails,
] = await Promise.all([
	request(app).get('/api/albums/album-1/images').query({ limit: 1, offset: 0 }),
	request(app).delete('/api/albums/album-1/images/outside-first'),
	request(app)
		.post('/api/albums/album-1/images')
		.send({ imageIds: ['outside-first'] }),
	request(app).get('/api/collections/collection-1/images').query({ limit: 1, offset: 0 }),
	request(app).post('/api/reindex/full').send({ folderId: 'folder-1' }),
	request(app).get('/api/json/json-outside/preview'),
	request(app).get('/api/folders/folder-1/files').query({ fileTypes: 'image', limit: 20 }),
	request(app).get('/api/folders/folder-1/files/stats'),
	request(app).get('/api/favorites'),
	request(app).get('/api/favorites/counts'),
	request(app).get('/api/favorites/check').query({ entityType: 'image', entityId: 'outside-first' }),
	request(app).get('/api/favorites/favorite-outside'),
	request(app).post('/api/favorites/toggle').send({ entityType: 'image', entityId: 'outside-first' }),
	request(app).delete('/api/favorites/favorite-outside'),
	request(app).get('/api/images').query({ limit: 1, offset: 0, sortBy: 'createdAt', sortOrder: 'desc' }),
	request(app).get('/api/tags/tag-1/images'),
	request(app).get('/api/tags/tag-1/thumbnails').query({ limit: 1 }),
]);

const verification = new Database(databasePath, { readonly: true });
const favoriteStillExists = Boolean(verification.query('SELECT id FROM Favorite WHERE id = ?').get('favorite-outside'));
const outsideAlbumRelationStillExists = Boolean(
	verification.query('SELECT A FROM _ImageToAlbum WHERE A = ? AND B = ?').get('outside-first', 'album-1')
);
verification.close();

const result = {
	albumImageIds: albumImages.body.map((item: { id: string }) => item.id),
	albumOutsideDeleteStatus: albumOutsideDelete.status,
	albumOutsideMutationStatus: albumOutsideMutation.status,
	collectionImageIds: collectionImages.body.map((item: { id: string }) => item.id),
	favoriteCheckStatus: favoriteCheck.status,
	favoriteCounts: favoriteCounts.body,
	favoriteDeleteStatus: favoriteDelete.status,
	favoriteGetStatus: favoriteGet.status,
	favoriteList: favorites.body,
	favoriteStillExists,
	favoriteToggleStatus: favoriteToggle.status,
	folderFiles: folderFiles.body,
	folderStats: folderStats.body,
	imagePage: imagePage.body,
	jsonPreviewStatus: jsonPreview.status,
	reindexCode: reindex.body.code,
	reindexStatus: reindex.status,
	outsideAlbumRelationStillExists,
	tagImageIds: tagImages.body.map((item: { id: string }) => item.id),
	tagThumbnailIds: tagThumbnails.body.map((item: { id: string }) => item.id),
};

await new Promise<void>((done) => {
	process.stdout.write(`SECURITY_ROUTES_RESULT:${JSON.stringify(result)}\n`, () => done());
});
process.exit(0);
