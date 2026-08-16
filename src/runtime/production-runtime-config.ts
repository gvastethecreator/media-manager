import { createLocalSessionEnvironment } from '../../scripts/local-session-environment.js';

export interface ProductionRuntimeConfig {
	backendPort: number;
	publicHost: '127.0.0.1';
	publicPort: number;
	runtimeEnvironment: Record<string, string | undefined> & {
		MEDIA_MANAGER_API_TARGET: string;
		MEDIA_MANAGER_SESSION_TOKEN: string;
	};
}

function parsePort(value: string | undefined, name: string, fallback: number): number {
	const port = Number.parseInt(value || fallback.toString(), 10);
	if (!(Number.isSafeInteger(port) && port > 0 && port <= 65_535)) {
		throw new Error(`${name} is invalid.`);
	}
	return port;
}

export function createProductionRuntimeConfig(
	environment: Record<string, string | undefined> = process.env
): ProductionRuntimeConfig {
	const publicHost = '127.0.0.1' as const;
	const publicPort = parsePort(environment.MEDIA_MANAGER_APP_PORT, 'MEDIA_MANAGER_APP_PORT', 4000);
	const backendPort = parsePort(environment.MEDIA_MANAGER_INTERNAL_API_PORT, 'MEDIA_MANAGER_INTERNAL_API_PORT', 4001);
	if (backendPort === publicPort) {
		throw new Error('The internal backend port cannot match the public port.');
	}
	const publicOrigins = `http://127.0.0.1:${publicPort},http://localhost:${publicPort}`;
	const runtimeEnvironment = createLocalSessionEnvironment({
		...environment,
		API_HOST: '127.0.0.1',
		API_PORT: backendPort.toString(),
		MEDIA_MANAGER_SESSION_ALLOWED_HOSTS: `127.0.0.1:${backendPort}`,
		MEDIA_MANAGER_SESSION_ALLOWED_ORIGINS: publicOrigins,
		NODE_ENV: 'production',
	});

	return { backendPort, publicHost, publicPort, runtimeEnvironment };
}
