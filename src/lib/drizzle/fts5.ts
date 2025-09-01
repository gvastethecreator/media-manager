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

const CREATE_TABLE = `CREATE VIRTUAL TABLE media_fts USING fts5(
  name,
  content,
  entity_type,
  entity_id,
  tokenize = 'unicode61 remove_diacritics 2'
)`;

const INSERT_INITIAL = `
-- Insertar imágenes
INSERT INTO media_fts(rowid, name, content, entity_type, entity_id)
SELECT 
  ROW_NUMBER() OVER (ORDER BY id) as rowid,
  name,
  (name || ' ' || path || ' ' || COALESCE(description, '')),
  'image' as entity_type,
  id as entity_id
FROM Image

UNION ALL

-- Insertar videos
SELECT 
  ROW_NUMBER() OVER (ORDER BY id) + (SELECT COUNT(*) FROM Image) as rowid,
  name,
  (name || ' ' || path || ' ' || COALESCE(description, '')),
  'video' as entity_type,
  id as entity_id
FROM Video

UNION ALL

-- Insertar documentos
SELECT 
  ROW_NUMBER() OVER (ORDER BY id) + (SELECT COUNT(*) FROM Image) + (SELECT COUNT(*) FROM Video) as rowid,
  name,
  (name || ' ' || path || ' ' || COALESCE(content, '') || ' ' || COALESCE(summary, '')),
  'document' as entity_type,
  id as entity_id
FROM Document

UNION ALL

-- Insertar archivos de audio
SELECT 
  ROW_NUMBER() OVER (ORDER BY id) + (SELECT COUNT(*) FROM Image) + (SELECT COUNT(*) FROM Video) + (SELECT COUNT(*) FROM Document) as rowid,
  name,
  (name || ' ' || path || ' ' || COALESCE(title, '') || ' ' || COALESCE(artist, '') || ' ' || COALESCE(album, '')),
  'audio' as entity_type,
  id as entity_id
FROM Audio
`;

const TRIGGERS = `
-- Triggers para imágenes
CREATE TRIGGER IF NOT EXISTS images_ai AFTER INSERT ON Image BEGIN
  INSERT INTO media_fts(rowid, name, content, entity_type, entity_id)
  VALUES (
    (SELECT COALESCE(MAX(rowid), 0) + 1 FROM media_fts),
    new.name,
    (new.name || ' ' || new.path || ' ' || COALESCE(new.description, '')),
    'image',
    new.id
  );
END;

CREATE TRIGGER IF NOT EXISTS images_ad AFTER DELETE ON Image BEGIN
  DELETE FROM media_fts WHERE entity_type = 'image' AND entity_id = old.id;
END;

CREATE TRIGGER IF NOT EXISTS images_au AFTER UPDATE ON Image BEGIN
  UPDATE media_fts SET
    name = new.name,
    content = (new.name || ' ' || new.path || ' ' || COALESCE(new.description, ''))
  WHERE entity_type = 'image' AND entity_id = new.id;
END;

-- Triggers para videos
CREATE TRIGGER IF NOT EXISTS videos_ai AFTER INSERT ON Video BEGIN
  INSERT INTO media_fts(rowid, name, content, entity_type, entity_id)
  VALUES (
    (SELECT COALESCE(MAX(rowid), 0) + 1 FROM media_fts),
    new.name,
    (new.name || ' ' || new.path || ' ' || COALESCE(new.description, '')),
    'video',
    new.id
  );
END;

CREATE TRIGGER IF NOT EXISTS videos_ad AFTER DELETE ON Video BEGIN
  DELETE FROM media_fts WHERE entity_type = 'video' AND entity_id = old.id;
END;

CREATE TRIGGER IF NOT EXISTS videos_au AFTER UPDATE ON Video BEGIN
  UPDATE media_fts SET
    name = new.name,
    content = (new.name || ' ' || new.path || ' ' || COALESCE(new.description, ''))
  WHERE entity_type = 'video' AND entity_id = new.id;
END;

-- Triggers para documentos
CREATE TRIGGER IF NOT EXISTS documents_ai AFTER INSERT ON Document BEGIN
  INSERT INTO media_fts(rowid, name, content, entity_type, entity_id)
  VALUES (
    (SELECT COALESCE(MAX(rowid), 0) + 1 FROM media_fts),
    new.name,
    (new.name || ' ' || new.path || ' ' || COALESCE(new.content, '') || ' ' || COALESCE(new.summary, '')),
    'document',
    new.id
  );
END;

CREATE TRIGGER IF NOT EXISTS documents_ad AFTER DELETE ON Document BEGIN
  DELETE FROM media_fts WHERE entity_type = 'document' AND entity_id = old.id;
END;

CREATE TRIGGER IF NOT EXISTS documents_au AFTER UPDATE ON Document BEGIN
  UPDATE media_fts SET
    name = new.name,
    content = (new.name || ' ' || new.path || ' ' || COALESCE(new.content, '') || ' ' || COALESCE(new.summary, ''))
  WHERE entity_type = 'document' AND entity_id = new.id;
END;

-- Triggers para audio
CREATE TRIGGER IF NOT EXISTS audios_ai AFTER INSERT ON Audio BEGIN
  INSERT INTO media_fts(rowid, name, content, entity_type, entity_id)
  VALUES (
    (SELECT COALESCE(MAX(rowid), 0) + 1 FROM media_fts),
    new.name,
    (new.name || ' ' || new.path || ' ' || COALESCE(new.title, '') || ' ' || COALESCE(new.artist, '') || ' ' || COALESCE(new.album, '')),
    'audio',
    new.id
  );
END;

CREATE TRIGGER IF NOT EXISTS audios_ad AFTER DELETE ON Audio BEGIN
  DELETE FROM media_fts WHERE entity_type = 'audio' AND entity_id = old.id;
END;

CREATE TRIGGER IF NOT EXISTS audios_au AFTER UPDATE ON Audio BEGIN
  UPDATE media_fts SET
    name = new.name,
    content = (new.name || ' ' || new.path || ' ' || COALESCE(new.title, '') || ' ' || COALESCE(new.artist, '') || ' ' || COALESCE(new.album, ''))
  WHERE entity_type = 'audio' AND entity_id = new.id;
END;
`;

async function tableExists(): Promise<boolean> {
	const client = getDbClient();
	if (!client) {
		return false;
	}
	try {
		const res = await client.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='media_fts'");
		return res.rows.length > 0;
	} catch (e) {
		return false;
	}
}

function buildBackfillFn(client: any) {
	return async function backfillIfNeeded() {
		try {
			const countImages = await client.execute('SELECT COUNT(1) FROM Image');
			const countVideos = await client.execute('SELECT COUNT(1) FROM Video');
			const countDocuments = await client.execute('SELECT COUNT(1) FROM Document');
			const countAudios = await client.execute('SELECT COUNT(1) FROM Audio');
			const countFts = await client.execute('SELECT COUNT(1) FROM media_fts');

			const totalMedia =
				Number(countImages.rows?.[0]?.[0] || 0) +
				Number(countVideos.rows?.[0]?.[0] || 0) +
				Number(countDocuments.rows?.[0]?.[0] || 0) +
				Number(countAudios.rows?.[0]?.[0] || 0);
			const totalFts = Number(countFts.rows?.[0]?.[0] || 0);

			if (totalFts < totalMedia) {
				log.info('Backfill incremental FTS5', { totalMedia, totalFts });
				await client.execute('DELETE FROM media_fts'); // Limpiar antes de re-poblar
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
