import { randomBytes, timingSafeEqual } from 'node:crypto';
import type { RequestHandler, Response } from 'express';

export const LOCAL_SESSION_HEADER = 'authorization';
export const LOCAL_REQUEST_MARKER_HEADER = 'x-local-app-request';
export const LOCAL_REQUEST_MARKER_VALUE = '1';

const SESSION_TOKEN_ENV = 'MEDIA_MANAGER_SESSION_TOKEN';
const ALLOWED_HOSTS_ENV = 'MEDIA_MANAGER_SESSION_ALLOWED_HOSTS';
const ALLOWED_ORIGINS_ENV = 'MEDIA_MANAGER_SESSION_ALLOWED_ORIGINS';
const MINIMUM_TOKEN_BYTES = 32;

export interface LocalApiSessionOptions {
	allowedHosts: Iterable<string>;
	allowedOrigins: Iterable<string>;
	token: string;
}

export interface ResolvedLocalApiSessionOptions {
	allowedHosts: ReadonlySet<string>;
	allowedOrigins: ReadonlySet<string>;
	token: string;
}

type SecurityFailureCode =
	| 'LOCAL_HOST_FORBIDDEN'
	| 'LOCAL_ORIGIN_FORBIDDEN'
	| 'LOCAL_REQUEST_CONTEXT_FORBIDDEN'
	| 'LOCAL_REQUEST_MARKER_REQUIRED'
	| 'LOCAL_SESSION_REQUIRED';

function splitCsv(value: string | undefined): string[] {
	return (value ?? '')
		.split(',')
		.map((item) => item.trim())
		.filter(Boolean);
}

function normalizeHost(value: string): string {
	const trimmed = value.trim().toLowerCase();
	if (!trimmed || /[\s/@\\]/.test(trimmed)) {
		throw new Error(`Host local inválido: ${value}`);
	}
	const parsed = new URL(`http://${trimmed}`);
	if (parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search || parsed.hash) {
		throw new Error(`Host local inválido: ${value}`);
	}
	return parsed.host;
}

function normalizeOrigin(value: string): string {
	const trimmed = value.trim();
	if (!trimmed || trimmed === 'null') {
		throw new Error(`Origin local inválido: ${value}`);
	}
	const parsed = new URL(trimmed);
	if (
		!['http:', 'https:'].includes(parsed.protocol) ||
		parsed.username ||
		parsed.password ||
		parsed.pathname !== '/' ||
		parsed.search ||
		parsed.hash
	) {
		throw new Error(`Origin local inválido: ${value}`);
	}
	return parsed.origin;
}

function normalizeToken(value: string | undefined): string {
	const token = value ?? '';
	if (!token || Buffer.byteLength(token, 'utf8') < MINIMUM_TOKEN_BYTES || /\s/.test(token)) {
		throw new Error(
			`${SESSION_TOKEN_ENV} debe contener un secreto efímero de al menos ${MINIMUM_TOKEN_BYTES} bytes sin espacios.`
		);
	}
	return token;
}

function safeTokenEquals(expected: string, candidate: string | undefined): boolean {
	const expectedBuffer = Buffer.from(expected, 'utf8');
	const candidateSource = Buffer.from(candidate ?? '', 'utf8');
	const candidateBuffer = Buffer.alloc(expectedBuffer.length);
	candidateSource.copy(candidateBuffer, 0, 0, expectedBuffer.length);
	const contentsMatch = timingSafeEqual(expectedBuffer, candidateBuffer);
	return candidateSource.length === expectedBuffer.length && contentsMatch;
}

function extractBearerToken(authorization: string | undefined): string | undefined {
	if (!authorization?.startsWith('Bearer ')) {
		return undefined;
	}
	const token = authorization.slice('Bearer '.length);
	return token && !/\s/.test(token) ? token : undefined;
}

function reject(res: Response, status: 401 | 403, code: SecurityFailureCode): void {
	res.setHeader('Cache-Control', 'no-store');
	res.status(status).json({
		code,
		message: status === 401 ? 'Sesión local requerida.' : 'Contexto de solicitud local no autorizado.',
		retryable: false,
	});
}

export function generateLocalSessionToken(): string {
	return randomBytes(MINIMUM_TOKEN_BYTES).toString('base64url');
}

export function resolveLocalApiSessionOptions(
	environment: Record<string, string | undefined> = process.env
): ResolvedLocalApiSessionOptions {
	const apiHost = environment.API_HOST?.trim() || '127.0.0.1';
	const apiPort = environment.API_PORT?.trim() || environment.PORT?.trim() || '4000';
	const vitePort = environment.VITE_PORT?.trim() || '5173';
	const hasConfiguredHosts = Object.hasOwn(environment, ALLOWED_HOSTS_ENV);
	const hasConfiguredOrigins = Object.hasOwn(environment, ALLOWED_ORIGINS_ENV);
	const configuredHosts = splitCsv(environment[ALLOWED_HOSTS_ENV]);
	const configuredOrigins = splitCsv(environment[ALLOWED_ORIGINS_ENV]);
	if (
		(hasConfiguredHosts && configuredHosts.length === 0) ||
		(hasConfiguredOrigins && configuredOrigins.length === 0)
	) {
		throw new Error('Las allowlists explícitas de Host y Origin no pueden estar vacías.');
	}
	const allowedHosts = hasConfiguredHosts ? configuredHosts : [`${apiHost}:${apiPort}`];
	const allowedOrigins = hasConfiguredOrigins
		? configuredOrigins
		: [`http://127.0.0.1:${vitePort}`, `http://localhost:${vitePort}`, `http://${apiHost}:${apiPort}`];

	return {
		allowedHosts: new Set(allowedHosts.map(normalizeHost)),
		allowedOrigins: new Set(allowedOrigins.map(normalizeOrigin)),
		token: normalizeToken(environment[SESSION_TOKEN_ENV]),
	};
}

export function createLocalApiSessionMiddleware(options: LocalApiSessionOptions): RequestHandler {
	const expectedToken = normalizeToken(options.token);
	const allowedHosts = new Set([...options.allowedHosts].map(normalizeHost));
	const allowedOrigins = new Set([...options.allowedOrigins].map(normalizeOrigin));

	if (allowedHosts.size === 0 || allowedOrigins.size === 0) {
		throw new Error('La sesión local requiere allowlists no vacías de Host y Origin.');
	}

	return (req, res, next): void => {
		let requestHost: string;
		try {
			requestHost = normalizeHost(req.get('host') ?? '');
		} catch {
			reject(res, 403, 'LOCAL_HOST_FORBIDDEN');
			return;
		}
		if (!allowedHosts.has(requestHost)) {
			reject(res, 403, 'LOCAL_HOST_FORBIDDEN');
			return;
		}

		const origin = req.get('origin');
		if (origin !== undefined) {
			let normalizedOrigin: string;
			try {
				normalizedOrigin = normalizeOrigin(origin);
			} catch {
				reject(res, 403, 'LOCAL_ORIGIN_FORBIDDEN');
				return;
			}
			if (!allowedOrigins.has(normalizedOrigin)) {
				reject(res, 403, 'LOCAL_ORIGIN_FORBIDDEN');
				return;
			}
		}

		const fetchSite = req.get('sec-fetch-site');
		if (fetchSite !== undefined && fetchSite !== 'same-origin') {
			reject(res, 403, 'LOCAL_REQUEST_CONTEXT_FORBIDDEN');
			return;
		}
		if (req.get(LOCAL_REQUEST_MARKER_HEADER) !== LOCAL_REQUEST_MARKER_VALUE) {
			reject(res, 403, 'LOCAL_REQUEST_MARKER_REQUIRED');
			return;
		}

		const candidateToken = extractBearerToken(req.get(LOCAL_SESSION_HEADER));
		if (!safeTokenEquals(expectedToken, candidateToken)) {
			res.setHeader('WWW-Authenticate', 'Bearer realm="media-manager-local"');
			reject(res, 401, 'LOCAL_SESSION_REQUIRED');
			return;
		}

		next();
	};
}
