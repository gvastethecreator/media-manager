import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { eq, inArray } from 'drizzle-orm';
import express from 'express';
import request from 'supertest';
import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import { db, ensureDatabaseReady } from '@/lib/drizzle';
import { ensureFts5Ready } from '@/lib/drizzle/fts5';
import { files, folders, images } from '@/lib/drizzle/schema';
import searchRouter from '@/server/routes/search.effect';
import { createAuthorizedRootRegistry } from '@/server/security/authorized-roots';

const folderId = crypto.randomUUID();
const ids = [crypto.randomUUID(), crypto.randomUUID()];
const app = express();
let directory: string;

beforeAll(async () => {
	vi.stubEnv('DISABLE_FTS5', '0');
	vi.stubEnv('SEARCH_FTS_REQUIRE', '0');
	await ensureDatabaseReady();
	directory = await mkdtemp(join(tmpdir(), 'media-manager-fts-'));
	app.locals.authorizedRootRegistry = await createAuthorizedRootRegistry([
		{ id: 'fts-fixture', label: 'Search fixture', path: directory, permissions: ['read', 'index'] },
	]);
	app.use('/api/search', searchRouter);
	await db.insert(folders).values({ id: folderId, name: 'Search fixture', path: directory });
	for (const [index, id] of ids.entries()) {
		const name = index === 0 ? 'cleanupnebula cleanupnebula.png' : 'cleanupnebula galaxy.png';
		const path = join(directory, name);
		await writeFile(path, 'fixture');
		const shared = { id, name, path, folderId, size: 7, hash: String(index + 1).repeat(64) };
		await db.insert(images).values({ ...shared, width: 1, height: 1 });
		await db.insert(files).values({ ...shared, mimeType: 'image/png', extension: '.png', fileType: 'image' });
	}
	await Promise.all([ensureFts5Ready(), ensureFts5Ready()]);
});

afterAll(async () => {
	await db.delete(files).where(inArray(files.id, ids));
	await db.delete(images).where(inArray(images.id, ids));
	await db.delete(folders).where(eq(folders.id, folderId));
	if (directory) await rm(directory, { recursive: true, force: true });
	vi.unstubAllEnvs();
});

it('returns seeded matches with finite scores in FTS ranking order', async () => {
	const response = await request(app).get('/api/search/fts').query({ q: 'cleanupnebula' });
	expect(response.status).toBe(200);
	expect(response.body.engine).toBe('fts5');
	expect(response.body.total).toBe(2);
	expect(response.body.items.map((item: { id: string }) => item.id).sort()).toEqual([...ids].sort());
	const scores = response.body.items.map((item: { score: number }) => item.score);
	expect(scores.every(Number.isFinite)).toBe(true);
	expect(scores).toEqual([...scores].sort((a, b) => a - b));
	await db.update(images).set({ name: 'cleanupnebula revisedtrigger.png' }).where(eq(images.id, ids[0]));
	const updated = await request(app).get('/api/search/fts').query({ q: 'revisedtrigger' });
	expect(updated.status).toBe(200);
	expect(updated.body.engine).toBe('fts5');
	expect(updated.body.items.map((item: { id: string }) => item.id)).toEqual([ids[0]]);
});

it('keeps the same matches through the explicit LIKE fallback and fails when FTS is required', async () => {
	vi.stubEnv('DISABLE_FTS5', '1');
	const response = await request(app).get('/api/search/fts').query({ q: 'cleanupnebula' });
	expect(response.status).toBe(200);
	expect(response.body.engine).toBe('like');
	expect(response.body.total).toBe(2);
	expect(response.body.items.map((item: { id: string }) => item.id).sort()).toEqual([...ids].sort());
	vi.stubEnv('SEARCH_FTS_REQUIRE', '1');
	const required = await request(app).get('/api/search/fts').query({ q: 'cleanupnebula' });
	expect(required.status).toBe(503);
	expect(required.body.required).toBe(true);
});
