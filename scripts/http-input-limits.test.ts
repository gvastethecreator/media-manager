import { expect, it } from 'bun:test';
import { createServer, type Server } from 'node:http';
import { type AddressInfo, createConnection } from 'node:net';
import express from 'express';
import request from 'supertest';
import {
	API_HTTP_SERVER_OPTIONS,
	API_JSON_BODY_LIMIT,
	MAX_REQUEST_BODY_BYTES,
	MAX_REQUEST_HEADER_BYTES,
} from '../src/runtime/http-limits';
import { publicErrorHandler } from '../src/server/middleware/public-error-handler';
import { limitRequestBody } from '../src/server/middleware/request-body-limit';

async function listen(server: Server): Promise<number> {
	await new Promise<void>((done, reject) => {
		server.once('error', reject);
		server.listen(0, '127.0.0.1', () => done());
	});
	return (server.address() as AddressInfo).port;
}

async function close(server: Server): Promise<void> {
	if (!server.listening) return;
	server.closeAllConnections();
	await new Promise<void>((done) => server.close(() => done()));
}

async function rawRequest(port: number, payload: string): Promise<string> {
	return new Promise((done, reject) => {
		let response = '';
		const socket = createConnection({ host: '127.0.0.1', port });
		socket.setEncoding('utf8');
		socket.once('error', reject);
		socket.on('data', (chunk) => {
			response += chunk;
		});
		socket.once('end', () => done(response));
		socket.once('connect', () => socket.write(payload));
	});
}

it('rechaza cuerpos JSON superiores al límite con una respuesta pública y trazable', async () => {
	const app = express();
	app.use((_request, response, next) => {
		response.locals.requestId = 'request-limit-test';
		next();
	});
	app.use(express.json({ limit: API_JSON_BODY_LIMIT }));
	app.post('/api/probe', (_request, response) => response.status(204).end());
	app.use(publicErrorHandler);

	const response = await request(app)
		.post('/api/probe')
		.set('Content-Type', 'application/json')
		.send({ content: 'x'.repeat(MAX_REQUEST_BODY_BYTES) });

	expect(response.status).toBe(413);
	expect(response.body).toEqual({
		code: 'PAYLOAD_TOO_LARGE',
		message: 'El cuerpo de la solicitud supera el límite permitido.',
		requestId: 'request-limit-test',
		retryable: false,
	});
});

it('no filtra detalles internos al cliente', async () => {
	const app = express();
	app.use((_request, response, next) => {
		response.locals.requestId = 'request-internal-error-test';
		next();
	});
	app.get('/api/fail', (_request, _response, next) => next(new Error('C:\\biblioteca-privada\\fallo.db')));
	app.use(publicErrorHandler);

	const response = await request(app).get('/api/fail');

	expect(response.status).toBe(500);
	expect(response.body).toEqual({
		code: 'INTERNAL_SERVER_ERROR',
		message: 'Ocurrió un error interno.',
		requestId: 'request-internal-error-test',
		retryable: false,
	});
	expect(JSON.stringify(response.body)).not.toContain('biblioteca-privada');
});

it('rechaza cuerpos chunked de tipos no soportados antes de alcanzar rutas', async () => {
	const app = express();
	const testBodyLimit = 32;
	let reachedRoute = false;
	app.use(limitRequestBody(testBodyLimit));
	app.post('/api/opaque', (_request, response) => {
		reachedRoute = true;
		response.status(204).end();
	});
	app.use(publicErrorHandler);
	const server = createServer(API_HTTP_SERVER_OPTIONS, app);
	try {
		const port = await listen(server);
		const payload = 'x'.repeat(testBodyLimit + 1);
		const response = await rawRequest(
			port,
			`POST /api/opaque HTTP/1.1\r\nHost: 127.0.0.1:${port}\r\nConnection: close\r\nContent-Type: application/octet-stream\r\nTransfer-Encoding: chunked\r\n\r\n${payload.length.toString(16)}\r\n${payload}\r\n0\r\n\r\n`
		);
		expect(response).toContain(' 413 ');
		expect(reachedRoute).toBe(false);
	} finally {
		await close(server);
	}
});

it('no permite que un GET con cuerpo chunked evite el límite', async () => {
	const app = express();
	const testBodyLimit = 32;
	let reachedRoute = false;
	app.use(limitRequestBody(testBodyLimit));
	app.get('/health', (_request, response) => {
		reachedRoute = true;
		response.status(200).json({ status: 'ready' });
	});
	app.use(publicErrorHandler);
	const server = createServer(API_HTTP_SERVER_OPTIONS, app);
	try {
		const port = await listen(server);
		const payload = 'x'.repeat(testBodyLimit + 1);
		const response = await rawRequest(
			port,
			`GET /health HTTP/1.1\r\nHost: 127.0.0.1:${port}\r\nConnection: close\r\nTransfer-Encoding: chunked\r\n\r\n${payload.length.toString(16)}\r\n${payload}\r\n0\r\n\r\n`
		);
		expect(response).toContain(' 413 ');
		expect(reachedRoute).toBe(false);
	} finally {
		await close(server);
	}
});

it('aplica el límite real de cabeceras antes de entregar la solicitud a Express', async () => {
	const app = express();
	let reachedExpress = false;
	app.get('/health', (_request, response) => {
		reachedExpress = true;
		response.status(200).json({ status: 'ready' });
	});
	const server = createServer(API_HTTP_SERVER_OPTIONS, app);
	try {
		const port = await listen(server);
		const response = await rawRequest(
			port,
			`GET /health HTTP/1.1\r\nHost: 127.0.0.1:${port}\r\nConnection: close\r\nX-Overflow: ${'x'.repeat(MAX_REQUEST_HEADER_BYTES)}\r\n\r\n`
		);
		expect(response).toContain(' 431 ');
		expect(reachedExpress).toBe(false);
	} finally {
		await close(server);
	}
});
