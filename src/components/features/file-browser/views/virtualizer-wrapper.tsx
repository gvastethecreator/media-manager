import { useVirtualizer } from '@tanstack/react-virtual';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

// Tipos para mejorar la tipificación
type ViewType = 'list' | 'grid' | 'masonry';

interface VirtualizerWrapperProps<T> {
	type: ViewType;
	data: T[];
	itemContent: (index: number, item: T) => React.ReactNode;
	itemSize?: number;
	gridClassName?: string;
	listClassName?: string;
	layoutId?: string; // Mantenerla para compatibilidad con la API
	onScrollStart?: () => void;
	onScrollEnd?: () => void;
	// Nuevas propiedades para personalización de la cuadrícula
	gridGap?: number;
	aspectRatio?: number;
	// Callback para notificar qué elementos son visibles
	onVisibilityChange?: (indices: number[]) => void;
}

// Configuración optimizada para rendimiento
const VIRTUALIZER_CONFIG = {
	// Mayor overscan significa más elementos en caché, pero mayor uso de memoria
	overscan: {
		list: 20, // Elementos adicionales renderizados arriba/abajo en listas
		grid: 15, // Filas adicionales en cuadrículas
		masonry: 10, // Elementos adicionales en masonry
	},
	// Tamaño de caché para elementos pre-renderizados
	cacheSize: 1000, // Número máximo de elementos a mantener en caché
	// Configuración para carga suave
	sequential: {
		batchSize: 50, // Cuántos elementos cargar por lote
		delayBetweenBatches: 30, // Milisegundos entre lotes para UI responsiva
		maxRequestsPerSession: 30, // Límite de solicitudes por sesión de scroll
		initialLoadDelay: 50, // Tiempo de espera antes de cargar el primer lote
	},
	// Umbrales por tipo de vista para determinar cuándo cargar más
	scrollThresholds: {
		grid: 0.65, // Más agresivo para grid (carga antes)
		list: 0.7, // Valor medio para lista
		masonry: 0.6, // Muy agresivo para masonry (carga mucho antes)
	},
	// Umbrales en pixels para detectar el final del scroll por tipo
	pixelThresholds: {
		grid: 500,
		list: 400,
		masonry: 600,
	},
	// Configuración por defecto de la cuadrícula
	grid: {
		gap: 16, // Gap por defecto
		aspectRatio: 1, // Relación de aspecto por defecto
	},
};

/**
 * 🖼️ Componente de visualización de datos con virtualización usando TanStack Virtual
 *
 * Esta implementación utiliza @tanstack/react-virtual para renderizar
 * solo los elementos visibles en el viewport, mejorando significativamente
 * el rendimiento con conjuntos de datos grandes.
 */
export function VirtualizerWrapper<T>({
	type,
	data,
	itemContent,
	itemSize = 200,
	gridClassName,
	listClassName,
	onScrollStart,
	onScrollEnd,
	gridGap = VIRTUALIZER_CONFIG.grid.gap,
	aspectRatio = VIRTUALIZER_CONFIG.grid.aspectRatio,
	onVisibilityChange,
}: VirtualizerWrapperProps<T>) {
	// Referencia al contenedor de desplazamiento
	const scrollRef = useRef<HTMLDivElement>(null);
	const [columnCount, setColumnCount] = useState(4); // Default a 4 columnas
	const [isScrolling, setIsScrolling] = useState(false);
	// Lista de índices actualmente visibles
	const [_visibleIndices, setVisibleIndices] = useState<number[]>([]);

	// Caché de elementos para carga secuencial
	const renderedItemsCache = useRef<Map<number, React.ReactNode>>(new Map());
	const [loadedItems, setLoadedItems] = useState<number>(VIRTUALIZER_CONFIG.sequential.batchSize);
	// Contador de tiempo para evitar demasiadas actualizaciones en desplazamientos rápidos
	const visibilityUpdateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	// Contador para limitar solicitudes secuenciales por sesión de scroll
	const sequentialRequestsRef = useRef<number>(0);
	// Flag para saber si estamos cargando actualmente
	const isLoadingRef = useRef<boolean>(false);
	// Último tamaño conocido de datos para comparar
	const lastDataLengthRef = useRef<number>(data.length);

	// Función para obtener el elemento scrollable (viewport de ScrollArea)
	const getScrollElement = useCallback(() => {
		if (!scrollRef.current) return null;
		const viewport = scrollRef.current.closest('[data-slot="scroll-area-viewport"]') as HTMLElement;
		return viewport || scrollRef.current;
	}, []);

	// Función para cargar elementos secuencialmente
	const loadItemsSequentially = useCallback(() => {
		// Evitar cargar si ya estamos en el límite
		if (loadedItems >= data.length || loadedItems >= VIRTUALIZER_CONFIG.cacheSize) {
			isLoadingRef.current = false;
			return;
		}

		// Evitar iniciar una nueva carga si ya estamos cargando
		if (isLoadingRef.current) {
			return;
		}

		// Limitar el número de solicitudes secuenciales por sesión
		if (sequentialRequestsRef.current >= VIRTUALIZER_CONFIG.sequential.maxRequestsPerSession) {
			console.debug('Límite de solicitudes secuenciales alcanzado, reiniciando contador');
			// Reiniciar el contador después de un tiempo
			setTimeout(() => {
				sequentialRequestsRef.current = 0;
				isLoadingRef.current = false;
			}, 2000);
			return;
		}

		// Marcar como cargando
		isLoadingRef.current = true;
		sequentialRequestsRef.current++;

		// Solo cargar hasta el total de elementos o tamaño máximo de caché
		const targetCount = Math.min(
			loadedItems + VIRTUALIZER_CONFIG.sequential.batchSize,
			data.length,
			VIRTUALIZER_CONFIG.cacheSize
		);

		if (loadedItems >= targetCount) {
			isLoadingRef.current = false;
			return;
		}

		console.debug(
			`Cargando secuencialmente: ${loadedItems} → ${targetCount} (solicitud #${sequentialRequestsRef.current})`
		);

		// Cargar el siguiente lote con un pequeño retraso para mantener la UI receptiva
		setTimeout(() => {
			setLoadedItems(targetCount);

			// Si estamos cerca del final, intentar cargar más automáticamente
			if (targetCount < data.length && targetCount < VIRTUALIZER_CONFIG.cacheSize) {
				setTimeout(() => {
					isLoadingRef.current = false;

					// Si todavía no hemos alcanzado el límite y el usuario está cerca del final,
					// cargar otro lote automáticamente
					const scrollableElement = getScrollElement();
					if (scrollableElement) {
						const scrollPosition = scrollableElement.scrollTop + scrollableElement.clientHeight;
						const scrollRatio = scrollPosition / scrollableElement.scrollHeight;

						if (scrollRatio > 0.75) {
							loadItemsSequentially();
						}
					}
				}, VIRTUALIZER_CONFIG.sequential.delayBetweenBatches * 2);
			} else {
				// Desmarcar como no cargando después de un breve periodo
				setTimeout(() => {
					isLoadingRef.current = false;
				}, VIRTUALIZER_CONFIG.sequential.delayBetweenBatches);
			}
		}, VIRTUALIZER_CONFIG.sequential.delayBetweenBatches);
	}, [data.length, loadedItems, getScrollElement]);

	// Función memoizada para obtener contenido con caché
	const getCachedContent = useCallback(
		(index: number, item: T) => {
			// Verificar si ya está en caché
			if (renderedItemsCache.current.has(index)) {
				return renderedItemsCache.current.get(index);
			}

			// Renderizar solo si está dentro de los elementos cargados
			if (index < loadedItems) {
				try {
					const content = itemContent(index, item);
					// Guardar en caché
					renderedItemsCache.current.set(index, content);
					return content;
				} catch (error) {
					console.error(`Error al renderizar elemento ${index}:`, error);
					// Devolver un placeholder de error como fallback
					return (
						<div className="bg-red-100/20 w-full h-full rounded-md flex items-center justify-center">
							<span className="text-xs text-red-500">Error al renderizar</span>
						</div>
					);
				}
			}

			// Placeholder para elementos aún no cargados
			return (
				<div className="animate-pulse bg-muted/20 w-full h-full rounded-md flex items-center justify-center">
					<span className="text-xs text-muted-foreground">Cargando...</span>
				</div>
			);
		},
		[itemContent, loadedItems]
	);

	// Configuración de la virtualización para lista
	const listVirtualizer = useVirtualizer({
		count: data.length,
		getScrollElement,
		estimateSize: () => itemSize,
		overscan: VIRTUALIZER_CONFIG.overscan.list,
		scrollMargin: scrollRef.current?.offsetTop || 0,
	});

	// Configuración de la virtualización para cuadrícula
	const gridVirtualizer = useVirtualizer({
		count: Math.ceil(data.length / columnCount),
		getScrollElement,
		estimateSize: () => {
			// Si tenemos aspectRatio, ajustar la altura según el ancho real
			if (aspectRatio) {
				// Calcular el ancho del item basado en el ancho del contenedor y el número de columnas
				const containerWidth = scrollRef.current?.clientWidth || 0;
				const availableWidth = containerWidth - gridGap * (columnCount + 1);
				const itemWidth = availableWidth / columnCount;
				// Calcular altura basada en relación de aspecto (width / height = aspectRatio)
				return itemWidth / aspectRatio + gridGap;
			}
			// Si no hay aspectRatio, usar itemSize + gap
			return itemSize + gridGap;
		},
		overscan: VIRTUALIZER_CONFIG.overscan.grid * 2,
		getItemKey: (index) => `grid-row-${index}`,
		scrollMargin: scrollRef.current?.offsetTop || 0,
	});

	// Función para actualizar los elementos visibles
	const updateVisibleIndices = useCallback(() => {
		// Lista para acumular índices visibles
		const newVisibleIndices: number[] = [];

		// Obtener elemento scrollable
		const scrollElement = getScrollElement();
		if (!scrollElement) return;

		// Obtener dimensiones del viewport
		const containerHeight = scrollElement.clientHeight;
		const scrollPosition = scrollElement.scrollTop;

		if (type === 'grid') {
			// Para cuadrícula, calcular índices por filas/columnas
			const itemHeight = gridVirtualizer.options.estimateSize(0);
			const itemWidth = (scrollElement.clientWidth - gridGap * (columnCount + 1)) / columnCount;

			if (itemHeight && itemWidth) {
				const firstVisibleRow = Math.floor(scrollPosition / itemHeight);
				const lastVisibleRow = Math.ceil((scrollPosition + containerHeight) / itemHeight);

				// Para cada fila visible
				for (let row = firstVisibleRow; row <= lastVisibleRow; row++) {
					for (let col = 0; col < columnCount; col++) {
						const itemIndex = row * columnCount + col;
						if (itemIndex < data.length) {
							newVisibleIndices.push(itemIndex);
						}
					}
				}
			}
		} else if (type === 'list') {
			// Para lista, usar virtualizer para determinar items visibles
			const items = listVirtualizer.getVirtualItems();
			newVisibleIndices.push(...items.map((item) => item.index));
		}

		// Actualizamos directamente
		setVisibleIndices(newVisibleIndices);
		onVisibilityChange?.(newVisibleIndices);

		// Si estamos cerca del límite de elementos cargados, cargar más
		const maxIndex = newVisibleIndices.length > 0 ? Math.max(...newVisibleIndices) : 0;
		if (maxIndex + 10 > loadedItems && loadedItems < data.length) {
			loadItemsSequentially();
		}
	}, [
		type,
		data.length,
		columnCount,
		gridVirtualizer,
		listVirtualizer,
		getScrollElement,
		loadedItems,
		loadItemsSequentially,
		onVisibilityChange,
		gridGap,
	]);

	// Calcular el número de columnas para la cuadrícula
	useEffect(() => {
		if (!scrollRef.current) return;

		const updateColumnCount = () => {
			const containerWidth = scrollRef.current?.clientWidth || 0;
			// Usar el gridGap proporcionado en lugar del valor fijo
			const effectiveItemSize = itemSize + gridGap;
			// Asegurar que al menos hay una columna
			const columns = Math.max(1, Math.floor((containerWidth - gridGap) / effectiveItemSize));
			if (columns !== columnCount) {
				setColumnCount(columns);
			}
		};

		// Actualizar inmediatamente
		updateColumnCount();

		// Actualizar cuando cambie el tamaño de la ventana
		const resizeObserver = new ResizeObserver(() => {
			updateColumnCount();
			// Forzar recálculo del virtualizer para grid
			if (type === 'grid') {
				gridVirtualizer.measure();
			}
			// Actualizar índices visibles tras el resize, pero con debounce
			setTimeout(() => {
				updateVisibleIndices();
			}, 50);
		});

		resizeObserver.observe(scrollRef.current);

		return () => {
			if (scrollRef.current) {
				resizeObserver.unobserve(scrollRef.current);
			}
			resizeObserver.disconnect();
		};
	}, [itemSize, gridGap, type, gridVirtualizer, updateVisibleIndices, columnCount]);

	// Efecto para cargar elementos iniciales y cuando cambian los datos
	useEffect(() => {
		// Detectar cambio real en los datos comparando con el último tamaño conocido
		const dataChanged = data.length !== lastDataLengthRef.current;
		lastDataLengthRef.current = data.length;

		if (dataChanged) {
			console.debug(`Datos cambiados: ${data.length} elementos, reiniciando contadores`);

			// Reiniciar el conteo cuando cambian los datos
			setLoadedItems(Math.min(VIRTUALIZER_CONFIG.sequential.batchSize, data.length));

			// Limpiar caché cuando cambian los datos completamente
			renderedItemsCache.current.clear();

			// Reiniciar contadores de control
			sequentialRequestsRef.current = 0;
			isLoadingRef.current = false;

			// Comenzar carga secuencial después de un breve retraso
			setTimeout(() => {
				// Asegurar que el elemento de scroll esté al inicio
				const scrollElement = getScrollElement();
				if (scrollElement) {
					scrollElement.scrollTop = 0;
				}

				loadItemsSequentially();
			}, VIRTUALIZER_CONFIG.sequential.initialLoadDelay);
		}
	}, [data, loadItemsSequentially, getScrollElement]);

	// Efecto para configurar event listeners para scroll
	useEffect(() => {
		if (!scrollRef.current) return;

		const scrollElement = getScrollElement();
		if (!scrollElement) return;

		const handleScroll = () => {
			// Throttle para evitar demasiadas actualizaciones durante desplazamiento rápido
			if (visibilityUpdateTimeoutRef.current) {
				clearTimeout(visibilityUpdateTimeoutRef.current);
			}

			// Activar el estado de scroll
			if (!isScrolling) {
				setIsScrolling(true);
				onScrollStart?.();
				// Cada vez que iniciamos un nuevo scroll, reiniciamos el contador de solicitudes
				sequentialRequestsRef.current = 0;
			}

			// Delay para actualizar índices visibles
			visibilityUpdateTimeoutRef.current = setTimeout(() => {
				// Cast a number para compatibilidad con el navegador
				updateVisibleIndices();
				visibilityUpdateTimeoutRef.current = null;
			}, 100);

			// Debounce para detectar cuando se detiene el scroll
			clearTimeout((window as any).scrollTimeout);
			(window as any).scrollTimeout = setTimeout(() => {
				setIsScrolling(false);
				onScrollEnd?.();

				// Solo cargar más si no estamos cargando actualmente
				if (!isLoadingRef.current) {
					loadItemsSequentially();
				}

				// Actualizar índices visibles al final
				updateVisibleIndices();
			}, 150);

			// Algoritmo para detectar fin de scroll y cargar más
			const scrollPosition = scrollElement.scrollTop + scrollElement.clientHeight;
			const scrollHeight = scrollElement.scrollHeight;
			const scrollRatio = scrollPosition / scrollHeight;

			// Usar thresholds específicos por tipo de vista
			const threshold = VIRTUALIZER_CONFIG.scrollThresholds[type];
			const pixelThreshold = VIRTUALIZER_CONFIG.pixelThresholds[type];

			// Detectar si estamos cerca del final del scroll
			const isNearBottom = scrollRatio > threshold || scrollHeight - scrollPosition < pixelThreshold;

			// Cargar más elementos si estamos cerca del final
			if (
				isNearBottom &&
				!isLoadingRef.current &&
				loadedItems < data.length &&
				sequentialRequestsRef.current < VIRTUALIZER_CONFIG.sequential.maxRequestsPerSession
			) {
				console.debug(`Cerca del fondo (${type} - ${scrollRatio.toFixed(2)}), cargando más`);
				loadItemsSequentially();
			}

			// Carga especial cuando estamos muy cerca del final
			if (scrollHeight - scrollPosition < 100 && !isLoadingRef.current && loadedItems < data.length) {
				console.debug('Extremadamente cerca del final, forzando carga');
				loadItemsSequentially();
			}
		};

		// Agregar event listener
		scrollElement.addEventListener('scroll', handleScroll);

		// Actualizar índices visibles inicialmente
		updateVisibleIndices();

		// Limpiar event listener al desmontar
		return () => {
			scrollElement.removeEventListener('scroll', handleScroll);
			if (visibilityUpdateTimeoutRef.current) {
				clearTimeout(visibilityUpdateTimeoutRef.current);
			}
			if ((window as any).scrollTimeout) {
				clearTimeout((window as any).scrollTimeout);
			}
		};
	}, [
		getScrollElement,
		isScrolling,
		onScrollStart,
		onScrollEnd,
		loadItemsSequentially,
		updateVisibleIndices,
		data.length,
		loadedItems,
		type,
	]);

	// Renderizado para modo masonry
	if (type === 'masonry') {
		return (
			<ScrollArea
				className={cn('h-full w-full', gridClassName)}
				onWheel={(_e: React.WheelEvent) => {
				// Detectar scroll manual con rueda
				const scrollElement = getScrollElement();
				if (scrollElement) {
					const scrollPosition = scrollElement.scrollTop + scrollElement.clientHeight;
					const scrollHeight = scrollElement.scrollHeight;

					// Si estamos cerca del final, cargar más
					if (scrollHeight - scrollPosition < 400 && !isLoadingRef.current) {
						loadItemsSequentially();
					}
				}
			}}
			>
				<div ref={scrollRef} className="p-4 h-full" style={{ scrollBehavior: 'smooth' }}>
					<div className="flex" style={{ gap: `${gridGap}px`, minHeight: '100%' }}>
						{/* Crear columnas */}
						{Array.from({ length: columnCount }).map((_, colIndex) => {
							// Más elementos por columna para masonry
							const itemsPerColumn = Math.ceil(loadedItems / columnCount) + 5;
							// Filtrar elementos para esta columna
							const columnItems = data.filter((_, index) => index % columnCount === colIndex).slice(0, itemsPerColumn);

							return (
								<div key={`masonry-col-${colIndex}`} className="flex-1 flex flex-col" style={{ gap: `${gridGap}px` }}>
									{columnItems.map((item, idx) => {
										const originalIndex = colIndex + idx * columnCount;

										// Obtener metadatos para calcular aspect ratio real
										let width = 0;
										let height = 0;
										try {
											if ((item as any).metadata && typeof (item as any).metadata === 'string') {
												const metadata = JSON.parse((item as any).metadata);
												width = (item as any).width || metadata?.dimensions?.width || metadata?.width;
												height = (item as any).height || metadata?.dimensions?.height || metadata?.height;
											} else {
												width = (item as any).width || 200;
												height = (item as any).height || 200;
											}
										} catch (_e) {
											width = 200;
											height = 200;
										}

										// Calcular aspect ratio real
										const itemAspectRatio = width && height ? width / height : 1;
										const calculatedHeight = itemAspectRatio ? `${Math.floor(200 / itemAspectRatio)}px` : 'auto';

										return (
											<div
												key={`masonry-item-${originalIndex}`}
												className="w-full"
												style={{ height: calculatedHeight }}
											>
												{getCachedContent(originalIndex, item)}
											</div>
										);
									})}

									{/* Placeholder para indicar que hay más elementos por cargar */}
									{columnItems.length === itemsPerColumn && columnItems.length * columnCount < data.length && (
										<div className="w-full h-40 animate-pulse bg-muted/10 rounded-md flex items-center justify-center">
											<span className="text-xs text-muted-foreground">Scroll para cargar más...</span>
										</div>
									)}
								</div>
							);
						})}
					</div>

					{/* Indicador de carga para masonry */}
					{loadedItems < data.length && (
						<div className="w-full py-4 flex justify-center mt-4">
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<div className="w-4 h-4 rounded-full border-2 border-t-transparent border-primary/30 animate-spin" />
								<span>Cargando más elementos...</span>
							</div>
						</div>
					)}
				</div>
			</ScrollArea>
		);
	}

	// Renderizado para modo cuadrícula
	if (type === 'grid') {
		// Calcular el número total de filas
		const rowVirtualItems = gridVirtualizer.getVirtualItems();

		return (
			<ScrollArea
				className={cn('h-full w-full', gridClassName)}
				onWheel={(_e: React.WheelEvent) => {
				// Detectar scroll manual con rueda
				const scrollElement = getScrollElement();
				if (scrollElement) {
					const scrollPosition = scrollElement.scrollTop + scrollElement.clientHeight;
					const scrollHeight = scrollElement.scrollHeight;

					// Si estamos cerca del final, cargar más
					if (scrollHeight - scrollPosition < 500 && !isLoadingRef.current) {
						loadItemsSequentially();
					}
				}
			}}
			>
				<div ref={scrollRef} className="h-full" style={{ scrollBehavior: 'smooth' }}>
					<div
						style={{
							height: `${gridVirtualizer.getTotalSize()}px`,
							width: '100%',
							position: 'relative',
							padding: `${gridGap}px`,
							paddingTop: `${gridGap}px`,
							minHeight: '100%',
						}}
					>
						{rowVirtualItems.length === 0 && data.length > 0 && (
							<div className="w-full py-4 flex justify-center">
								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									<span>Cargando elementos...</span>
								</div>
							</div>
						)}

						{rowVirtualItems.map((virtualRow) => {
							const rowIndex = virtualRow.index;

							return (
								<div
									key={virtualRow.key}
									data-index={rowIndex}
									className="flex"
									style={{
										position: 'absolute',
										top: 0,
										left: 0,
										width: '100%',
										height: `${virtualRow.size - gridGap}px`,
										transform: `translateY(${virtualRow.start}px)`,
										gap: `${gridGap}px`,
									}}
								>
									{Array.from({ length: columnCount }).map((_, colIndex) => {
										const itemIndex = rowIndex * columnCount + colIndex;
										if (itemIndex >= data.length) return null;

										const item = data[itemIndex];
										const itemWidth = `calc((100% - ${(columnCount - 1) * gridGap}px) / ${columnCount})`;

										return (
											<div
												key={`grid-item-${itemIndex}`}
												style={{
													width: itemWidth,
													aspectRatio: String(aspectRatio),
												}}
											>
												{getCachedContent(itemIndex, item)}
											</div>
										);
									})}
								</div>
							);
						})}

						{/* Indicador de carga para grid */}
						{loadedItems < data.length && (
							<div
								className="w-full py-4 flex justify-center"
								style={{
									position: 'absolute',
									bottom: 0,
									left: 0,
								}}
							>
								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									<div className="w-4 h-4 rounded-full border-2 border-t-transparent border-primary/30 animate-spin" />
									<span>Cargando más elementos...</span>
								</div>
							</div>
						)}
					</div>
				</div>
			</ScrollArea>
		);
	}

	// Renderizado para modo lista
	return (
		<ScrollArea className={cn('h-full w-full', listClassName)}>
			<div ref={scrollRef} className="h-full" style={{ scrollBehavior: 'smooth' }}>
				<div
					style={{
						height: `${listVirtualizer.getTotalSize()}px`,
						width: '100%',
						position: 'relative',
						padding: '16px',
						paddingTop: '16px',
						minHeight: '100%',
					}}
				>
					{data.length > 0 &&
						listVirtualizer.getVirtualItems().map((virtualItem) => {
							const itemIndex = virtualItem.index;
							if (itemIndex >= data.length) return null;

							const item = data[itemIndex];

							return (
								<div
									key={virtualItem.key}
									data-index={itemIndex}
									style={{
										position: 'absolute',
										top: 0,
										left: 0,
										width: '100%',
										height: `${virtualItem.size}px`,
										transform: `translateY(${virtualItem.start}px)`,
										padding: '0 16px',
									}}
								>
									{getCachedContent(itemIndex, item)}
								</div>
							);
						})}
				</div>
			</div>
		</ScrollArea>
	);
}

// Función auxiliar para comparar arrays
const _areArraysEqual = (a: number[], b: number[]): boolean => {
	if (a.length !== b.length) return false;
	return a.every((item, index) => item === b[index]);
};
