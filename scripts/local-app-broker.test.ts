import { expect, it } from 'bun:test';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { createServer as createNodeServer, type Server } from 'node:http';
import { createConnection, type AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import express from 'express';
import {
	createLocalAppBrokerHandler,
	isServerSentEventRequest,
	type LocalAppBrokerServer,
	type LocalAppUpstreamAbortState,
	startLocalAppBroker,
} from '../src/runtime/local-app-broker';
import { createProductionRuntimeConfig } from '../src/runtime/production-runtime-config';
import { createRuntimeHealthController } from '../src/runtime/runtime-health';
import { MAX_REQUEST_BODY_BYTES } from '../src/runtime/http-limits';
import {
	createLocalApiSessionMiddleware,
	generateLocalSessionToken,
	LOCAL_REQUEST_MARKER_HEADER,
} from '../src/server/middleware/local-api-session';

async function listen(server: Server, port = 0): Promise<number> {
	await new Promise<void>((done, reject) => {
		server.once('error', reject);
		server.listen(port, '127.0.0.1', () => done());
	});
	return (server.address() as AddressInfo).port;
}

async function close(server: Server | undefined): Promise<void> {
	if (!server?.listening) return;
	server.closeAllConnections();
	await new Promise<void>((done) => server.close(() => done()));
}

async function reservePort(): Promise<number> {
	const reservation = createNodeServer();
	const port = await listen(reservation);
	await close(reservation);
	return port;
}

it('sirve la SPA y media a través de un broker que conserva el bearer fuera del navegador', async () => {
	const clientRoot = await mkdtemp(resolve(tmpdir(), 'media-manager-production-broker-'));
	await mkdir(resolve(clientRoot, 'assets'));
	await writeFile(resolve(clientRoot, 'index.html'), '<main>production broker</main>', 'utf8');
	await writeFile(resolve(clientRoot, 'assets/app-12345678.js'), 'window.__BROKER_SMOKE__ = true;', 'utf8');
	await writeFile(resolve(clientRoot, 'assets/worker-12345678.mjs'), 'export default null;', 'utf8');
	const brokerPort = await reservePort();
	const browserOrigin = `http://127.0.0.1:${brokerPort}`;
	const token = generateLocalSessionToken();
	const runtimeHealth = createRuntimeHealthController(() => new Date('2026-07-15T00:00:00.000Z'));
	const backendApp = express();
	let observedAuthorization = '';
	let backendHealthStatus: 'degraded' | 'ready' = 'ready';
	let longSseClosed = false;
	let longSseStarted = false;
	let upstreamAbortState: LocalAppUpstreamAbortState | undefined;
	backendApp.use((req, _res, next) => {
		observedAuthorization = req.get('authorization') ?? '';
		next();
	});
	const backendServer = createNodeServer(backendApp);
	let brokerServer: LocalAppBrokerServer | undefined;

	try {
		const backendPort = await listen(backendServer);
		backendApp.get('/health', (_req, res) => {
			res.status(backendHealthStatus === 'ready' ? 200 : 503).json({ status: backendHealthStatus });
		});
		backendApp.use(
			['/api', '/uploads'],
			createLocalApiSessionMiddleware({
				allowedHosts: [`127.0.0.1:${backendPort}`],
				allowedOrigins: [browserOrigin],
				token,
			})
		);
		backendApp.use(express.json());
		backendApp.post('/api/probe', (req, res) =>
			res.json({ body: req.body, marker: req.get(LOCAL_REQUEST_MARKER_HEADER) })
		);
		backendApp.get('/api/events', (_req, res) => {
			res.setHeader('Content-Type', 'text/event-stream');
			res.end('data: {"ok":true}\n\n');
		});
		backendApp.get('/api/events/long', (req, res) => {
			longSseStarted = true;
			res.setHeader('Content-Type', 'text/event-stream');
			res.flushHeaders();
			res.write('data: {"started":true}\n\n');
			const cleanup = () => {
				longSseClosed = true;
				clearInterval(heartbeat);
			};
			const heartbeat = setInterval(() => {
				if (res.destroyed) {
					cleanup();
					return;
				}
				res.write(': heartbeat\n\n');
			}, 20);
			req.socket.on('close', cleanup);
			res.on('close', cleanup);
		});
		backendApp.get('/uploads/probe.jpg', (_req, res) => res.type('image/jpeg').send('image'));

		brokerServer = startLocalAppBroker({
			backendOrigin: `http://127.0.0.1:${backendPort}`,
			clientRoot,
			onUpstreamAbort: (state) => {
				upstreamAbortState = state;
			},
			publicPort: brokerPort,
			runtimeHealth: () => runtimeHealth.getSnapshot(),
			sessionToken: token,
		});
		const startingHealth = await fetch(`${browserOrigin}/health`);
		expect(startingHealth.status).toBe(503);
		expect(await startingHealth.json()).toEqual({
			changedAt: '2026-07-15T00:00:00.000Z',
			status: 'starting',
		});
		runtimeHealth.transition('ready');
		const readyHealth = await fetch(`${browserOrigin}/health`);
		expect(readyHealth.status).toBe(200);
		expect(await readyHealth.json()).toEqual({
			changedAt: '2026-07-15T00:00:00.000Z',
			status: 'ready',
		});
		backendHealthStatus = 'degraded';
		const degradedHealth = await fetch(`${browserOrigin}/health`);
		expect(degradedHealth.status).toBe(503);
		expect(await degradedHealth.json()).toMatchObject({ status: 'degraded' });
		backendHealthStatus = 'ready';
		const recoveredHealth = await fetch(`${browserOrigin}/health`);
		expect(recoveredHealth.status).toBe(200);
		expect(await recoveredHealth.json()).toMatchObject({ status: 'ready' });

		const directResponse = await fetch(`http://127.0.0.1:${backendPort}/api/probe`, {
			headers: { 'Content-Type': 'application/json', Host: `127.0.0.1:${backendPort}`, Origin: browserOrigin },
			method: 'POST',
			body: '{}',
		});
		expect(directResponse.status).toBe(403);

		const apiResponse = await fetch(`${browserOrigin}/api/probe`, {
			headers: { 'Content-Type': 'application/json', Origin: browserOrigin, 'Sec-Fetch-Site': 'same-origin' },
			method: 'POST',
			body: JSON.stringify({ ok: true }),
		});
		const apiBody = await apiResponse.json();
		expect(apiResponse.status).toBe(200);
		expect(apiBody).toEqual({ body: { ok: true }, marker: '1' });
		expect(observedAuthorization).toBe(`Bearer ${token}`);
		expect(JSON.stringify(apiBody)).not.toContain(token);
		const oversizedResponse = await fetch(`${browserOrigin}/api/probe`, {
			headers: { 'Content-Type': 'application/json', Origin: browserOrigin, 'Sec-Fetch-Site': 'same-origin' },
			method: 'POST',
			body: JSON.stringify({ payload: 'x'.repeat(MAX_REQUEST_BODY_BYTES) }),
		});
		expect(oversizedResponse.status).toBe(413);

		const [uploadResponse, eventsResponse, indexResponse, fallbackResponse, hostileResponse, missingContextResponse] =
			await Promise.all([
				fetch(`${browserOrigin}/uploads/probe.jpg`, { headers: { Origin: browserOrigin } }),
				fetch(`${browserOrigin}/api/events`, { headers: { Origin: browserOrigin } }),
				fetch(`${browserOrigin}/`),
				fetch(`${browserOrigin}/library/asset-1`, { headers: { Accept: 'text/html' } }),
				fetch(`${browserOrigin}/api/probe`, { headers: { Origin: 'https://attacker.test' } }),
				fetch(`${browserOrigin}/api/probe`),
			]);

		expect(uploadResponse.status).toBe(200);
		expect(await eventsResponse.text()).toContain('data:');
		expect(await indexResponse.text()).toContain('production broker');
		const clientCsp = indexResponse.headers.get('content-security-policy') ?? '';
		expect(clientCsp).toContain("default-src 'self'");
		expect(clientCsp).toContain("script-src 'self'");
		expect(clientCsp).toContain("worker-src 'self' blob:");
		expect(clientCsp).toContain("frame-ancestors 'none'");
		expect(clientCsp).toContain("object-src 'none'");
		expect(clientCsp).not.toContain("script-src 'self' 'unsafe-inline'");
		expect(indexResponse.headers.get('permissions-policy')).toContain('camera=()');
		expect(indexResponse.headers.get('cross-origin-resource-policy')).toBe('same-origin');
		expect(await fallbackResponse.text()).toContain('production broker');
		expect(fallbackResponse.headers.get('content-security-policy')).toBe(clientCsp);
		expect(hostileResponse.status).toBe(403);
		expect(missingContextResponse.status).toBe(403);
		await Promise.all([uploadResponse.arrayBuffer(), hostileResponse.text(), missingContextResponse.text()]);

		const workerResponse = await fetch(`${browserOrigin}/assets/worker-12345678.mjs`);
		expect(workerResponse.status).toBe(200);
		expect(workerResponse.headers.get('content-type')).toBe('text/javascript; charset=utf-8');
		expect(workerResponse.headers.get('content-security-policy')).toBeNull();
		expect(await workerResponse.text()).toBe('export default null;');

		longSseClosed = false;
		upstreamAbortState = undefined;
		await new Promise<void>((done, reject) => {
			const deadline = setTimeout(() => reject(new Error('SSE downstream did not receive the first event')), 5000);
			const socket = createConnection({ host: '127.0.0.1', port: brokerPort }, () => {
				socket.write(
					`GET /api/events/long HTTP/1.1\r\nHost: 127.0.0.1:${brokerPort}\r\nOrigin: ${browserOrigin}\r\nConnection: close\r\n\r\n`
				);
			});
			socket.once('error', (error) => {
				if ((error as NodeJS.ErrnoException).code !== 'ECONNRESET') {
					clearTimeout(deadline);
					reject(error);
				}
			});
			socket.once('data', () => {
				clearTimeout(deadline);
				socket.resetAndDestroy();
				done();
			});
		});
		expect(longSseStarted).toBe(true);
		const abortDeadline = Date.now() + 5000;
		while ((!upstreamAbortState || !longSseClosed) && Date.now() < abortDeadline) {
			await new Promise((done) => setTimeout(done, 25));
		}
		expect(upstreamAbortState).toEqual({
			requestDestroyed: true,
			requestSocketDestroyed: true,
			responseDestroyed: true,
			responseSocketDestroyed: true,
		});
		expect(longSseClosed).toBe(true);
	} finally {
		await brokerServer?.stop(true);
		await close(backendServer);
		await rm(clientRoot, { force: true, recursive: true });
	}
});

it('fuerza target, Host y origins coherentes para el runtime de producción', () => {
	const config = createProductionRuntimeConfig({
		MEDIA_MANAGER_APP_PORT: '4000',
		MEDIA_MANAGER_INTERNAL_API_PORT: '4001',
		MEDIA_MANAGER_SESSION_ALLOWED_HOSTS: '127.0.0.1:4000',
	});

	expect(config.runtimeEnvironment.MEDIA_MANAGER_API_TARGET).toBe('http://127.0.0.1:4001');
	expect(config.runtimeEnvironment.MEDIA_MANAGER_SESSION_ALLOWED_HOSTS).toBe('127.0.0.1:4001');
	expect(config.runtimeEnvironment.MEDIA_MANAGER_SESSION_ALLOWED_ORIGINS).toBe(
		'http://127.0.0.1:4000,http://localhost:4000'
	);
});

it('rechaza targets no loopback y secretos débiles', () => {
	expect(() =>
		createLocalAppBrokerHandler({
			backendOrigin: 'https://example.com',
			clientRoot: '.',
			publicPort: 4000,
			sessionToken: 'a'.repeat(32),
		})
	).toThrow('backend HTTP loopback');
	expect(() =>
		createLocalAppBrokerHandler({
			backendOrigin: 'http://127.0.0.1:4001',
			clientRoot: '.',
			publicPort: 4000,
			sessionToken: 'weak',
		})
	).toThrow('secreto de sesión local válido');
});

it('rechaza de forma inmediata un puerto público ocupado', async () => {
	const occupiedServer = createNodeServer();
	const occupiedPort = await listen(occupiedServer);

	try {
		expect(() =>
			startLocalAppBroker({
				backendOrigin: 'http://127.0.0.1:4001',
				clientRoot: '.',
				publicPort: occupiedPort,
				sessionToken: 'a'.repeat(32),
			})
		).toThrow();
	} finally {
		await close(occupiedServer);
	}
});

it('identifica únicamente solicitudes SSE para desactivar su timeout de inactividad', () => {
	expect(
		isServerSentEventRequest(new Request('http://127.0.0.1/api/events', { headers: { Accept: 'text/event-stream' } }))
	).toBe(true);
	expect(isServerSentEventRequest(new Request('http://127.0.0.1/api/events'))).toBe(false);
	expect(
		isServerSentEventRequest(
			new Request('http://127.0.0.1/api/events', { headers: { Accept: 'text/event-stream' }, method: 'POST' })
		)
	).toBe(false);
});
