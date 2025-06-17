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
// Re-exportar enhanced-logger para compatibilidad
export {
	createEnhancedServiceLogger,
	EnhancedLogger,
} from './enhanced-logger';

// Exportar configuración y tipos
export {
	type LoggerConfig,
	LoggerConfigSchema,
	type LogLevel,
	LogLevelSchema,
	loggerConfig,
} from './logger.config';
// Exportar directamente desde el logger del servidor
export {
	createServerServiceLogger as createLogger,
	ServerLogger as Logger,
	ServerLogger, // Exportar ServerLogger también como Logger para compatibilidad
	serverLogger,
} from './server-logger';
