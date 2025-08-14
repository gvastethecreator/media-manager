#!/usr/bin/env bun
import { getDbClient } from '../../src/lib/drizzle';
/**
 * Backfill FTS5 para tabla File
 */
import { ensureFts5Ready } from '../../src/lib/drizzle/fts5';
import { serverLogger } from '../../src/lib/logger/server-logger';

const log = serverLogger.withContext('FTS5:Backfill');

async function main() {
	await ensureFts5Ready({ backfill: true });
	const client = getDbClient();
	if (!client) {
		log.error('Sin cliente DB');
		return;
	}
	try {
		const countFiles = await client.execute('SELECT COUNT(1) FROM File');
		const countFts = await client.execute('SELECT COUNT(1) FROM files_fts');
		log.info('Backfill verificación', { files: countFiles.rows?.[0]?.[0], fts: countFts.rows?.[0]?.[0] });
	} catch (e) {
		log.error('Error verificando conteos', e);
	}
}

main().catch((e) => {
	log.error('Error en backfill FTS5', e);
	process.exit(1);
});
