import { expect, test } from 'bun:test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const workspaceRoot = resolve(import.meta.dir, '..');

test('desktop source keeps Electron security defaults and no Cargo desktop gate', async () => {
	const [workflow, packageJson, ipc] = await Promise.all([
		readFile(resolve(workspaceRoot, '.github/workflows/quality.yml'), 'utf8'),
		readFile(resolve(workspaceRoot, 'package.json'), 'utf8'),
		readFile(resolve(workspaceRoot, 'electron/shared/ipc-contract.ts'), 'utf8'),
	]);
	expect(workflow).toContain('desktop-source:');
	expect(workflow).toContain('runs-on: windows-latest');
	expect(workflow).toContain('bun run build');
	expect(workflow).not.toContain('cargo check --manifest-path src-tauri/Cargo.toml --locked');
	expect(packageJson).not.toContain('@tauri-apps/api');
	expect(packageJson).not.toContain('@tauri-apps/cli');
	expect(ipc).toContain("DEV_WINDOW_ORIGIN = 'http://127.0.0.1:5173'");
	expect(ipc).toContain('deleteFile');
});
