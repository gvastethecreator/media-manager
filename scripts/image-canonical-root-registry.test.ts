import { afterEach, describe, expect, it } from 'bun:test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { eq } from 'drizzle-orm';
import { db } from '../src/lib/drizzle';
import { mediaRoots } from '../src/lib/drizzle/schema';
import {
	resetConfiguredMediaSourceCache,
	resolveConfiguredMediaSource,
} from '../src/server/security/configured-media-source';
import {
	createAuthorizedRootRegistry,
	ROOT_GRANTS_ENV,
	type RootAuthorizationError,
} from '../src/server/security/authorized-roots';
import { getFileInfo } from '../src/services/file-entity-mapper/utils/file-info.utils';
import { syncCanonicalMediaRoots } from '../src/services/media-core/media-root-registry.service';

const temporaryDirectories: string[] = [];
const rootIds: string[] = [];
const originalRootGrants = process.env[ROOT_GRANTS_ENV];

afterEach(async () => {
	if (originalRootGrants === undefined) delete process.env[ROOT_GRANTS_ENV];
	else process.env[ROOT_GRANTS_ENV] = originalRootGrants;
	resetConfiguredMediaSourceCache();
	for (const id of rootIds.splice(0)) await db.delete(mediaRoots).where(eq(mediaRoots.id, id));
	for (const directory of temporaryDirectories.splice(0)) {
		await rm(directory, { force: true, maxRetries: 40, recursive: true, retryDelay: 100 });
	}
});

async function createFixture(): Promise<{ imagePath: string; rootPath: string; videoPath: string }> {
	const directory = await mkdtemp(join(tmpdir(), 'media-manager-image-root-registry-'));
	temporaryDirectories.push(directory);
	const rootPath = resolve(directory, 'library');
	await mkdir(rootPath);
	const imagePath = resolve(rootPath, 'photo.jpg');
	const videoPath = resolve(rootPath, 'movie.mp4');
	await Promise.all([writeFile(imagePath, 'image'), writeFile(videoPath, 'video')]);
	return { imagePath, rootPath, videoPath };
}

describe('canonical Image root integration', () => {
	it('requires trusted roots for every recognized media family and derives opaque sources without guessing', async () => {
		const fixture = await createFixture();
		process.env[ROOT_GRANTS_ENV] = '';
		resetConfiguredMediaSourceCache();

		for (const [path, folderId] of [
			[fixture.imagePath, 'folder-image'],
			[fixture.videoPath, 'folder-video'],
		] as const) {
			await expect(getFileInfo(path, folderId)).rejects.toMatchObject<Partial<RootAuthorizationError>>({
				code: 'ROOT_PATH_OUTSIDE',
			});
		}

		process.env[ROOT_GRANTS_ENV] = JSON.stringify([
			{ id: 'library', label: 'Library', path: fixture.rootPath, permissions: ['read', 'index'] },
		]);
		resetConfiguredMediaSourceCache();
		expect(await resolveConfiguredMediaSource(fixture.imagePath)).toEqual({
			relativePath: 'photo.jpg',
			rootId: 'library',
		});
		expect((await getFileInfo(fixture.imagePath, 'folder-image')).source).toEqual({
			relativePath: 'photo.jpg',
			rootId: 'library',
		});
		expect((await getFileInfo(fixture.videoPath, 'folder-video')).source).toEqual({
			relativePath: 'movie.mp4',
			rootId: 'library',
		});
	});

	it('syncs only opaque root identity and status into MediaRoot', async () => {
		const fixture = await createFixture();
		const rootId = `root-${crypto.randomUUID()}`;
		rootIds.push(rootId);
		const registry = await createAuthorizedRootRegistry([
			{ id: rootId, label: 'Canonical library', path: fixture.rootPath, permissions: ['read', 'index'] },
		]);

		expect(await syncCanonicalMediaRoots(registry)).toBe(1);
		const rows = await db.select().from(mediaRoots).where(eq(mediaRoots.id, rootId));
		expect(rows).toEqual([expect.objectContaining({ id: rootId, label: 'Canonical library', status: 'active' })]);
		expect(JSON.stringify(rows)).not.toContain(fixture.rootPath);
	});
});
