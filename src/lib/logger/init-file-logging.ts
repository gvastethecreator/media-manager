/**
 * @file Inicializador del sistema de logging de archivos
 * @module lib/logger/init-file-logging
 * @description Inicializa y configura el sistema de logging de archivos al arrancar el servidor
 */

import { reindexFileLogger } from './reindex-file-logger';
import { serverLogger } from './server-logger';

/**
 * Inicializa el sistema de logging de archivos
 */
export function initializeFileLogging(): void {
	try {
		// Test write to verify logging system is working
		reindexFileLogger.logWarning('monitor', 'File logging system initialized successfully', {
			context: {
				timestamp: new Date().toISOString(),
				logDirectory: 'logs/reindex',
				initializationTest: true,
			},
		});

		// Get initial stats
		const stats = reindexFileLogger.getLogStats();
		serverLogger.info('📝 Sistema de logging de archivos inicializado:');
		serverLogger.info(`   • Error log: ${stats.errorLogExists ? '✓' : '○'} (${stats.errorLogPath})`);
		serverLogger.info(`   • Warning log: ${stats.warningLogExists ? '✓' : '○'} (${stats.warningLogPath})`);

		// Schedule periodic cleanup (once per day at startup + 1 hour)
		const cleanupInterval = 24 * 60 * 60 * 1000; // 24 hours
		const initialDelay = 60 * 60 * 1000; // 1 hour after startup

		setTimeout(() => {
			serverLogger.info('🧹 Iniciando limpieza programada de logs antiguos...');
			reindexFileLogger.cleanupOldLogs();

			// Set up recurring cleanup
			setInterval(() => {
				serverLogger.info('🧹 Limpieza programada de logs antiguos...');
				reindexFileLogger.cleanupOldLogs();
			}, cleanupInterval);
		}, initialDelay);

		serverLogger.info('🕐 Limpieza automática de logs programada (cada 24h)');
	} catch (error) {
		serverLogger.error('❌ Could not initialize file logging system:', error);
		// Don't throw - allow server to continue without file logging
	}
}

/**
 * Función helper para obtener estadísticas del sistema de logging
 */
export function getLoggingSystemStatus() {
	try {
		const stats = reindexFileLogger.getLogStats();
		return {
			success: true,
			stats,
			errorLogActive: stats.errorLogExists,
			warningLogActive: stats.warningLogExists,
			totalLogSize: stats.errorLogSize + stats.warningLogSize,
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Error desconocido',
			stats: null,
		};
	}
}
