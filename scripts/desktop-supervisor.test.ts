import { describe, expect, it } from 'bun:test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { BunSupervisor } from '../electron/main/supervisor';

const workspaceRoot = resolve(import.meta.dir, '..');

function isPidAlive(pid: number): boolean {
	try {
		process.kill(pid, 0);
		return true;
	} catch {
		return false;
	}
}

describe('BunSupervisor start/stop', () => {
	it('starts a child and waits until stop observes process exit', async () => {
		const dir = mkdtempSync(join(tmpdir(), 'media-manager-supervisor-'));
		const port = 18_000 + Math.floor(Math.random() * 1_000);
		const supervisor = new BunSupervisor({
			bunExecutable: process.execPath,
			extraEnv: {
				MEDIA_MANAGER_APP_PORT: String(port),
				MEDIA_MANAGER_INTERNAL_API_PORT: String(port + 1),
			},
			healthTimeoutMs: 10_000,
			healthUrl: `http://127.0.0.1:${port}/health`,
			startScript: resolve(workspaceRoot, 'scripts/fixtures/supervisor-ready-child.ts'),
			userDataDir: dir,
			workspaceRoot: dir,
		});
		const status = await supervisor.start();
		expect(status).toBe('ready');
		const pid = supervisor.getPid();
		expect(pid).toBeTruthy();
		expect(isPidAlive(pid as number)).toBe(true);
		await supervisor.stop();
		expect(supervisor.getStatus()).toBe('stopped');
		expect(supervisor.getPid()).toBeUndefined();
		expect(isPidAlive(pid as number)).toBe(false);
	});
});
