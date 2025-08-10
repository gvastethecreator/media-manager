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
	data?: AnyEntityWithStats[];
	filterFn?: (item: AnyEntityWithStats) => boolean;
	sortFn?: (a: AnyEntityWithStats, b: AnyEntityWithStats) => number;
	searchTerm?: string;
	onPerformanceMetrics?: (metrics: PerformanceMetrics) => void;
}

interface PerformanceMetrics {
	renderTime: number;
	filterTime: number;
	sortTime: number;
	itemCount: number;
	memoryUsage: number;
	averageFPS: number;
	timestamp: number;
}

interface PerformanceState {
	config: PerformanceConfig;
	metrics: PerformanceMetrics | null;
	isMonitoring: boolean;
	processedData: AnyEntityWithStats[];
	isLoading: boolean;
}

interface PerformanceActions {
	startMonitoring: () => void;
	stopMonitoring: () => void;
	updateConfig: (updates: Partial<PerformanceConfig>) => Promise<void>;
	updateMetrics: () => void;
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
	const key = JSON.stringify(deps);
	const cache = cacheRef.current;
	const now = Date.now();
	// Limpiar entradas expiradas
	for (const [cacheKey, entry] of cache.entries()) {
		if (now - entry.timestamp > maxAge) {
			cache.delete(cacheKey);
		}
	}
	// Limitar tamaño máximo
	if (cache.size >= maxSize) {
		const oldestKey = cache.keys().next().value;
		if (oldestKey) {
			cache.delete(oldestKey);
		}
	}
	// Devolver de caché si es válido
	const cached = cache.get(key);
	if (cached && now - cached.timestamp < maxAge) {
		return cached.value;
	}
	// Calcular y guardar
	const value = factory();
	cache.set(key, { value, timestamp: now });
	return value;
}

export function usePerformance(options: UsePerformanceOptions = {}) {
	const { data = [], filterFn, sortFn, searchTerm, onPerformanceMetrics } = options;
	const { settings, updateSettings } = useSettings();
	const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
	const [isMonitoring, setIsMonitoring] = useState(false);
	const [isLoading] = useState(false);
	const lastFrameTimeRef = useRef(performance.now());
	const fpsHistoryRef = useRef<number[]>([]);

	// Config predeterminada
	const config = settings?.fileBrowser?.performance || {
		maxRenderItems: 1000,
		virtualization: true,
		virtualizationBuffer: 5,
		lazyThumbnails: true,
		thumbnailQuality: 'medium' as const,
		cache: { thumbnails: true, maxSize: 100, ttl: 3_600_000 },
		debounce: { search: 300, scroll: 16, resize: 100 },
	} satisfies PerformanceConfig as PerformanceConfig;

	const debouncedSearchTerm = useDebounce(searchTerm || '', config.debounce.search);

	// Medición de tiempo
	const measureTime = useCallback(<T,>(fn: () => T): { result: T; time: number } => {
		const start = performance.now();
		const result = fn();
		const time = performance.now() - start;
		return { result, time };
	}, []);

	// Filtrado
	const filteredData = useAdvancedMemo(
		() => {
			if (!(filterFn || debouncedSearchTerm)) {
				return data;
			}
			return measureTime(() => {
				let result = data;
				if (filterFn) {
					result = result.filter(filterFn);
				}
				if (debouncedSearchTerm) {
					const search = debouncedSearchTerm.toLowerCase();
					result = result.filter((item) => (item?.name || '').toLowerCase().includes(search));
				}
				return result;
			}).result;
		},
		[data, filterFn, debouncedSearchTerm, measureTime]
	);

	// Ordenamiento
	const sortedData = useAdvancedMemo(
		() => {
			if (!sortFn) {
				return filteredData;
			}
			return measureTime(() => [...filteredData].sort(sortFn)).result;
		},
		[filteredData, sortFn, measureTime]
	);

	// Límite
	const processedData = useMemo(() => {
		const maxItems = config.maxRenderItems;
		return sortedData.slice(0, maxItems);
	}, [sortedData, config.maxRenderItems]);

	// FPS
	const calculateFPS = useCallback(() => {
		const now = performance.now();
		const delta = now - lastFrameTimeRef.current;
		if (delta > 0) {
			const fps = 1000 / delta;
			fpsHistoryRef.current.push(fps);
			if (fpsHistoryRef.current.length > 60) {
				fpsHistoryRef.current.shift();
			}
		}
		lastFrameTimeRef.current = now;
		if (isMonitoring) {
			requestAnimationFrame(calculateFPS);
		}
	}, [isMonitoring]);

	const estimateMemoryUsage = useCallback(() => {
		const itemSize = 0.001; // ~1KB por item
		const thumbnailSize = 0.05; // ~50KB por thumbnail
		const baseUsage = processedData.length * itemSize;
		const thumbnailUsage = config.lazyThumbnails ? processedData.length * 0.1 * thumbnailSize : processedData.length * thumbnailSize;
		return baseUsage + thumbnailUsage;
	}, [processedData.length, config.lazyThumbnails]);

	const updateMetrics = useCallback(() => {
		if (!isMonitoring) {
			return;
		}
		const now = performance.now();
		const averageFPS = fpsHistoryRef.current.length > 0 ? fpsHistoryRef.current.reduce((a, b) => a + b, 0) / fpsHistoryRef.current.length : 60;
		const newMetrics: PerformanceMetrics = {
			renderTime: 0,
			filterTime: 0,
			sortTime: 0,
			itemCount: processedData.length,
			memoryUsage: estimateMemoryUsage(),
			averageFPS,
			timestamp: now,
		};
		setMetrics(newMetrics);
		onPerformanceMetrics?.(newMetrics);
	}, [isMonitoring, processedData.length, estimateMemoryUsage, onPerformanceMetrics]);

	const startMonitoring = useCallback(() => {
		if (!isMonitoring) {
			setIsMonitoring(true);
			requestAnimationFrame(calculateFPS);
		}
	}, [isMonitoring, calculateFPS]);

	const stopMonitoring = useCallback(() => {
		setIsMonitoring(false);
		fpsHistoryRef.current = [];
	}, []);

	const updateConfig = useCallback(
		async (updates: Partial<PerformanceConfig>) => {
			await updateSettings({
				fileBrowser: {
					...settings?.fileBrowser,
					performance: { ...config, ...updates },
				},
			});
		},
		[updateSettings, settings?.fileBrowser, config]
	);

	const clearCache = useCallback(() => {
		if ('caches' in window) {
			caches.delete('thumbnails').catch(() => {
				// Ignorar fallo al borrar caché (puede no existir)
			});
		}
		for (const key of Object.keys(localStorage)) {
			if (key.startsWith('thumbnail-') || key.startsWith('cache-')) {
				localStorage.removeItem(key);
			}
		}
	}, []);

	useEffect(() => {
		if (!isMonitoring) {
			return;
		}
		const interval = setInterval(updateMetrics, 1000);
		return () => clearInterval(interval);
	}, [isMonitoring, updateMetrics]);

	useEffect(() => () => stopMonitoring(), [stopMonitoring]);

	const state: PerformanceState = { config, metrics, isMonitoring, processedData, isLoading };
	const actions: PerformanceActions = { startMonitoring, stopMonitoring, updateConfig, updateMetrics, clearCache };

	return { ...state, ...actions, measureTime, debouncedSearchTerm };
}

export type { PerformanceMetrics, PerformanceState, PerformanceActions, UsePerformanceOptions };
export { useDebounce, useAdvancedMemo };

