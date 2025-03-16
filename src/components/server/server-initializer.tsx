'use client';

import { serverLogger } from '@/lib/logger/server-logger';
import { useEffect, useState } from 'react';

// Logger específico para este componente
const logger = serverLogger.withContext('ServerInitializer');

/**
 * Componente que inicializa el servidor automáticamente
 *
 * Este componente se debe incluir en el layout principal de la aplicación.
 * Realiza una llamada a la API de inicialización del servidor cuando
 * la aplicación se carga en el navegador.
 */
export function ServerInitializer() {
	const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

	useEffect(() => {
		const initServer = async () => {
			try {
				setStatus('loading');
				logger.info('Inicializando servidor...');

				// Llamar a la API de inicialización
				const response = await fetch('/api/init-server');
				const data = await response.json();

				if (data.success) {
					setStatus('success');
					logger.success('Servidor inicializado correctamente', data);
				} else {
					setStatus('error');
					logger.error('Error al inicializar el servidor', data);
				}
			} catch (error) {
				setStatus('error');
				logger.error('Error al llamar a la API de inicialización', {
					error: error instanceof Error ? error.message : String(error),
				});
			}
		};

		// Inicializar servidor cuando el componente se monta
		initServer();

		// No es necesario limpiar nada cuando el componente se desmonta
	}, []);

	// Este componente no renderiza nada visible
	return null;
}
