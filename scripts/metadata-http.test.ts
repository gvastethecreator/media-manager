import { expect, it } from 'bun:test';
import { inArray } from 'drizzle-orm';
import express from 'express';
import request from 'supertest';
import { db } from '@/lib/drizzle';
import { metadatas } from '@/lib/drizzle/schema';
import metadataRouter from '@/server/routes/metadata.effect';

it('routes bulk metadata updates before an individual ID and persists both changes', async () => {
	const ids = [crypto.randomUUID(), crypto.randomUUID()];
	const app = express();
	app.use(express.json());
	app.use('/api/metadata', metadataRouter);
	try {
		await db.insert(metadatas).values(
			ids.map((id) => ({
				id,
				entityType: 'image',
				entityId: id,
				key: 'description',
				value: 'before',
			}))
		);
		const response = await request(app)
			.put('/api/metadata/bulk-update')
			.send({
				updates: ids.map((id) => ({ id, data: { value: 'after' } })),
			});
		expect(response.status).toBe(200);
		expect(response.body).toEqual({ updated: 2, errors: [] });
		const rows = await db.select().from(metadatas).where(inArray(metadatas.id, ids));
		expect(rows).toHaveLength(2);
		expect(rows.every((row) => row.value === 'after')).toBe(true);
		const individual = await request(app).put(`/api/metadata/${ids[0]}`).send({ value: 'single' });
		expect(individual.status).toBe(200);
		expect(individual.body.value).toBe('single');
		expect((await request(app).put('/api/metadata/bulk-update').send({ updates: {} })).status).toBe(400);
	} finally {
		await db.delete(metadatas).where(inArray(metadatas.id, ids));
	}
});
