import { describe, expect, it } from 'bun:test';
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import type { AddressInfo } from 'node:net';
import express from 'express';
import request from 'supertest';
import { createServer } from 'vite-plus';
import { createLocalSessionEnvironment } from './local-session-environment.js';
import {
	createLocalApiSessionMiddleware,
	generateLocalSessionToken,
	LOCAL_REQUEST_MARKER_HEADER,
	LOCAL_REQUEST_MARKER_VALUE,
	resolveLocalApiSessionOptions,
} from '../src/server/middleware/local-api-session';

const ALLOWED_HOST = '127.0.0.1:4000';
const ALLOWED_ORIGIN = 'http://127.0.0.1:5173';
const WORKSPACE_PATH = resolve(import.meta.dir, '..');

async function collectClientSourcePaths(directory: string): Promise<string[]> {
	const entries = await readdir(directory, { withFileTypes: true });
	const branches = await Promise.all(
		entries.map(async (entry): Promise<string[]> => {
			const path = resolve(directory, entry.name);
			if (entry.isDirectory()) {
				return entry.name === 'server' ? [] : collectClientSourcePaths(path);
			}
			return /\.(?:[cm]?[jt]sx?)$/.test(entry.name) ? [path] : [];
		})
	);
	return branches.flat();
}

function createProbeApp(token: string) {
	const app = express();
	app.get('/health', (_req, res) => res.json({ status: 'ok' }));
	app.use(
		'/api',
		createLocalApiSessionMiddleware({
			allowedHosts: [ALLOWED_HOST],
			allowedOrigins: [ALLOWED_ORIGIN],
			token,
		})
	);
	app.get('/api/probe', (_req, res) => res.json({ ok: true }));
	return app;
}

function authorized(requestBuilder: request.Test, token: string): request.Test {
	return requestBuilder
		.set('Host', ALLOWED_HOST)
		.set('Origin', ALLOWED_ORIGIN)
		.set('Sec-Fetch-Site', 'same-origin')
		.set(LOCAL_REQUEST_MARKER_HEADER, LOCAL_REQUEST_MARKER_VALUE)
		.set('Authorization', `Bearer ${token}`);
}

describe('local API session middleware', () => {
	it('genera secretos independientes de 256 bits', () => {
		const first = generateLocalSessionToken();
		const second = generateLocalSessionToken();

		expect(first).not.toBe(second);
		expect(Buffer.from(first, 'base64url')).toHaveLength(32);
		expect(Buffer.from(second, 'base64url')).toHaveLength(32);
	});

	it('rota el secreto por lanzamiento y rechaza el de la ejecución anterior', async () => {
		const staticParentToken = 'a'.repeat(32);
		const firstLaunch = createLocalSessionEnvironment({ MEDIA_MANAGER_SESSION_TOKEN: staticParentToken });
		const secondLaunch = createLocalSessionEnvironment({ MEDIA_MANAGER_SESSION_TOKEN: staticParentToken });
		const firstToken = firstLaunch.MEDIA_MANAGER_SESSION_TOKEN;
		const secondToken = secondLaunch.MEDIA_MANAGER_SESSION_TOKEN;

		expect(firstToken).not.toBe(staticParentToken);
		expect(secondToken).not.toBe(staticParentToken);
		expect(secondToken).not.toBe(firstToken);
		expect(firstLaunch.MEDIA_MANAGER_API_TARGET).toBe('http://127.0.0.1:4000');
		expect(Buffer.from(firstToken, 'base64url')).toHaveLength(32);
		expect(Buffer.from(secondToken, 'base64url')).toHaveLength(32);

		const restartedApp = createProbeApp(secondToken);
		const staleResponse = await authorized(request(restartedApp).get('/api/probe'), firstToken);
		const currentResponse = await authorized(request(restartedApp).get('/api/probe'), secondToken);

		expect(staleResponse.status).toBe(401);
		expect(currentResponse.status).toBe(200);
	});

	it('mantiene target, Host permitido y health alineados cuando cambia host o puerto', () => {
		const environment = createLocalSessionEnvironment({ API_HOST: 'localhost', API_PORT: '4317' });
		const resolved = resolveLocalApiSessionOptions(environment);

		expect(environment.MEDIA_MANAGER_API_TARGET).toBe('http://localhost:4317');
		expect(resolved.allowedHosts.has('localhost:4317')).toBe(true);
		expect(resolved.allowedHosts.has('127.0.0.1:4000')).toBe(false);
	});

	it('falla cerrado sin secreto de sesión', () => {
		expect(() => resolveLocalApiSessionOptions({ API_PORT: '4000' })).toThrow(
			'MEDIA_MANAGER_SESSION_TOKEN debe contener un secreto efímero'
		);
	});

	it('falla cerrado con allowlists explícitas vacías o secretos con espacios', () => {
		const token = generateLocalSessionToken();

		expect(() =>
			resolveLocalApiSessionOptions({
				MEDIA_MANAGER_SESSION_TOKEN: token,
				MEDIA_MANAGER_SESSION_ALLOWED_HOSTS: ' , ',
			})
		).toThrow('Las allowlists explícitas de Host y Origin no pueden estar vacías.');
		expect(() =>
			resolveLocalApiSessionOptions({
				MEDIA_MANAGER_SESSION_TOKEN: token,
				MEDIA_MANAGER_SESSION_ALLOWED_ORIGINS: ' ',
			})
		).toThrow('Las allowlists explícitas de Host y Origin no pueden estar vacías.');
		expect(() => resolveLocalApiSessionOptions({ MEDIA_MANAGER_SESSION_TOKEN: ` ${token}` })).toThrow(
			'MEDIA_MANAGER_SESSION_TOKEN debe contener un secreto efímero'
		);
	});

	it('mantiene health público cuando el montaje precede sólo a /api', async () => {
		const response = await request(createProbeApp(generateLocalSessionToken())).get('/health');

		expect(response.status).toBe(200);
		expect(response.body).toEqual({ status: 'ok' });
	});

	it('rechaza token ausente, incorrecto y de una ejecución anterior sin filtrarlo', async () => {
		const currentToken = generateLocalSessionToken();
		const staleToken = generateLocalSessionToken();
		const app = createProbeApp(currentToken);
		const missing = await request(app)
			.get('/api/probe')
			.set('Host', ALLOWED_HOST)
			.set('Origin', ALLOWED_ORIGIN)
			.set(LOCAL_REQUEST_MARKER_HEADER, LOCAL_REQUEST_MARKER_VALUE);
		const wrongToken = `${currentToken.slice(0, -1)}x`;
		const wrong = await authorized(request(app).get('/api/probe'), wrongToken);
		const stale = await authorized(request(app).get('/api/probe'), staleToken);
		const probes = [
			{ candidate: '', response: missing },
			{ candidate: wrongToken, response: wrong },
			{ candidate: staleToken, response: stale },
		];

		for (const { candidate, response } of probes) {
			expect(response.status).toBe(401);
			expect(response.body.code).toBe('LOCAL_SESSION_REQUIRED');
			const serializedResponse = JSON.stringify({ body: response.body, headers: response.headers });
			expect(serializedResponse).not.toContain(currentToken);
			if (candidate) {
				expect(serializedResponse).not.toContain(candidate);
			}
		}
	});

	it('acepta token y contexto broker exactos', async () => {
		const token = generateLocalSessionToken();
		const response = await authorized(request(createProbeApp(token)).get('/api/probe'), token);

		expect(response.status).toBe(200);
		expect(response.body).toEqual({ ok: true });
	});

	it('rechaza Host hostil incluso con token válido', async () => {
		const token = generateLocalSessionToken();
		const response = await authorized(request(createProbeApp(token)).get('/api/probe'), token).set(
			'Host',
			'attacker.test:4000'
		);

		expect(response.status).toBe(403);
		expect(response.body.code).toBe('LOCAL_HOST_FORBIDDEN');
	});

	it('rechaza Origin hostil y null', async () => {
		const token = generateLocalSessionToken();
		const app = createProbeApp(token);
		const hostile = await authorized(request(app).get('/api/probe'), token).set('Origin', 'https://attacker.test');
		const nullOrigin = await authorized(request(app).get('/api/probe'), token).set('Origin', 'null');

		expect(hostile.status).toBe(403);
		expect(hostile.body.code).toBe('LOCAL_ORIGIN_FORBIDDEN');
		expect(nullOrigin.status).toBe(403);
		expect(nullOrigin.body.code).toBe('LOCAL_ORIGIN_FORBIDDEN');
	});

	it('rechaza Fetch Metadata cross-site y marker ausente', async () => {
		const token = generateLocalSessionToken();
		const app = createProbeApp(token);
		const crossSite = await authorized(request(app).get('/api/probe'), token).set('Sec-Fetch-Site', 'cross-site');
		const missingMarker = await request(app)
			.get('/api/probe')
			.set('Host', ALLOWED_HOST)
			.set('Origin', ALLOWED_ORIGIN)
			.set('Sec-Fetch-Site', 'same-origin')
			.set('Authorization', `Bearer ${token}`);

		expect(crossSite.status).toBe(403);
		expect(crossSite.body.code).toBe('LOCAL_REQUEST_CONTEXT_FORBIDDEN');
		expect(missingMarker.status).toBe(403);
		expect(missingMarker.body.code).toBe('LOCAL_REQUEST_MARKER_REQUIRED');
	});

	it('monta el gate antes de parsers y rutas y mantiene el token fuera de React', async () => {
		const [server, vite, devFull, devServer, devVite, tauriDev, thumbnailEvents, imageLoader, publicErrorHandler] =
			await Promise.all([
				readFile(resolve(WORKSPACE_PATH, 'src/server/index.ts'), 'utf8'),
				readFile(resolve(WORKSPACE_PATH, 'vite.config.ts'), 'utf8'),
				readFile(resolve(WORKSPACE_PATH, 'scripts/dev-full.js'), 'utf8'),
				readFile(resolve(WORKSPACE_PATH, 'scripts/dev-server-hot.js'), 'utf8'),
				readFile(resolve(WORKSPACE_PATH, 'scripts/dev-vite-headers.js'), 'utf8'),
				readFile(resolve(WORKSPACE_PATH, 'scripts/tauri-dev.js'), 'utf8'),
				readFile(resolve(WORKSPACE_PATH, 'src/lib/hooks/ui/use-thumbnail-events.ts'), 'utf8'),
				readFile(resolve(WORKSPACE_PATH, 'src/lib/image/image-loader.ts'), 'utf8'),
				readFile(resolve(WORKSPACE_PATH, 'src/server/middleware/public-error-handler.ts'), 'utf8'),
			]);

		const healthIndex = server.search(/app\.get\(["']\/health["']/);
		const sessionGateIndex = server.search(/app\.use\(\[["']\/api["'],\s*["']\/uploads["']\]/);
		const parserIndex = server.indexOf('express.json');
		const routesIndex = server.indexOf('registerRoutes(app)');
		for (const index of [healthIndex, sessionGateIndex, parserIndex, routesIndex])
			expect(index).toBeGreaterThanOrEqual(0);
		expect(healthIndex).toBeLessThan(sessionGateIndex);
		expect(sessionGateIndex).toBeLessThan(parserIndex);
		expect(sessionGateIndex).toBeLessThan(routesIndex);
		expect(server).toMatch(/app\.use\(["']\/api["'],\s*sanitizeJsonResponses\)/);
		expect(server).toContain("import { publicErrorHandler } from './middleware/public-error-handler';");
		expect(server).toContain('publicErrorHandler(error, req, res, next)');
		expect(publicErrorHandler).toMatch(/code:\s*["']INTERNAL_SERVER_ERROR["']/);
		expect(vite).toContain("proxyRequest.setHeader('Authorization'");
		expect(vite).toContain("proxyRequest.setHeader('X-Local-App-Request', '1')");
		expect(vite).toContain('target: localApiTarget');
		expect(vite).toContain("'/uploads': localSessionProxy");
		expect(vite).not.toMatch(/define:\s*\{[^}]*MEDIA_MANAGER_SESSION_TOKEN/s);
		expect(devFull).toContain('createLocalSessionEnvironment()');
		expect(devServer).toContain('isolated standalone session (use dev:full for a connected UI)');
		expect(devVite).toContain('isolated standalone session (use dev:full for a connected backend)');
		expect(tauriDev).toContain('createLocalSessionEnvironment({');
		expect(thumbnailEvents).not.toContain('VITE_API_URL');
		expect(imageLoader).not.toContain('VITE_API_URL');
	});

	it('mantiene todo el frontend detrás de URLs API same-origin', async () => {
		const sourcePaths = await collectClientSourcePaths(resolve(WORKSPACE_PATH, 'src'));
		const violations: string[] = [];
		for (let offset = 0; offset < sourcePaths.length; offset += 64) {
			const paths = sourcePaths.slice(offset, offset + 64);
			const sources = await Promise.all(paths.map((path) => readFile(path, 'utf8')));
			for (const [index, source] of sources.entries()) {
				if (/VITE_API_URL|https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?\/api/.test(source)) {
					violations.push(paths[index].slice(WORKSPACE_PATH.length + 1));
				}
			}
		}
		expect(violations).toEqual([]);
	});

	it('injecta la sesión realmente a API, uploads y SSE a través del proxy Vite', async () => {
		const capturedRequests: Array<{ authorization: string | null; marker: string | null; path: string }> = [];
		const backend = Bun.serve({
			hostname: '127.0.0.1',
			port: 0,
			fetch(request) {
				const url = new URL(request.url);
				capturedRequests.push({
					authorization: request.headers.get('authorization'),
					marker: request.headers.get(LOCAL_REQUEST_MARKER_HEADER),
					path: url.pathname,
				});
				if (url.pathname.endsWith('/events')) {
					return new Response('data: {"ok":true}\n\n', { headers: { 'Content-Type': 'text/event-stream' } });
				}
				return Response.json({ ok: true, path: url.pathname });
			},
		});
		const temporaryRoot = await mkdtemp(resolve(tmpdir(), 'media-manager-vite-proxy-'));
		const token = generateLocalSessionToken();
		const previousEnvironment = {
			MEDIA_MANAGER_API_TARGET: process.env.MEDIA_MANAGER_API_TARGET,
			MEDIA_MANAGER_SESSION_TOKEN: process.env.MEDIA_MANAGER_SESSION_TOKEN,
		};
		process.env.MEDIA_MANAGER_API_TARGET = `http://127.0.0.1:${backend.port}`;
		process.env.MEDIA_MANAGER_SESSION_TOKEN = token;
		await writeFile(resolve(temporaryRoot, 'index.html'), '<main>proxy smoke</main>', 'utf8');

		let viteServer: Awaited<ReturnType<typeof createServer>> | undefined;
		try {
			const viteConfig = (await import(`../vite.config.ts?proxy-smoke=${Date.now()}`)).default;
			viteServer = await createServer({
				...viteConfig,
				cacheDir: resolve(temporaryRoot, '.vite-cache'),
				configFile: false,
				optimizeDeps: {
					...viteConfig.optimizeDeps,
					force: false,
					include: [],
					noDiscovery: true,
				},
				plugins: [],
				root: temporaryRoot,
				server: {
					...viteConfig.server,
					hmr: false,
					host: '127.0.0.1',
					port: 0,
				},
			});
			await viteServer.listen();
			const address = viteServer.httpServer?.address() as AddressInfo;
			const browserOrigin = `http://127.0.0.1:${address.port}`;

			const apiResponse = await fetch(`${browserOrigin}/api/probe`);
			const uploadResponse = await fetch(`${browserOrigin}/uploads/probe.jpg`);
			const eventsResponse = await fetch(`${browserOrigin}/api/probe/events`);

			expect(apiResponse.status).toBe(200);
			expect(uploadResponse.status).toBe(200);
			expect(await eventsResponse.text()).toContain('data:');
			expect(capturedRequests.map(({ path }) => path)).toEqual([
				'/api/probe',
				'/uploads/probe.jpg',
				'/api/probe/events',
			]);
			for (const captured of capturedRequests) {
				expect(captured.authorization).toBe(`Bearer ${token}`);
				expect(captured.marker).toBe(LOCAL_REQUEST_MARKER_VALUE);
			}
		} finally {
			await viteServer?.close();
			backend.stop(true);
			await rm(temporaryRoot, { force: true, recursive: true });
			for (const [key, value] of Object.entries(previousEnvironment)) {
				if (value === undefined) delete process.env[key];
				else process.env[key] = value;
			}
		}
	}, 120_000);
});
