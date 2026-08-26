import { existsSync } from 'node:fs';
import { join } from 'node:path';

export type DesktopRuntimeMode = 'development' | 'production';

export function resolveDesktopRuntimeMode(input: {
	desktopMode?: string;
	isPackaged: boolean;
}): DesktopRuntimeMode {
	if (input.isPackaged) return 'production';
	if (input.desktopMode === 'production') return 'production';
	return 'development';
}

export function resolveExtraResourcesRoot(input: {
	isPackaged: boolean;
	resourcesPath: string;
	workspaceRoot: string;
}): string {
	if (input.isPackaged) return join(input.resourcesPath, 'extra-resources');
	return join(input.workspaceRoot, 'electron', 'extra-resources');
}

export function resolvePackagedBunExecutable(extraResourcesRoot: string): string {
	return process.platform === 'win32'
		? join(extraResourcesRoot, 'bun', 'bun.exe')
		: join(extraResourcesRoot, 'bun', 'bun');
}

export function resolvePackagedStartScript(extraResourcesRoot: string): string {
	return join(extraResourcesRoot, 'start', 'start-production.js');
}

export function resolvePackagedMigrateScript(extraResourcesRoot: string): string {
	return join(extraResourcesRoot, 'start', 'migrate-library.js');
}

export function resolvePackagedClientRoot(extraResourcesRoot: string): string {
	return join(extraResourcesRoot, 'client');
}

export function resolvePackagedBackendEntry(extraResourcesRoot: string): string {
	return join(extraResourcesRoot, 'server', 'index.js');
}

export function resolvePackagedMigrationsDir(extraResourcesRoot: string): string {
	return join(extraResourcesRoot, 'migrations');
}

export function resolvePackagedSchemaContract(extraResourcesRoot: string): string {
	return join(extraResourcesRoot, 'schema-contract.json');
}

export function resolveHostBunExecutable(env: NodeJS.ProcessEnv = process.env): string {
	if (env.MEDIA_MANAGER_BUN) return env.MEDIA_MANAGER_BUN;
	if (typeof process.versions.bun === 'string') return process.execPath;
	return process.platform === 'win32' ? 'bun.exe' : 'bun';
}

export function resolveSupervisorBunExecutable(input: {
	isPackaged: boolean;
	extraResourcesRoot: string;
	env?: NodeJS.ProcessEnv;
}): string {
	const packagedBun = resolvePackagedBunExecutable(input.extraResourcesRoot);
	if (existsSync(packagedBun)) return packagedBun;
	if (input.isPackaged) return packagedBun;
	return resolveHostBunExecutable(input.env);
}

export function extraResourcesAreComplete(extraResourcesRoot: string): { bun: boolean; start: boolean; client: boolean; server: boolean } {
	return {
		bun: existsSync(resolvePackagedBunExecutable(extraResourcesRoot)),
		client: existsSync(join(resolvePackagedClientRoot(extraResourcesRoot), 'index.html')),
		migrations: existsSync(resolvePackagedMigrationsDir(extraResourcesRoot)),
		schemaContract: existsSync(resolvePackagedSchemaContract(extraResourcesRoot)),
		server: existsSync(resolvePackagedBackendEntry(extraResourcesRoot)),
		start: existsSync(resolvePackagedStartScript(extraResourcesRoot)),
	};
}
