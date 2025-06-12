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
	parentCallbackRef: (node: HTMLDivElement | null) => void; // 🔧 NUEVO: callback ref para configurar ResizeObserver
	loadMoreRef: React.RefObject<HTMLDivElement | null>;
	containerWidth: number;
	isScrolling: boolean;
	isTransitioning: boolean;
	handleScroll: () => void;
	debouncedLoadThumbnails: (visibleItems: FileItem[]) => void;
	forceRecalcWidth: () => void; // NUEVO: función para forzar recálculo manual
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
	// 🔧 CORREGIDO: Implementación correcta del callback ref con ResizeObserver
	const [containerWidth, setContainerWidth] = useState(0);
	const parentRef = useRef<HTMLDivElement | null>(null);
	const resizeObserverRef = useRef<ResizeObserver | null>(null);
	const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	// 🎯 Callback ref SIMPLIFICADO que configura el ResizeObserver inmediatamente
	const parentCallbackRef = useCallback(
		(node: HTMLDivElement | null) => {
			// Limpiar el observer anterior si existe
			if (resizeObserverRef.current) {
				resizeObserverRef.current.disconnect();
				resizeObserverRef.current = null;
			}

			if (resizeTimeoutRef.current) {
				clearTimeout(resizeTimeoutRef.current);
				resizeTimeoutRef.current = null;
			}

			// Actualizar la referencia
			parentRef.current = node;

			if (node) {
				// 📏 Cálculo agresivo del ancho inicial con múltiples estrategias
				const calculateInitialWidth = (source: string) => {
					// Asegurarse de que el nodo esté en el DOM y tenga un layout válido
					if (!node.parentElement || node.offsetWidth === 0) {
						console.warn(
							`[useGridView] calculateInitialWidth (${source}): Nodo no listo o sin dimensiones. offsetWidth: ${node.offsetWidth}, parentElement: ${!!node.parentElement}`
						);
						return false;
					}
					const width = node.offsetWidth;
					console.debug(`[useGridView] calculateInitialWidth (${source}): width = ${width}px`);
					if (width > 0) {
						setContainerWidth(width);
						return true;
					}
					return false;
				};

				// 1. Intentar inmediatamente
				if (!calculateInitialWidth('immediate')) {
					// 2. RequestAnimationFrame si no hay ancho inicial
					requestAnimationFrame(() => {
						if (!calculateInitialWidth('RAF')) {
							// 3. Timeout como último recurso
							setTimeout(() => {
								calculateInitialWidth('setTimeout');
							}, 100); // Aumentado ligeramente
						}
					});
				}

				// 👁️ Configurar ResizeObserver para el nuevo nodo
				const updateWidth = (width: number) => {
					if (width > 0) {
						setContainerWidth(width);
					}
				};

				resizeObserverRef.current = new ResizeObserver((entries) => {
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

				resizeObserverRef.current.observe(node);
			} else {
				// Si no hay nodo, resetear el ancho
				setContainerWidth(0);
			}
		},
		[isResizing]
	);

	// 🔄 Función para forzar recálculo manual del ancho
	const forceRecalcWidth = useCallback(() => {
		if (parentRef.current) {
			const node = parentRef.current;
			const isInDOM = document.body.contains(node);
			const hasParent = !!node.parentElement;

			console.debug('[useGridView] forceRecalcWidth: Iniciando recálculo manual');
			console.debug(`[useGridView] forceRecalcWidth: Estado - En DOM: ${isInDOM}, Tiene Padre: ${hasParent}`);

			if (isInDOM && hasParent) {
				const width = node.offsetWidth;
				const rect = node.getBoundingClientRect();

				console.debug(
					`[useGridView] forceRecalcWidth: Dimensiones - offsetWidth: ${width}px, boundingWidth: ${rect.width}px`
				);

				if (width > 0) {
					setContainerWidth(width);
					console.debug(`[useGridView] forceRecalcWidth: ✅ ContainerWidth actualizado a ${width}px`);
				} else {
					console.warn('[useGridView] forceRecalcWidth: ⚠️ Dimensiones inválidas, no se actualiza containerWidth');
				}
			} else {
				console.warn(
					`[useGridView] forceRecalcWidth: ⚠️ Nodo no está listo. En DOM: ${isInDOM}, Tiene Padre: ${hasParent}`
				);
			}
		} else {
			console.warn('[useGridView] forceRecalcWidth: ⚠️ parentRef.current es null');
		}
	}, []);

	const loadMoreRef = useRef<HTMLDivElement>(null);
	const [isScrolling, setIsScrolling] = useState(false);
	const [isTransitioning, setIsTransitioning] = useState(false);
	const scrollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const previousViewMode = useRef<ViewMode | null>(null);
	const imageResources = useImageResources();
	const { loadThumbnail, loadQueueRef } = useThumbnailLoader();

	// Referencia para el debounce timer
	const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

	// Constantes para optimizar la carga
	const BATCH_SIZE = 5; // Número de thumbnails a cargar simultáneamente
	const DEBOUNCE_TIME = 200; // Tiempo para debounce en ms

	// 🌍 Listener global de resize como fallback
	useEffect(() => {
		const handler = () => {
			if (parentRef.current) {
				const width = parentRef.current.offsetWidth;
				if (width > 0) {
					setContainerWidth(width);
				}
			}
		};
		window.addEventListener('resize', handler);
		return () => window.removeEventListener('resize', handler);
	}, []);

	// 🧹 Limpiar al desmontar
	useEffect(() => {
		return () => {
			if (resizeObserverRef.current) {
				resizeObserverRef.current.disconnect();
			}
			if (resizeTimeoutRef.current) {
				clearTimeout(resizeTimeoutRef.current);
			}
		};
	}, []);

	// Limpiar timeouts
	useEffect(() => {
		return () => {
			if (scrollingTimeoutRef.current) {
				clearTimeout(scrollingTimeoutRef.current);
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
				.map((item) => String(item.id)) // Convertir EntityId a string explícitamente
				.filter((id) => typeof id === 'string' && id.trim() !== '');

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

	// Función debounced para cargar thumbnails
	const debouncedLoadThumbnails = useCallback(
		(visibleItems: FileItem[]) => {
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current);
			}

			// Evitar recargas mientras se está scrolleando activamente
			if (isScrolling) {
				console.debug('[FileBrowserGrid] Omitiendo carga durante scroll activo');
				return;
			}

			debounceTimerRef.current = setTimeout(() => {
				// Solo ejecutar si el componente sigue montado
				if (parentRef.current) {
					// Log de depuración con información útil
					console.debug(
						`[FileBrowserGrid] 🔄 Cargando thumbnails para ${visibleItems.length} items visibles${
							isResizing ? ' (redimensionando)' : ''
						}`
					);

					// Verificar si hay IDs válidos
					const validIds = visibleItems
						.filter((item) => item?.id && typeof item.id === 'string')
						.map((item) => item.id);

					if (validIds.length > 0) {
						console.debug(`[FileBrowserGrid] 📋 Primeros 3 IDs: ${validIds.slice(0, 3).join(', ')}`);
					} else {
						console.warn('[FileBrowserGrid] ⚠️ No hay IDs válidos para cargar thumbnails');
					}

					// Llamar a la función optimizada de carga
					loadVisibleThumbnails(visibleItems);
				}
			}, DEBOUNCE_TIME);
		},
		[isScrolling, isResizing, loadVisibleThumbnails]
	);

	return {
		parentRef, // 🎯 RefObject para useGridVirtualizer
		parentCallbackRef, // 🔧 Callback ref para el div del DOM (configura ResizeObserver)
		loadMoreRef,
		containerWidth,
		isScrolling,
		isTransitioning,
		handleScroll,
		debouncedLoadThumbnails,
		forceRecalcWidth,
	};
}
