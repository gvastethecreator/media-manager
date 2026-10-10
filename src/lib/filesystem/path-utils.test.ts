import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, normalize } from 'node:path';
import { scanFolder } from '@/lib/filesystem/folder-scanner';
import { normalizePath } from '@/lib/filesystem/path-utils';

vi.mock('@/lib/logger/server-logger', () => ({
	serverLogger: { withContext: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }) },
}));

const roots: string[] = [];
afterEach(async () => {
	await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('filesystem path identity', () => {
	it.each(['OUTPUTS', 'outpuuts', 'outpputs', 'ssdmatrix'])('preserves the literal folder name %s', async (name) => {
		const root = await mkdtemp(join(tmpdir(), 'media-path-test-'));
		roots.push(root);
		const folder = join(root, name);
		await mkdir(folder);
		await writeFile(join(folder, 'fixture.png'), 'synthetic fixture');
		const result = await scanFolder(folder);
		expect(result.error).toBeUndefined();
		expect(result.path).toBe(folder);
		expect(result.files.map((file) => file.path)).toEqual([join(folder, 'fixture.png')]);
	});

	it('does not scan a similarly named sibling', async () => {
		const root = await mkdtemp(join(tmpdir(), 'media-path-test-'));
		roots.push(root);
		for (const name of ['outpuuts', 'outputs']) {
			await mkdir(join(root, name));
			await writeFile(join(root, name, `${name}.png`), 'synthetic fixture');
		}
		const result = await scanFolder(join(root, 'outpuuts'));
		expect(result.error).toBeUndefined();
		expect(result.files.map((file) => file.name)).toEqual(['outpuuts.png']);
	});

	it('normalizes navigation segments without changing path identity', () => {
		const path = join('library', 'nested', '..', 'OUTPUTS');
		expect(normalizePath(path)).toBe(normalize(path));
	});
});
