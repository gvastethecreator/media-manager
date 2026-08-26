import { describe, expect, it } from 'bun:test';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const workspaceRoot = resolve(import.meta.dir, '..');

function writeFixtureTree(): string {
	const tree = mkdtempSync(join(tmpdir(), 'media-manager-extraresources-'));
	mkdirSync(join(tree, 'bun'), { recursive: true });
	mkdirSync(join(tree, 'migrations'), { recursive: true });
	mkdirSync(join(tree, 'node_modules', 'sharp'), { recursive: true });
	mkdirSync(join(tree, 'start'), { recursive: true });
	mkdirSync(join(tree, 'client'), { recursive: true });
	mkdirSync(join(tree, 'server'), { recursive: true });
	writeFileSync(join(tree, process.platform === 'win32' ? 'bun/bun.exe' : 'bun/bun'), 'bun-runtime-bytes');
	writeFileSync(join(tree, 'migrations/001.sql'), 'SELECT 1;');
	writeFileSync(join(tree, 'node_modules/sharp/package.json'), '{"name":"sharp"}');
	writeFileSync(join(tree, 'start/start-production.js'), 'console.log("start")');
	writeFileSync(join(tree, 'client/index.html'), '<html></html>');
	writeFileSync(join(tree, 'server/index.js'), 'console.log("server")');
	return tree;
}

describe('extraResources inventory', () => {
	it('hashes the copied extraResources tree and never lists a sqlite database', () => {
		const tree = writeFixtureTree();
		const inventoryPath = join(tree, 'inventory.json');
		const result = spawnSync(process.execPath, ['scripts/write-extraresources-inventory.ts'], {
			cwd: workspaceRoot,
			encoding: 'utf8',
			env: {
				...process.env,
				EXTRA_RESOURCES_INVENTORY_PATH: inventoryPath,
				EXTRA_RESOURCES_ROOT: tree,
			},
		});
		expect(result.status).toBe(0);
		const inventory = JSON.parse(readFileSync(inventoryPath, 'utf8')) as {
			sqlite: boolean;
			root: string;
			entries: Array<{ key: string; path: string; present: boolean; hash?: string }>;
		};
		expect(inventory.sqlite).toBe(false);
		expect(inventory.root).toBe('electron/extra-resources');
		expect(JSON.stringify(inventory).toLowerCase()).not.toContain('.sqlite');
		expect(JSON.stringify(inventory)).not.toContain(process.execPath);
		expect(JSON.stringify(inventory)).not.toContain('dist/client');
		expect(JSON.stringify(inventory)).not.toContain('dist/server');
		const bun = inventory.entries.find((entry) => entry.key === 'bun-runtime');
		const migrations = inventory.entries.find((entry) => entry.key === 'migrations');
		const sharp = inventory.entries.find((entry) => entry.key === 'sharp');
		const start = inventory.entries.find((entry) => entry.key === 'start');
		expect(bun?.present).toBe(true);
		expect(bun?.path.replaceAll('\\', '/')).toBe(process.platform === 'win32' ? 'bun/bun.exe' : 'bun/bun');
		expect(bun?.hash).toBeTruthy();
		expect(migrations?.present).toBe(true);
		expect(migrations?.hash).toBeTruthy();
		expect(sharp?.present).toBe(true);
		expect(sharp?.hash).toBeTruthy();
		expect(start?.present).toBe(true);
		expect(start?.hash).toBeTruthy();
	});
});
