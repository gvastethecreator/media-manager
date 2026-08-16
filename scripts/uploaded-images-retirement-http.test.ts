import { describe, expect, it } from 'bun:test';
import express from 'express';
import request from 'supertest';
import { uploadedImagesEffectRouter } from '../src/server/routes/file-services.effect';

const retiredResponse = {
	code: 'AUTHORIZED_ROOT_INGEST_REQUIRED',
	message: 'Las cargas directas fueron retiradas. Añade archivos a un media root autorizado y reindexa la carpeta.',
	retryable: false,
};

describe('uploaded images retirement boundary', () => {
	it('rejects every legacy route without exposing request content', async () => {
		const app = express();
		app.use(express.json());
		app.use('/api/uploaded-images', uploadedImagesEffectRouter);

		const requests = [
			request(app).get('/api/uploaded-images'),
			request(app).get('/api/uploaded-images/stats'),
			request(app).get('/api/uploaded-images/legacy-image-id'),
			request(app).post('/api/uploaded-images/upload').send({ path: 'C:\\private\\image.png' }),
			request(app).post('/api/uploaded-images').send({ path: 'C:\\private\\image.png' }),
			request(app).put('/api/uploaded-images/legacy-image-id').send({ path: 'C:\\private\\image.png' }),
			request(app).delete('/api/uploaded-images/legacy-image-id'),
		];

		for (const response of await Promise.all(requests)) {
			expect(response.status).toBe(410);
			expect(response.body).toEqual(retiredResponse);
			expect(JSON.stringify(response.body)).not.toContain('C:\\private\\image.png');
		}
	});
});
