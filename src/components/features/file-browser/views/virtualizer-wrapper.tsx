'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useVirtualizer } from '@tanstack/react-virtual';
import React, { useCallback, useEffect, useRef, useState } from 'react';

interface VirtualizerWrapperProps<T> {
	type: 'list' | 'grid' | 'masonry';
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

// Configuración para mejorar el rendimiento y caching
const VIRTUALIZER_CONFIG = {
	// Mayor overscan significa más elementos en caché, pero mayor uso de memoria
	overscan: {
		list: 10,     // Elementos adicionales renderizados arriba/abajo en listas
		grid: 8,      // Filas adicionales en cuadrículas
		masonry: 5    // Elementos adicionales en masonry
	},
	// Tamaño de caché para elementos pre-renderizados
	cacheSize: 500,   // Número máximo de elementos a mantener en caché (aumentado de 200 a 500)
	// Configuración para carga suave
	sequential: {
		batchSize: 30,      // Cuántos elementos cargar por lote (aumentado de 20 a 30)
		delayBetweenBatches: 50,  // Milisegundos entre lotes para UI responsiva (reducido de 100 a 50)
		maxRequestsPerSession: 15, // Limitar el número de solicitudes de carga secuencial por sesión de scroll
		initialLoadDelay: 100 // Tiempo de espera antes de cargar el primer lote
	},
	// Configuración por defecto de la cuadrícula
	grid: {
		gap: 16,       // Gap por defecto (será reemplazado si se proporciona gridGap)
		aspectRatio: 1 // Relación de aspecto por defecto (será reemplazado si se proporciona aspectRatio)
	}
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
	const [visibleIndices, setVisibleIndices] = useState<number[]>([]);

	// Caché de elementos para carga secuencial
	const renderedItemsCache = useRef<Map<number, React.ReactNode>>(new Map());
	const [loadedItems, setLoadedItems] = useState<number>(VIRTUALIZER_CONFIG.sequential.batchSize);
	// Contador de tiempo para evitar demasiadas actualizaciones en desplazamientos rápidos
	const visibilityUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	// Contador para limitar solicitudes secuenciales por sesión de scroll
	const sequentialRequestsRef = useRef<number>(0);
	// Flag para saber si estamos cargando actualmente
	const isLoadingRef = useRef<boolean>(false);
	// Último tamaño conocido de datos para comparar
	const lastDataLengthRef = useRef<number>(data.length);

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
			console.debug("Límite de solicitudes secuenciales alcanzado, reiniciando contador");
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

		console.debug(`Cargando secuencialmente: ${loadedItems} → ${targetCount} (solicitud #${sequentialRequestsRef.current})`);

		// Cargar el siguiente lote con un pequeño retraso para mantener la UI receptiva
		setTimeout(() => {
			setLoadedItems(targetCount);

			// Si estamos cerca del final, intentar cargar más automáticamente
			if (targetCount < data.length && targetCount < VIRTUALIZER_CONFIG.cacheSize) {
				setTimeout(() => {
					isLoadingRef.current = false;

					// Si todavía no hemos alcanzado el límite y el usuario está cerca del final,
					// cargar otro lote automáticamente
					const scrollableElement = scrollRef.current?.closest('[data-slot="scroll-area-viewport"]') as HTMLElement;
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
	}, [data.length, loadedItems]);

	// Función memoizada para obtener contenido con caché
	const getCachedContent = useCallback((index: number, item: T) => {
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
	}, [itemContent, loadedItems]);

	// Calcular el número de columnas para la cuadrícula
	useEffect(() => {
		if (!scrollRef.current) return;

		const updateColumnCount = () => {
			const containerWidth = scrollRef.current?.clientWidth || 0;
			// Usar el gridGap proporcionado en lugar del valor fijo
			const effectiveItemSize = itemSize + gridGap;
			// Asegurar que al menos hay una columna
			const columns = Math.max(1, Math.floor((containerWidth - gridGap) / effectiveItemSize));
			setColumnCount(columns);
		};

		// Actualizar inmediatamente
		updateColumnCount();

		// Actualizar cuando cambie el tamaño de la ventana
		const resizeObserver = new ResizeObserver(updateColumnCount);
		resizeObserver.observe(scrollRef.current);

		return () => {
			if (scrollRef.current) {
				resizeObserver.unobserve(scrollRef.current);
			}
			resizeObserver.disconnect();
		};
	}, [itemSize, gridGap, scrollRef]);

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
				const scrollElement = scrollRef.current?.closest('[data-slot="scroll-area-viewport"]') as HTMLElement;
				if (scrollElement) {
					scrollElement.scrollTop = 0;
				}

				loadItemsSequentially();
			}, VIRTUALIZER_CONFIG.sequential.initialLoadDelay);
		}
	}, [data, loadItemsSequentially]);

	// Después de montar el componente, hacer scroll al inicio
	useEffect(() => {
		const scrollElement = scrollRef.current?.closest('[data-slot="scroll-area-viewport"]') as HTMLElement;
		if (scrollElement) {
			scrollElement.scrollTop = 0;
		}
	}, []);

	// Función para obtener el elemento scrollable
	const getScrollElement = useCallback(() => {
		if (!scrollRef.current) return null;
		const viewport = scrollRef.current.closest('[data-slot="scroll-area-viewport"]') as HTMLElement;
		return viewport || scrollRef.current;
	}, []);

	// Configuración de la virtualización para lista
	const listVirtualizer = useVirtualizer({
		count: data.length,
		getScrollElement,
		estimateSize: () => itemSize,
		overscan: VIRTUALIZER_CONFIG.overscan.list, // Mayor número de elementos en caché
		scrollMargin: scrollRef.current?.offsetTop || 0
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
		overscan: VIRTUALIZER_CONFIG.overscan.grid * 2, // Mayor overscan para cuadrículas (duplicado)
		getItemKey: (index) => `grid-row-${index}`,
		scrollMargin: scrollRef.current?.offsetTop || 0
	});

	// Función para actualizar los elementos visibles
	const updateVisibleIndices = useCallback(() => {
		// Lista para acumular índices visibles
		const newVisibleIndices: number[] = [];

		if (type === 'grid') {
			// Para grid, calcular qué filas son visibles y multiplicar por columnCount
			const visibleRows = gridVirtualizer.getVirtualItems();

			// Si no hay filas visibles pero tenemos datos, probablemente estamos esperando que se midan
			if (visibleRows.length === 0 && data.length > 0) {
				// Usar los primeros elementos como visibles temporalmente
				const initialVisible = Math.min(20, data.length);
				for (let i = 0; i < initialVisible; i++) {
					newVisibleIndices.push(i);
				}
			} else {
				visibleRows.forEach((row: VirtualItem) => {
					for (let col = 0; col < columnCount; col++) {
						const itemIndex = row.index * columnCount + col;
						if (itemIndex < data.length) {
							newVisibleIndices.push(itemIndex);
						}
					}
				});
			}

			// Después de actualizar los índices visibles, comprobar si necesitamos cargar más
			if (visibleRows.length > 0) {
				const lastRowIndex = visibleRows[visibleRows.length - 1].index;
				const totalRows = Math.ceil(data.length / columnCount);

				// Si estamos viendo las últimas filas y no estamos cargando, cargar más
				if (lastRowIndex >= totalRows - 3 && !isLoadingRef.current && loadedItems < data.length) {
					loadItemsSequentially();
				}
			}
		} else if (type === 'list') {
			// Para lista, usar directamente los índices virtuales
			const visibleItems = listVirtualizer.getVirtualItems();
			visibleItems.forEach((item: VirtualItem) => {
				if (item.index < data.length) {
					newVisibleIndices.push(item.index);
				}
			});
		} else if (type === 'masonry') {
			// Para masonry, tenemos que calcular manualmente
			// pero no es trivial determinar qué elementos están visibles
			// así que asumimos que todos los elementos de las primeras N filas lo están
			const containerHeight = scrollRef.current?.clientHeight || 0;
			const scrollPosition = scrollRef.current?.scrollTop || 0;
			const itemHeight = itemSize; // Aproximado

			// Rango visible: desde scrollPosition hasta scrollPosition + containerHeight
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

		// Actualizar el estado y notificar a través del callback
		setVisibleIndices(newVisibleIndices);
		onVisibilityChange?.(newVisibleIndices);
	}, [type, data.length, columnCount, onVisibilityChange, gridVirtualizer, listVirtualizer, loadedItems, loadItemsSequentially, isLoadingRef]);

	// Efecto para actualizar visibles cuando cambia el scrollTop
	useEffect(() => {
		if (!scrollRef.current) return;

		// Función para obtener el elemento scrollable
		const getScrollableElement = () => {
			const viewport = scrollRef.current?.closest('[data-slot="scroll-area-viewport"]') as HTMLElement;
			return viewport || scrollRef.current;
		};

		const handleScroll = () => {
			// Throttle para evitar demasiadas actualizaciones durante desplazamiento rápido
			if (visibilityUpdateTimeoutRef.current) {
				clearTimeout(visibilityUpdateTimeoutRef.current);
			}

			visibilityUpdateTimeoutRef.current = setTimeout(() => {
				updateVisibleIndices();
				visibilityUpdateTimeoutRef.current = null;
			}, 100);
		};

		const scrollElement = getScrollableElement();
		if (scrollElement) {
			scrollElement.addEventListener('scroll', handleScroll);
		}

		// Actualizar inmediatamente al montar
		updateVisibleIndices();

		return () => {
			if (scrollElement) {
				scrollElement.removeEventListener('scroll', handleScroll);
			}
			if (visibilityUpdateTimeoutRef.current) {
				clearTimeout(visibilityUpdateTimeoutRef.current);
			}
		};
	}, [updateVisibleIndices]);

	// Manejador de eventos de scroll con debounce
	const handleScroll = useCallback(
		(e: React.UIEvent<HTMLDivElement>) => {
			// Este manejador ya no necesita hacer mucho, ya que el scrollElement real ahora es el Viewport
			// del ScrollArea, y hemos configurado event listeners directamente en ese elemento.

			// Activar el estado de scroll
			if (!isScrolling) {
				setIsScrolling(true);
				onScrollStart?.();
				// Cada vez que iniciamos un nuevo scroll, reiniciamos el contador de solicitudes
				sequentialRequestsRef.current = 0;
			}

			// Debounce para detectar cuando se detiene el scroll
			clearTimeout((window as any).scrollTimeout);
			(window as any).scrollTimeout = setTimeout(() => {
				setIsScrolling(false);
				onScrollEnd?.();

				// Solo cargar más si no estamos cargando actualmente
				if (!isLoadingRef.current) {
					// Cargar más elementos cuando el usuario se detiene
					loadItemsSequentially();
				}

				// Actualizar los elementos visibles
				updateVisibleIndices();
			}, 200);

			// El scrollElement real ahora es el viewport del ScrollArea
			const scrollableElement = scrollRef.current?.closest('[data-slot="scroll-area-viewport"]') as HTMLElement;
			if (!scrollableElement) return;

			// Algoritmo mejorado para detectar el final del scroll
			// Considera un margen de error y la altura real del contenido
			const scrollPosition = scrollableElement.scrollTop + scrollableElement.clientHeight;
			const scrollRatio = scrollPosition / scrollableElement.scrollHeight;

			// Detectar si estamos cerca del final del scroll (75% del scroll o menos de 400px para llegar al final)
			// Se reduce el umbral para grids que pueden tener elementos más altos
			const isNearBottom = (type === 'grid' ? scrollRatio > 0.7 : scrollRatio > 0.75) ||
				(scrollableElement.scrollHeight - scrollPosition) < (type === 'grid' ? 400 : 300);

			// Solo intentar cargar más en el fondo si estamos cerca del fondo Y no estamos cargando
			if (isNearBottom && !isLoadingRef.current &&
				loadedItems < data.length &&
				sequentialRequestsRef.current < VIRTUALIZER_CONFIG.sequential.maxRequestsPerSession) {

				console.debug(`Cerca del fondo (${type}), cargando más elementos`);
				onScrollEnd?.();
				// Asegurarse de cargar más elementos al llegar al final
				loadItemsSequentially();
			}
		},
		[isScrolling, onScrollStart, onScrollEnd, loadItemsSequentially, updateVisibleIndices,
			data.length, loadedItems, type]
	);

	// Renderizado para modo masonry
	if (type === 'masonry') {
		// Para masonry, usamos una implementación más eficiente con carga limitada por columna
		return (
			<ScrollArea
				className={cn('h-full w-full', gridClassName)}
			>
				<div
					ref={scrollRef}
					className="p-4 h-full"
					onScroll={handleScroll}
					style={{ scrollBehavior: 'smooth' }}
				>
					<div className="flex" style={{ gap: `${gridGap}px`, minHeight: '100%' }}>
						{/* Crear columnas */}
						{Array.from({ length: columnCount }).map((_, colIndex) => {
							// Determinar cuántos elementos cargar por columna
							const itemsPerColumn = Math.ceil(loadedItems / columnCount);
							// Filtrar elementos que van en esta columna
							const columnItems = data
								.filter((_, index) => index % columnCount === colIndex)
								.slice(0, itemsPerColumn); // Limitar el número de elementos por columna

							return (
								<div
									key={`masonry-col-${colIndex}`}
									className="flex-1 flex flex-col"
									style={{ gap: `${gridGap}px` }}
								>
									{columnItems.map((item, idx) => {
										const originalIndex = colIndex + idx * columnCount;
										return (
											<div key={`masonry-item-${originalIndex}`} className="w-full">
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
				onWheel={(e) => {
					// Detectar eventos de scroll manual mediante rueda del ratón
					// Esto es útil porque algunos eventos de scroll no se capturan correctamente
					const scrollableElement = scrollRef.current?.closest('[data-slot="scroll-area-viewport"]') as HTMLElement;
					if (scrollableElement) {
						const scrollPosition = scrollableElement.scrollTop + scrollableElement.clientHeight;
						const scrollHeight = scrollableElement.scrollHeight;

						// Si estamos a menos de 300px del final, intentar cargar más
						if (scrollHeight - scrollPosition < 300 && !isLoadingRef.current) {
							loadItemsSequentially();
						}
					}
				}}
			>
				<div
					ref={scrollRef}
					className="h-full"
					onScroll={handleScroll}
					style={{ scrollBehavior: 'smooth' }}
				>
					<div
						style={{
							height: `${gridVirtualizer.getTotalSize()}px`,
							width: '100%',
							position: 'relative',
							padding: `${gridGap}px`,
							paddingTop: `${gridGap}px`, // Asegurar padding superior correcto
							minHeight: '100%'
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
										height: `${virtualRow.size - gridGap}px`, // Restar el gap para evitar espacio extra
										transform: `translateY(${virtualRow.start}px)`,
										gap: `${gridGap}px`
									}}
								>
									{Array.from({ length: columnCount }).map((_, colIndex) => {
										const itemIndex = rowIndex * columnCount + colIndex;
										if (itemIndex >= data.length) return null;

										const item = data[itemIndex];

										// Calcular el ancho del elemento considerando el gap
										const itemWidth = `calc((100% - ${(columnCount - 1) * gridGap}px) / ${columnCount})`;

										return (
											<div
												key={`grid-item-${itemIndex}`}
												style={{
													width: itemWidth,
													// La altura se calcula automáticamente si es aspect-square
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

						{/* Indicador de carga para la vista Grid */}
						{loadedItems < data.length && (
							<div
								className="w-full py-4 flex justify-center"
								style={{
									position: 'absolute',
									bottom: 0,
									left: 0
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
		<ScrollArea
			className={cn('h-full w-full', listClassName)}
		>
			<div
				ref={scrollRef}
				className="h-full"
				onScroll={handleScroll}
				style={{ scrollBehavior: 'smooth' }}
			>
				<div
					style={{
						height: `${listVirtualizer.getTotalSize()}px`,
						width: '100%',
						position: 'relative',
						padding: '16px',
						paddingTop: '16px', // Asegurar padding superior correcto
						minHeight: '100%'
					}}
				>
					{data.length > 0 && listVirtualizer.getVirtualItems().map((virtualItem) => {
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