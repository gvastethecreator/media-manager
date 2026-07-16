import { describe, expect, it } from 'bun:test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

async function source(path: string): Promise<string> {
	return readFile(resolve(import.meta.dir, '..', path), 'utf8');
}

describe('public media API input contracts', () => {
	it('requires opaque sources for every media create/update consumer', async () => {
		const [documents, jsonFiles, file3ds, videos, audio, videoClient, audioClient] = await Promise.all([
			source('src/lib/api/documents.ts'),
			source('src/lib/api/json-files.ts'),
			source('src/lib/api/file3ds.ts'),
			source('src/lib/api/videos.ts'),
			source('src/lib/api/audio.ts'),
			source('src/lib/api/client/video.client.ts'),
			source('src/lib/api/client/audio.client.ts'),
		]);

		expect(documents).toContain('PublicDocumentCreateInput');
		expect(documents).toContain('PublicDocumentUpdateInput');
		expect(file3ds).toContain('PublicFile3DCreateInput');
		expect(file3ds).toContain('PublicFile3DUpdateInput');
		const createJsonContract = jsonFiles.slice(
			jsonFiles.indexOf('export interface JsonFileCreateInput'),
			jsonFiles.indexOf('export interface JsonFileUpdateInput')
		);
		const updateJsonContract = jsonFiles.slice(
			jsonFiles.indexOf('export interface JsonFileUpdateInput'),
			jsonFiles.indexOf('export interface JsonFilesResponse')
		);
		expect(createJsonContract).toContain('source: AuthorizedPathReference');
		expect(updateJsonContract).toContain('source?: AuthorizedPathReference');
		expect(createJsonContract).not.toMatch(/\bpath\??:\s*string/);
		expect(updateJsonContract).not.toMatch(/\bpath\??:\s*string/);
		expect(videos).toContain('PublicVideoCreateInput');
		expect(videos).toContain('PublicVideoUpdateInput');
		expect(videos).toContain("updateMethod: 'patch'");
		expect(audio).toContain('PublicAudioCreateInput');
		expect(audio).toContain('PublicAudioUpdateInput');
		expect(audio).toContain('apiClient.patch');
		for (const client of [videoClient, audioClient]) {
			expect(client).toContain('Omit<');
			expect(client).toContain("'path'");
			expect(client).toContain('source: AuthorizedPathReference');
			expect(client).toContain('source?: AuthorizedPathReference');
			expect(client).toContain("method: 'PATCH'");
		}
	});

	it('keeps JSON inside the public filesystem-sync cache contract', async () => {
		const fileSync = await source('src/hooks/use-file-sync.ts');
		expect(fileSync).toMatch(/type:\s*'image'\s*\|\s*'video'\s*\|\s*'audio'\s*\|\s*'document'\s*\|\s*'json'/);
		expect(fileSync.match(/queryKey:\s*\['json-files'\]/g)).toHaveLength(2);
	});
});
