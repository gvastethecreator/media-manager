import { describe, expect, it } from 'bun:test';
import { Effect } from 'effect';
import express from 'express';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import request from 'supertest';
import { effectHandler } from '../src/lib/effect/adapters/express.adapter';
import { ClientLogger } from '../src/lib/logger/client-logger';
import { ReindexFileLogger } from '../src/lib/logger/reindex-file-logger';
import { serverLogger } from '../src/lib/logger/server-logger';
import { reindexLogsRouter } from '../src/server/routes/api/reindex-logs';
import { sanitizePublicPayload } from '../src/server/security/sanitize-public-payload';

const WINDOWS_PATH = 'C:\\private\\media\\asset.jpg';
const WINDOWS_PATH_WITH_SPACES = 'C:\\Users\\cristian\\My Media\\secret.jpg';
const POSIX_PATH = '/home/private/media/asset.jpg';
const FILE_URL = 'file:///home/cristian/My%20Media/secret.jpg';
const UUID = '9a6cbd2f-c144-4f20-9c7b-5d51c9968518';
const SHA_256 = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

async function captureConsoleError(run: () => Promise<void> | void): Promise<string> {
	const original = console.error;
	const output: string[] = [];
	console.error = (...parts: unknown[]) => output.push(parts.map(String).join(' '));
	try {
		await run();
	} finally {
		console.error = original;
	}
	return output.join('\n');
}

async function captureConsoleInfo(run: () => Promise<void> | void): Promise<string> {
	const original = console.info;
	const output: string[] = [];
	console.info = (...parts: unknown[]) => output.push(parts.map((part) => JSON.stringify(part)).join(' '));
	try {
		await run();
	} finally {
		console.info = original;
	}
	return output.join('\n');
}

describe('central output redaction', () => {
	it('redacta paths en campos arbitrarios, arrays y errores', () => {
		const payload = sanitizePublicPayload({
			arbitrary: [WINDOWS_PATH, POSIX_PATH, new Error(`Falló ${WINDOWS_PATH}`)],
			location: POSIX_PATH,
			reference: { relativePath: 'safe/asset.jpg', rootId: 'root-1' },
			targetPath: WINDOWS_PATH,
		});
		const serialized = JSON.stringify(payload);
		expect(serialized).not.toContain(WINDOWS_PATH);
		expect(serialized).not.toContain(POSIX_PATH);
		expect(serialized).not.toContain('targetPath');
		expect(serialized).toContain('[redacted-path]');
		expect(payload).toMatchObject({ reference: { relativePath: 'safe/asset.jpg', rootId: 'root-1' } });
	});

	it('redacta rutas con espacios y file URLs sin dejar sufijos privados', () => {
		const serialized = JSON.stringify(
			sanitizePublicPayload({
				fileUrlMessage: `Falló ${FILE_URL}`,
				windowsMessage: `Falló ${WINDOWS_PATH_WITH_SPACES}`,
			})
		);
		expect(serialized).not.toContain('cristian');
		expect(serialized).not.toContain('My Media');
		expect(serialized).not.toContain('My%20Media');
		expect(serialized.match(/\[redacted-path\]/g)).toHaveLength(2);
	});

	it('sanea mensajes y contexto en el logger central', async () => {
		const output = await captureConsoleError(() => {
			serverLogger.withContext('RedactionProbe').error(`Falló ${WINDOWS_PATH}`, {
				location: POSIX_PATH,
				targetPath: WINDOWS_PATH,
			});
		});
		expect(output).not.toContain(WINDOWS_PATH);
		expect(output).not.toContain(POSIX_PATH);
		expect(output).toContain('[redacted-path]');
	});

	it('redacta secretos por nombre de campo en payloads y logs', async () => {
		const payload = sanitizePublicPayload({
			authorization: 'Bearer private-session',
			content: 'public authored content',
			nested: { api_key: 'private-api-key', safe: 'visible' },
		});
		expect(payload).toEqual({
			authorization: '[redacted]',
			content: 'public authored content',
			nested: { api_key: '[redacted]', safe: 'visible' },
		});

		const serverOutput = await captureConsoleError(() => {
			serverLogger.error('Secret probe', {
				content: 'private authored content',
				name: 'private file name.jpg',
				safe: 'visible',
				sessionToken: 'private-session',
			});
		});
		expect(serverOutput).not.toContain('private-session');
		expect(serverOutput).not.toContain('private authored content');
		expect(serverOutput).not.toContain('private file name.jpg');
		expect(serverOutput).toContain('[redacted]');
		expect(serverOutput).toContain('[redacted-content]');

		const clientOutput = await captureConsoleInfo(() => {
			new ClientLogger({ level: 'debug' }).info(`Falló ${WINDOWS_PATH}`, {
				metadata: { prompt: 'private prompt' },
				databaseUrl: `file:${WINDOWS_PATH}`,
				safe: 'visible',
				token: 'private-session',
			});
		});
		const directContextOutput = await captureConsoleInfo(() => {
			new ClientLogger({ level: 'debug' }).info('Direct context probe', 'private direct content');
		});
		expect(clientOutput).not.toContain(WINDOWS_PATH);
		expect(clientOutput).not.toContain('private-session');
		expect(clientOutput).not.toContain('private prompt');
		expect(clientOutput).toContain('[redacted-path]');
		expect(clientOutput).toContain('[redacted]');
		expect(clientOutput).toContain('[redacted-content]');
		expect(directContextOutput).not.toContain('private direct content');
		expect(directContextOutput).toContain('[redacted-content]');
	});

	it('redacta IDs y hashes de los mensajes y contextos de log', async () => {
		const output = await captureConsoleError(() => {
			serverLogger.error(`Falló el registro ${UUID} con hash ${SHA_256}`, {
				assetId: UUID,
				contentHash: SHA_256,
				promptId: 'prompt-derived-from-authored-title',
				requestId: 'request-correlation-kept',
			});
		});
		expect(output).not.toContain(UUID);
		expect(output).not.toContain(SHA_256);
		expect(output).not.toContain('prompt-derived-from-authored-title');
		expect(output).toContain('[redacted-id]');
		expect(output).toContain('[redacted-hash]');
		expect(output).toContain('request-correlation-kept');
	});

	it('redacta logs de reindexado persistidos y no publica sus rutas', async () => {
		const logDirectory = await mkdtemp(join(tmpdir(), 'media-manager-reindex-log-'));
		try {
			const fileLogger = new ReindexFileLogger(logDirectory);
			fileLogger.logError('monitor', `Falló ${WINDOWS_PATH} con ${UUID} y ${SHA_256}`, {
				context: { checksum: SHA_256, content: 'private authored content' },
				folderId: UUID,
				folderPath: WINDOWS_PATH,
				operationId: UUID,
			});

			const persistedStats = fileLogger.getLogStats();
			const persisted = await readFile(persistedStats.errorLogPath, 'utf8');
			const recent = JSON.stringify(fileLogger.readRecentLogs('error'));
			for (const sensitiveValue of [WINDOWS_PATH, UUID, SHA_256, 'private authored content']) {
				expect(persisted).not.toContain(sensitiveValue);
				expect(recent).not.toContain(sensitiveValue);
			}
			expect(persisted).toContain('[redacted-path]');
			expect(persisted).toContain('[redacted-id]');
			expect(persisted).toContain('[redacted-hash]');
			expect(persisted).toContain('[redacted-content]');

			const app = express();
			app.use('/api/reindex-logs', reindexLogsRouter);
			const response = await request(app).get('/api/reindex-logs/stats');
			expect(response.status).toBe(200);
			expect(response.body.data).not.toHaveProperty('errorLogPath');
			expect(response.body.data).not.toHaveProperty('warningLogPath');
		} finally {
			await rm(logDirectory, { force: true, recursive: true });
		}
	});

	it('devuelve error genérico y logs saneados ante fallos Effect inesperados', async () => {
		const previousEnvironment = process.env.NODE_ENV;
		process.env.NODE_ENV = 'production';
		const app = express();
		app.get(
			'/probe',
			effectHandler(() => Effect.fail(new Error(`Unexpected failure at ${WINDOWS_PATH}`)))
		);
		let response: request.Response | undefined;
		const output = await captureConsoleError(async () => {
			response = await request(app).get('/probe');
		});
		process.env.NODE_ENV = previousEnvironment;
		expect(response?.status).toBe(500);
		expect(response?.body).toEqual({ error: 'Internal server error' });
		expect(JSON.stringify(response?.body)).not.toContain(WINDOWS_PATH);
		expect(output).not.toContain(WINDOWS_PATH);
	});

	it('ejecuta FFmpeg sin shell ni sinks que impriman rutas físicas', async () => {
		const [ffmpegSource, thumbnailServiceSource, thumbnailSource] = await Promise.all([
			readFile(resolve(import.meta.dir, '../src/lib/utils/video/ffmpeg-thumbnails.ts'), 'utf8'),
			readFile(resolve(import.meta.dir, '../src/server/services/media/ffmpeg-thumbnail.service.ts'), 'utf8'),
			readFile(resolve(import.meta.dir, '../src/lib/utils/video/thumbnail-helpers.ts'), 'utf8'),
		]);
		expect(ffmpegSource).toMatch(/import \{ execFile \} from ["']node:child_process["']/);
		expect(ffmpegSource).not.toContain('execAsync');
		expect(ffmpegSource).not.toContain('ffmpegCmd');
		expect(ffmpegSource).not.toMatch(/console\.(?:log|warn|error)/);
		expect(thumbnailServiceSource).toContain('stderrBytes');
		expect(thumbnailServiceSource).not.toContain('stderr.slice');
		expect(thumbnailSource).not.toContain('${videoPath}');
		expect(thumbnailSource).not.toContain('${audioPath}');
	});
});
