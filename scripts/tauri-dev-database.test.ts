import { afterEach, describe, expect, it } from 'bun:test';
import { mkdir, mkdtemp, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { resolveTauriDevelopmentDatabase } from './tauri-dev-database.js';

const temporaryDirectories: string[] = [];

async function createTemporaryDirectory(): Promise<string> {
	const directory = await mkdtemp(join(tmpdir(), 'media-manager-tauri-dev-db-'));
	temporaryDirectories.push(directory);
	return directory;
}

afterEach(async () => {
	for (const directory of temporaryDirectories.splice(0)) {
		await rm(directory, { force: true, maxRetries: 10, recursive: true, retryDelay: 50 });
	}
});

describe('Tauri development database confinement', () => {
	it('places the default database under the dedicated LOCALAPPDATA directory', async () => {
		const localAppData = await createTemporaryDirectory();
		const result = resolveTauriDevelopmentDatabase({ LOCALAPPDATA: localAppData });

		expect(result).toBe(resolve(localAppData, 'MediaManager', 'development', 'media-manager.sqlite'));
	});

	it('rejects a junction used as the dedicated development root', async () => {
		const localAppData = await createTemporaryDirectory();
		const outside = await createTemporaryDirectory();
		const mediaManagerRoot = join(localAppData, 'MediaManager');
		await mkdir(mediaManagerRoot, { recursive: true });
		await symlink(outside, join(mediaManagerRoot, 'development'), process.platform === 'win32' ? 'junction' : 'dir');

		expect(() => resolveTauriDevelopmentDatabase({ LOCALAPPDATA: localAppData })).toThrow(
			'symlinks, junctions o reparse points'
		);
	});

	it('rejects a junction below the dedicated root before creating directories outside', async () => {
		const localAppData = await createTemporaryDirectory();
		const outside = await createTemporaryDirectory();
		resolveTauriDevelopmentDatabase({ LOCALAPPDATA: localAppData });
		const developmentRoot = join(localAppData, 'MediaManager', 'development');
		await symlink(outside, join(developmentRoot, 'escape'), process.platform === 'win32' ? 'junction' : 'dir');

		expect(() =>
			resolveTauriDevelopmentDatabase({
				LOCALAPPDATA: localAppData,
				MEDIA_MANAGER_TAURI_DEV_DATABASE: join(developmentRoot, 'escape', 'must-not-exist', 'media-manager.sqlite'),
			})
		).toThrow('symlinks, junctions o reparse points');
		expect(await Bun.file(join(outside, 'must-not-exist')).exists()).toBe(false);
	});

	it('rejects a junction at MediaManager before creating the development directory outside', async () => {
		const localAppData = await createTemporaryDirectory();
		const outside = await createTemporaryDirectory();
		await symlink(outside, join(localAppData, 'MediaManager'), process.platform === 'win32' ? 'junction' : 'dir');

		expect(() => resolveTauriDevelopmentDatabase({ LOCALAPPDATA: localAppData })).toThrow(
			'symlinks, junctions o reparse points'
		);
		expect(await Bun.file(join(outside, 'development')).exists()).toBe(false);
	});

	it('rejects an explicit target outside the dedicated development root before creating its parent', async () => {
		const localAppData = await createTemporaryDirectory();
		const outside = await createTemporaryDirectory();
		const target = join(outside, 'must-not-exist', 'media-manager.sqlite');

		expect(() =>
			resolveTauriDevelopmentDatabase({
				LOCALAPPDATA: localAppData,
				MEDIA_MANAGER_TAURI_DEV_DATABASE: target,
			})
		).toThrow('debe permanecer dentro del data dir de desarrollo dedicado');
		expect(await Bun.file(join(outside, 'must-not-exist')).exists()).toBe(false);
	});
});
