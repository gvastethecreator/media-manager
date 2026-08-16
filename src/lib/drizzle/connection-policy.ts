export type SqliteClient = {
	execute: (statement: string) => Promise<{ rows: ArrayLike<unknown>[] }>;
};

export type SqliteConnectionPolicy = {
	busyTimeoutMs: number;
	journalMode: 'delete' | 'wal' | null;
	synchronous: 'FULL' | 'NORMAL';
	walAutocheckpointPages: number | null;
};

export type SqliteConnectionStatus = {
	busyTimeoutMs: number;
	foreignKeys: boolean;
	journalMode: string;
	synchronous: number;
	walAutocheckpointPages: number;
};

const DEFAULT_BUSY_TIMEOUT_MS = 5_000;
const DEFAULT_WAL_AUTOCHECKPOINT_PAGES = 1_000;

function parseBoundedInteger(value: string | undefined, fallback: number, minimum: number, maximum: number): number {
	if (value === undefined || value.trim() === '') return fallback;
	const parsed = Number(value);
	if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum) {
		throw new Error(`Invalid SQLite value: ${value}. Se esperaba un entero entre ${minimum} y ${maximum}.`);
	}
	return parsed;
}

export function isLikelyLocalSqliteUrl(databaseUrl: string): boolean {
	if (!databaseUrl.startsWith('file:')) return false;
	const path = databaseUrl.slice('file:'.length).replaceAll('\\', '/');
	if (path.startsWith('//')) {
		const authority = path.slice(2).split('/')[0] ?? '';
		return authority === '' || authority.toLowerCase() === 'localhost';
	}
	return true;
}

export function resolveSqliteConnectionPolicy(
	databaseUrl: string,
	environment: Record<string, string | undefined>
): SqliteConnectionPolicy {
	const busyTimeoutMs = parseBoundedInteger(environment.SQLITE_BUSY_TIMEOUT_MS, DEFAULT_BUSY_TIMEOUT_MS, 0, 60_000);
	const requestedJournalMode = environment.SQLITE_JOURNAL_MODE?.trim().toLowerCase();
	if (requestedJournalMode && requestedJournalMode !== 'wal' && requestedJournalMode !== 'delete') {
		throw new Error('SQLITE_JOURNAL_MODE only accepts WAL or DELETE.');
	}
	const journalMode =
		(requestedJournalMode as 'delete' | 'wal' | undefined) ?? (isLikelyLocalSqliteUrl(databaseUrl) ? 'wal' : null);
	const walAutocheckpointPages =
		journalMode === 'wal'
			? parseBoundedInteger(environment.SQLITE_WAL_AUTOCHECKPOINT_PAGES, DEFAULT_WAL_AUTOCHECKPOINT_PAGES, 1, 100_000)
			: null;
	return {
		busyTimeoutMs,
		journalMode,
		synchronous: journalMode === 'wal' ? 'NORMAL' : 'FULL',
		walAutocheckpointPages,
	};
}

function firstNumber(rows: ArrayLike<unknown>[], pragma: string): number {
	const value = Number(rows[0]?.[0]);
	if (!Number.isFinite(value)) throw new Error(`SQLite did not return a numeric value for ${pragma}.`);
	return value;
}

function firstString(rows: ArrayLike<unknown>[], pragma: string): string {
	const value = rows[0]?.[0];
	if (typeof value !== 'string' && typeof value !== 'number') {
		throw new Error(`SQLite did not return a value for ${pragma}.`);
	}
	return String(value).toLowerCase();
}

export async function configureSqliteConnection(
	client: SqliteClient,
	databaseUrl: string,
	environment: Record<string, string | undefined>
): Promise<SqliteConnectionStatus> {
	const policy = resolveSqliteConnectionPolicy(databaseUrl, environment);
	await client.execute(`PRAGMA busy_timeout = ${policy.busyTimeoutMs}`);
	await client.execute('PRAGMA foreign_keys = ON');

	const foreignKeys = firstNumber((await client.execute('PRAGMA foreign_keys')).rows, 'foreign_keys') === 1;
	if (!foreignKeys) throw new Error('SQLite rejected PRAGMA foreign_keys=ON; the connection is not safe to use.');

	if (policy.journalMode) {
		const journalMode = firstString(
			(await client.execute(`PRAGMA journal_mode = ${policy.journalMode.toUpperCase()}`)).rows,
			'journal_mode'
		);
		if (journalMode !== policy.journalMode) {
			throw new Error(`SQLite no pudo activar journal_mode=${policy.journalMode}; returned ${journalMode}.`);
		}
	}

	await client.execute(`PRAGMA synchronous = ${policy.synchronous}`);
	if (policy.walAutocheckpointPages !== null) {
		await client.execute(`PRAGMA wal_autocheckpoint = ${policy.walAutocheckpointPages}`);
	}

	return {
		busyTimeoutMs: firstNumber((await client.execute('PRAGMA busy_timeout')).rows, 'busy_timeout'),
		foreignKeys,
		journalMode: firstString((await client.execute('PRAGMA journal_mode')).rows, 'journal_mode'),
		synchronous: firstNumber((await client.execute('PRAGMA synchronous')).rows, 'synchronous'),
		walAutocheckpointPages: firstNumber((await client.execute('PRAGMA wal_autocheckpoint')).rows, 'wal_autocheckpoint'),
	};
}
