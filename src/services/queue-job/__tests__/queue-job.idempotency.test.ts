import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/drizzle';
import { queueJobs } from '@/lib/drizzle/schema';
import { createQueueJob } from '../queue-job.service';

describe('QueueJob idempotency', () => {
	beforeEach(async () => {
		await db.delete(queueJobs);
	});

	it('returns the same persisted job when the same key and payload are retried', async () => {
		const input = {
			data: 'asset-1',
			idempotencyKey: 'thumbnail:asset-1:v1',
			maxAttempts: 3,
			metadata: { source: 'thumbnail' },
			priority: 2,
			queue: 'thumbnails',
		};
		const first = await createQueueJob(input);
		const retried = await createQueueJob(input);
		const persisted = await db.select().from(queueJobs);

		expect(retried.id).toBe(first.id);
		expect(persisted).toHaveLength(1);
		expect(persisted[0].idempotencyKey).toBe(input.idempotencyKey);
	});

	it('rejects key reuse with a different payload', async () => {
		await createQueueJob({ data: 'asset-1', idempotencyKey: 'thumbnail:asset-1:v1', queue: 'thumbnails' });

		await expect(
			createQueueJob({ data: 'asset-2', idempotencyKey: 'thumbnail:asset-1:v1', queue: 'thumbnails' })
		).rejects.toMatchObject({ code: 'IDEMPOTENCY_CONFLICT' });
		expect(await db.select().from(queueJobs)).toHaveLength(1);
	});

	it('keeps legacy non-idempotent enqueue behavior when no key is supplied', async () => {
		await createQueueJob({ data: 'asset-1', queue: 'thumbnails' });
		await createQueueJob({ data: 'asset-1', queue: 'thumbnails' });

		expect(await db.select().from(queueJobs)).toHaveLength(2);
	});
});
