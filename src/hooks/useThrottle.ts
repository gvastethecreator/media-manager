import { useCallback, useRef } from 'react';

/**
 * Hook para throttling de funciones - limita la frecuencia de ejecución
 * @param callback Función a throttlear
 * @param delay Delay en ms entre ejecuciones
 * @returns Función throttleada
 */
export function useThrottle<T extends (...args: any[]) => any>(
	callback: T,
	delay: number
): (...args: Parameters<T>) => void {
	const lastRun = useRef<number>(0);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	return useCallback(
		(...args: Parameters<T>) => {
			const now = Date.now();

			if (now - lastRun.current >= delay) {
				// Ejecutar inmediatamente si ha pasado el delay
				lastRun.current = now;
				callback(...args);
			} else {
				// Programar ejecución para el final del período de throttle
				if (timeoutRef.current) {
					clearTimeout(timeoutRef.current);
				}

				timeoutRef.current = setTimeout(
					() => {
						lastRun.current = Date.now();
						callback(...args);
					},
					delay - (now - lastRun.current)
				);
			}
		},
		[callback, delay]
	);
}

/**
 * Hook para debouncing de funciones - retrasa la ejecución hasta que paren las llamadas
 * @param callback Función a debouncear
 * @param delay Delay en ms antes de ejecutar
 * @returns Función debounceada
 */
export function useDebounce<T extends (...args: any[]) => any>(
	callback: T,
	delay: number
): (...args: Parameters<T>) => void {
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	return useCallback(
		(...args: Parameters<T>) => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}

			timeoutRef.current = setTimeout(() => {
				callback(...args);
			}, delay);
		},
		[callback, delay]
	);
}

/**
 * Hook basado en requestAnimationFrame: coalescea múltiples llamadas en un mismo frame.
 * Ideal para renders en canvas y handlers de scroll/resize.
 */
export function useRaf<T extends (...args: any[]) => any>(callback: T): (...args: Parameters<T>) => void {
	const frameRef = useRef<number | null>(null);
	const lastArgsRef = useRef<Parameters<T> | null>(null);

	return useCallback(
		(...args: Parameters<T>) => {
			lastArgsRef.current = args;
			if (frameRef.current != null) return;

			frameRef.current = requestAnimationFrame(() => {
				frameRef.current = null;
				const a = lastArgsRef.current as Parameters<T> | null;
				if (a) callback(...a);
			});
		},
		[callback]
	);
}
