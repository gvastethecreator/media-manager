import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as relations from './relations.js';
import * as schema from './schema.js';

/**
 * =================================================================================
 * CONFIGURACIÓN DE LA BASE DE DATOS CON DRIZZLE ORM
 * =================================================================================
 * Este archivo maneja la conexión a la base de datos SQLite usando Drizzle ORM.
 *
 * ✅ UNIFICADO A SQLITE - Enero 2025
 * 🔧 RELACIONES COMPLETAS - Enero 2025
 *
 * Coexistencia con Prisma:
 * - Drizzle y Prisma apuntan a la misma base de datos física (prisma/dev.db)
 * - Ambos ORMs pueden leer/escribir sin conflictos
 * - La migración será gradual, servicio por servicio
 *
 * Configuración según documentación oficial:
 * https://orm.drizzle.team/docs/get-started/sqlite-existing
 */

// Combinar schema y relaciones para Drizzle
const fullSchema = { ...schema, ...relations.allRelations };

// Obtener la URL de la base de datos desde las variables de entorno
// En el servidor (Node.js) usa process.env.DATABASE_URL directamente
// En el cliente (browser) usa una URL por defecto que será interceptada por el proxy
const databaseUrl = typeof window === 'undefined' ? process.env.DATABASE_URL || 'file:./db.sqlite' : 'file:./db.sqlite'; // Fallback para el cliente, aunque no se usará realmente

let client: ReturnType<typeof createClient> | null = null;
let dbInstance;

if (typeof window === 'undefined') {
	client = createClient({
		url: databaseUrl,
	});
	dbInstance = drizzle(client, {
		schema: fullSchema,
		logger: process.env.NODE_ENV === 'development',
	});
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
				then: (onResolve: any) => Promise.resolve([]).then(onResolve),
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
		transaction: (fn: any) => Promise.resolve(fn({})),
	} as any; // Mock object para el cliente
}

export const db = dbInstance;

// Exportar el schema y relaciones para uso en otros archivos
export { schema, relations };

// Exportar tipos útiles
export type DrizzleDatabase = typeof db;
export type Schema = typeof schema;
export type Relations = typeof relations;

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

/**
 * Función para verificar la conectividad de la base de datos
 * Útil para health checks
 */
export async function checkDatabaseConnection(): Promise<boolean> {
	if (!client) {
		return false; // No hay cliente en el lado del cliente
	}
	try {
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
		const tablesResult = await client.execute(
			"SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
		);

		const versionResult = await client.execute('PRAGMA user_version');
		const pageSizeResult = await client.execute('PRAGMA page_size');
		const journalModeResult = await client.execute('PRAGMA journal_mode');

		const tables = tablesResult.rows.map((row) => row[0] as string);

		return {
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
