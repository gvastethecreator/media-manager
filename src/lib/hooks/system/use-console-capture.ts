'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { LogEntry } from '@/components/ui/log-viewer';

type ConsoleMethods = 'log' | 'info' | 'warn' | 'error' | 'debug';
type ConsoleFunction = (...args: unknown[]) => void;

interface UseConsoleCapture {
	/**
	 * Indica si la captura está activa
	 */
	isCapturing: boolean;
	/**
	 * Función para iniciar la captura de logs de consola
	 */
	startCapture: () => void;

	/**
	 * Función para detener la captura de logs de consola
	 */
	stopCapture: () => void;
}

/**
 * Hook para capturar los logs de consola y redirigirlos a un callback
 * @param onCaptureLog Callback que se ejecuta cuando se captura un log
 * @param methods Métodos de consola a capturar
 * @returns Objeto con funciones para controlar la captura
 */
export function useConsoleCapture(
	onCaptureLog: (log: LogEntry) => void,
	methods: ConsoleMethods[] = ['log', 'info', 'warn', 'error', 'debug']
): UseConsoleCapture {
	const isCapturingRef = useRef(false);
	const originalConsole = useRef<Record<ConsoleMethods, ConsoleFunction>>(
		{} as Record<ConsoleMethods, ConsoleFunction>
	);

	// Iniciar captura
	const startCapture = useCallback(() => {
		if (isCapturingRef.current) {
			return;
		}

		// Guardar las funciones originales
		for (const method of methods) {
			originalConsole.current[method] = console[method];

			// Reemplazar con nuestra función
			console[method] = (...args: unknown[]) => {
				// Llamar a la función original
				originalConsole.current[method](...args);

				// Extraer mensaje y datos
				const message = args[0]?.toString() || '';
				const data = args.length > 1 ? args.slice(1) : undefined;

				// Mapear el nivel de log
				let level: LogEntry['level'] = 'info';
				switch (method) {
					case 'debug':
						level = 'debug';
						break;
					case 'warn':
						level = 'warn';
						break;
					case 'error':
						level = 'error';
						break;
					default:
						level = 'info';
						break;
				}

				// Crear entrada de log
				const logEntry: LogEntry = {
					id: Date.now().toString(),
					timestamp: new Date().toISOString(),
					level,
					message,
					data: data?.length ? data : undefined,
				};

				// Enviar al callback
				onCaptureLog(logEntry);
			};
		}

		isCapturingRef.current = true;
	}, [methods, onCaptureLog]);

	// Detener captura
	const stopCapture = useCallback(() => {
		if (!isCapturingRef.current) {
			return;
		}

		// Restaurar funciones originales
		for (const method of methods) {
			if (originalConsole.current[method]) {
				console[method] = originalConsole.current[method];
			}
		}

		isCapturingRef.current = false;
	}, [methods]);

	// Limpiar al desmontar
	useEffect(() => {
		return () => {
			if (isCapturingRef.current) {
				stopCapture();
			}
		};
	}, [stopCapture]);

	return {
		startCapture,
		stopCapture,
		isCapturing: isCapturingRef.current,
	};
}
