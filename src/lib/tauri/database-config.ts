/**
 * Desktop database path is owned by the supervisor. The renderer never writes process.env.
 */
export async function getDatabasePath(): Promise<string> {
	return './db.sqlite';
}

export async function setupTauriEnvironment(): Promise<void> {
	return;
}

export async function checkBackendDependencies(): Promise<{
	hasDatabase: boolean;
	hasNodeRuntime: boolean;
	errors: string[];
}> {
	return { errors: [], hasDatabase: true, hasNodeRuntime: true };
}
