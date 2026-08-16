import { describe, expect, it, vi } from 'vitest';
import {
	configureSqliteConnection,
	isLikelyLocalSqliteUrl,
	resolveSqliteConnectionPolicy,
	type SqliteClient,
} from './connection-policy';

function pragmaClient(
	overrides: Partial<Record<string, unknown>> = {},
	options: { foreignKeysLockedOff?: boolean } = {}
): SqliteClient {
	const values: Record<string, unknown> = {
		busy_timeout: 5_000,
		foreign_keys: 1,
		journal_mode: 'wal',
		synchronous: 1,
		wal_autocheckpoint: 1_000,
		...overrides,
	};
	return {
		execute: vi.fn(async (statement: string) => {
			if (options.foreignKeysLockedOff && /^PRAGMA\s+foreign_keys(?:\s*=\s*ON)?$/i.test(statement)) {
				return { rows: [[0]] };
			}
			const assignment = /^PRAGMA\s+([a-z_]+)\s*=\s*(.+)$/i.exec(statement);
			if (assignment) {
				const [, name, rawValue] = assignment;
				if (name === 'journal_mode') values[name] = rawValue.toLowerCase();
				else if (name === 'foreign_keys') values[name] = rawValue === 'ON' ? 1 : 0;
				else if (name === 'synchronous') values[name] = rawValue === 'NORMAL' ? 1 : 2;
				else values[name] = Number(rawValue);
				return { rows: [[values[name]]] };
			}
			const name = statement.replace(/^PRAGMA\s+/i, '').trim();
			return { rows: [[values[name]]] };
		}),
	};
}

describe('SQLite connection policy', () => {
	it('uses WAL only for local file databases by default', () => {
		expect(isLikelyLocalSqliteUrl('file:D:/data/app.sqlite')).toBe(true);
		expect(isLikelyLocalSqliteUrl('file:///D:/data/app.sqlite')).toBe(true);
		expect(isLikelyLocalSqliteUrl('file://server/share/app.sqlite')).toBe(false);
		expect(isLikelyLocalSqliteUrl('https://example.turso.io')).toBe(false);
		expect(resolveSqliteConnectionPolicy('file:D:/data/app.sqlite', {}).journalMode).toBe('wal');
		expect(resolveSqliteConnectionPolicy('file://server/share/app.sqlite', {}).journalMode).toBeNull();
	});

	it('rejects unsupported and out-of-range configuration', () => {
		expect(() => resolveSqliteConnectionPolicy('file:test.sqlite', { SQLITE_JOURNAL_MODE: 'memory' })).toThrow(
			'WAL or DELETE'
		);
		expect(() => resolveSqliteConnectionPolicy('file:test.sqlite', { SQLITE_BUSY_TIMEOUT_MS: '-1' })).toThrow(
			'Invalid SQLite value'
		);
	});

	it('enables and verifies every safety pragma before reporting ready', async () => {
		const client = pragmaClient();
		const status = await configureSqliteConnection(client, 'file:D:/data/app.sqlite', {});
		expect(status).toEqual({
			busyTimeoutMs: 5_000,
			foreignKeys: true,
			journalMode: 'wal',
			synchronous: 1,
			walAutocheckpointPages: 1_000,
		});
		expect(client.execute).toHaveBeenNthCalledWith(1, 'PRAGMA busy_timeout = 5000');
		expect(client.execute).toHaveBeenNthCalledWith(2, 'PRAGMA foreign_keys = ON');
	});

	it('fails closed when foreign key enforcement cannot be enabled', async () => {
		const client = pragmaClient({ foreign_keys: 0 }, { foreignKeysLockedOff: true });
		await expect(configureSqliteConnection(client, 'file:test.sqlite', {})).rejects.toThrow('connection is not safe');
	});
});
