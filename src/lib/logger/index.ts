/**
 * Archivo principal para las exportaciones del logger
 *
 * Este archivo centraliza todas las exportaciones relacionadas con el logger
 * para mantener compatibilidad con diferentes patrones de importación en el código.
 */

// Exportar el logger del cliente para componentes del lado del cliente
export {
	ClientLogger,
	clientLogger,
	createClientServiceLogger,
} from './client-logger';
// enhanced-logger eliminado - usar serverLogger en su lugar

// Exportar configuración y tipos
export {
	LogLevelSchema,
	LoggerConfigSchema,
	loggerConfig,
	type LogLevel,
	type LoggerConfig,
} from './logger.config';
// Exportar directamente desde el logger del servidor
export {
	ServerLogger as Logger,
	ServerLogger,
	createServerServiceLogger as createLogger, // Exportar ServerLogger también como Logger para compatibilidad
	serverLogger,
} from './server-logger';
