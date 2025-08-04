/**
 * @file Hook para optimizaciones de rendimiento en el navegador de archivos
 * @module hooks/use-performance
 * @description Proporciona optimizaciones de rendimiento y monitoreo
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSettings } from '@/hooks/use-settings';
import type { PerformanceConfig } from '@/transformers/settings/schema';
import type { AnyEntityWithStats } from '@/types/migration';

interface UsePerformanceOptions {
	/** Datos a procesar */
	data?: AnyEntityWithStats[];
	/** Función de filtrado */
	filterFn?: (item: AnyEntityWithStats) => boolean;
	/** Función de ordenamiento */
	sortFn?: (a: AnyEntityWithStats, b: AnyEntityWithStats) => number;
	/** Término de búsqueda */
	searchTerm?: string;
	/** Callback para métricas de rendimiento */
	onPerformanceMetrics?: (metrics: PerformanceMetrics) => void;
}

interface PerformanceMetrics {
	/** Tiempo de renderizado en ms */
	renderTime: number;
	/** Tiempo de filtrado en ms */
	filterTime: number;
	/** Tiempo de ordenamiento en ms */
	sortTime: number;
	/** Número de elementos procesados */
	itemCount: number;
	/** Uso de memoria estimado en MB */
	memoryUsage: number;
	/** FPS promedio */
	averageFPS: number;
	/** Timestamp de la medición */
	timestamp: number;
}

interface PerformanceState {
	/** Configuración de rendimiento actual */
	config: PerformanceConfig;
	/** Métricas de rendimiento actuales */
	metrics: PerformanceMetrics | null;
	/** Si el monitoreo está activo */
	isMonitoring: boolean;
	/** Datos procesados y optimizados */
	processedData: AnyEntityWithStats[];
	/** Si está cargando */
	isLoading: boolean;
}

interface PerformanceActions {
	/** Inicia el monitoreo de rendimiento */
	startMonitoring: () => void;
	/** Detiene el monitoreo de rendimiento */
	stopMonitoring: () => void;
	/** Actualiza la configuración de rendimiento */
	updateConfig: (updates: Partial<PerformanceConfig>) => Promise<void>;
	/** Fuerza una actualización de métricas */
	updateMetrics: () => void;
	/** Limpia la caché */
	clearCache: () => void;
}

// Hook para debouncing
function useDebounce<T>(value: T, delay: number): T {
	const [debouncedValue, setDebouncedValue] = useState<T>(value);

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		return () => {
			clearTimeout(handler);
		};
	}, [value, delay]);

	return debouncedValue;
}

// Hook para memoización avanzada
function useAdvancedMemo<T>(
	factory: () => T,
	deps: React.DependencyList,
	options: { maxAge?: number; maxSize?: number } = {}
): T {
	const { maxAge = 5000, maxSize = 100 } = options;
	const cacheRef = useRef(new Map<string, { value: T; timestamp: number }>());

	const key = useMemo(() => JSON.stringify(deps), deps);

	return useMemo(() => {
		const cache = cacheRef.current;
		const now = Date.now();

		// Limpiar entradas expiradas
		for (const [cacheKey, entry] of cache.entries()) {
			if (now - entry.timestamp > maxAge) {
				cache.delete(cacheKey);
			}
		}

		// Limpiar si excede el tamaño máximo
		if (cache.size >= maxSize) {
			const oldestKey = cache.keys().next().value;
			if (oldestKey) cache.delete(oldestKey);
		}

		// Verificar si existe en caché
		const cached = cache.get(key);
		if (cached && now - cached.timestamp < maxAge) {
			return cached.value;
		}

		// Calcular nuevo valor
		const value = factory();
		cache.set(key, { value, timestamp: now });

		return value;
	}, [key, factory, maxAge, maxSize]);
}

export function usePerformance(options: UsePerformanceOptions = {}) {
	const { data = [], filterFn, sortFn, searchTerm, onPerformanceMetrics } = options;
	const { settings, updateSettings } = useSettings();
	const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
	const [isMonitoring, setIsMonitoring] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const performanceObserverRef = useRef<PerformanceObserver | null>(null);
	const frameCountRef = useRef(0);
	const lastFrameTimeRef = useRef(performance.now());
	const fpsHistoryRef = useRef<number[]>([]);

	// Configuración de rendimiento actual
	const config = settings?.fileBrowser?.performance || {
		maxRenderItems: 1000,
		virtualization: true,
		virtualizationBuffer: 5,
		lazyThumbnails: true,
		thumbnailQuality: 'medium' as const,
		cache: {
			thumbnails: true,
			maxSize: 100,
			ttl: 3600000,
		},
		debounce: {
			search: 300,
			scroll: 16,
			resize: 100,
		},
	};

	// Debounce del término de búsqueda
	const debouncedSearchTerm = useDebounce(searchTerm || '', config.debounce.search);

	// Función para medir tiempo de ejecución
	const measureTime = useCallback(
		<T>(fn: () => T, label: string): { result: T; time: number } => {
			const start = performance.now();
			const result = fn();
			const time = performance.now() - start;

			if (isMonitoring) {
				console.log(`⚡ Performance [${label}]: ${time.toFixed(2)}ms`);
			}

			return { result, time };
		},
		[isMonitoring]
	);

	// Filtrado optimizado con memoización
	const filteredData = useAdvancedMemo(
		() => {
			if (!filterFn && !debouncedSearchTerm) return data;

			return measureTime(() => {
				let result = data;

				// Aplicar filtro personalizado
				if (filterFn) {
					result = result.filter(filterFn);
				}

				// Aplicar búsqueda
				if (debouncedSearchTerm) {
					const searchLower = debouncedSearchTerm.toLowerCase();
					result = result.filter(
						(item) =>
							item.name?.toLowerCase().includes(searchLower) ||
							('description' in item ? item.description?.toLowerCase().includes(searchLower) : false)
					);
				}

				return result;
			}, 'Filter').result;
		},
		[data, filterFn, debouncedSearchTerm, measureTime],
		{ maxAge: 2000, maxSize: 50 }
	);

	// Ordenamiento optimizado con memoización
	const sortedData = useAdvancedMemo(
		() => {
			if (!sortFn) return filteredData;

			return measureTime(() => {
				return [...filteredData].sort(sortFn);
			}, 'Sort').result;
		},
		[filteredData, sortFn, measureTime],
		{ maxAge: 2000, maxSize: 50 }
	);

	// Datos finales con límite de rendimiento
	const processedData = useMemo(() => {
		const maxItems = config.maxRenderItems;
		return sortedData.slice(0, maxItems);
	}, [sortedData, config.maxRenderItems]);

	// Función para calcular FPS
	const calculateFPS = useCallback(() => {
		const now = performance.now();
		const delta = now - lastFrameTimeRef.current;

		if (delta > 0) {
			const fps = 1000 / delta;
			fpsHistoryRef.current.push(fps);

			// Mantener solo los últimos 60 frames
			if (fpsHistoryRef.current.length > 60) {
				fpsHistoryRef.current.shift();
			}
		}

		lastFrameTimeRef.current = now;
		frameCountRef.current++;

		if (isMonitoring) {
			requestAnimationFrame(calculateFPS);
		}
	}, [isMonitoring]);

	// Función para estimar uso de memoria
	const estimateMemoryUsage = useCallback(() => {
		// Estimación básica basada en el número de elementos
		const itemSize = 0.001; // ~1KB por item
		const thumbnailSize = 0.05; // ~50KB por thumbnail
		const baseUsage = processedData.length * itemSize;
		const thumbnailUsage = config.lazyThumbnails
			? processedData.length * 0.1 * thumbnailSize
			: // Solo 10% cargados
				processedData.length * thumbnailSize;

		return baseUsage + thumbnailUsage;
	}, [processedData.length, config.lazyThumbnails]);

	// Función para actualizar métricas
	const updateMetrics = useCallback(() => {
		if (!isMonitoring) return;

		const now = performance.now();
		const averageFPS =
			fpsHistoryRef.current.length > 0
				? fpsHistoryRef.current.reduce((a, b) => a + b, 0) / fpsHistoryRef.current.length
				: 60;

		const newMetrics: PerformanceMetrics = {
			renderTime: 0, // Se actualizará en el componente
			filterTime: 0, // Se actualizará durante el filtrado
			sortTime: 0, // Se actualizará durante el ordenamiento
			itemCount: processedData.length,
			memoryUsage: estimateMemoryUsage(),
			averageFPS,
			timestamp: now,
		};

		setMetrics(newMetrics);
		onPerformanceMetrics?.(newMetrics);
	}, [isMonitoring, processedData.length, estimateMemoryUsage, onPerformanceMetrics]);

	// Función para iniciar monitoreo
	const startMonitoring = useCallback(() => {
		setIsMonitoring(true);

		// Iniciar cálculo de FPS
		requestAnimationFrame(calculateFPS);

		// Configurar Performance Observer si está disponible
		if ('PerformanceObserver' in window) {
			try {
				const observer = new PerformanceObserver((list) => {
					const entries = list.getEntries();
					for (const entry of entries) {
						if (entry.entryType === 'measure') {
							console.log(`📊 Performance Measure [${entry.name}]: ${entry.duration.toFixed(2)}ms`);
						}
					}
				});

				observer.observe({ entryTypes: ['measure', 'navigation', 'paint'] });
				performanceObserverRef.current = observer;
			} catch (error) {
				console.warn('Performance Observer not supported:', error);
			}
		}
	}, [calculateFPS]);

	// Función para detener monitoreo
	const stopMonitoring = useCallback(() => {
		setIsMonitoring(false);

		if (performanceObserverRef.current) {
			performanceObserverRef.current.disconnect();
			performanceObserverRef.current = null;
		}

		// Limpiar historial de FPS
		fpsHistoryRef.current = [];
		frameCountRef.current = 0;
	}, []);

	// Función para actualizar configuración
	const updateConfig = useCallback(
		async (updates: Partial<PerformanceConfig>) => {
			await updateSettings({
				fileBrowser: {
					...settings?.fileBrowser,
					performance: {
						...config,
						...updates,
					},
				},
			});
		},
		[updateSettings, settings?.fileBrowser, config]
	);

	// Función para limpiar caché
	const clearCache = useCallback(() => {
		// Limpiar caché de thumbnails si está disponible
		if ('caches' in window) {
			caches.delete('thumbnails').catch(console.warn);
		}

		// Limpiar localStorage relacionado
		Object.keys(localStorage).forEach((key) => {
			if (key.startsWith('thumbnail-') || key.startsWith('cache-')) {
				localStorage.removeItem(key);
			}
		});
	}, []);

	// Actualizar métricas periódicamente
	useEffect(() => {
		if (!isMonitoring) return;

		const interval = setInterval(updateMetrics, 1000);
		return () => clearInterval(interval);
	}, [isMonitoring, updateMetrics]);

	// Cleanup al desmontar
	useEffect(() => {
		return () => {
			stopMonitoring();
		};
	}, [stopMonitoring]);

	const state: PerformanceState = {
		config,
		metrics,
		isMonitoring,
		processedData,
		isLoading,
	};

	const actions: PerformanceActions = {
		startMonitoring,
		stopMonitoring,
		updateConfig,
		updateMetrics,
		clearCache,
	};

	return {
		...state,
		...actions,
		// Utilidades adicionales
		measureTime,
		debouncedSearchTerm,
	};
}

export type { PerformanceMetrics, PerformanceState, PerformanceActions, UsePerformanceOptions };
export { useDebounce, useAdvancedMemo };
