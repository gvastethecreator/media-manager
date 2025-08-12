/**
 * @file Configuración de base de datos
 * @module lib/config/db
 */

import { z } from 'zod';

// Esquema de validación para la configuración de la base de datos
export const dbConfigSchema = z.object({
	url: z.string().url('URL de base de datos inválida'),
	maxConnections: z.number().min(1).max(100).default(10),
	connectionTimeout: z.number().min(1000).max(60_000).default(10_000),
	queryTimeout: z.number().min(1000).max(30_000).default(5000),
	logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
	enableLogging: z.boolean().default(false),
});

export type DbConfig = z.infer<typeof dbConfigSchema>;

// Configuración por defecto
export const defaultDbConfig: DbConfig = {
	url: process.env.DATABASE_URL || 'file:./db.sqlite',
	maxConnections: 10,
	connectionTimeout: 10_000,
	queryTimeout: 5000,
	logLevel: 'info',
	enableLogging: process.env.NODE_ENV === 'development',
};

/**
 * Valida y obtiene la configuración de la base de datos
 */
export function getDbConfig(): DbConfig {
	try {
		return dbConfigSchema.parse({
			url: process.env.DATABASE_URL || 'file:./db.sqlite',
			maxConnections: process.env.DB_MAX_CONNECTIONS ? Number.parseInt(process.env.DB_MAX_CONNECTIONS, 10) : undefined,
			connectionTimeout: process.env.DB_CONNECTION_TIMEOUT
				? Number.parseInt(process.env.DB_CONNECTION_TIMEOUT, 10)
				: undefined,
			queryTimeout: process.env.DB_QUERY_TIMEOUT ? Number.parseInt(process.env.DB_QUERY_TIMEOUT, 10) : undefined,
			logLevel: process.env.DB_LOG_LEVEL,
			enableLogging: process.env.DB_ENABLE_LOGGING === 'true',
		});
	} catch (error) {
		console.warn('Error validando configuración de DB, usando valores por defecto:', error);
		return defaultDbConfig;
	}
}

/**
 * Verifica si la configuración de la base de datos es válida
 */
export function validateDbConfig(config: unknown): config is DbConfig {
	try {
		dbConfigSchema.parse(config);
		return true;
	} catch {
		return false;
	}
}
