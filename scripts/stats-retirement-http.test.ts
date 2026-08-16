import { describe, expect, it } from 'bun:test';
import express from 'express';
import request from 'supertest';
import statsRouter from '../src/server/routes/stats';

describe('retired global stats HTTP contract', () => {
	it('keeps every aggregate endpoint fail-closed before route handlers can expose global counts', async () => {
		const app = express();
		app.use('/api/stats', statsRouter);
		const secretProbe = 'withdrawn-taxonomy-id-8675309';

		for (const endpoint of ['general', 'system', 'extended']) {
			const response = await request(app).get(`/api/stats/${endpoint}`).query({ entityId: secretProbe });
			expect(response.status).toBe(410);
			expect(response.body).toEqual({
				code: 'AUTHORIZED_SCOPE_REQUIRED',
				message: 'Las estadísticas globales fueron retiradas hasta disponer de agregados por media root.',
				retryable: false,
			});
			const publicBody = JSON.stringify(response.body);
			expect(publicBody).not.toContain(secretProbe);
			for (const forbiddenCount of ['totalNotes', 'totalPrompts', 'totalWildcards']) {
				expect(publicBody).not.toContain(forbiddenCount);
			}
		}
	});
});
