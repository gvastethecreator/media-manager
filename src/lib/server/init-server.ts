/**
 * Inicialización del servidor
 *
 * Este módulo se encarga de inicializar todos los componentes del servidor,
 * incluyendo loggers, monitores y otros servicios.
 */

import { appMonitor } from './app-monitor';
import { serverLogger } from '../logger/server-logger';

// Logger específico para la inicialización
const initLogger = serverLogger.withContext('ServerInit');

// Variable para controlar si ya se ha inicializado
let isInitialized = false;

/**
 * Inicializa todos los componentes del servidor
 */
export function initializeServer() {
	// Evitar inicialización múltiple
	if (isInitialized) {
		initLogger.warn('El servidor ya ha sido inicializado');
		return;
	}

	try {
		// Registrar inicio de la aplicación
		initLogger.info('Iniciando servidor...');

		// Iniciar monitor de aplicación
		appMonitor.logStartup();

		// Iniciar monitor con intervalos personalizados
		const stopMonitor = appMonitor.start({
			interval: 60000, // Estadísticas de aplicación cada 1 minuto
			includeSystemStats: true,
			systemStatsInterval: 300000, // Estadísticas de sistema cada 5 minutos
		});

		// Configurar cierre limpio
		setupCleanShutdown(stopMonitor);

		// Marcar como inicializado
		isInitialized = true;

		initLogger.success('Servidor inicializado correctamente');
	} catch (error) {
		initLogger.error('Error al inicializar el servidor', {
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		});

		// Registrar error en las estadísticas
		appMonitor.trackError(error instanceof Error ? error : new Error(String(error)), 'server-init');
	}
}

/**
 * Configura manejadores para cierre limpio del servidor
 * @param stopMonitor Función para detener el monitor
 */
function setupCleanShutdown(stopMonitor: () => void) {
	// Manejar señales de terminación
	const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];

	for (const signal of signals) {
		process.on(signal, () => {
			initLogger.info(`Señal ${signal} recibida, cerrando servidor...`);

			// Detener monitor
			stopMonitor();

			// Registrar apagado
			appMonitor.logShutdown();

			// Dar tiempo para que los logs se escriban
			setTimeout(() => {
				initLogger.info('Servidor cerrado correctamente');
				process.exit(0);
			}, 500);
		});
	}

	// Manejar excepciones no capturadas
	process.on('uncaughtException', (error) => {
		initLogger.error('Excepción no capturada', {
			error: error.message,
			stack: error.stack,
		});

		// Registrar error en las estadísticas
		appMonitor.trackError(error, 'uncaught-exception');
	});

	// Manejar rechazos de promesas no capturados
	process.on('unhandledRejection', (reason) => {
		initLogger.error('Rechazo de promesa no manejado', {
			reason: reason instanceof Error ? reason.message : String(reason),
			stack: reason instanceof Error ? reason.stack : undefined,
		});

		// Registrar error en las estadísticas
		appMonitor.trackError(reason instanceof Error ? reason : new Error(String(reason)), 'unhandled-rejection');
	});
}

// Exportar función de inicialización
export default initializeServer;
