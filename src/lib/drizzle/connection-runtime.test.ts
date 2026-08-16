import { describe, expect, it } from 'vitest';
import {
	checkpointDatabase,
	ensureDatabaseReady,
	getDatabaseLifecycleMetrics,
	getDbClient,
	recordDatabaseError,
} from './index';

describe('runtime SQLite connection', () => {
	it('is not exposed as ready until the required per-connection pragmas are active', async () => {
		const status = await ensureDatabaseReady();
		const client = getDbClient();
		expect(client).not.toBeNull();
		expect(status).toMatchObject({
			busyTimeoutMs: 5_000,
			foreignKeys: true,
			journalMode: 'wal',
			walAutocheckpointPages: 1_000,
		});
		const foreignKeys = await client!.execute('PRAGMA foreign_keys');
		expect(foreignKeys.rows[0]?.[0]).toBe(1);
	});

	it('checkpoints WAL and exposes lock-contention counters without physical paths', async () => {
		const before = getDatabaseLifecycleMetrics();
		const checkpoint = await checkpointDatabase('PASSIVE');
		expect(checkpoint.busy).toBeGreaterThanOrEqual(0);
		expect(checkpoint.logFrames).toBeGreaterThanOrEqual(0);
		recordDatabaseError({ code: 'SQLITE_BUSY' });
		const after = getDatabaseLifecycleMetrics();
		expect(after.busyErrors).toBe(before.busyErrors + 1);
		expect(after.lastCheckpointAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
		expect(JSON.stringify(after)).not.toContain(process.env.DATABASE_URL);
	});
});
