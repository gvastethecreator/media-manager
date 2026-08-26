import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { resolveDatabasePath } from './db/database-safety';
import { migrateDatabase } from './db/migrations';

export function resolveProductionMigrationsDirectory(
	environment: Record<string, string | undefined> = process.env,
	cwd = process.cwd()
): string {
	if (environment.MEDIA_MANAGER_MIGRATIONS_DIR) return resolve(environment.MEDIA_MANAGER_MIGRATIONS_DIR);
	const packaged = resolve(cwd, 'migrations');
	if (existsSync(packaged)) return packaged;
	return resolve(cwd, 'src/lib/drizzle/migrations');
}

export function resolveProductionSchemaContractPath(
	environment: Record<string, string | undefined> = process.env,
	cwd = process.cwd()
): string {
	if (environment.MEDIA_MANAGER_SCHEMA_CONTRACT) return resolve(environment.MEDIA_MANAGER_SCHEMA_CONTRACT);
	const packaged = resolve(cwd, 'schema-contract.json');
	if (existsSync(packaged)) return packaged;
	return resolve(cwd, 'src/lib/drizzle/schema-contract.json');
}

export async function applyProductionDatabaseMigrations(
	environment: Record<string, string | undefined> = process.env,
	cwd = process.cwd()
): Promise<{ applied: string[]; skipped: string[]; databasePath: string; migrationsDirectory: string }> {
	if (!environment.DATABASE_URL) {
		throw new Error('DATABASE_URL es obligatorio antes de aplicar migraciones de producción.');
	}
	const databasePath = resolveDatabasePath(environment.DATABASE_URL, cwd);
	const migrationsDirectory = resolveProductionMigrationsDirectory(environment, cwd);
	const schemaContractPath = resolveProductionSchemaContractPath(environment, cwd);
	if (!existsSync(migrationsDirectory)) {
		throw new Error(`No hay un directorio de migraciones en ${migrationsDirectory}.`);
	}
	const result = await migrateDatabase({
		databasePath,
		migrationsDirectory,
		schemaContractPath: existsSync(schemaContractPath) ? schemaContractPath : undefined,
	});
	return { ...result, databasePath, migrationsDirectory };
}
