import { serverLogger } from '@/lib/logger/server-logger';
import { getDbClient } from './index';

const log = serverLogger.withContext('FTS5');

const CREATE_TABLE = `CREATE VIRTUAL TABLE files_fts USING fts5(
  name,
  content,
  tags,
  tokenize = 'unicode61 remove_diacritics 2'
)`;

const INSERT_INITIAL = `INSERT INTO files_fts(rowid,name,content,tags)
SELECT id,name,(name||' '||path||' '||COALESCE(tags,'')),COALESCE(tags,'') FROM File`;

const TRIGGERS = `
CREATE TRIGGER IF NOT EXISTS files_ai AFTER INSERT ON File BEGIN
  INSERT INTO files_fts(rowid,name,content,tags)
  VALUES (new.id, new.name, (new.name||' '||new.path||' '||COALESCE(new.tags,'')), COALESCE(new.tags,''));
END;
CREATE TRIGGER IF NOT EXISTS files_ad AFTER DELETE ON File BEGIN
  DELETE FROM files_fts WHERE rowid = old.id;
END;
CREATE TRIGGER IF NOT EXISTS files_au AFTER UPDATE ON File BEGIN
  UPDATE files_fts SET
    name=new.name,
    content=(new.name||' '||new.path||' '||COALESCE(new.tags,'')),
    tags=COALESCE(new.tags,'')
  WHERE rowid=new.id;
END;`;

async function tableExists(): Promise<boolean> {
	const client = getDbClient();
	if (!client) {
		return false;
	}
	try {
		const res = await client.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='files_fts'");
		return res.rows.length > 0;
	} catch (e) {
		return false;
	}
}

export async function ensureFts5Ready({ backfill = false } = {}) {
	const client = getDbClient();
	if (!client) {
		return;
	}
	if (await tableExists()) {
		if (backfill) {
			// refrescar mínimo: insertar filas faltantes (simple estrategia naive)
			try {
				const countFiles = await client.execute('SELECT COUNT(1) FROM File');
				const countFts = await client.execute('SELECT COUNT(1) FROM files_fts');
				const totalFiles = Number(countFiles.rows?.[0]?.[0] || 0);
				const totalFts = Number(countFts.rows?.[0]?.[0] || 0);
				if (totalFts < totalFiles) {
					log.info('Backfill incremental FTS5', { totalFiles, totalFts });
					await client.execute(INSERT_INITIAL);
				}
			} catch (e) {
				log.warn('Error en backfill incremental FTS5', e);
			}
		}
		return;
	}
	try {
		await client.execute(CREATE_TABLE);
		await client.execute(INSERT_INITIAL);
		await client.execute(TRIGGERS);
		log.info('FTS5 inicializado');
	} catch (e) {
		log.error('Error inicializando FTS5', e);
	}
}
