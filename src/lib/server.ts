/**
 * @file Utilidades del lado del servidor
 * @module lib/server
 */

export * from './config';
// Nota: No re-exportamos './utils' para evitar colisiones con exports de nivel superior en src/lib/index.ts
// Las utilidades se exportan directamente desde @/lib/utils cuando se necesiten

// Servidor específico
const isServer = typeof window === 'undefined';
const isClient = !isServer;

/**
 * Ejecuta código solo en el servidor
 */
export function serverOnly<T>(fn: () => T): T | undefined {
	return isServer ? fn() : undefined;
}

/**
 * Variables de entorno del servidor
 */
export const serverEnv = {
	NODE_ENV: process.env.NODE_ENV || 'development',
	DATABASE_URL: process.env.DATABASE_URL,
	PORT: process.env.PORT || '5173',
	HOST: process.env.HOST || 'localhost',
} as const;

/**
 * Verifica si estamos en modo desarrollo
 */
export const isDevelopment = serverEnv.NODE_ENV === 'development';

/**
 * Verifica si estamos en modo producción
 */
export const isProduction = serverEnv.NODE_ENV === 'production';
