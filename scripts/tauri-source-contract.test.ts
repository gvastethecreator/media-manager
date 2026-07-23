import { expect, test } from 'bun:test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const workspaceRoot = resolve(import.meta.dir, '..');

test('desktop source keeps a constrained CSP and no unused native filesystem or shell bridge', async () => {
	const [cargoToml, libRs, tauriConfig, workflow] = await Promise.all([
		readFile(resolve(workspaceRoot, 'src-tauri/Cargo.toml'), 'utf8'),
		readFile(resolve(workspaceRoot, 'src-tauri/src/lib.rs'), 'utf8'),
		readFile(resolve(workspaceRoot, 'src-tauri/tauri.conf.json'), 'utf8'),
		readFile(resolve(workspaceRoot, '.github/workflows/quality.yml'), 'utf8'),
	]);
	const config = JSON.parse(tauriConfig) as {
		app?: { security?: { csp?: Record<string, string>; devCsp?: Record<string, string> } };
	};

	expect(cargoToml).not.toContain('tauri-plugin-fs');
	expect(cargoToml).not.toContain('tauri-plugin-shell');
	expect(libRs).not.toContain('tauri_plugin_fs');
	expect(libRs).not.toContain('tauri_plugin_shell');
	expect(config.app?.security?.csp).toMatchObject({
		'connect-src': "'self' ipc: http://127.0.0.1:* http://localhost:*",
		'default-src': "'self' customprotocol: asset:",
	});
	expect(config.app?.security?.devCsp?.['connect-src']).toContain('ws://localhost:*');
	expect(tauriConfig).toContain('"../dist/server/index.js": "server/index.js"');
	expect(tauriConfig).not.toContain('wrapper.js');
	expect(workflow).toContain('desktop-source:');
	expect(workflow).toContain('runs-on: windows-latest');
	expect(workflow).toContain('bun run build');
	expect(workflow).toContain('cargo check --manifest-path src-tauri/Cargo.toml --locked');
});
