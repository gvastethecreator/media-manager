import { describe, expect, it } from 'bun:test';
import { Effect } from 'effect';
import express from 'express';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import request from 'supertest';
import { effectHandler } from '../src/lib/effect/adapters/express.adapter';
import { serverLogger } from '../src/lib/logger/server-logger';
import { sanitizePublicPayload } from '../src/server/security/sanitize-public-payload';

const WINDOWS_PATH = 'C:\\private\\media\\asset.jpg';
const WINDOWS_PATH_WITH_SPACES = 'C:\\Users\\cristian\\My Media\\secret.jpg';
const POSIX_PATH = '/home/private/media/asset.jpg';
const FILE_URL = 'file:///home/cristian/My%20Media/secret.jpg';

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
