import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writeDesktopLog } from './desktop-log';

const nodeRequire = createRequire(import.meta.url);
const electron = nodeRequire('electron') as typeof import('electron');
const { app, BrowserWindow, ipcMain, shell } = electron;

writeDesktopLog(tmpdir(), 'desktop main module loaded');

function resolveUserDataFromArgv(argv: string[]): string | null {
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg.startsWith('--user-data-dir=')) return arg.slice('--user-data-dir='.length).replaceAll('"', '');
		if (arg === '--user-data-dir' && argv[index + 1]) return argv[index + 1].replaceAll('"', '');
	}
	return null;
}

const requestedUserData = resolveUserDataFromArgv(process.argv);
try {
	if (requestedUserData) {
		app.setPath('userData', requestedUserData);
	}
	writeDesktopLog(tmpdir(), `boot packaged=${app.isPackaged} userData=${app.getPath('userData')} argv=${process.argv.join(' ')}`);
} catch (error) {
	writeDesktopLog(tmpdir(), `boot path error ${error instanceof Error ? error.message : String(error)}`);
}
import { DESKTOP_CHANNELS, DEV_WINDOW_ORIGIN, resolveAllowedWindowOrigin } from '../shared/ipc-contract';
import { resolveDesktopLibraryPaths } from './data-dir';
import { evaluateRestoreOffer, writeSkipRestoreMarker } from './restore-source';
import {
	extraResourcesAreComplete,
	resolveDesktopRuntimeMode,
	resolveExtraResourcesRoot,
	resolvePackagedBackendEntry,
	resolvePackagedClientRoot,
	resolvePackagedMigrateScript,
	resolvePackagedMigrationsDir,
	resolvePackagedSchemaContract,
	resolvePackagedStartScript,
	resolveSupervisorBunExecutable,
} from './runtime-mode';
import { runLibraryMigrate } from './run-migrate';
import { developmentOrigin, isTrustedSender, SECURE_WEB_PREFERENCES } from './security';
import { BunSupervisor } from './supervisor';

const runtimeMode = resolveDesktopRuntimeMode({
	desktopMode: process.env.MEDIA_MANAGER_DESKTOP_MODE,
	isPackaged: app.isPackaged,
});
const isDevelopment = runtimeMode === 'development';
const publicPort = Number.parseInt(process.env.MEDIA_MANAGER_APP_PORT || '4000', 10);
const expectedOrigin = resolveAllowedWindowOrigin(runtimeMode, publicPort);
const workspaceRoot = app.isPackaged ? process.resourcesPath : process.cwd();
const extraResourcesRoot = resolveExtraResourcesRoot({
	isPackaged: app.isPackaged,
	resourcesPath: process.resourcesPath,
	workspaceRoot: process.cwd(),
});

let supervisor: BunSupervisor | undefined;
let mainWindow: BrowserWindow | undefined;
let quitting = false;

function createWindow() {
	mainWindow = new BrowserWindow({
		height: 800,
		minHeight: 600,
		minWidth: 800,
		title: 'Media Manager',
		webPreferences: {
			...SECURE_WEB_PREFERENCES,
			preload: join(__dirname, process.env.ELECTRON_PRELOAD || 'preload.cjs'),
		},
		width: 1200,
	});
	const url = isDevelopment ? developmentOrigin() : expectedOrigin;
	writeDesktopLog(app.getPath('userData'), `desktop window origin ${url}`);
	void mainWindow.loadURL(url);
	mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
		if (new URL(navigationUrl).origin !== new URL(url).origin) event.preventDefault();
	});
	mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
}

function senderIsTrusted(event: Electron.IpcMainInvokeEvent): boolean {
	return isTrustedSender(event.senderFrame?.url, expectedOrigin);
}

function resolveMigrateScript(): string {
	if (app.isPackaged) return resolvePackagedMigrateScript(extraResourcesRoot);
	const workspaceScript = join(process.cwd(), 'electron', 'main', 'data-migrate.ts');
	if (existsSync(workspaceScript)) return workspaceScript;
	return resolvePackagedMigrateScript(extraResourcesRoot);
}

async function startSupervisor(userData: string): Promise<void> {
	if (isDevelopment || supervisor) return;
	const resources = extraResourcesAreComplete(extraResourcesRoot);
	const bunExecutable = resolveSupervisorBunExecutable({
		extraResourcesRoot,
		isPackaged: app.isPackaged,
	});
	writeDesktopLog(
		userData,
		`desktop extraResources bun=${resources.bun} start=${resources.start} client=${resources.client} server=${resources.server} migrations=${resources.migrations} schemaContract=${resources.schemaContract} bunExecutable=${bunExecutable}`
	);
	if (
		!(resources.bun || existsSync(bunExecutable)) ||
		!resources.start ||
		!resources.client ||
		!resources.server ||
		!resources.migrations ||
		!resources.schemaContract
	) {
		writeDesktopLog(userData, `desktop extraResources are incomplete ${JSON.stringify(resources)}`);
		return;
	}
	supervisor = new BunSupervisor({
		bunExecutable,
		extraEnv: {
			MEDIA_MANAGER_BACKEND_ENTRY: resolvePackagedBackendEntry(extraResourcesRoot),
			MEDIA_MANAGER_CLIENT_ROOT: resolvePackagedClientRoot(extraResourcesRoot),
			MEDIA_MANAGER_MIGRATIONS_DIR: resolvePackagedMigrationsDir(extraResourcesRoot),
			MEDIA_MANAGER_SCHEMA_CONTRACT: resolvePackagedSchemaContract(extraResourcesRoot),
		},
		onLog: (message) => writeDesktopLog(userData, message),
		startScript: resolvePackagedStartScript(extraResourcesRoot),
		userDataDir: userData,
		workspaceRoot: extraResourcesRoot,
	});
	await supervisor.start();
}

app.on('second-instance', () => {
	if (mainWindow) {
		if (mainWindow.isMinimized()) mainWindow.restore();
		mainWindow.focus();
	}
});

const gotLock = app.requestSingleInstanceLock();
writeDesktopLog(tmpdir(), `desktop single-instance lock=${gotLock}`);
if (!gotLock) {
	app.quit();
} else {
	void app.whenReady().then(async () => {
		const userData = app.getPath('userData');
		const paths = resolveDesktopLibraryPaths(userData);
		const offer = evaluateRestoreOffer({ appDataDir: paths.appDataDir });
		writeDesktopLog(userData, `desktop runtimeMode=${runtimeMode} packaged=${app.isPackaged} origin=${expectedOrigin} restore=${offer.available}`);
		if (!isDevelopment) {
			await startSupervisor(userData);
			writeDesktopLog(userData, `desktop supervisor status ${supervisor?.getStatus() ?? 'stopped'}`);
		}
		ipcMain.handle(DESKTOP_CHANNELS.getRuntimeInfo, (event) => {
			if (!senderIsTrusted(event)) return null;
			return {
				appVersion: app.getVersion(),
				dataDirLabel: 'app-data',
				isDesktop: true as const,
			};
		});
		ipcMain.handle(DESKTOP_CHANNELS.getBackendStatus, (event) => {
			if (!senderIsTrusted(event)) return 'stopped';
			return supervisor?.getStatus() ?? (isDevelopment ? 'ready' : 'stopped');
		});
		ipcMain.handle(DESKTOP_CHANNELS.retryBackend, async (event) => {
			if (!senderIsTrusted(event)) return 'stopped';
			if (supervisor) return supervisor.retry();
			if (!isDevelopment) {
				await startSupervisor(app.getPath('userData'));
				return supervisor?.getStatus() ?? 'stopped';
			}
			return 'ready';
		});
		ipcMain.handle(DESKTOP_CHANNELS.openLogFolder, async (event) => {
			if (!senderIsTrusted(event)) return;
			await shell.openPath(paths.logsDir);
		});
		ipcMain.handle(DESKTOP_CHANNELS.getRestoreOffer, (event) => {
			if (!senderIsTrusted(event)) return { available: false, sourceLabel: '' };
			const current = evaluateRestoreOffer({ appDataDir: paths.appDataDir });
			return {
				available: current.available,
				sourceLabel: current.available ? 'previous desktop library' : '',
			};
		});
		ipcMain.handle(DESKTOP_CHANNELS.confirmRestore, async (event) => {
			if (!senderIsTrusted(event)) return { status: 'failed', error: 'untrusted sender' };
			const current = evaluateRestoreOffer({ appDataDir: paths.appDataDir });
			if (supervisor) {
				await supervisor.stop();
				supervisor = undefined;
			}
			const result = runLibraryMigrate({
				bunExecutable: resolveSupervisorBunExecutable({
					extraResourcesRoot,
					isPackaged: app.isPackaged,
				}),
				script: resolveMigrateScript(),
				sourceDb: current.sourceDb,
				targetDir: paths.appDataDir,
			});
			if (!isDevelopment) await startSupervisor(userData);
			return result;
		});
		ipcMain.handle(DESKTOP_CHANNELS.skipRestore, async (event) => {
			if (!senderIsTrusted(event)) return { status: 'failed', error: 'untrusted sender' };
			writeSkipRestoreMarker(paths.appDataDir);
			if (!isDevelopment) await startSupervisor(userData);
			return { status: 'no-source' };
		});
		createWindow();
	});

	app.on('window-all-closed', () => {
		if (process.platform !== 'darwin') app.quit();
	});
	app.on('before-quit', (event) => {
		if (quitting || !supervisor) return;
		event.preventDefault();
		quitting = true;
		void supervisor.stop().finally(() => {
			app.quit();
		});
	});
}

export const desktopMainContract = {
	DEV_WINDOW_ORIGIN,
	expectedOrigin,
	runtimeMode,
	secureWebPreferences: SECURE_WEB_PREFERENCES,
	workspaceRoot,
};
