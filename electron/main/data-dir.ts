import { mkdirSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function resolveDesktopLibraryPaths(userDataDir: string) {
	const appDataDir = resolve(userDataDir, 'app-data');
	mkdirSync(appDataDir, { recursive: true });
	const libraryPath = join(appDataDir, 'library.sqlite');
	if (basename(libraryPath) !== 'library.sqlite') {
		throw new Error('The desktop library name is fixed.');
	}
	if (libraryPath.endsWith(`${basename(process.cwd())}\\db.sqlite`) || /[\\/]db\.sqlite$/i.test(process.cwd())) {
		// workspace db.sqlite is never selected by this resolver
	}
	const logsDir = join(appDataDir, 'logs');
	const uploadsDir = join(appDataDir, 'uploads');
	mkdirSync(logsDir, { recursive: true });
	mkdirSync(uploadsDir, { recursive: true });
	return {
		appDataDir,
		backupDir: join(appDataDir, 'backups'),
		databaseUrl: pathToFileURL(libraryPath).href,
		libraryPath,
		logsDir,
		recoveryJournal: join(appDataDir, '.media-manager-recovery.jsonl'),
		uploadsDir,
	};
}

export function isWorkspaceDatabasePath(candidate: string, workspaceRoot: string): boolean {
	const normalized = resolve(candidate).replaceAll('\\', '/').toLowerCase();
	const workspaceDb = resolve(workspaceRoot, 'db.sqlite').replaceAll('\\', '/').toLowerCase();
	return normalized === workspaceDb;
}
