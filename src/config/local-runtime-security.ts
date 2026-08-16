export const DEFAULT_LOCAL_SERVICE_HOST = '127.0.0.1';

const LOOPBACK_HOSTS = new Set(['127.0.0.1', '::1', 'localhost']);

type LocalServiceHostOptions = {
	allowExternalBind?: boolean;
	host?: string;
	serviceName: string;
};

export function isLoopbackHost(host: string): boolean {
	return LOOPBACK_HOSTS.has(host.trim().toLowerCase());
}

export function resolveLocalServiceHost({
	allowExternalBind = false,
	host,
	serviceName,
}: LocalServiceHostOptions): string {
	const resolvedHost = host?.trim() || DEFAULT_LOCAL_SERVICE_HOST;
	if (!(isLoopbackHost(resolvedHost) || allowExternalBind)) {
		throw new Error(
			`${serviceName} bloqueó bind externo en ${resolvedHost}. ` +
				'Usa ALLOW_EXTERNAL_BIND=1 sólo en una red confiable y con controles adicionales.'
		);
	}
	return resolvedHost;
}

export function shouldEnableDevelopmentRoutes(environment: Record<string, string | undefined>): boolean {
	return environment.NODE_ENV === 'development' && environment.ENABLE_DEBUG_ROUTES === '1';
}
