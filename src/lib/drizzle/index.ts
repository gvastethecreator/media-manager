import { createClient } from '@libsql/client';
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

/**
 * =================================================================================
 * CONFIGURACIÓN DE LA BASE DE DATOS CON DRIZZLE ORM
 * =================================================================================
 * Este archivo maneja la conexión a la base de datos SQLite usando Drizzle ORM.
 *
 * Coexistencia con Prisma:
 * - Drizzle y Prisma apuntan a la misma base de datos física (prisma/dev.db)
 * - Ambos ORMs pueden leer/escribir sin conflictos
 * - La migración será gradual, servicio por servicio
 *
 * Configuración según documentación oficial:
 * https://orm.drizzle.team/docs/get-started/sqlite-existing
 */

// Obtener la URL de la base de datos desde las variables de entorno
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL no está definida. Asegúrate de tener un archivo .env con la configuración de la base de datos.',
  );
}

// Crear cliente de libsql
// libsql es compatible con el formato file: de Prisma
const client = createClient({
  url: databaseUrl
});

// Crear la instancia de Drizzle con el schema completo
export const db = drizzle(client, {
  schema,
  logger: process.env.NODE_ENV === 'development'
});

// Exportar el schema para uso en otros archivos
export { schema };

// Exportar tipos útiles
export type DrizzleDatabase = typeof db;
export type Schema = typeof schema;

/**
 * Función para cerrar la conexión a la base de datos
 * Útil para testing y cleanup
 */
export function closeDatabase() {
  client.close();
}

/**
 * Función para verificar la conectividad de la base de datos
 * Útil para health checks
 */
export async function checkDatabaseConnection(): Promise<boolean> {
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
  try {
    const tablesResult = await client.execute(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );

    const versionResult = await client.execute('PRAGMA user_version');
    const pageSizeResult = await client.execute('PRAGMA page_size');
    const journalModeResult = await client.execute('PRAGMA journal_mode');

    const tables = tablesResult.rows.map(row => row[0] as string);

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