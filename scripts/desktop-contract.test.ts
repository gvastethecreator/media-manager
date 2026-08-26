import { describe, expect, it } from 'bun:test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import {
	DESKTOP_METHODS,
	DEV_WINDOW_ORIGIN,
	FORBIDDEN_DESKTOP_APIS,
	isAllowedDesktopChannel,
	resolveAllowedWindowOrigin,
} from '../electron/shared/ipc-contract';
import { isWorkspaceDatabasePath, resolveDesktopLibraryPaths } from '../electron/main/data-dir';
import {
	resolveDesktopRuntimeMode,
	resolveExtraResourcesRoot,
	resolvePackagedBunExecutable,
} from '../electron/main/runtime-mode';
import { isTrustedSender, SECURE_WEB_PREFERENCES } from '../electron/main/security';
import { readFile } from 'node:fs/promises';

const workspaceRoot = resolve(import.meta.dir, '..');

describe('desktop contract', () => {
	it('keeps the development window on the Vite loopback origin', () => {
		expect(DEV_WINDOW_ORIGIN).toBe('http://127.0.0.1:5173');
		expect(resolveAllowedWindowOrigin('development', 4000)).toBe('http://127.0.0.1:5173');
		expect(resolveAllowedWindowOrigin('production', 4000)).toBe('http://127.0.0.1:4000');
	});

	it('exposes only named desktop methods', () => {
		expect(DESKTOP_METHODS).toEqual([
			'desktop:get-runtime-info',
			'desktop:get-backend-status',
			'desktop:retry-backend',
			'desktop:open-log-folder',
			'desktop:get-restore-offer',
			'desktop:confirm-restore',
			'desktop:skip-restore',
		]);
		expect(isAllowedDesktopChannel('invoke')).toBe(false);
		for (const forbidden of FORBIDDEN_DESKTOP_APIS) {
			expect(isAllowedDesktopChannel(forbidden)).toBe(false);
		}
	});

	it('keeps secure window preferences', () => {
		expect(SECURE_WEB_PREFERENCES).toMatchObject({
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: true,
			webSecurity: true,
		});
		expect(isTrustedSender('http://127.0.0.1:5173/app', DEV_WINDOW_ORIGIN)).toBe(true);
		expect(isTrustedSender('http://evil.example/', DEV_WINDOW_ORIGIN)).toBe(false);
	});

	it('resolves the desktop library away from the workspace database', () => {
		const dir = mkdtempSync(join(tmpdir(), 'media-manager-desktop-'));
		const paths = resolveDesktopLibraryPaths(dir);
		expect(paths.libraryPath.endsWith('app-data\\library.sqlite') || paths.libraryPath.endsWith('app-data/library.sqlite')).toBe(
			true
		);
		expect(paths.logsDir.endsWith('app-data\\logs') || paths.logsDir.endsWith('app-data/logs')).toBe(true);
		expect(paths.uploadsDir.endsWith('app-data\\uploads') || paths.uploadsDir.endsWith('app-data/uploads')).toBe(true);
		expect(isWorkspaceDatabasePath(paths.libraryPath, workspaceRoot)).toBe(false);
		expect(isWorkspaceDatabasePath(resolve(workspaceRoot, 'db.sqlite'), workspaceRoot)).toBe(true);
	});

	it('uses app packaging and extraResources for the production origin and bun path', () => {
		expect(resolveDesktopRuntimeMode({ isPackaged: true })).toBe('production');
		expect(resolveDesktopRuntimeMode({ desktopMode: undefined, isPackaged: false })).toBe('development');
		expect(resolveDesktopRuntimeMode({ desktopMode: 'production', isPackaged: false })).toBe('production');
		expect(resolveAllowedWindowOrigin('production', 4000)).toBe('http://127.0.0.1:4000');
		expect(resolveExtraResourcesRoot({ isPackaged: true, resourcesPath: 'C:\\app\\resources', workspaceRoot: workspaceRoot })).toBe(
			join('C:\\app\\resources', 'extra-resources')
		);
		expect(resolvePackagedBunExecutable('C:\\app\\resources\\extra-resources').replaceAll('\\', '/')).toMatch(/bun\/bun(\.exe)?$/);
	});

	it('does not define the session token into the Vite bundle', async () => {
		const vite = await readFile(resolve(workspaceRoot, 'vite.config.ts'), 'utf8');
		expect(vite).not.toMatch(/define:\s*\{[^}]*MEDIA_MANAGER_SESSION_TOKEN/s);
	});

	it('wires packaged startup, awaited quit, and the restore dialog', async () => {
		const [main, supervisor, shell] = await Promise.all([
			readFile(resolve(workspaceRoot, 'electron/main/index.ts'), 'utf8'),
			readFile(resolve(workspaceRoot, 'electron/main/supervisor.ts'), 'utf8'),
			readFile(resolve(workspaceRoot, 'src/platform/app-shell/app-shell.tsx'), 'utf8'),
		]);
		expect(main).toContain('app.isPackaged');
		expect(main).toContain('before-quit');
		expect(main).toContain('event.preventDefault()');
		expect(main).toContain('resolvePackagedStartScript');
		expect(main).toContain('preload.cjs');
		expect(main).toContain('paths.logsDir');
		expect(supervisor).toContain('MEDIA_MANAGER_LOG_DIR');
		expect(supervisor).toContain('UPLOADS_DIR');
		expect(main).not.toContain("MEDIA_MANAGER_DESKTOP_MODE !== 'production'");
		expect(shell).toContain('RestoreLibraryDialog');
		expect(shell).toContain('confirmRestore');
		expect(shell).toContain('skipRestore');
		const buildShell = await readFile(resolve(workspaceRoot, 'scripts/build-electron-shell.js'), 'utf8');
		expect(buildShell).toContain("external: ['electron']");
	});
});
