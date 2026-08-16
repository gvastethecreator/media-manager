import { describe, expect, it } from 'bun:test';
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { eq, inArray } from 'drizzle-orm';
import express from 'express';
import request from 'supertest';
import { sanitizeEventForStore } from '../src/lib/server/events.server';
import downloadRouter from '../src/server/routes/download.effect';
import filesRouter from '../src/server/routes/files.effect';
import {
	assertAuthorizedMediaEntity,
	authorizeMediaPathInput,
	filterAuthorizedMediaEntities,
} from '../src/server/security/authorized-root-request';
import { createAuthorizedRootRegistry } from '../src/server/security/authorized-roots';
import { sanitizeJsonResponses } from '../src/server/security/sanitize-public-payload';

async function withApp(
	run: (fixture: {
		app: express.Express;
		outside: string;
		primary: string;
		registry: Awaited<ReturnType<typeof createAuthorizedRootRegistry>>;
		secondary: string;
	}) => Promise<void>,
	options: { allowCrossRoot?: boolean; permissions?: Array<'read' | 'index' | 'write' | 'delete' | 'export'> } = {}
): Promise<void> {
	const container = await mkdtemp(resolve(tmpdir(), 'media-manager-files-routes-'));
	const primary = resolve(container, 'primary');
	const secondary = resolve(container, 'secondary');
	const outside = resolve(container, 'outside');
	await Promise.all([mkdir(primary), mkdir(secondary), mkdir(outside)]);
	await writeFile(resolve(primary, 'inside.txt'), 'inside', 'utf8');
	await writeFile(resolve(outside, 'secret.txt'), 'outside', 'utf8');
	const permissions = options.permissions ?? ['read', 'index', 'write', 'delete', 'export'];
	const registry = await createAuthorizedRootRegistry([
		{ allowCrossRoot: options.allowCrossRoot, id: 'primary', label: 'Primary', path: primary, permissions },
		{ allowCrossRoot: options.allowCrossRoot, id: 'secondary', label: 'Secondary', path: secondary, permissions },
	]);
	const app = express();
	app.locals.authorizedRootRegistry = registry;
	app.use(express.json());
	app.post('/api/probe/file', authorizeMediaPathInput({ expected: 'file', required: true }), (req, res) => {
		res.json({ authorized: typeof req.body.path === 'string', source: req.body.source });
	});
	app.patch('/api/probe/file', authorizeMediaPathInput({ expected: 'file', required: false }), (req, res) => {
		res.json({ keys: Object.keys(req.body).sort() });
	});
	app.get('/api/probe/public-payload', sanitizeJsonResponses, (_req, res) => {
		res.json({
			arbitrary: [resolve(primary, 'inside.txt'), { location: resolve(primary, 'nested') }],
			data: [{ absolutePath: primary, id: 'asset-1', nested: { filePath: resolve(primary, 'inside.txt') } }],
			error: `No se pudo abrir ${resolve(primary, 'inside.txt')}`,
			message: 'Backend disponible en http://127.0.0.1:4000/api',
			path: primary,
			reference: { relativePath: 'inside.txt', rootId: 'primary' },
			targetPath: resolve(primary, 'target'),
		});
	});
	app.use('/api/files', filesRouter);
	app.use('/api/download', downloadRouter);
	try {
		await run({ app, outside, primary, registry, secondary });
	} finally {
		await rm(container, { force: true, recursive: true });
	}
}

describe('authorized filesystem HTTP contract', () => {
	it('cierra bypasses legacy, agregados, favoritos y backfill de paginación', async () => {
		const container = await mkdtemp(resolve(tmpdir(), 'media-manager-security-routes-'));
		try {
			const child = Bun.spawn(
				[process.execPath, resolve(import.meta.dir, 'security-route-bypasses-http-child.ts'), container],
				{ cwd: resolve(import.meta.dir, '..'), stderr: 'pipe', stdout: 'pipe' }
			);
			const [exitCode, stdout, stderr] = await Promise.all([
				child.exited,
				new Response(child.stdout).text(),
				new Response(child.stderr).text(),
			]);
			expect(exitCode, stderr).toBe(0);
			const line = stdout.split(/\r?\n/).find((entry) => entry.startsWith('SECURITY_ROUTES_RESULT:'));
			expect(line, stdout).toBeDefined();
			const result = JSON.parse(line?.slice('SECURITY_ROUTES_RESULT:'.length) ?? '{}');
			expect(result.reindexStatus).toBe(410);
			expect(result.reindexCode).toBe('AUTHORIZED_FOLDER_OPERATION_REQUIRED');
			expect(result.albumImageIds).toEqual(['inside-second']);
			expect(result.collectionImageIds).toEqual(['inside-second']);
			expect(result.tagImageIds).toEqual(['inside-second']);
			expect(result.tagThumbnailIds).toEqual(['inside-second']);
			expect(result.albumOutsideDeleteStatus).toBe(403);
			expect(result.albumOutsideMutationStatus).toBe(403);
			expect(result.outsideAlbumRelationStillExists).toBe(true);
			expect(result.jsonPreviewStatus).toBe(403);
			expect(result.folderFiles.files).toEqual([]);
			expect(result.folderFiles.total).toBe(0);
			expect(result.folderStats.total).toBe(0);
			expect(result.favoriteList.data).toEqual([]);
			expect(result.favoriteList.pagination.total).toBe(0);
			expect(result.favoriteCounts).toEqual({});
			expect(result.favoriteCheckStatus).toBe(403);
			expect(result.favoriteGetStatus).toBe(403);
			expect(result.favoriteToggleStatus).toBe(403);
			expect(result.favoriteSetStateStatus).toBe(403);
			expect(result.favoriteDeleteStatus).toBe(403);
			expect(result.favoriteStillExists).toBe(true);
			expect(result.favoriteStateAddStatus).toBe(200);
			expect(result.favoriteStateAddBody).toMatchObject({ isFavorite: true });
			expect(result.favoriteStateAddAgainStatus).toBe(200);
			expect(result.favoriteStateAddAgainBody).toEqual(result.favoriteStateAddBody);
			expect(result.favoriteStateCheckAddedStatus).toBe(200);
			expect(result.favoriteStateCheckAddedBody).toEqual({ isFavorite: true });
			expect(result.favoriteStateRemoveStatus).toBe(200);
			expect(result.favoriteStateRemoveBody).toEqual({ isFavorite: false });
			expect(result.favoriteStateCheckRemovedStatus).toBe(200);
			expect(result.favoriteStateCheckRemovedBody).toEqual({ isFavorite: false });
			expect(result.favoriteStateInvalidStatus).toBe(400);
			expect(result.favoriteStateInvalidBody).toMatchObject({ error: 'Datos inválidos' });
			expect(result.imagePage.data.map((item: { id: string }) => item.id)).toEqual(['inside-second']);
			expect(result.imagePage.pagination).toMatchObject({ hasNext: false, limit: 1, offset: 0, total: 1 });
		} finally {
			await rm(container, { force: true, recursive: true });
		}
	});

	it('rechaza colisiones HTTP de move y rename sin tocar archivos ni base', async () => {
		const container = await mkdtemp(resolve(tmpdir(), 'media-manager-files-http-contract-'));
		try {
			const child = Bun.spawn(
				[process.execPath, resolve(import.meta.dir, 'authorized-files-http-child.ts'), container],
				{
					cwd: resolve(import.meta.dir, '..'),
					stderr: 'pipe',
					stdout: 'pipe',
				}
			);
			const [exitCode, stdout, stderr] = await Promise.all([
				child.exited,
				new Response(child.stdout).text(),
				new Response(child.stderr).text(),
			]);
			expect(exitCode, stderr).toBe(0);
			const resultLine = stdout.split(/\r?\n/).find((line) => line.startsWith('HTTP_CONTRACT_RESULT:'));
			expect(resultLine, stdout).toBeDefined();
			const result = JSON.parse(resultLine?.slice('HTTP_CONTRACT_RESULT:'.length) ?? '{}');
			expect(result).toEqual({
				databaseUnchanged: true,
				moveCode: 'FILE_ALREADY_EXISTS',
				moveDestinationUnchanged: true,
				moveStatus: 409,
				renameCode: 'FILE_ALREADY_EXISTS',
				renameDestinationUnchanged: true,
				renameStatus: 409,
				reconciledPrepared: true,
				sourceUnchanged: true,
				zeroDestinationAbsent: true,
				zeroRowCode: 'MEDIA_ASSET_LOCATION_CONFLICT',
				zeroRowSourceUnchanged: true,
				zeroRowStatus: 409,
			});
		} finally {
			await rm(container, { force: true, recursive: true });
		}
	});

	it('lista roots y directorios sin filtrar paths absolutos', async () => {
		await withApp(async ({ app, primary }) => {
			const roots = await request(app).get('/api/files/roots');
			const directory = await request(app).get('/api/files/directory').query({ rootId: 'primary', path: '' });
			expect(roots.status).toBe(200);
			expect(roots.body.roots[0]).toMatchObject({ id: 'primary', label: 'Primary' });
			expect(directory.status).toBe(200);
			expect(directory.body.data.items[0]).toMatchObject({ relativePath: 'inside.txt', rootId: 'primary' });
			expect(JSON.stringify({ roots: roots.body, directory: directory.body })).not.toContain(primary);
		});
	});

	it('expone sólo el resumen seguro de la recuperación de inicio', async () => {
		await withApp(async ({ app, primary }) => {
			app.locals.startupFileMutationRecovery = { completed: 2, manual: 1, pending: 3 };
			const response = await request(app).get('/api/files/recovery-status');

			expect(response.status).toBe(200);
			expect(response.body).toEqual({
				data: {
					recovery: { completed: 2, manual: 1, pending: 3, state: 'manual_review_required' },
				},
				success: true,
			});
			expect(JSON.stringify(response.body)).not.toContain(primary);
			expect(JSON.stringify(response.body)).not.toContain('asset-');
		});
	});

	it('vuelve a evaluar la recuperación sin publicar el journal ni rutas locales', async () => {
		await withApp(async ({ app, primary }) => {
			const previousJournalPath = process.env.MEDIA_MANAGER_FILE_MUTATION_RECOVERY_JOURNAL;
			process.env.MEDIA_MANAGER_FILE_MUTATION_RECOVERY_JOURNAL = resolve(primary, 'recovery.jsonl');
			try {
				const response = await request(app).post('/api/files/recovery/reconcile');

				expect(response.status).toBe(200);
				expect(response.body).toEqual({
					data: { recovery: { completed: 0, manual: 0, pending: 0, state: 'clean' } },
					success: true,
				});
				expect(JSON.stringify(response.body)).not.toContain(primary);
				expect(JSON.stringify(response.body)).not.toContain('recovery.jsonl');
			} finally {
				if (previousJournalPath === undefined) delete process.env.MEDIA_MANAGER_FILE_MUTATION_RECOVERY_JOURNAL;
				else process.env.MEDIA_MANAGER_FILE_MUTATION_RECOVERY_JOURNAL = previousJournalPath;
			}
		});
	});

	it('sirve contenido y downloads sólo mediante referencias autorizadas', async () => {
		await withApp(async ({ app, primary }) => {
			const content = await request(app).get('/api/files/content').query({ rootId: 'primary', path: 'inside.txt' });
			const download = await request(app).get('/api/download').query({ rootId: 'primary', path: 'inside.txt' });
			const legacyAbsolute = await request(app)
				.get('/api/files/content')
				.query({ path: resolve(primary, 'inside.txt') });
			expect(content.status).toBe(200);
			expect(content.text).toBe('inside');
			expect(content.headers['cache-control']).toBe('private, max-age=0, must-revalidate');
			expect(content.headers.vary).toContain('Cookie');
			expect(content.headers['x-content-type-options']).toBe('nosniff');
			expect(content.headers.etag).toBeDefined();
			expect(
				(
					await request(app)
						.get('/api/files/content')
						.query({ rootId: 'primary', path: 'inside.txt' })
						.set('If-None-Match', content.headers.etag)
				).status
			).toBe(304);
			expect(download.status).toBe(200);
			expect(download.headers['content-disposition']).toContain('inside.txt');
			expect(download.headers['cache-control']).toBe('private, max-age=0, must-revalidate');
			expect(download.headers.vary).toContain('Cookie');
			expect(download.headers['x-content-type-options']).toBe('nosniff');
			expect(download.headers.etag).toBeDefined();
			expect(
				(
					await request(app)
						.get('/api/download')
						.query({ rootId: 'primary', path: 'inside.txt' })
						.set('If-None-Match', download.headers.etag)
				).status
			).toBe(304);
			expect(legacyAbsolute.status).toBe(400);
			expect(JSON.stringify(legacyAbsolute.body)).not.toContain(primary);
		});
	});

	it('retira mutaciones filesystem crudas que podían desincronizar la base', async () => {
		await withApp(async ({ app, primary }) => {
			const created = await request(app)
				.post('/api/files/directory')
				.send({ target: { rootId: 'primary', relativePath: 'new' } });
			const copied = await request(app)
				.post('/api/files/copy')
				.send({
					destination: { rootId: 'primary', relativePath: 'new/copied.txt' },
					source: { rootId: 'primary', relativePath: 'inside.txt' },
				});
			const renamed = await request(app)
				.put('/api/files/rename')
				.send({
					destination: { rootId: 'primary', relativePath: 'new/renamed.txt' },
					source: { rootId: 'primary', relativePath: 'new/copied.txt' },
				});
			const moved = await request(app)
				.post('/api/files/move')
				.send({
					destination: { rootId: 'primary', relativePath: 'moved.txt' },
					source: { rootId: 'primary', relativePath: 'new/renamed.txt' },
				});
			for (const response of [created, copied, renamed, moved]) {
				expect(response.status).toBe(410);
				expect(response.body.code).toBe('DOMAIN_OPERATION_REQUIRED');
				expect(JSON.stringify(response.body)).not.toContain(primary);
			}
			await expect(readFile(resolve(primary, 'moved.txt'), 'utf8')).rejects.toMatchObject({ code: 'ENOENT' });
		});
	});

	it('bloquea permisos faltantes y mantiene retiradas las mutaciones legacy', async () => {
		await withApp(
			async ({ app, primary }) => {
				const createDenied = await request(app)
					.post('/api/files/directory')
					.send({ target: { rootId: 'primary', relativePath: 'denied' } });
				const downloadDenied = await request(app).get('/api/download').query({ rootId: 'primary', path: 'inside.txt' });
				const legacyBody = await request(app)
					.post('/api/files/directory')
					.send({ path: resolve(primary, 'legacy') });
				expect(createDenied.status).toBe(410);
				expect(downloadDenied.status).toBe(403);
				expect(legacyBody.status).toBe(410);
			},
			{ permissions: ['read', 'index'] }
		);

		await withApp(async ({ app, secondary }) => {
			const crossRoot = await request(app)
				.post('/api/files/copy')
				.send({
					destination: { rootId: 'secondary', relativePath: 'copied.txt' },
					source: { rootId: 'primary', relativePath: 'inside.txt' },
				});
			expect(crossRoot.status).toBe(410);
			await expect(readFile(resolve(secondary, 'copied.txt'), 'utf8')).rejects.toMatchObject({ code: 'ENOENT' });
		});
	});

	it('bloquea un junction/symlink de lectura que escapa del fixture', async () => {
		await withApp(async ({ app, outside, primary }) => {
			await symlink(outside, resolve(primary, 'escape'), process.platform === 'win32' ? 'junction' : 'dir');
			const response = await request(app)
				.get('/api/files/content')
				.query({ rootId: 'primary', path: 'escape/secret.txt' });
			expect(response.status).toBe(403);
			expect(response.body.code).toBe('ROOT_PATH_OUTSIDE');
			expect(response.text).not.toContain(outside);
		});
	});

	it('conserva source opaco para persistencia canónica, resuelve path sólo en servidor y rechaza path legacy', async () => {
		await withApp(async ({ app, primary }) => {
			const authorized = await request(app)
				.post('/api/probe/file')
				.send({ name: 'inside', source: { rootId: 'primary', relativePath: 'inside.txt' } });
			const legacy = await request(app)
				.post('/api/probe/file')
				.send({ path: resolve(primary, 'inside.txt') });
			const metadataOnlyUpdate = await request(app).patch('/api/probe/file').send({ description: 'safe update' });
			expect(authorized.status).toBe(200);
			expect(authorized.body).toEqual({
				authorized: true,
				source: { relativePath: 'inside.txt', rootId: 'primary' },
			});
			expect(JSON.stringify(authorized.body)).not.toContain(primary);
			expect(legacy.status).toBe(400);
			expect(metadataOnlyUpdate.body).toEqual({ keys: ['description'] });
		});
	});

	it('elimina paths físicos de payloads públicos sin destruir referencias autorizadas', async () => {
		await withApp(async ({ app, primary }) => {
			const response = await request(app).get('/api/probe/public-payload');
			expect(response.status).toBe(200);
			expect(response.body).toEqual({
				arbitrary: ['[redacted-path]', { location: '[redacted-path]' }],
				data: [{ id: 'asset-1', nested: {} }],
				error: 'No se pudo abrir [redacted-path]',
				message: 'Backend disponible en http://127.0.0.1:4000/api',
				reference: { relativePath: 'inside.txt', rootId: 'primary' },
			});
			expect(response.text).not.toContain(primary);
		});
	});

	it('elimina paths físicos también del canal de eventos', async () => {
		await withApp(async ({ primary }) => {
			const event = sanitizeEventForStore({
				type: 'file:moved',
				data: {
					message: `Movido desde ${resolve(primary, 'inside.txt')}`,
					sourcePath: resolve(primary, 'inside.txt'),
				},
			});
			expect(event.data).toEqual({ message: 'Movido desde [redacted-path]' });
			expect(JSON.stringify(event)).not.toContain(primary);
		});
	});

	it('filtra listados legacy por path autorizado y falla cerrado para lecturas directas', async () => {
		await withApp(async ({ app, outside, primary, registry }) => {
			const [{ db }, { folders, images }] = await Promise.all([
				import('../src/lib/drizzle'),
				import('../src/lib/drizzle/schema'),
			]);
			const suffix = crypto.randomUUID();
			const folderId = `legacy-auth-folder-${suffix}`;
			const insideId = `legacy-auth-inside-${suffix}`;
			const outsideId = `legacy-auth-outside-${suffix}`;
			await db.insert(folders).values({ id: folderId, name: 'Legacy authorization fixture', path: primary });
			await db.insert(images).values([
				{
					folderId,
					hash: '1'.repeat(64),
					height: 1,
					id: insideId,
					name: 'inside.txt',
					path: resolve(primary, 'inside.txt'),
					size: 6,
					width: 1,
				},
				{
					folderId,
					hash: '2'.repeat(64),
					height: 1,
					id: outsideId,
					name: 'secret.txt',
					path: resolve(outside, 'secret.txt'),
					size: 7,
					width: 1,
				},
			]);

			try {
				const requestContext = { app: { locals: app.locals } };
				const entities = [
					{ id: insideId, path: resolve(primary, 'attacker-controlled.txt') },
					{ id: outsideId, path: resolve(primary, 'inside.txt') },
				];
				const filtered = await filterAuthorizedMediaEntities(requestContext, entities, 'image', ['read', 'index']);
				expect(filtered.map((entity) => entity.id)).toEqual([insideId]);
				await expect(
					assertAuthorizedMediaEntity(requestContext, entities[1], 'image', ['read', 'index'])
				).rejects.toMatchObject({ code: 'ROOT_PATH_OUTSIDE', status: 403 });
				expect(registry.list()).toHaveLength(2);
			} finally {
				await db.delete(images).where(inArray(images.id, [insideId, outsideId]));
				await db.delete(folders).where(eq(folders.id, folderId));
			}
		});
	});
});
