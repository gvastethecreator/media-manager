import { randomBytes } from 'node:crypto';

const TOKEN_BYTES = 32;

/**
 * Creates one trusted local-session environment for a supervisor launch.
 * Existing token values are intentionally replaced so secrets cannot persist
 * through .env files or parent shells.
 */
export function createLocalSessionEnvironment(environment = process.env) {
	const apiHost = environment.API_HOST?.trim() || '127.0.0.1';
	const apiPort = environment.API_PORT?.trim() || environment.PORT?.trim() || '4000';
	const vitePort = environment.VITE_PORT?.trim() || '5173';
	const apiTarget = `http://${apiHost}:${apiPort}`;

	return {
		...environment,
		MEDIA_MANAGER_API_TARGET: apiTarget,
		MEDIA_MANAGER_TRUSTED_SUPERVISOR: '1',
		MEDIA_MANAGER_SESSION_ALLOWED_HOSTS: environment.MEDIA_MANAGER_SESSION_ALLOWED_HOSTS ?? `${apiHost}:${apiPort}`,
		MEDIA_MANAGER_SESSION_ALLOWED_ORIGINS:
			environment.MEDIA_MANAGER_SESSION_ALLOWED_ORIGINS ??
			`http://127.0.0.1:${vitePort},http://localhost:${vitePort},${apiTarget}`,
		MEDIA_MANAGER_SESSION_TOKEN: randomBytes(TOKEN_BYTES).toString('base64url'),
	};
}
