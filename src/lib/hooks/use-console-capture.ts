'use client';

import { useEffect, useRef } from 'react';
import { type LogEntry } from '@/components/ui/log-viewer';

type ConsoleMethods = 'log' | 'info' | 'warn' | 'error' | 'debug';

interface UseConsoleCapture {
	/**
	 * Función para iniciar la captura de logs de consola
	 */
	startCapture: () => void;

	/**
	 * Función para detener la captura de logs de consola
	 */
	stopCapture: () => void;

	/**
	 * Indica si la captura está activa
	 */
	isCapturing: boolean;
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
	const originalConsole = useRef<Record<ConsoleMethods, any>>({} as any);

	// Iniciar captura
	const startCapture = () => {
		if (isCapturingRef.current) return;

		// Guardar las funciones originales
		methods.forEach((method) => {
			originalConsole.current[method] = console[method];

			// Reemplazar con nuestra función
			console[method] = (...args: any[]) => {
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
					case 'info':
					case 'log':
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
		});

		isCapturingRef.current = true;
	};

	// Detener captura
	const stopCapture = () => {
		if (!isCapturingRef.current) return;

		// Restaurar funciones originales
		methods.forEach((method) => {
			if (originalConsole.current[method]) {
				console[method] = originalConsole.current[method];
			}
		});

		isCapturingRef.current = false;
	};

	// Limpiar al desmontar
	useEffect(() => {
		return () => {
			if (isCapturingRef.current) {
				stopCapture();
			}
		};
	}, []);

	return {
		startCapture,
		stopCapture,
		isCapturing: isCapturingRef.current,
	};
}
