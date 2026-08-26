import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { MIGRATION_MARKER } from './migration-marker';

export function readMigrationMarker(targetDir: string): { status?: string } | null {
	const markerPath = join(targetDir, MIGRATION_MARKER);
	if (!existsSync(markerPath)) return null;
	return JSON.parse(readFileSync(markerPath, 'utf8')) as { status?: string };
}
