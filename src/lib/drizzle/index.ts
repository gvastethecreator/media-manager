import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { configureSqliteConnection, type SqliteConnectionStatus } from './connection-policy';
import { ensureFts5Ready } from './fts5';
import {
	activities,
	albumPlaces,
	albums,
	audios,
	characters,
	characterPlaces,
	collections,
	concepts,
	documents,
	entityAggregates,
	favorites,
	file3Ds,
	fileStats,
	files,
	folders,
	groupAlbums,
	groupImages,
	groups,
	groupTags,
	groupVideos,
	imageAlbums,
	imageCharacters,
	imageCollections,
	imageConcepts,
	imageNotes,
	imagePlaces,
	imagePrompts,
	imageProperties,
	images,
	imageTags,
	imageWildcards,
	imageWorldItems,
	jsonFiles,
	metadatas,
	notes,
	places,
	profiles,
	prompts,
	properties,
	queueJobs,
	settings,
	tags,
	thumbnails,
	uploadedImages,
	videoAlbums,
	videoCharacters,
	videoCollections,
	videoConcepts,
	videoNotes,
	videoPlaces,
	videoPrompts,
	videoProperties,
	videos,
	videoTags,
	videoWildcards,
	videoWorldItems,
	wildcards,
	worldItems,
} from './schema/index';

/**
 * =================================================================================
 * CONFIGURACIÓN DE LA BASE DE DATOS CON DRIZZLE ORM
 * =================================================================================
 * Este archivo maneja la conexión a la base de datos SQLite usando Drizzle ORM.
 *
 * ✅ UNIFICADO A SQLITE - Enero 2025
 * 🔧 RELACIONES COMPLETAS - Enero 2025
 * ✅ MIGRADO COMPLETAMENTE A DRIZZLE - 2025
 *
 * Configuración según documentación oficial:
 * https://orm.drizzle.team/docs/get-started/sqlite-existing
 */

// Crear el objeto schema con todas las tablas
const schema = {
	// Core
	queueJobs,
	profiles,
	settings,
	activities,
	metadatas,
	fileStats,
	thumbnails,
	entityAggregates,
	// Media
	folders,
	images,
	videos,
	uploadedImages,
	audios,
	documents,
	jsonFiles,
	file3Ds,
	// Organization
	groups,
	albums,
	collections,
	favorites,
	files,
	// Taxonomy
	tags,
	properties,
	wildcards,
	characters,
	places,
	worldItems,
	concepts,
	prompts,
	notes,
	// Relations
	albumPlaces,
	characterPlaces,
	imageAlbums,
	videoAlbums,
	imageCollections,
	videoCollections,
	imageTags,
	videoTags,
	imageProperties,
	videoProperties,
	imageWildcards,
	videoWildcards,
	imageCharacters,
	videoCharacters,
	imagePlaces,
	videoPlaces,
	imageWorldItems,
	videoWorldItems,
	imageConcepts,
	videoConcepts,
	imagePrompts,
	videoPrompts,
	imageNotes,
	videoNotes,
	groupImages,
	groupVideos,
	groupAlbums,
	groupTags,
};

// Combinar schema y relaciones para Drizzle
// Temporalmente sin relaciones para debugging
const fullSchema = { ...schema };

// Detectar Bun de forma robusta (en tests con jsdom existe `window`, pero seguimos queriendo DB real)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isBun = typeof (globalThis as any)?.Bun !== 'undefined';

// Obtener env vars tanto en Node como en Bun (en algunos contextos `process` puede no estar disponible)
const env: Record<string, string | undefined> =
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	typeof process !== 'undefined' && (process as any)?.env
		? // eslint-disable-next-line @typescript-eslint/no-explicit-any
			((process as any).env as Record<string, string | undefined>)
		: // eslint-disable-next-line @typescript-eslint/no-explicit-any
			(((globalThis as any)?.Bun?.env ?? {}) as Record<string, string | undefined>);

const isUnitTest = env.NODE_ENV === 'test' || env.BUN_TEST === '1' || env.VITEST === 'true' || env.TEST === 'true';

// Detectar entorno de servidor/test.
// Nota: en unit tests con jsdom existe `window`, así que no podemos depender solo de eso.
const isServerOrTest = typeof window === 'undefined' || isBun || isUnitTest;
const databaseUrl = isServerOrTest ? env.DATABASE_URL : undefined;

let client: ReturnType<typeof createClient> | null = null;
let databaseReady: Promise<SqliteConnectionStatus | null> = Promise.resolve(null);
const databaseLifecycleMetrics = {
	busyErrors: 0,
	checkpointBusy: 0,
	checkpointedFrames: 0,
	lastCheckpointAt: null as string | null,
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- instancia dinámica mock o drizzle
let dbInstance: any;

if (isServerOrTest) {
	if (!databaseUrl) {
		throw new Error('DATABASE_URL es obligatorio en servidor/tests; no existe fallback a db.sqlite.');
	}
	client = createClient({
		url: databaseUrl,
	});
	databaseReady = configureSqliteConnection(client, databaseUrl, env);
	// Evitar logs masivos de consultas (base64 de thumbnails) => logger desactivado por defecto.
	// Si se requiere, activar con DRIZZLE_LOG=1 explícitamente.
	const enableDrizzleLogger = env.DRIZZLE_LOG === '1';
	dbInstance = drizzle(client, {
		schema: fullSchema,
		logger: enableDrizzleLogger,
	});
	// Inicializar FTS5 de forma asíncrona (no bloquear arranque)
	// Lanzar inicialización FTS5 sin bloquear; ignorar promesa
	// En tests no queremos inicializaciones pesadas o side-effects (FTS5 no es requerida para unit tests)
	if (!isUnitTest) {
		databaseReady
			.then(() => ensureFts5Ready())
			.catch((e) => {
				if (env.NODE_ENV === 'development') {
					console.warn('FTS5 init error', e);
				}
			});
	}
} else {
	dbInstance = {
		// Mock object completo para el cliente - simula toda la API de Drizzle
		select: () => {
			const mockQuery = {
				from: () => mockQuery,
				leftJoin: () => mockQuery,
				rightJoin: () => mockQuery,
				innerJoin: () => mockQuery,
				where: () => mockQuery,
				orderBy: () => mockQuery,
				limit: () => mockQuery,
				offset: () => mockQuery,
				groupBy: () => mockQuery,
				having: () => mockQuery,
				execute: () => Promise.resolve([]),
			};
			return mockQuery;
		},
		insert: (_table: any) => ({
			values: (data: any) => ({
				returning: () =>
					Promise.resolve([
						{
							id: `mock-id-${Date.now()}`,
							createdAt: new Date().toISOString(),
							updatedAt: new Date().toISOString(),
							...data,
						},
					]),
				execute: () =>
					Promise.resolve({
						rowCount: 1,
						insertId: `mock-id-${Date.now()}`,
					}),
				onDuplicateKeyUpdate: () =>
					Promise.resolve([
						{
							id: `mock-id-${Date.now()}`,
							createdAt: new Date().toISOString(),
							updatedAt: new Date().toISOString(),
							...data,
						},
					]),
			}),
		}),
		update: (_table: any) => ({
			set: () => ({
				where: () => ({
					returning: () => Promise.resolve([]),
					execute: () => Promise.resolve({ rowCount: 0 }),
				}),
			}),
		}),
		delete: (_table: any) => ({
			where: () => ({
				execute: () => Promise.resolve({ rowCount: 0 }),
			}),
		}),
		query: new Proxy(
			{},
			{
				get: () => ({
					findMany: () => Promise.resolve([]),
					findFirst: () => Promise.resolve(null),
					findUnique: () => Promise.resolve(null),
				}),
			}
		),
		// Agregar las tablas del schema como proxies para evitar errores
		...Object.keys(fullSchema).reduce((acc, tableName) => {
			acc[tableName] = new Proxy(
				{},
				{
					get: () => ({
						id: 'mock-column',
						// Otros campos se pueden agregar aquí si es necesario
					}),
				}
			);
			return acc;
		}, {} as any),
		transaction: (fn: any) => Promise.resolve(fn({})),
	} as any; // Mock object para el cliente
}

export const db = dbInstance;

// Helper para acceso a cliente SQL subyacente (para SQL raw)
export function getDbClient() {
	return client;
}

/**
 * Barrera de arranque: ninguna ruta ni tarea en segundo plano debe usar SQLite
 * antes de que la conexión confirme foreign_keys, timeout y journal mode.
 */
export async function ensureDatabaseReady(): Promise<SqliteConnectionStatus | null> {
	return databaseReady;
}

// Exportar solo el schema (relaciones ya incluidas donde se definen)
export { schema };

// Exportar tipos útiles
export type DrizzleDatabase = typeof db;
export type Schema = typeof schema;

// Tipos inferidos de Drizzle para reemplazar tipos de Prisma
export type Profile = typeof schema.profiles.$inferSelect;
export type NewProfile = typeof schema.profiles.$inferInsert;
export type Settings = typeof schema.settings.$inferSelect;
export type NewSettings = typeof schema.settings.$inferInsert;
export type Image = typeof schema.images.$inferSelect;
export type NewImage = typeof schema.images.$inferInsert;
export type Video = typeof schema.videos.$inferSelect;
export type NewVideo = typeof schema.videos.$inferInsert;
export type Tag = typeof schema.tags.$inferSelect;
export type NewTag = typeof schema.tags.$inferInsert;
export type Album = typeof schema.albums.$inferSelect;
export type NewAlbum = typeof schema.albums.$inferInsert;
export type Collection = typeof schema.collections.$inferSelect;
export type NewCollection = typeof schema.collections.$inferInsert;
export type Folder = typeof schema.folders.$inferSelect;
export type NewFolder = typeof schema.folders.$inferInsert;
export type Note = typeof schema.notes.$inferSelect;
export type NewNote = typeof schema.notes.$inferInsert;
export type Character = typeof schema.characters.$inferSelect;
export type NewCharacter = typeof schema.characters.$inferInsert;
export type Place = typeof schema.places.$inferSelect;
export type NewPlace = typeof schema.places.$inferInsert;
export type Property = typeof schema.properties.$inferSelect;
export type NewProperty = typeof schema.properties.$inferInsert;
export type Document = typeof schema.documents.$inferSelect;
export type NewDocument = typeof schema.documents.$inferInsert;
export type Audio = typeof schema.audios.$inferSelect;
export type NewAudio = typeof schema.audios.$inferInsert;
export type JsonFile = typeof schema.jsonFiles.$inferSelect;
export type NewJsonFile = typeof schema.jsonFiles.$inferInsert;
export type File3D = typeof schema.file3Ds.$inferSelect;
export type NewFile3D = typeof schema.file3Ds.$inferInsert;
export type Prompt = typeof schema.prompts.$inferSelect;
export type NewPrompt = typeof schema.prompts.$inferInsert;
export type Wildcard = typeof schema.wildcards.$inferSelect;
export type NewWildcard = typeof schema.wildcards.$inferInsert;
export type WorldItem = typeof schema.worldItems.$inferSelect;
export type NewWorldItem = typeof schema.worldItems.$inferInsert;
export type Concept = typeof schema.concepts.$inferSelect;
export type NewConcept = typeof schema.concepts.$inferInsert;
export type UploadedImage = typeof schema.uploadedImages.$inferSelect;
export type NewUploadedImage = typeof schema.uploadedImages.$inferInsert;
export type QueueJob = typeof schema.queueJobs.$inferSelect;
export type NewQueueJob = typeof schema.queueJobs.$inferInsert;
export type Favorite = typeof schema.favorites.$inferSelect;
export type NewFavorite = typeof schema.favorites.$inferInsert;
export type File = typeof schema.files.$inferSelect;
export type NewFile = typeof schema.files.$inferInsert;

/**
 * Función para cerrar la conexión a la base de datos
 * Útil para testing y cleanup
 */
export function closeDatabase() {
	if (client) {
		client.close();
	}
}

function sqliteErrorCode(error: unknown): string | number | undefined {
	if (!(error && typeof error === 'object')) return undefined;
	const candidate = error as { code?: string | number; rawCode?: string | number };
	return candidate.code ?? candidate.rawCode;
}

export function recordDatabaseError(error: unknown): void {
	const code = sqliteErrorCode(error);
	if (code === 'SQLITE_BUSY' || code === 5) databaseLifecycleMetrics.busyErrors += 1;
}

export function getDatabaseLifecycleMetrics() {
	return { ...databaseLifecycleMetrics };
}

export async function checkpointDatabase(mode: 'PASSIVE' | 'TRUNCATE' = 'PASSIVE'): Promise<{
	busy: number;
	checkpointedFrames: number;
	logFrames: number;
}> {
	if (!client) return { busy: 0, checkpointedFrames: 0, logFrames: 0 };
	await ensureDatabaseReady();
	try {
		const result = await client.execute(`PRAGMA wal_checkpoint(${mode})`);
		const busy = Number(result.rows[0]?.[0] ?? 0);
		const logFrames = Number(result.rows[0]?.[1] ?? 0);
		const checkpointedFrames = Number(result.rows[0]?.[2] ?? 0);
		databaseLifecycleMetrics.checkpointBusy += busy;
		databaseLifecycleMetrics.checkpointedFrames += checkpointedFrames;
		databaseLifecycleMetrics.lastCheckpointAt = new Date().toISOString();
		return { busy, checkpointedFrames, logFrames };
	} catch (error) {
		recordDatabaseError(error);
		throw error;
	}
}

export async function closeDatabaseGracefully(): Promise<void> {
	if (!client) return;
	await checkpointDatabase('TRUNCATE');
	client.close();
	client = null;
}

/**
 * Función para verificar la conectividad de la base de datos
 * Útil para health checks
 */
export async function checkDatabaseConnection(): Promise<boolean> {
	if (!client) {
		return false; // No hay cliente en el lado del cliente
	}
	try {
		await ensureDatabaseReady();
		const result = await client.execute('SELECT 1 as test');
		return result.rows.length > 0 && result.rows[0][0] === 1;
	} catch (error) {
		console.error('Error al verificar la conexión a la base de datos:', error);
		return false;
	}
}

/**
 * Función para obtener información básica de la base de datos
 * Útil para debugging y monitoreo
 */
export async function getDatabaseInfo() {
	if (!client) {
		return null; // No hay cliente en el lado del cliente
	}
	try {
		const connection = await ensureDatabaseReady();
		const tablesResult = await client.execute(
			"SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
		);

		const versionResult = await client.execute('PRAGMA user_version');
		const pageSizeResult = await client.execute('PRAGMA page_size');
		const journalModeResult = await client.execute('PRAGMA journal_mode');

		const tables = tablesResult.rows.map((row) => row[0] as string);

		return {
			connection,
			tables: tables.length,
			tableNames: tables,
			version: versionResult.rows[0]?.[0] || 0,
			pageSize: pageSizeResult.rows[0]?.[0] || 0,
			journalMode: journalModeResult.rows[0]?.[0] || 'unknown',
			url: databaseUrl,
		};
	} catch (error) {
		console.error('Error al obtener información de la base de datos:', error);
		return null;
	}
}
