/**
 * @file Hook personalizado para lógica de datos del FileBrowser
 * @module components/features/file-browser/hooks/use-file-browser-data
 * @description Hook que maneja la carga, filtrado y ordenamiento de datos
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { useReindexFolder } from '@/lib/api/folders';
import { clientLogger } from '@/lib/logger/client-logger';
import { useImageStore } from '@/store/entities/image';
import { type SortOption, useViewOptionsStore } from '@/store/ui/view-options.slice';
import { type AnyEntityWithStats, EntityStatsType } from '@/types/migration';
import { DEBOUNCE_DELAY } from '../config/file-browser.config';
import type { FileBrowserDataState, SortingValues } from '../types/file-browser.types';
import {
	compareByField,
	extractEntityName,
	extractEntityPath,
	getItemsByType,
	getMixedItems,
	getMixedModeError,
	getSpecificModeError,
	getTypesToLoad,
	loadImagesForType,
} from '../utils/file-browser-helpers';

const logger = clientLogger.withContext('useFileBrowserData');

interface UseFileBrowserDataProps {
	entityType: EntityStatsType | 'mixed';
	entityTypes: EntityStatsType[];
	mode: 'auto' | 'manual';
	manualItems: AnyEntityWithStats[];
	filterId?: string;
	filterType?: 'folder' | 'collection' | 'tag' | 'album' | 'video';
}

export const useFileBrowserData = ({
	entityType,
	entityTypes,
	mode,
	manualItems,
	filterId,
	filterType,
}: UseFileBrowserDataProps): FileBrowserDataState => {
	// Estados del store
	const searchQuery = useViewOptionsStore((state) => state.searchQuery);
	const sortOptions = useViewOptionsStore((state) => state.sortOptions);

	// Store de entidades
	const { isLoading: imagesLoading, error: imagesError, getSortedImages, getImagesByFolder } = useImageStore();

	// Referencias para optimización
	const lastLoadParamsRef = useRef<string>('');
	const isLoadingRef = useRef<boolean>(false);
	const sortingCache = useRef(new Map<string, SortingValues>());

	// 🔧 MEJORADO: Control de auto-reindexado con cooldown y límite de intentos
	interface AutoReindexState {
		lastAttempt: number;
		attempts: number;
		maxAttempts: number;
		cooldownPeriod: number;
	}
	const autoReindexState = useRef<Map<string, AutoReindexState>>(new Map());
	const COOLDOWN_PERIOD = 5 * 60 * 1000; // 5 minutos
	const MAX_ATTEMPTS_PER_SESSION = 3;

	// Hook para reindexar carpetas automáticamente
	const reindexFolderMutation = useReindexFolder();

	// Función de auto-reindexado cuando se navega a una carpeta
	const checkAndAutoReindex = useCallback(
		async (folderId: string) => {
			// Verificaciones básicas
			if (mode !== 'auto' || filterType !== 'folder' || !folderId) {
				return;
			}

			// 🔧 Verificar estado de auto-reindexado con cooldown
			const now = Date.now();
			const folderState = autoReindexState.current.get(folderId) || {
				lastAttempt: 0,
				attempts: 0,
				maxAttempts: MAX_ATTEMPTS_PER_SESSION,
				cooldownPeriod: COOLDOWN_PERIOD,
			};

			// Verificar si estamos en cooldown period
			const timeSinceLastAttempt = now - folderState.lastAttempt;
			if (timeSinceLastAttempt < folderState.cooldownPeriod) {
				const remainingTime = Math.ceil((folderState.cooldownPeriod - timeSinceLastAttempt) / 1000);
				logger.debug(`🕒 Auto-reindex en cooldown para ${folderId}. Reintentar en ${remainingTime}s`);
				return;
			}

			// Verificar si se excedió el límite de intentos
			if (folderState.attempts >= folderState.maxAttempts) {
				logger.warn(
					`🚫 Límite de intentos alcanzado para auto-reindex de ${folderId} (${folderState.attempts}/${folderState.maxAttempts})`
				);
				return;
			}

			try {
				logger.info(
					`🔄 Auto-reindexando carpeta al navegar: ${folderId} (intento ${folderState.attempts + 1}/${folderState.maxAttempts})`
				);

				// Actualizar estado antes del intento
				folderState.lastAttempt = now;
				folderState.attempts++;
				autoReindexState.current.set(folderId, folderState);

				// Ejecutar reindexado en background
				await reindexFolderMutation.mutateAsync(folderId);

				// ✅ Forzar recarga inmediata de imágenes de la carpeta reindexada para reflejar cambios
				try {
					const { loadImages } = useImageStore.getState();
					await loadImages({ folderId, refresh: true });
					logger.info(`📁 Imágenes recargadas tras auto-reindex de carpeta: ${folderId}`);
				} catch (refreshErr) {
					logger.warn(`⚠️ Falló recarga post auto-reindex carpeta ${folderId}:`, refreshErr);
				}

				logger.info(`✅ Auto-reindexado completado para carpeta: ${folderId}`);

				// Reset attempts en caso de éxito
				folderState.attempts = 0;
				autoReindexState.current.set(folderId, folderState);
			} catch (autoReindexError) {
				logger.error(
					`❌ Error en auto-reindexado de carpeta ${folderId} (intento ${folderState.attempts}):`,
					autoReindexError
				);

				// Incrementar el cooldown period en caso de error para evitar spam
				folderState.cooldownPeriod = Math.min(folderState.cooldownPeriod * 1.5, 30 * 60 * 1000); // Máximo 30 minutos
				autoReindexState.current.set(folderId, folderState);
			}
		},
		[mode, filterType, reindexFolderMutation]
	);

	// Clave de parámetros estable
	const loadParamsKey = useMemo(() => {
		return `${entityType}|${entityTypes.join(',')}|${filterId}|${filterType}|${mode}`;
	}, [entityType, entityTypes, filterId, filterType, mode]);

	// Función de carga con debounce
	const debouncedLoadData = useDebouncedCallback(() => {
		if (mode === 'manual' || !filterId) {
			return;
		}

		if (lastLoadParamsRef.current === loadParamsKey || isLoadingRef.current) {
			return;
		}

		const typesToLoad = getTypesToLoad(entityType, entityTypes);

		for (const type of typesToLoad) {
			if (type === 'image') {
				loadImagesForType(filterId, filterType, loadParamsKey, lastLoadParamsRef, isLoadingRef);
			}
		}
	}, DEBOUNCE_DELAY);

	// Cargar datos cuando cambian los filtros
	useEffect(() => {
		debouncedLoadData();

		// 🔄 Auto-reindexado: Ejecutar cuando se navega a una carpeta específica
		if (filterId && filterType === 'folder') {
			checkAndAutoReindex(filterId);
		}
	}, [debouncedLoadData, filterId, filterType, checkAndAutoReindex]);

	// Obtener items en bruto
	const rawItems = useMemo(() => {
		if (mode === 'manual' && manualItems) {
			return manualItems;
		}

		if (entityType === 'mixed') {
			return getMixedItems(entityTypes, filterId, filterType, getImagesByFolder, getSortedImages);
		}

		return getItemsByType(entityType, filterId, filterType, getImagesByFolder, getSortedImages);
	}, [entityType, entityTypes, filterId, filterType, mode, manualItems, getSortedImages, getImagesByFolder]);

	// Limpiar cache de sorting cuando cambia sortVersion (invalidación explícita)
	// Invalidación manual de cache de ordenamiento basada en referencia de sortOptions
	const prevSortRef = useRef<SortOption[] | null>(null as any);
	if (prevSortRef.current !== sortOptions) {
		sortingCache.current.clear();
		prevSortRef.current = sortOptions;
	}

	// Función para obtener valores de ordenamiento con cache
	const getSortingValues = useCallback((entity: AnyEntityWithStats): SortingValues => {
		const cached = sortingCache.current.get(entity.id);
		if (cached) {
			return cached;
		}
		const values: SortingValues = {
			name: extractEntityName(entity).toLowerCase(),
			path: extractEntityPath(entity).toLowerCase(),
			modifiedTime: new Date((entity as any).updatedAt || (entity as any).modifiedAt || 0).getTime(),
			createdTime: new Date((entity as any).createdAt || 0).getTime(),
		};
		sortingCache.current.set(entity.id, values);
		return values;
	}, []);

	// Filtrar items (normaliza searchQuery por robustez en tests/mocks)
	const filteredItems = useMemo(() => {
		const q = typeof searchQuery === 'string' ? searchQuery : '';
		if (!q.trim()) {
			return rawItems;
		}

		const query = q.toLowerCase().trim();
		return rawItems.filter((item) => {
			const values = getSortingValues(item);
			return values.name.includes(query) || values.path.includes(query);
		});
	}, [rawItems, searchQuery, getSortingValues]);

	// Crear comparador de ordenamiento
	const createSortComparator = useCallback(
		(sortOptionsParam: any[]) => {
			// Prioridad: la última opción es la primaria (coherente con el UI y activeSort)
			const prioritized = [...sortOptionsParam].reverse();
			return (a: AnyEntityWithStats, b: AnyEntityWithStats) => {
				const aValues = getSortingValues(a);
				const bValues = getSortingValues(b);

				for (const sortOption of prioritized) {
					const { field, direction } = sortOption;
					const result = compareByField(aValues, bValues, field);

					if (result !== 0) {
						return direction === 'asc' ? result : -result;
					}
				}
				return 0;
			};
		},
		[getSortingValues]
	);

	// Ordenar items
	const items = useMemo(() => {
		if (sortOptions.length === 0) {
			return filteredItems.slice().sort((a, b) => {
				const aValues = getSortingValues(a);
				const bValues = getSortingValues(b);
				return bValues.modifiedTime - aValues.modifiedTime;
			});
		}

		const comparator = createSortComparator(sortOptions);
		return filteredItems.slice().sort(comparator);
	}, [filteredItems, sortOptions, getSortingValues, createSortComparator]);

	// Determinar estado de carga
	const isLoading = (() => {
		if (mode === 'manual') {
			return false;
		}

		if (entityType === 'mixed') {
			return entityTypes.some((type) => {
				switch (type) {
					case 'image':
						return imagesLoading;
					default:
						return false;
				}
			});
		}

		switch (entityType) {
			case 'image':
				return imagesLoading;
			default:
				return false;
		}
	})();

	// Determinar error
	const error = (() => {
		if (mode === 'manual') {
			return null;
		}

		if (entityType === 'mixed') {
			return getMixedModeError(entityTypes, imagesError);
		}

		return getSpecificModeError(entityType, imagesError);
	})();

	return {
		rawItems,
		filteredItems,
		items,
		isLoading,
		error,
	};
};
