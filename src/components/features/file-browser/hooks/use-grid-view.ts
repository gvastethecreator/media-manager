'use client';

import { useImageResources } from '@/store/image-resources.store';
import type { FileItem } from '@/types/file-item';
import type { ViewMode } from '@/types/settings';
import type * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useThumbnailLoader } from './use-thumbnail-loader';

/**
 * Props para el hook useGridView
 */
interface UseGridViewProps {
	viewMode: ViewMode;
	isResizing?: boolean;
	loadMoreItems?: () => void;
}

/**
 * Resultado del hook useGridView
 */
interface UseGridViewResult {
	parentRef: React.RefObject<HTMLDivElement | null>;
	loadMoreRef: React.RefObject<HTMLDivElement | null>;
	containerWidth: number;
	isScrolling: boolean;
	isTransitioning: boolean;
	handleScroll: () => void;
	debouncedLoadThumbnails: (visibleItems: FileItem[]) => void;
}

/**
 * Hook para gestionar la visualización y comportamiento del grid de archivos
 *
 * Este hook maneja:
 * - Referencias al contenedor principal y elemento de carga infinita
 * - Cálculo y actualización del ancho del contenedor
 * - Estados de scroll y transición entre vistas
 * - Carga optimizada de miniaturas visibles
 * - Observación de redimensionamiento
 * - Scroll infinito para carga de más items
 *
 * @param viewMode - Modo de visualización actual (grid, list, masonry, cards)
 * @param isResizing - Indica si el contenedor está siendo redimensionado
 * @param loadMoreItems - Función para cargar más items (scroll infinito)
 * @returns Objeto con referencias, estados y funciones para la vista
 */
export function useGridView({ viewMode, isResizing, loadMoreItems }: UseGridViewProps): UseGridViewResult {
	const parentRef = useRef<HTMLDivElement>(null);
	const loadMoreRef = useRef<HTMLDivElement>(null);
	const [containerWidth, setContainerWidth] = useState(0);
	const [isScrolling, setIsScrolling] = useState(false);
	const [isTransitioning, setIsTransitioning] = useState(false);
	const scrollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const previousViewMode = useRef<ViewMode | null>(null);
	const imageResources = useImageResources();
	const { loadThumbnail, loadQueueRef } = useThumbnailLoader();

	// Referencia para el debounce timer
	const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

	// Constantes para optimizar la carga
	const BATCH_SIZE = 5; // Número de thumbnails a cargar simultáneamente
	const DEBOUNCE_TIME = 200; // Tiempo para debounce en ms

	// Limpiar timeouts
	useEffect(() => {
		return () => {
			if (scrollingTimeoutRef.current) {
				clearTimeout(scrollingTimeoutRef.current);
			}
			if (resizeTimeoutRef.current) {
				clearTimeout(resizeTimeoutRef.current);
			}
			if (transitionTimeoutRef.current) {
				clearTimeout(transitionTimeoutRef.current);
			}
		};
	}, []);

	// Forzar recálculo al cambiar de vista
	useEffect(() => {
		if (previousViewMode.current !== viewMode) {
			setIsTransitioning(true);
			if (transitionTimeoutRef.current) {
				clearTimeout(transitionTimeoutRef.current);
			}

			// Resetear scroll
			if (parentRef.current) {
				parentRef.current.scrollTop = 0;
			}

			// Forzar recálculo después de un breve delay
			transitionTimeoutRef.current = setTimeout(() => {
				if (parentRef.current) {
					const width = parentRef.current.offsetWidth;
					setContainerWidth(width);
					previousViewMode.current = viewMode;
					setIsTransitioning(false);
				}
			}, 50);
		}
	}, [viewMode]);

	// Optimizar ResizeObserver con mejor manejo de cambios
	useEffect(() => {
		if (!parentRef.current) {
			return;
		}

		const updateWidth = (width: number) => {
			if (width > 0 && (width !== containerWidth || previousViewMode.current !== viewMode)) {
				setContainerWidth(width);
				previousViewMode.current = viewMode;
			}
		};

		const resizeObserver = new ResizeObserver((entries) => {
			if (resizeTimeoutRef.current) {
				clearTimeout(resizeTimeoutRef.current);
			}

			const width = entries[0].contentRect.width;
			if (isResizing) {
				resizeTimeoutRef.current = setTimeout(() => {
					updateWidth(width);
				}, 100);
			} else {
				updateWidth(width);
			}
		});

		resizeObserver.observe(parentRef.current);
		return () => {
			resizeObserver.disconnect();
			if (resizeTimeoutRef.current) {
				clearTimeout(resizeTimeoutRef.current);
			}
		};
	}, [containerWidth, isResizing, viewMode]);

	// Optimizar el manejo del scroll infinito
	useEffect(() => {
		if (!loadMoreRef.current || !loadMoreItems) {
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				const [entry] = entries;
				if (entry?.isIntersecting && !isScrolling) {
					requestAnimationFrame(() => {
						loadMoreItems();
					});
				}
			},
			{
				rootMargin: '100px 0px',
				threshold: 0,
			}
		);

		observer.observe(loadMoreRef.current);
		return () => observer.disconnect();
	}, [loadMoreItems, isScrolling]);

	// Función para cargar thumbnails visibles
	const loadVisibleThumbnails = useCallback(
		async (visibleItems: FileItem[]) => {
			// Filtrar items válidos
			const itemsToLoad: FileItem[] = [];

			// Verificar si el componente sigue montado
			if (!loadQueueRef.current) {
				return; // El componente se ha desmontado
			}

			for (const item of visibleItems) {
				// Verificar ID válido
				if (!item.id || typeof item.id !== 'string' || item.id.trim() === '') {
					continue; // Saltar items sin ID válido
				}

				// Acceder directamente al store para verificar si ya existe
				const resource = imageResources.resources.get(item.id);

				// Solo cargar si:
				// 1. No tiene thumbnail en el resource
				// 2. No está ya en la cola de carga
				// 3. No tiene un error registrado (o si lo queremos reintentar)
				if (!resource?.thumbnail && !loadQueueRef.current.has(item.id)) {
					itemsToLoad.push(item);
				}
			}

			// Si no hay items para cargar, salir temprano
			if (itemsToLoad.length === 0) {
				return;
			}

			// Precargar recursos para todos los items válidos a cargar
			const itemIdsToLoad = itemsToLoad
				.map((item) => item.id)
				.filter((id): id is string => typeof id === 'string' && id.trim() !== '');

			if (itemIdsToLoad.length > 0) {
				try {
					imageResources.preloadResources(itemIdsToLoad);
				} catch (preloadError) {
					console.warn('Error al precargar recursos:', preloadError);
					// Continuar con la carga individual a pesar del error
				}
			}

			// Cargar thumbnails por lotes para mejorar rendimiento
			try {
				for (let i = 0; i < itemsToLoad.length; i += BATCH_SIZE) {
					// Verificar de nuevo si el componente sigue montado
					if (!loadQueueRef.current) {
						return; // Salir si el componente se ha desmontado
					}

					const batch = itemsToLoad.slice(i, i + BATCH_SIZE);

					try {
						// Usar Promise.allSettled para evitar que un error detenga todo el lote
						const results = await Promise.allSettled(batch.map((item) => loadThumbnail(item.id)));

						// Loggear errores individuales para diagnóstico
						results.forEach((result, index) => {
							if (result.status === 'rejected') {
								console.warn(`Error al cargar thumbnail para ${batch[index].id}:`, result.reason);
							}
						});
					} catch (batchError) {
						console.warn('Error procesando lote de thumbnails:', batchError);
						// Continuar con el siguiente lote a pesar del error
					}

					// Pequeña pausa entre lotes para no bloquear la UI
					if (i + BATCH_SIZE < itemsToLoad.length) {
						await new Promise((resolve) => setTimeout(resolve, 10));
					}
				}
			} catch (error) {
				console.error('Error general cargando thumbnails:', error);
			}
		},
		[imageResources, loadThumbnail, loadQueueRef]
	);

	// Mejorar el manejo de scroll
	const handleScroll = useCallback(() => {
		if (scrollingTimeoutRef.current) {
			clearTimeout(scrollingTimeoutRef.current);
		}

		setIsScrolling(true);
		scrollingTimeoutRef.current = setTimeout(() => {
			setIsScrolling(false);
		}, 150);
	}, []);

	// Implementar debounce para la carga de thumbnails
	const debouncedLoadThumbnails = useCallback(
		(visibleItems: FileItem[]) => {
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current);
			}

			debounceTimerRef.current = setTimeout(() => {
				loadVisibleThumbnails(visibleItems);
			}, DEBOUNCE_TIME);
		},
		[loadVisibleThumbnails]
	);

	return {
		parentRef,
		loadMoreRef,
		containerWidth,
		isScrolling,
		isTransitioning,
		handleScroll,
		debouncedLoadThumbnails,
	};
}
