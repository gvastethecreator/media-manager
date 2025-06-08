'use client';

import { initServer as initServerAction } from '@/app/actions/system';
import { clientLogger } from '@/lib/logger/client-logger';
import { useEffect, useState } from 'react';

// Logger específico para este componente
const logger = clientLogger.withContext('ServerInitializer');

// Configuración para reintentos
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 segundos

/**
 * Componente que inicializa el servidor automáticamente
 *
 * Este componente se debe incluir en el layout principal de la aplicación.
 * Realiza una llamada a la API de inicialización del servidor cuando
 * la aplicación se carga en el navegador.
 */
export function ServerInitializer() {
	const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
	const [retries, setRetries] = useState(0);

	useEffect(() => {
		// Función para inicializar el servidor con reintentos
		const runInitServer = async () => {
			if (retries >= MAX_RETRIES) {
				logger.warn(`Máximo de reintentos (${MAX_RETRIES}) alcanzado, no se intentará nuevamente`);
				setStatus('error');
				return;
			}

			try {
				setStatus('loading');
				logger.info(`Inicializando servidor... (intento ${retries + 1}/${MAX_RETRIES + 1})`);

				try {
					await initServerAction();
					setStatus('success');
					logger.success('Servidor inicializado correctamente');
				} catch (fetchError) {
					if (fetchError instanceof Error) {
						logger.error('Error al inicializar:', fetchError);
						throw fetchError;
					}
					logger.error('Error desconocido capturado:', fetchError);
					throw new Error(String(fetchError));
				}
			} catch (error) {
				setStatus('error');
				logger.error('Error al inicializar el servidor', {
					error: error instanceof Error ? error.message : String(error),
					fullError: error,
					retry: retries + 1,
				});

				// Programar un reintento
				const nextRetry = retries + 1;
				if (nextRetry <= MAX_RETRIES) {
					logger.info(`Reintentando en ${RETRY_DELAY / 1000} segundos...`);
					setTimeout(() => {
						setRetries(nextRetry);
					}, RETRY_DELAY);
				}
			}
		};

		// Inicializar servidor cuando el componente se monta o cuando cambia el contador de reintentos
		runInitServer();

		// No es necesario limpiar nada cuando el componente se desmonta
	}, [retries]);

	// Este componente no renderiza nada visible
	return null;
}
