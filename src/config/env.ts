/**
 * @file Configuración de variables de entorno
 * @module config/env
 * @description Configuración de variables de entorno sin dotenv para compatibilidad con bundling
 */

import { serverLogger } from '@/lib/logger/server-logger';

const envLogger = serverLogger.withContext('ENV');

export const ENV = {
	NODE_ENV: process.env.NODE_ENV || 'development',
	API_PORT: process.env.API_PORT || process.env.PORT || '4000',
	DATABASE_URL: process.env.DATABASE_URL,
	CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
} as const;

// Validar variables críticas en el servidor
if (typeof window === 'undefined') {
	if (!ENV.DATABASE_URL) {
		envLogger.error('❌ DATABASE_URL no está definida');
		envLogger.error('Variables disponibles:', {
			NODE_ENV: process.env.NODE_ENV,
			DATABASE_URL: process.env.DATABASE_URL,
		});
		throw new Error(
			'DATABASE_URL no está definida. Asegúrate de tener un archivo .env con la configuración de la base de datos.'
		);
	}

	// Log de configuración en desarrollo
	if (ENV.NODE_ENV === 'development') {
		envLogger.info('🔧 Configuración ENV:', {
			NODE_ENV: ENV.NODE_ENV,
			API_PORT: ENV.API_PORT,
			DATABASE_URL: ENV.DATABASE_URL,
		});
	}
}
