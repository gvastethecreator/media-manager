'use client';

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
		const initServer = async () => {
			if (retries >= MAX_RETRIES) {
				logger.warn(`Máximo de reintentos (${MAX_RETRIES}) alcanzado, no se intentará nuevamente`);
				setStatus('error');
				return;
			}

			try {
				setStatus('loading');
				logger.info(`Inicializando servidor... (intento ${retries + 1}/${MAX_RETRIES + 1})`);

				// Llamar a la API de inicialización con timeout
				const controller = new AbortController();
				const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos de timeout

				try {
					const response = await fetch('/api/init-server', {
						signal: controller.signal,
						// Evitar caché
						cache: 'no-store',
						headers: {
							'Cache-Control': 'no-cache, no-store, must-revalidate',
							Pragma: 'no-cache',
							Expires: '0',
						},
					});

					// Limpiar timeout
					clearTimeout(timeoutId);

					// Verificar si la respuesta es exitosa
					if (!response.ok) {
						throw new Error(`Error en la respuesta: ${response.status} ${response.statusText}`);
					}

					const data = await response.json();

					if (data.success) {
						setStatus('success');
						logger.success('Servidor inicializado correctamente', data);
					} else {
						throw new Error(data.message || 'Error desconocido al inicializar el servidor');
					}
				} catch (fetchError) {
					// Limpiar timeout si aún existe
					clearTimeout(timeoutId);

					// Manejar errores específicos de fetch
					if (fetchError instanceof Error) {
						if (fetchError.name === 'AbortError') {
							throw new Error('Timeout al inicializar el servidor');
						}
						throw fetchError;
					}
					throw new Error(String(fetchError));
				}
			} catch (error) {
				setStatus('error');
				logger.error('Error al inicializar el servidor', {
					error: error instanceof Error ? error.message : String(error),
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
		initServer();

		// No es necesario limpiar nada cuando el componente se desmonta
	}, [retries]);

	// Este componente no renderiza nada visible
	return null;
}
