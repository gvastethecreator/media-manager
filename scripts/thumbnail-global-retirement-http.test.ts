import { describe, expect, it } from 'bun:test';
import express from 'express';
import request from 'supertest';
import thumbnailsRouter from '../src/server/routes/thumbnails.effect';

const responses = [
	{
		method: 'get' as const,
		path: '/api/thumbnails/stats',
		message: 'Las estadísticas globales no están disponibles hasta que pueda limitarse a un media root autorizado.',
	},
	{
		method: 'get' as const,
		path: '/api/thumbnails/last-processed?limit=999&path=C%3A%5Cprivate%5Cimage.png',
		message: 'El historial global no está disponible hasta que pueda limitarse a un media root autorizado.',
	},
	{
		method: 'post' as const,
		path: '/api/thumbnails/clean',
		message: 'La limpieza global no está disponible hasta que pueda limitarse a un media root autorizado.',
	},
	{
		method: 'post' as const,
		path: '/api/thumbnails/optimize',
		message: 'La optimización global no está disponible hasta que pueda limitarse a un media root autorizado.',
	},
	{
		method: 'post' as const,
		path: '/api/thumbnails/reprocess',
		message: 'El reprocesado global no está disponible hasta que pueda limitarse a un media root autorizado.',
	},
];

describe('thumbnail global retirement boundary', () => {
	it('rejects every unscoped operation without exposing request content', async () => {
		const app = express();
		app.use(express.json());
		app.use('/api/thumbnails', thumbnailsRouter);

		for (const expected of responses) {
			const response =
				expected.method === 'get'
					? await request(app).get(expected.path)
					: await request(app).post(expected.path).send({ path: 'C:\\private\\image.png' });

			expect(response.status).toBe(410);
			expect(response.body).toEqual({
				code: 'ROOT_SCOPED_OPERATION_REQUIRED',
				message: expected.message,
				retryable: false,
			});
			expect(JSON.stringify(response.body)).not.toContain('C:\\private\\image.png');
		}
	});
});
