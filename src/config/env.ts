/**
 * @file Configuración de variables de entorno
 * @module config/env
 * @description Configuración de variables de entorno sin dotenv para compatibilidad con bundling
 */

// Exportar configuración para uso en otros módulos
export const ENV = {
	NODE_ENV: process.env.NODE_ENV || 'development',
	API_PORT: process.env.API_PORT || process.env.PORT || '3001',
	DATABASE_URL: process.env.DATABASE_URL || 'file:./db.sqlite',
	VITE_API_URL: process.env.VITE_API_URL || 'http://localhost:3001/api',
	CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
} as const;

// Validar variables críticas en el servidor
if (typeof window === 'undefined') {
	if (!ENV.DATABASE_URL) {
		throw new Error(
			'DATABASE_URL no está definida. Asegúrate de tener un archivo .env con la configuración de la base de datos.'
		);
	}
}
