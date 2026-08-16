import { once } from 'node:events';
import { stat } from 'node:fs/promises';
import { type ClientRequest, type IncomingMessage, request as createHttpRequest } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { Readable } from 'node:stream';
import { BROKER_IDLE_TIMEOUT_SECONDS, MAX_BROKER_REQUEST_BODY_BYTES, MAX_REQUEST_BODY_BYTES } from './http-limits';
import type { RuntimeHealthSnapshot } from './runtime-health';

const HOP_BY_HOP_HEADERS = new Set([
	'connection',
	'keep-alive',
	'proxy-authenticate',
	'proxy-authorization',
	'te',
	'trailer',
	'transfer-encoding',
	'upgrade',
]);

const CONTENT_TYPES: Record<string, string> = {
	'.css': 'text/css; charset=utf-8',
	'.html': 'text/html; charset=utf-8',
	'.ico': 'image/x-icon',
	'.jpeg': 'image/jpeg',
	'.jpg': 'image/jpeg',
	'.js': 'text/javascript; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.map': 'application/json; charset=utf-8',
	'.mjs': 'text/javascript; charset=utf-8',
	'.png': 'image/png',
	'.svg': 'image/svg+xml; charset=utf-8',
	'.webp': 'image/webp',
	'.woff': 'font/woff',
	'.woff2': 'font/woff2',
};

export const CLIENT_CONTENT_SECURITY_POLICY = [
	"default-src 'self'",
	"base-uri 'none'",
	"connect-src 'self' blob: data:",
	"font-src 'self' data:",
	"form-action 'self'",
	"frame-ancestors 'none'",
	"frame-src 'self' blob:",
	"img-src 'self' blob: data:",
	"media-src 'self' blob:",
	"object-src 'none'",
	"script-src 'self' 'wasm-unsafe-eval'",
	"style-src 'self' 'unsafe-inline'",
	"worker-src 'self' blob:",
].join('; ');

const CLIENT_PERMISSIONS_POLICY = 'camera=(), geolocation=(), microphone=(), payment=(), usb=()';

export interface LocalAppBrokerOptions {
	backendOrigin: string;
	clientRoot: string;
	onUpstreamAbort?: (state: LocalAppUpstreamAbortState) => void;
	publicPort: number;
	runtimeHealth?: () => RuntimeHealthSnapshot;
	sessionToken: string;
}

export interface LocalAppUpstreamAbortState {
	requestDestroyed: boolean;
	requestSocketDestroyed: boolean;
	responseDestroyed: boolean;
	responseSocketDestroyed: boolean;
}

export interface LocalAppBrokerServer {
	stop(closeActiveConnections?: boolean): Promise<void> | void;
}

interface BunRuntime {
	file(path: string): Blob;
	serve(options: {
		fetch: (request: Request, server: { timeout(request: Request, seconds: number): void }) => Promise<Response>;
		hostname: string;
		idleTimeout?: number;
		maxRequestBodySize?: number;
		port: number;
	}): LocalAppBrokerServer;
}

function getBunRuntime(): BunRuntime {
	const runtime = (globalThis as typeof globalThis & { Bun?: BunRuntime }).Bun;
	if (!runtime) throw new Error('The local broker requires Bun.');
	return runtime;
}

export function isServerSentEventRequest(request: Request): boolean {
	return (
		request.method === 'GET' && (request.headers.get('accept')?.toLowerCase().includes('text/event-stream') ?? false)
	);
}

function jsonResponse(status: number, code: string, message: string): Response {
	return Response.json(
		{ code, message, retryable: false },
		{
			headers: {
				'Cache-Control': 'no-store',
				'X-Content-Type-Options': 'nosniff',
			},
			status,
		}
	);
}

function hasAllowedHost(request: Request, publicPort: number): boolean {
	const host = request.headers.get('host')?.toLowerCase();
	return host === `127.0.0.1:${publicPort}` || host === `localhost:${publicPort}`;
}

function hasAllowedBrowserContext(request: Request): boolean {
	const host = request.headers.get('host')?.toLowerCase();
	const origin = request.headers.get('origin');
	const hasExactOrigin = origin === `http://${host}`;
	if (origin !== null && !hasExactOrigin) {
		return false;
	}
	const fetchSite = request.headers.get('sec-fetch-site');
	if (fetchSite !== null && fetchSite !== 'same-origin') {
		return false;
	}
	return hasExactOrigin || fetchSite === 'same-origin';
}

function hasExcessiveContentLength(request: Request): boolean {
	const rawLength = request.headers.get('content-length');
	if (rawLength === null) return false;
	const length = Number(rawLength);
	return Number.isSafeInteger(length) && length > MAX_REQUEST_BODY_BYTES;
}

function createProxyHeaders(request: Request, backend: URL, sessionToken: string): Headers {
	const headers = new Headers(request.headers);
	for (const name of HOP_BY_HOP_HEADERS) headers.delete(name);
	headers.delete('authorization');
	headers.delete('host');
	headers.delete('x-local-app-request');
	headers.set('authorization', `Bearer ${sessionToken}`);
	headers.set('host', backend.host);
	headers.set('x-local-app-request', '1');
	return headers;
}

async function proxyRequest(
	request: Request,
	backend: URL,
	sessionToken: string,
	onAbort?: (state: LocalAppUpstreamAbortState) => void
): Promise<Response> {
	let abortReported = false;
	let requestBodyReader: ReadableStreamDefaultReader<Uint8Array> | undefined;
	let upstreamRequest: ClientRequest | undefined;
	let upstreamResponse: IncomingMessage | undefined;
	const reportAbort = () => {
		if (abortReported) return;
		abortReported = true;
		onAbort?.({
			requestDestroyed: upstreamRequest?.destroyed ?? false,
			requestSocketDestroyed: upstreamRequest?.socket?.destroyed ?? false,
			responseDestroyed: upstreamResponse?.destroyed ?? false,
			responseSocketDestroyed: upstreamResponse?.socket.destroyed ?? false,
		});
	};
	const abortUpstream = (reason?: unknown) => {
		void requestBodyReader?.cancel(reason).catch(() => undefined);
		upstreamResponse?.socket.destroy();
		upstreamResponse?.destroy();
		upstreamRequest?.socket?.destroy();
		upstreamRequest?.destroy(reason instanceof Error ? reason : undefined);
		reportAbort();
	};
	const abortFromRequest = () => abortUpstream(request.signal.reason);
	request.signal.addEventListener('abort', abortFromRequest, { once: true });
	const upstreamUrl = new URL(`${new URL(request.url).pathname}${new URL(request.url).search}`, backend);

	try {
		const upstreamResponsePromise = new Promise<IncomingMessage>((resolveResponse, rejectResponse) => {
			const upstreamHeaders = createProxyHeaders(request, backend, sessionToken);
			upstreamHeaders.set('connection', 'close');
			upstreamRequest = createHttpRequest(
				upstreamUrl,
				{
					agent: false,
					headers: Object.fromEntries(upstreamHeaders),
					method: request.method,
				},
				resolveResponse
			);
			upstreamRequest.once('error', rejectResponse);
		});

		const activeRequest = upstreamRequest;
		if (!activeRequest) throw new Error('The request to the local backend could not be created.');
		void (async () => {
			try {
				if (!request.body || ['GET', 'HEAD'].includes(request.method)) {
					activeRequest.end();
					return;
				}
				requestBodyReader = request.body.getReader();
				while (true) {
					const { done, value } = await requestBodyReader.read();
					if (done) break;
					if (!activeRequest.write(value)) await once(activeRequest, 'drain');
				}
				activeRequest.end();
			} catch (error) {
				activeRequest.destroy(error instanceof Error ? error : new Error(String(error)));
			}
		})();

		upstreamResponse = await upstreamResponsePromise;
		const responseHeaders = new Headers();
		for (const [name, value] of Object.entries(upstreamResponse.headers)) {
			if (Array.isArray(value)) {
				for (const item of value) responseHeaders.append(name, item);
			} else if (value !== undefined) {
				responseHeaders.set(name, value);
			}
		}
		for (const name of HOP_BY_HOP_HEADERS) responseHeaders.delete(name);
		if (request.method === 'HEAD' || [204, 304].includes(upstreamResponse.statusCode ?? 0)) {
			request.signal.removeEventListener('abort', abortFromRequest);
			upstreamResponse.destroy();
			return new Response(null, {
				headers: responseHeaders,
				status: upstreamResponse.statusCode,
				statusText: upstreamResponse.statusMessage,
			});
		}

		const upstreamReader = Readable.toWeb(upstreamResponse).getReader();
		const downstreamBody = new ReadableStream<Uint8Array>({
			async cancel(reason) {
				request.signal.removeEventListener('abort', abortFromRequest);
				abortUpstream(reason);
				await upstreamReader.cancel(reason).catch(() => undefined);
			},
			async pull(controller) {
				try {
					const { done, value } = await upstreamReader.read();
					if (done) {
						request.signal.removeEventListener('abort', abortFromRequest);
						controller.close();
						return;
					}
					controller.enqueue(value as Uint8Array);
				} catch (error) {
					request.signal.removeEventListener('abort', abortFromRequest);
					controller.error(error);
				}
			},
		});
		return new Response(downstreamBody, {
			headers: responseHeaders,
			status: upstreamResponse.statusCode,
			statusText: upstreamResponse.statusMessage,
		});
	} catch {
		request.signal.removeEventListener('abort', abortFromRequest);
		if (request.signal.aborted) reportAbort();
		return jsonResponse(502, 'LOCAL_BACKEND_UNAVAILABLE', 'The local backend is unavailable.');
	}
}

function isContained(root: string, candidate: string): boolean {
	const normalizedRoot = root.endsWith(sep) ? root : `${root}${sep}`;
	return candidate === root || candidate.startsWith(normalizedRoot);
}

async function resolveClientFile(
	clientRoot: string,
	requestPath: string,
	acceptsHtml: boolean
): Promise<string | null> {
	let decodedPath: string;
	try {
		decodedPath = decodeURIComponent(requestPath);
	} catch {
		return null;
	}
	if (decodedPath.includes('\0') || decodedPath.startsWith('/server')) {
		return null;
	}

	const requested = decodedPath === '/' ? '/index.html' : decodedPath;
	const candidate = resolve(clientRoot, `.${requested}`);
	if (!isContained(clientRoot, candidate)) {
		return null;
	}
	try {
		if ((await stat(candidate)).isFile()) return candidate;
	} catch {
		// SPA fallback below.
	}
	return acceptsHtml ? resolve(clientRoot, 'index.html') : null;
}

async function serveClient(request: Request, clientRoot: string): Promise<Response> {
	if (!['GET', 'HEAD'].includes(request.method)) {
		return jsonResponse(405, 'METHOD_NOT_ALLOWED', 'Method not allowed.');
	}
	const requestUrl = new URL(request.url);
	const acceptsHtml = request.headers.get('accept')?.includes('text/html') ?? false;
	const filePath = await resolveClientFile(clientRoot, requestUrl.pathname, acceptsHtml);
	if (!filePath) return jsonResponse(404, 'CLIENT_ASSET_NOT_FOUND', 'Recurso no encontrado.');
	const fileStat = await stat(filePath);
	const immutable = /-[A-Za-z0-9_-]{8,}\.[^.]+$/.test(filePath);
	const contentType = CONTENT_TYPES[extname(filePath).toLowerCase()] ?? 'application/octet-stream';
	const headers = new Headers({
		'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
		'Content-Length': fileStat.size.toString(),
		'Content-Type': contentType,
		'Cross-Origin-Resource-Policy': 'same-origin',
		'Referrer-Policy': 'no-referrer',
		'X-Content-Type-Options': 'nosniff',
	});
	if (contentType === 'text/html; charset=utf-8') {
		headers.set('Content-Security-Policy', CLIENT_CONTENT_SECURITY_POLICY);
		headers.set('Cross-Origin-Opener-Policy', 'same-origin');
		headers.set('Permissions-Policy', CLIENT_PERMISSIONS_POLICY);
	}
	return new Response(request.method === 'HEAD' ? null : getBunRuntime().file(filePath), { headers });
}

export function createLocalAppBrokerHandler(options: LocalAppBrokerOptions): (request: Request) => Promise<Response> {
	const backend = new URL(options.backendOrigin);
	if (backend.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(backend.hostname)) {
		throw new Error('The broker can only target a loopback HTTP backend.');
	}
	if (!Number.isSafeInteger(options.publicPort) || options.publicPort < 1 || options.publicPort > 65_535) {
		throw new Error('The broker requires a valid public port.');
	}
	if (
		!options.sessionToken ||
		Buffer.byteLength(options.sessionToken, 'utf8') < 32 ||
		/\s/.test(options.sessionToken)
	) {
		throw new Error('The broker requires a valid local session secret.');
	}
	const clientRoot = resolve(options.clientRoot);
	let publishedHealth = options.runtimeHealth?.() ?? {
		changedAt: new Date().toISOString(),
		status: 'ready' as const,
	};

	const resolvePublicHealth = async (): Promise<RuntimeHealthSnapshot> => {
		const supervisorHealth = options.runtimeHealth?.() ?? publishedHealth;
		if (supervisorHealth.status !== 'ready') {
			publishedHealth = supervisorHealth;
			return { ...publishedHealth };
		}

		let backendReady = false;
		try {
			const response = await fetch(new URL('/health', backend), {
				headers: { Accept: 'application/json' },
				signal: AbortSignal.timeout(1_000),
			});
			const payload = (await response.json()) as { status?: unknown };
			backendReady = response.ok && payload.status === 'ready';
		} catch {
			backendReady = false;
		}

		const status: RuntimeHealthSnapshot['status'] = backendReady ? 'ready' : 'degraded';
		if (publishedHealth.status !== status) {
			publishedHealth = {
				changedAt:
					publishedHealth.status === 'starting' && status === 'ready'
						? supervisorHealth.changedAt
						: new Date().toISOString(),
				status,
			};
		}
		return { ...publishedHealth };
	};

	return async (request: Request): Promise<Response> => {
		if (!hasAllowedHost(request, options.publicPort)) {
			return jsonResponse(403, 'LOCAL_BROKER_HOST_FORBIDDEN', 'Host local no autorizado.');
		}
		const requestPath = new URL(request.url).pathname;
		if (requestPath === '/health') {
			if (!['GET', 'HEAD'].includes(request.method)) {
				return jsonResponse(405, 'METHOD_NOT_ALLOWED', 'Method not allowed.');
			}
			const snapshot = await resolvePublicHealth();
			return new Response(request.method === 'HEAD' ? null : JSON.stringify(snapshot), {
				headers: {
					'Cache-Control': 'no-store',
					'Content-Type': 'application/json; charset=utf-8',
					'X-Content-Type-Options': 'nosniff',
				},
				status: snapshot.status === 'ready' ? 200 : 503,
			});
		}
		if (requestPath === '/api' || requestPath.startsWith('/api/') || requestPath.startsWith('/uploads/')) {
			if (!hasAllowedBrowserContext(request)) {
				return jsonResponse(403, 'LOCAL_BROKER_ORIGIN_FORBIDDEN', 'Unauthorized local origin.');
			}
			if (hasExcessiveContentLength(request)) {
				return jsonResponse(413, 'PAYLOAD_TOO_LARGE', 'The request body exceeds the allowed limit.');
			}
			return proxyRequest(request, backend, options.sessionToken, options.onUpstreamAbort);
		}
		try {
			return await serveClient(request, clientRoot);
		} catch {
			return jsonResponse(500, 'CLIENT_ASSET_READ_FAILED', 'The client asset could not be read.');
		}
	};
}

export function startLocalAppBroker(options: LocalAppBrokerOptions): LocalAppBrokerServer {
	const handler = createLocalAppBrokerHandler(options);
	return getBunRuntime().serve({
		fetch: (request, server) => {
			if (isServerSentEventRequest(request)) server.timeout(request, 0);
			return handler(request);
		},
		hostname: '127.0.0.1',
		idleTimeout: BROKER_IDLE_TIMEOUT_SECONDS,
		maxRequestBodySize: MAX_BROKER_REQUEST_BODY_BYTES,
		port: options.publicPort,
	});
}
