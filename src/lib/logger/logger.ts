/**
 * @deprecated Este archivo está obsoleto. Usa enhancedLogger de '@/lib/logger/enhanced-logger' en su lugar.
 * Se mantiene por compatibilidad con código existente.
 */

/**
 * Archivo principal de exportación del logger
 *
 * Este archivo exporta el logger del servidor para ser usado en toda la aplicación.
 */

// Exportar desde el archivo del servidor para mantener compatibilidad
export { createServerServiceLogger , serverLogger as logger } from './server-logger';
