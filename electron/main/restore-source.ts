import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { MIGRATION_MARKER } from './migration-marker';
import { readMigrationMarker } from './data-migrate-marker';

const SOURCE_NAMES = ['db.sqlite', 'library.sqlite', 'media-manager.sqlite'];

export function findTauriLibraryCandidates(env: NodeJS.ProcessEnv = process.env): string[] {
	const found: string[] = [];
	if (env.MEDIA_MANAGER_TAURI_SOURCE_DB && existsSync(env.MEDIA_MANAGER_TAURI_SOURCE_DB)) {
		found.push(env.MEDIA_MANAGER_TAURI_SOURCE_DB);
	}
	const roots: Array<string | undefined> = [
		env.MEDIA_MANAGER_TAURI_DATA_DIR,
		env.LOCALAPPDATA ? join(env.LOCALAPPDATA, 'com.imagemanager.app') : undefined,
		env.APPDATA ? join(env.APPDATA, 'com.imagemanager.app') : undefined,
		env.LOCALAPPDATA ? join(env.LOCALAPPDATA, 'Image Manager') : undefined,
		env.APPDATA ? join(env.APPDATA, 'Image Manager') : undefined,
	];
	for (const root of roots) {
		if (!root) continue;
		if (SOURCE_NAMES.some((name) => root.endsWith(name)) && existsSync(root)) {
			found.push(root);
			continue;
		}
		for (const name of SOURCE_NAMES) {
			const candidate = join(root, name);
			if (existsSync(candidate)) found.push(candidate);
		}
	}
	return [...new Set(found)];
}

export function evaluateRestoreOffer(input: {
	appDataDir: string;
	env?: NodeJS.ProcessEnv;
}): { available: boolean; sourceDb: string | null } {
	const marker = readMigrationMarker(input.appDataDir);
	if (marker?.status === 'completed' || marker?.status === 'no-source') {
		return { available: false, sourceDb: null };
	}
	const sourceDb = findTauriLibraryCandidates(input.env)[0] ?? null;
	return { available: Boolean(sourceDb), sourceDb };
}

export function writeSkipRestoreMarker(appDataDir: string): void {
	mkdirSync(appDataDir, { recursive: true });
	writeFileSync(join(appDataDir, MIGRATION_MARKER), `${JSON.stringify({ status: 'no-source', version: 1 }, null, 2)}\n`);
}
