/**
 * Archivo principal para las exportaciones del logger
 *
 * Este archivo centraliza todas las exportaciones relacionadas con el logger
 * para mantener compatibilidad con diferentes patrones de importación en el código.
 */

// Exportar directamente desde el logger del servidor
export {
    ServerLogger as Logger, ServerLogger, // Exportar ServerLogger también como Logger para compatibilidad
    createServerServiceLogger as createLogger,
    serverLogger
} from './server-logger';

// Exportar el logger del cliente para componentes del lado del cliente
export {
    ClientLogger,
    clientLogger,
    createClientServiceLogger
} from './client-logger';

// Exportar configuración y tipos
export {
    LogLevelSchema,
    LoggerConfigSchema, loggerConfig, type LogLevel,
    type LoggerConfig
} from './logger.config';

// Re-exportar enhanced-logger para compatibilidad
export {
    EnhancedLogger,
    createEnhancedServiceLogger
} from './enhanced-logger';
