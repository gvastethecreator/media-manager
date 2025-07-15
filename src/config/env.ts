/**
 * @file Configuración de variables de entorno
 * @module config/env
 * @description Configuración de variables de entorno sin dotenv para compatibilidad con bundling
 */

// Detectar si estamos ejecutando en Tauri
const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;
const isTauriDev = process.env.TAURI_ENV === 'dev';

// Exportar configuración para uso en otros módulos
export const ENV = {
	NODE_ENV: process.env.NODE_ENV || 'development',
	API_PORT: process.env.API_PORT || process.env.PORT || '3001',
	DATABASE_URL: process.env.DATABASE_URL || 'file:./db.sqlite',
	VITE_API_URL: process.env.VITE_API_URL || 'http://localhost:3001/api',
	CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
	IS_TAURI: isTauri,
	IS_TAURI_DEV: isTauriDev,
} as const;

// Validar variables críticas en el servidor
if (typeof window === 'undefined') {
	if (!ENV.DATABASE_URL) {
		console.error('❌ DATABASE_URL no está definida');
		console.error('Variables disponibles:', {
			NODE_ENV: process.env.NODE_ENV,
			DATABASE_URL: process.env.DATABASE_URL,
			TAURI_ENV: process.env.TAURI_ENV,
		});
		throw new Error(
			'DATABASE_URL no está definida. Asegúrate de tener un archivo .env con la configuración de la base de datos.'
		);
	}

	// Log de configuración en desarrollo
	if (ENV.NODE_ENV === 'development') {
		console.log('🔧 Configuración ENV:', {
			NODE_ENV: ENV.NODE_ENV,
			API_PORT: ENV.API_PORT,
			DATABASE_URL: ENV.DATABASE_URL,
			IS_TAURI: ENV.IS_TAURI,
			IS_TAURI_DEV: ENV.IS_TAURI_DEV,
		});
	}
}
