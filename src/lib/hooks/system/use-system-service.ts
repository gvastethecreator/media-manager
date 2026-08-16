'use client';

import { useMutation } from '@tanstack/react-query';
import { serverLogger } from '@/lib/logger/server-logger';

const systemLogger = serverLogger.withContext('SystemService');

/**
 * Hook para inicializar el sistema
 * Proporciona una mutación para inicializar el servidor
 */
export function useSystemInit() {
	return useMutation({
		mutationFn: async () => {
			try {
				systemLogger.info('🚀 Inicializando sistema...');

				// Simular inicialización del sistema
				// En una implementación real, aquí se haría la llamada a la API
				await new Promise((resolve) => setTimeout(resolve, 1000));

				systemLogger.info('✅ Sistema inicializado correctamente');
				return { success: true, message: 'Sistema inicializado' };
			} catch (error) {
				systemLogger.error('❌ Error al inicializar sistema:', error);
				throw error;
			}
		},
		onSuccess: () => {
			systemLogger.info('🎉 Inicialización del sistema completada');
		},
		onError: (error) => {
			systemLogger.error('💥 System initialization failed:', error);
		},
	});
}

/**
 * Hook para obtener el estado del sistema
 */
export function useSystemStatus() {
	return useMutation({
		mutationFn: async () => {
			try {
				systemLogger.info('📊 Obteniendo estado del sistema...');

				// Simular obtención del estado
				await new Promise((resolve) => setTimeout(resolve, 500));

				return {
					status: 'running',
					uptime: Date.now(),
					version: '1.0.0',
					health: 'good',
				};
			} catch (error) {
				systemLogger.error('❌ Could not get system status:', error);
				throw error;
			}
		},
	});
}
