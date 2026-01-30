import { useEffect } from 'react';
import { useSystemInit } from '@/lib/hooks/system/use-system-service';
import { clientLogger } from '@/lib/logger/client-logger';

// Logger específico para este componente
const logger = clientLogger.withContext('ServerInitializer');

/**
 * Componente que inicializa el servidor automáticamente
 *
 * Este componente se debe incluir en el  principal de la aplicación.
 * Realiza una llamada a la API de inicialización del servidor cuando
 * la aplicación se carga en el navegador.
 */
export function ServerInitializer() {
	// Usar React Query mutation en lugar de server action
	const initServerMutation = useSystemInit();

	useEffect(() => {
		// Función para inicializar el servidor
		const runInitServer = async () => {
			try {
				logger.info('Inicializando servidor...');
				await initServerMutation.mutateAsync();
				logger.success('Servidor inicializado correctamente');
			} catch (error) {
				logger.error('Error al inicializar el servidor', {
					error: error instanceof Error ? error.message : String(error),
					fullError: error,
				});
			}
		};

		// Inicializar servidor cuando el componente se monta
		runInitServer();
	}, [initServerMutation]);

	// Este componente no renderiza nada visible
	return null;
}
