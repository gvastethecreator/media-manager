import express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'bun:test';
import wildcardRouter from '@/server/routes/wildcards';
import wildcardService from '@/services/wildcard/wildcard.service';

const originalCreate = wildcardService.createWildcard;
const originalUpdate = wildcardService.updateWildcard;
const originalDelete = wildcardService.deleteWildcard;

function buildApp() {
	const app = express();
	app.use(express.json());
	app.use('/api/wildcards', wildcardRouter);
	return app;
}

afterEach(() => {
	(wildcardService as any).createWildcard = originalCreate;
	(wildcardService as any).updateWildcard = originalUpdate;
	(wildcardService as any).deleteWildcard = originalDelete;
});

describe('Wildcards router', () => {
	it('crea un wildcard valido', async () => {
		const app = buildApp();
		const payload = { name: 'Test wildcard', description: 'demo' };
		const created = {
			id: 'w1',
			name: payload.name,
			description: payload.description,
			emoji: null,
			color: null,
			category: null,
			shortcut: null,
			children: null,
			featuredImage: null,
			isFavorite: false,
			parentId: null,
			stats: {
				adaptabilityScore: 0,
				usageDiversity: 0,
				completenessScore: 0,
				popularity: 0,
				isDirectory: false,
				isFile: true,
			},
		} as any;

		let received: unknown;
		(wildcardService as any).createWildcard = async (input: unknown) => {
			received = input;
			return created;
		};

		const response = await request(app).post('/api/wildcards').send(payload);

		expect(response.status).toBe(201);
		expect(response.body.id).toBe('w1');
		expect((received as any).name).toBe('Test wildcard');
	});

	it('rechaza payload invalido', async () => {
		const app = buildApp();

		const response = await request(app).post('/api/wildcards').send({});

		expect(response.status).toBe(400);
		expect(response.body.error).toBe(true);
	});

	it('actualiza un wildcard existente', async () => {
		const app = buildApp();
		const updated = {
			id: 'w2',
			name: 'Updated',
			description: null,
			emoji: null,
			color: null,
			category: null,
			shortcut: null,
			children: null,
			featuredImage: null,
			isFavorite: false,
			parentId: null,
			stats: {
				adaptabilityScore: 0,
				usageDiversity: 0,
				completenessScore: 0,
				popularity: 0,
				isDirectory: false,
				isFile: true,
			},
		} as any;

		let updateInput: unknown;
		(wildcardService as any).updateWildcard = async (_id: string, input: unknown) => {
			updateInput = input;
			return updated;
		};

		const response = await request(app).put('/api/wildcards/w2').send({ name: 'Updated' });

		expect(response.status).toBe(200);
		expect(response.body.name).toBe('Updated');
		expect((updateInput as any).name).toBe('Updated');
	});

	it('elimina un wildcard y responde 204', async () => {
		const app = buildApp();

		let deletedId: string | undefined;
		(wildcardService as any).deleteWildcard = async (id: string) => {
			deletedId = id;
		};

		const response = await request(app).delete('/api/wildcards/bye');

		expect(response.status).toBe(204);
		expect(deletedId).toBe('bye');
	});
});

