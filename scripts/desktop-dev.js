#!/usr/bin/env bun

import { spawn, spawnSync } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createLocalSessionEnvironment } from './local-session-environment.js';
import { applyProductionDatabaseMigrations } from './apply-production-database.ts';
import { resolveDesktopLibraryPaths } from '../electron/main/data-dir.ts';

const processes = [];
const userDataDir = process.env.LOCALAPPDATA || join(homedir(), 'AppData', 'Local');
const desktopUserData = join(userDataDir, 'MediaManagerDesktopDev');
const library = resolveDesktopLibraryPaths(desktopUserData);
await applyProductionDatabaseMigrations({
	...process.env,
	DATABASE_URL: library.databaseUrl,
});
const localSessionEnvironment = createLocalSessionEnvironment({
	...process.env,
	CORS_ORIGIN: 'http://127.0.0.1:5173',
	DATABASE_URL: library.databaseUrl,
	MEDIA_MANAGER_DESKTOP_MODE: 'development',
	MEDIA_MANAGER_FILE_MUTATION_RECOVERY_JOURNAL: library.recoveryJournal,
	MEDIA_MANAGER_LOG_DIR: library.logsDir,
	UPLOADS_DIR: library.uploadsDir,
});

function cleanup() {
	for (const proc of processes) {
		if (proc && !proc.killed) proc.kill('SIGTERM');
	}
}

process.on('SIGINT', () => {
	cleanup();
	process.exit(0);
});
process.on('SIGTERM', () => {
	cleanup();
	process.exit(0);
});

console.log(`desktop:dev window origin http://127.0.0.1:5173`);
console.log(`desktop:dev database ${pathToFileURL(library.libraryPath).href}`);

const childEnv = {
	...localSessionEnvironment,
	MEDIA_MANAGER_TRUSTED_SUPERVISOR: '1',
	MEDIA_MANAGER_SESSION_TOKEN: localSessionEnvironment.MEDIA_MANAGER_SESSION_TOKEN,
};

const serverProcess = spawn(process.execPath, ['run', 'dev:server:hot'], {
	cwd: process.cwd(),
	env: childEnv,
	stdio: 'inherit',
});
processes.push(serverProcess);

const viteProcess = spawn(process.execPath, ['run', 'dev:vite'], {
	cwd: process.cwd(),
	env: childEnv,
	stdio: 'inherit',
});
processes.push(viteProcess);

const buildShell = spawnSync(process.execPath, ['scripts/build-electron-shell.js'], {
	cwd: process.cwd(),
	stdio: 'inherit',
});
if (buildShell.status !== 0) process.exit(buildShell.status ?? 1);

const electronBin = process.env.ELECTRON_BINARY || 'bunx';
const electronArgs = electronBin === 'bunx' ? ['electron', 'electron/dist/main.cjs'] : ['electron/dist/main.cjs'];
const electronProcess = spawn(electronBin, electronArgs, {
	cwd: process.cwd(),
	env: {
		...localSessionEnvironment,
		ELECTRON_RENDERER_URL: 'http://127.0.0.1:5173',
		MEDIA_MANAGER_BUN: process.execPath,
		MEDIA_MANAGER_DESKTOP_MODE: 'development',
	},
	shell: true,
	stdio: 'inherit',
});
processes.push(electronProcess);
electronProcess.on('exit', (code) => {
	cleanup();
	process.exit(code ?? 0);
});
