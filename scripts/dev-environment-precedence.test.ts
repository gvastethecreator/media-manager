import { describe, expect, it } from 'bun:test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

describe('development server environment precedence', () => {
	it('keeps explicit supervisor variables above repository env files', async () => {
		const source = await readFile(resolve(import.meta.dir, 'dev-server-hot.js'), 'utf8');
		const merge = source.match(/const configuredServerEnv = \{([\s\S]*?)\n\};/)?.[1] ?? '';
		expect(merge).toContain('...defaultEnv');
		expect(merge).toContain('...tauriEnv');
		expect(merge).toContain('...process.env');
		expect(merge.indexOf('...defaultEnv')).toBeLessThan(merge.indexOf('...tauriEnv'));
		expect(merge.indexOf('...tauriEnv')).toBeLessThan(merge.indexOf('...process.env'));
		expect(source).not.toContain('${serverEnv.DATABASE_URL ||');
		expect(source).not.toMatch(/databaseUrl\s*:\s*serverEnv\.DATABASE_URL/);
	});

	it('passes the explicit supervisor database URL to the effective child environment', async () => {
		const explicitDatabaseUrl = 'file:./explicit-supervisor.sqlite';
		const child = Bun.spawn([process.execPath, resolve(import.meta.dir, 'dev-server-hot.js')], {
			cwd: resolve(import.meta.dir, '..'),
			env: {
				...process.env,
				DATABASE_URL: explicitDatabaseUrl,
				MEDIA_MANAGER_ENV_PROBE: '1',
				MEDIA_MANAGER_ENV_PROBE_EXPECTED_DATABASE_URL: explicitDatabaseUrl,
				MEDIA_MANAGER_SESSION_TOKEN: 'probe-token-abcdefghijklmnopqrstuvwxyz-0123456789',
				MEDIA_MANAGER_TRUSTED_SUPERVISOR: '1',
			},
			stderr: 'pipe',
			stdout: 'pipe',
		});
		const [stdout, stderr, exitCode] = await Promise.all([
			new Response(child.stdout).text(),
			new Response(child.stderr).text(),
			child.exited,
		]);
		expect(exitCode, stderr).toBe(0);
		const probeLine = stdout
			.split(/\r?\n/)
			.map((line) => line.trim())
			.find((line) => line.startsWith('{') && line.includes('"databaseUrlMatchesExpected"'));
		expect(probeLine).toBeDefined();
		expect(JSON.parse(probeLine ?? '{}')).toMatchObject({ databaseUrlMatchesExpected: true });
		expect(stdout).not.toContain(explicitDatabaseUrl);
	});

	it('does not copy a workspace database into extraResources', async () => {
		const source = await readFile(resolve(import.meta.dir, 'write-extraresources-inventory.ts'), 'utf8');
		expect(source).toContain('SQLite file is not allowed in extraResources');
		expect(source).not.toContain('db.sqlite');
	});
});
