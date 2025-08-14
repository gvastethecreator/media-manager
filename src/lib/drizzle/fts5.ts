import { serverLogger } from '@/lib/logger/server-logger';
import { getDbClient } from './index';

const log = serverLogger.withContext('FTS5');

let supported: boolean | null = null; // null = desconocido
let initialized = false;
let hardDisabled = false;
let firstErrorLogged = false;

function envDisabled() {
	return process.env.DISABLE_FTS5 === '1';
}

export function isFts5Enabled() {
	return initialized && supported === true && !hardDisabled && !envDisabled();
}

async function detectSupport(client: any): Promise<boolean> {
	if (supported !== null) {
		return supported;
	}
	if (!client) {
		return false;
	}
	if (envDisabled()) {
		supported = false;
		hardDisabled = true;
		log.warn('FTS5 deshabilitado por variable de entorno DISABLE_FTS5=1');
		return false;
	}
	try {
		// Método estándar: pragma_module_list
		const res = await client.execute("SELECT 1 FROM pragma_module_list WHERE name='fts5' LIMIT 1");
		supported = res.rows.length > 0;
		if (!supported) {
			log.warn('Modulo fts5 no disponible en este build de SQLite/libsql. Se usará fallback LIKE.');
		}
		return supported;
	} catch (e) {
		supported = false;
		log.warn('No se pudo detectar soporte FTS5; asumiendo no soportado.', e);
		return false;
	}
}

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

function buildBackfillFn(client: any) {
	return async function backfillIfNeeded() {
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
	};
}

async function createAndSeed(client: any) {
	await client.execute(CREATE_TABLE);
	await client.execute(INSERT_INITIAL);
	await client.execute(TRIGGERS);
	supported = true;
	initialized = true;
	log.info('FTS5 inicializado');
}

function handleInitError(e: any) {
	supported = false;
	initialized = true;
	if (!firstErrorLogged) {
		firstErrorLogged = true;
		const code = e?.code || e?.rawCode;
		if (code === 'SQLITE_ERROR' || code === 'SQLITE_MISMATCH' || code === 20) {
			log.warn('FTS5 no disponible (probable build sin módulo). Fallback LIKE. Código:', code);
		} else {
			log.error('Error inicializando FTS5', e);
		}
	}
}

export async function ensureFts5Ready({ backfill = false } = {}) {
	const client = getDbClient();
	if (!client) {
		return;
	}
	if (initialized) {
		return;
	}
	const ok = await detectSupport(client);
	if (!ok) {
		initialized = true;
		return;
	}
	try {
		if (await tableExists()) {
			if (backfill) {
				await buildBackfillFn(client)();
			}
			supported = true;
			initialized = true;
			return;
		}
		await createAndSeed(client);
	} catch (e) {
		handleInitError(e);
	}
}

export function getFts5Status() {
	return { supported, initialized, disabledEnv: envDisabled() };
}
