'use client';

import { Meh, Star } from 'lucide-react';
import { motion } from 'motion/react';
import * as React from 'react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useSelectionStore } from '@/store/ui/selection.slice';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';
import type { FileItem } from '@/types/files';
import { ImageRenderer } from '../image-renderer';
import '../styles/scrollbar.css';

/**
 * Un componente de Grid View simplificado que no utiliza virtualización para evitar loops
 * de renderizado en situaciones complejas.
 */

interface SimpleGridViewProps {
	items: FileItem[];
	onItemClick?: (item: FileItem, e: React.MouseEvent) => void;
	onItemDoubleClick?: (item: FileItem) => void;
	onContextMenu?: (item: FileItem, e: React.MouseEvent) => void;
	className?: string;
}

export const SimpleGridView = memo<SimpleGridViewProps>(function SimpleGridView({
	items,
	onItemClick,
	onItemDoubleClick,
	onContextMenu,
	className,
}) {
	// Obtener estado de selección
	const { selectedIds, activeId } = useSelectionStore();
	// Obtener tamaño de los items
	const itemSize = useViewOptionsStore((state) => state.itemSize);

	// Referencia al contenedor
	const containerRef = useRef<HTMLDivElement>(null);

	// Estado para controlar la carga progresiva de items
	const [visibleItems, setVisibleItems] = useState(() => {
		// Determinar el número inicial de elementos a mostrar
		// basado en el número total de elementos
		if (items.length <= 100) {
			return items.length; // Mostrar todos si hay pocos
		}
		if (items.length <= 500) {
			return 100; // Mostrar 100 si hay una cantidad moderada
		}
		return 50; // Mostrar 50 si hay muchos
	});
	const loadingMoreRef = useRef(false);

	// Calcular número de columnas basado en el tamaño del contenedor
	const [columnCount, setColumnCount] = useState(4);

	// Referencia para el indicador de carga
	const loadMoreRef = useRef<HTMLDivElement>(null);

	// Efecto para calcular número de columnas
	useEffect(() => {
		if (!containerRef.current) return;

		const calculateColumns = () => {
			const containerWidth = containerRef.current?.clientWidth || 0;
			const gap = 16;
			const effectiveItemSize = itemSize + gap;
			const columns = Math.max(1, Math.floor((containerWidth - gap) / effectiveItemSize));
			setColumnCount(columns);
		};

		// Calcular inicialmente
		calculateColumns();

		// Recalcular al cambiar tamaño de ventana
		const resizeObserver = new ResizeObserver(() => {
			calculateColumns();
		});

		if (containerRef.current) {
			resizeObserver.observe(containerRef.current);
		}

		return () => {
			if (containerRef.current) {
				resizeObserver.unobserve(containerRef.current);
			}
			resizeObserver.disconnect();
		};
	}, [itemSize]);

	// Renderizar un item de la grid
	const renderGridItem = useCallback(
		(item: FileItem, _index: number) => {
			const isSelected = selectedIds.includes(item.id);
			const _isActive = activeId === item.id;

			// Determinar si es una imagen
			const isImage = item.type?.startsWith('image/') || item.type === 'image' || item.mimeType?.startsWith('image/');

			// Url para la imagen
			const imageUrl =
				typeof item.thumbnail === 'string'
					? item.thumbnail
					: typeof item.src === 'string'
						? item.src
						: `/api/images/${item.id}/thumbnail`;

			// Manejar click
			const handleClick = (e: React.MouseEvent) => {
				if (onItemClick) {
					onItemClick(item, e);
				}
			};

			// Manejar doble click
			const handleDoubleClick = () => {
				if (onItemDoubleClick) {
					onItemDoubleClick(item);
				}
			};

			// Manejar menu contextual
			const handleContextMenu = (e: React.MouseEvent) => {
				e.preventDefault();
				if (onContextMenu) {
					onContextMenu(item, e);
				}
			};

			return (
				<motion.div
					key={item.id}
					className={cn(
						'flex flex-col rounded-md border overflow-hidden',
						'transition-all duration-200',
						isSelected ? 'ring-2 ring-primary border-primary' : 'ring-0'
					)}
					style={{
						width: `calc((100% - ${(columnCount - 1) * 16}px) / ${columnCount})`,
						userSelect: 'none',
						WebkitUserSelect: 'none',
					}}
					whileHover={{ scale: 1.02 }}
					whileTap={{ scale: 0.98 }}
					onClick={handleClick}
					onDoubleClick={handleDoubleClick}
					onContextMenu={handleContextMenu}
				>
					<div className="aspect-square w-full bg-muted/50 relative">
						{/* Imagen */}
						{isImage ? (
							<ImageRenderer src={imageUrl} alt={item.name || ''} className="h-full w-full object-cover" />
						) : (
							<div className="flex items-center justify-center h-full">
								<Meh className="h-10 w-10 text-muted-foreground/50" />
							</div>
						)}

						{/* Indicador favorito */}
						{item.isFavorite && (
							<div className="absolute top-1.5 right-1.5 bg-background/80 rounded-full p-0.5">
								<Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
							</div>
						)}
					</div>

					{/* Nombre */}
					<div className="p-2 text-xs">
						<div className="truncate font-medium">{item.name}</div>
					</div>
				</motion.div>
			);
		},
		[activeId, onContextMenu, onItemClick, onItemDoubleClick, selectedIds, columnCount]
	);

	// Manejar scroll y carga infinita
	const handleScroll = useCallback(
		(e: React.UIEvent<HTMLDivElement>) => {
			if (loadingMoreRef.current || visibleItems >= items.length) return;

			const container = e.currentTarget;
			if (!container) return;

			// Calcular si estamos cerca del final del scroll
			const { scrollTop, scrollHeight, clientHeight } = container;
			const scrollBottom = scrollTop + clientHeight;
			const threshold = scrollHeight * 0.75; // Cargar más cuando llegamos al 75% del scroll

			if (scrollBottom >= threshold) {
				loadingMoreRef.current = true;

				// Usar setTimeout para evitar bloqueos de UI
				setTimeout(() => {
					setVisibleItems((prev) => {
						// Cargar más elementos de forma dinámica
						// Si hay pocos elementos, cargar todos
						// Si hay muchos, cargar en lotes más grandes
						const increment = items.length < 200 ? 50 : 100;
						const newCount = Math.min(prev + increment, items.length);
						console.log(`[SimpleGridView] Cargando más elementos: ${prev} → ${newCount}`);
						return newCount;
					});

					// Desbloquear después de un pequeño retraso
					setTimeout(() => {
						loadingMoreRef.current = false;
					}, 50);
				}, 100);
			}
		},
		[items.length, visibleItems]
	);

	// Resetear el contador cuando cambian los items
	useEffect(() => {
		// Determinar el número inicial de elementos a mostrar
		// basado en el número total de elementos
		let initialCount;
		if (items.length <= 100) {
			initialCount = items.length; // Mostrar todos si hay pocos
		} else if (items.length <= 500) {
			initialCount = 100; // Mostrar 100 si hay una cantidad moderada
		} else {
			initialCount = 50; // Mostrar 50 si hay muchos
		}

		setVisibleItems(initialCount);
		loadingMoreRef.current = false;
	}, [items]);

	// Usar IntersectionObserver para detectar cuando el indicador de carga es visible
	useEffect(() => {
		if (!loadMoreRef.current || visibleItems >= items.length) return;

		const observer = new IntersectionObserver(
			(entries) => {
				const [entry] = entries;
				if (entry.isIntersecting && !loadingMoreRef.current) {
					handleScroll({ currentTarget: containerRef.current } as React.UIEvent<HTMLDivElement>);
				}
			},
			{ threshold: 0.5 }
		);

		observer.observe(loadMoreRef.current);

		return () => {
			observer.disconnect();
		};
	}, [handleScroll, items.length, visibleItems]);

	// Estilos para el contenedor
	const containerStyles = useMemo(
		() => ({
			userSelect: 'none',
			WebkitUserSelect: 'none',
			MozUserSelect: 'none',
			msUserSelect: 'none',
			scrollbarWidth: 'thin',
			scrollbarColor: 'rgba(155, 155, 155, 0.5) transparent',
		}),
		[]
	);

	return (
		<div
			ref={containerRef}
			className={cn('h-full w-full overflow-auto p-4 custom-scrollbar', className)}
			style={containerStyles}
			onScroll={handleScroll}
		>
			<div
				className="flex flex-wrap gap-4 pb-8"
				style={{
					gap: '16px',
					userSelect: 'none',
				}}
			>
				{items.slice(0, visibleItems).map((item, index) => renderGridItem(item, index))}
			</div>

			{/* Indicador de carga */}
			{visibleItems < items.length && (
				<div ref={loadMoreRef} className="w-full py-4 flex justify-center">
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<div className="w-4 h-4 rounded-full border-2 border-t-transparent border-primary animate-spin" />
						<span>
							Cargando más elementos ({visibleItems} de {items.length})...
						</span>
					</div>
				</div>
			)}
		</div>
	);
});
