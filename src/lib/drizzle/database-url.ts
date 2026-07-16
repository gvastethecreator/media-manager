import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function requireDatabaseUrl(environment: Record<string, string | undefined> = process.env): string {
	const databaseUrl = environment.DATABASE_URL?.trim();
	if (!databaseUrl) throw new Error('DATABASE_URL es obligatorio; no existe fallback a db.sqlite.');
	return databaseUrl;
}

export function resolveLocalDatabaseFilePath(databaseUrl: string, cwd = process.cwd()): string | null {
	if (!databaseUrl.startsWith('file:')) return null;
	try {
		return databaseUrl.startsWith('file://')
			? resolve(fileURLToPath(databaseUrl))
			: resolve(cwd, decodeURIComponent(databaseUrl.slice('file:'.length)));
	} catch {
		throw new Error('DATABASE_URL contiene una file URL inválida.');
	}
}
