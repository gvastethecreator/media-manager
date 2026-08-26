import { join } from 'node:path';

export function resolveLogDirectory(environment: Record<string, string | undefined> = process.env, cwd = process.cwd()): string {
	const configured = environment.MEDIA_MANAGER_LOG_DIR?.trim();
	return configured ? configured : join(cwd, 'logs');
}

export function resolveReindexLogDirectory(
	environment: Record<string, string | undefined> = process.env,
	cwd = process.cwd()
): string {
	return join(resolveLogDirectory(environment, cwd), 'reindex');
}
