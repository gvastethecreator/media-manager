import { describe, expect, it } from 'bun:test';
import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import express from 'express';
import request from 'supertest';
import { retireFavoriteToggleFacades } from '../src/server/utils/favorite-facade-deprecation';

const workspacePath = resolve(import.meta.dir, '..');

async function listTypeScriptFiles(directory: string): Promise<string[]> {
	const entries = await readdir(directory, { withFileTypes: true });
	const files: string[] = [];
	for (const entry of entries) {
		const path = resolve(directory, entry.name);
		if (entry.isDirectory()) files.push(...(await listTypeScriptFiles(path)));
		else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) files.push(path);
	}
	return files;
}

async function readSources(relativeDirectories: string[]): Promise<string> {
	const files = (
		await Promise.all(relativeDirectories.map((directory) => listTypeScriptFiles(resolve(workspacePath, directory))))
	).flat();
	return (await Promise.all(files.map((file) => readFile(file, 'utf8')))).join('\n');
}

describe('FAV-001 public cutover', () => {
	it('keeps internal clients on the single canonical toggle endpoint', async () => {
		const clientSources = await readSources(['src/lib/api', 'src/hooks', 'src/store', 'src/components']);
		const entityFacade =
			/\/(?:folders|images|tags|albums|collections|characters|places|concepts|prompts|audio|videos|groups|wildcards|notes|properties|world-items|file3ds|json-files|documents)\/[^'"`\s]+\/favorite\b/;

		expect(clientSources).not.toMatch(entityFacade);
		expect(clientSources).not.toContain('/batch/favorite');
		expect(clientSources).not.toContain('/toggle-favorite');
		expect(clientSources).toContain("apiClient.post('/favorites/toggle'");
		expect(clientSources).toContain("apiClient.put<FavoriteToggleResponse>('/favorites/state'");
	});

	it('routes every canonical client mutation through shared Favorite cache invalidation', async () => {
		const clientFiles = (
			await Promise.all(
				['src/lib/api', 'src/hooks', 'src/store', 'src/components'].map((directory) =>
					listTypeScriptFiles(resolve(workspacePath, directory))
				)
			)
		).flat();
		const mutationFiles = [];
		for (const file of clientFiles) {
			const source = await readFile(file, 'utf8');
			if (source.includes('/favorites/toggle') || source.includes('/favorites/state')) {
				mutationFiles.push({ file, source });
			}
		}

		expect(mutationFiles.length).toBeGreaterThan(0);
		expect(
			mutationFiles
				.filter((mutationFile) => !mutationFile.source.includes('invalidateFavoriteQueries'))
				.map((mutationFile) => mutationFile.file)
		).toEqual([]);
	});

	it('invalidates Favorite caches after entity create, update, and physical delete surfaces', async () => {
		const mutationSurfaces = [
			'src/lib/api/hook-factory.ts',
			'src/lib/api/folders.ts',
			'src/lib/api/groups.ts',
			'src/lib/api/notes.ts',
			'src/lib/api/properties.ts',
			'src/lib/api/wildcards.ts',
			'src/lib/api/world-items.ts',
			'src/lib/api/services/folders.ts',
			'src/lib/api/client/album.client.ts',
			'src/lib/api/client/collection.client.ts',
			'src/lib/api/client/group.client.ts',
			'src/lib/api/client/note.client.ts',
			'src/lib/api/client/property.client.ts',
			'src/lib/api/client/wildcard.client.ts',
			'src/lib/api/client/world-item.client.ts',
		];

		for (const relativePath of mutationSurfaces) {
			const source = await readFile(resolve(workspacePath, relativePath), 'utf8');
			expect(source).toContain('invalidateFavoriteQueries');
		}
	});

	it('contains no nullable or legacy Favorite authority in services', async () => {
		const serviceSources = await readSources(['src/services']);
		const routeSources = await readSources(['src/server/routes']);
		const scaffoldSource = await readFile(resolve(workspacePath, 'scripts/scaffold-effect-service.ts'), 'utf8');
		const folderFilesSource = await readFile(
			resolve(workspacePath, 'src/services/folder-files/folder-files.service.ts'),
			'utf8'
		);
		const optimizedStatsSource = await readFile(
			resolve(workspacePath, 'src/services/stats/optimized-stats.service.ts'),
			'utf8'
		);
		const imageLookupSource = await readFile(
			resolve(workspacePath, 'src/services/image/image-lookup.service.ts'),
			'utf8'
		);
		const globalSearchSource = await readFile(resolve(workspacePath, 'src/server/services/search.service.ts'), 'utf8');
		const folderFilesStreamSource = await readFile(
			resolve(workspacePath, 'src/services/folder-files/folder-files-stream.service.ts'),
			'utf8'
		);

		expect(serviceSources).not.toContain('.getFavoriteEntityIds(');
		expect(serviceSources).not.toContain('projectEntityWithLegacyFallback');
		expect(serviceSources).not.toContain('projectEntitiesWithLegacyFallback');
		expect(serviceSources).not.toContain('useCanonicalFavoriteBridge');
		expect(serviceSources).not.toContain('legacyFallback');
		expect(routeSources).not.toContain("'/:id/favorite'");
		expect(routeSources).not.toContain("'/batch/favorite'");
		expect(routeSources).not.toContain("'/toggle-favorite'");
		expect(routeSources).not.toContain('markFavoriteToggleFacadeDeprecated');
		expect(scaffoldSource).not.toContain('isFavorite');
		expect(scaffoldSource).not.toContain('onlyFavorites');
		expect(scaffoldSource).not.toContain('toggleFavorite');
		expect(scaffoldSource).not.toContain("router.post('/:id/favorite'");
		expect(folderFilesSource).not.toContain('Boolean(row.isFavorite)');
		expect(optimizedStatsSource).not.toContain('i.isFavorite');
		expect(optimizedStatsSource).not.toContain('v.isFavorite');
		expect(optimizedStatsSource).not.toMatch(
			/FROM (?:Image|Video|Character|Place|WorldItem|Collection|Concept|Prompt|Note) WHERE isFavorite/
		);
		expect(folderFilesStreamSource).not.toContain('item.isFavorite');
		expect(imageLookupSource).not.toContain('image.isFavorite');
		for (const entityType of ['IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT']) {
			expect(globalSearchSource).toContain(`favoriteService.projectEntities(FavoriteEntityType.${entityType}`);
		}
	});

	it('returns 410 for every retired facade and lets the canonical route continue', async () => {
		const app = express();
		app.use(retireFavoriteToggleFacades);
		app.use((_req, res) => res.status(204).end());

		const retiredEntityPrefixes = [
			'folders',
			'images',
			'tags',
			'albums',
			'collections',
			'characters',
			'places',
			'concepts',
			'prompts',
			'audio',
			'videos',
			'groups',
			'wildcards',
			'notes',
			'properties',
			'world-items',
			'file3ds',
			'json-files',
			'documents',
		];

		for (const prefix of retiredEntityPrefixes) {
			const response = await request(app).post(`/api/${prefix}/entity-1/favorite`);
			expect(response.status).toBe(410);
			expect(response.body.successor).toBe('/api/favorites/toggle');
		}

		for (const prefix of ['images', 'audio', 'videos']) {
			expect((await request(app).post(`/api/${prefix}/batch/favorite`)).status).toBe(410);
		}
		expect((await request(app).post('/api/folders/folder-1/toggle-favorite')).status).toBe(410);
		expect((await request(app).post('/api/favorites/toggle')).status).toBe(204);
		expect((await request(app).put('/api/favorites/state')).status).toBe(204);
	});
});
