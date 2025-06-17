'use client';

import { cn } from '@/lib/utils';
import { useSelectionStore } from '@/store/ui/selection.slice';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';
import type { FileItem } from '@/types/file-item';
import { Meh, Star } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type * as React from 'react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ImageRenderer } from '../image-renderer';
import { VirtualizerWrapper } from './virtualizer-wrapper';

// Configuración constante para la cuadrícula
const GRID_CONFIG = {
	gap: 4, // Espaciado fijo de 4px entre elementos
	aspectRatio: 1, // Relación de aspecto 1:1
	animationDuration: 0.3, // Duración de las animaciones en segundos
	cornerRadius: 6, // Radio de las esquinas en píxeles
};

interface GridItemProps {
	item: FileItem;
	isSelected?: boolean;
	isActive?: boolean;
	onClick?: (item: FileItem, e: React.MouseEvent) => void;
	onDoubleClick?: (item: FileItem) => void;
	onContextMenu?: (item: FileItem, e: React.MouseEvent) => void;
	style?: React.CSSProperties;
	// Nuevas props para animaciones
	index: number;
	isVisible?: boolean;
}

/**
 * Componente para renderizar un elemento en la vista de cuadrícula
 */
const GridItem = memo(function GridItem({
	item,
	isSelected,
	isActive,
	onClick,
	onDoubleClick,
	onContextMenu,
	style,
	index,
	isVisible = true,
}: GridItemProps) {
	// Referencias
	const itemRef = useRef<HTMLDivElement>(null);
	// Estado para animación de entrada y carga
	const [isLoaded, setIsLoaded] = useState(false);
	const [imageLoaded, setImageLoaded] = useState(false);

	// Efecto para animar entrada con retraso basado en el índice
	useEffect(() => {
		if (isVisible) {
			// Retraso proporcional al índice para crear efecto de cascada
			const delay = Math.min(index * 20, 300); // máximo 300ms de retraso
			const timer = setTimeout(() => {
				setIsLoaded(true);
			}, delay);

			return () => clearTimeout(timer);
		}
	}, [isVisible, index]);

	// Memoizar clases
	const itemClassName = useMemo(
		() =>
			cn(
				'relative aspect-square overflow-hidden rounded-md border',
				'group hover:ring-1 hover:ring-primary/50 hover:border-primary/50',
				'transition-all duration-200 ease-in-out',
				{
					'ring-2 ring-primary border-primary': isSelected,
					'ring-2 ring-primary/70 border-primary/70': isActive && !isSelected,
					'opacity-0': !isLoaded,
					'opacity-100': isLoaded,
				}
			),
		[isSelected, isActive, isLoaded]
	);

	// Memoizar manejadores de eventos
	const handleClick = useCallback(
		(e: React.MouseEvent) => {
			if (onClick) {
				onClick(item, e);
			}
		},
		[item, onClick]
	);

	const handleDoubleClick = useCallback(() => {
		if (onDoubleClick) {
			onDoubleClick(item);
		}
	}, [item, onDoubleClick]);

	const handleContextMenu = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault(); // Prevenir el menú contextual por defecto
			if (onContextMenu) {
				onContextMenu(item, e);
			}
		},
		[item, onContextMenu]
	);

	// Determinar si es una imagen
	const isImage = useMemo(() => {
		return item.type?.startsWith('image/') || item.type === 'image' || item.mimeType?.startsWith('image/') || false;
	}, [item.type, item.mimeType]);

	// Obtener la URL de la miniatura o imagen
	const imageUrl = useMemo(() => {
		// Orden de prioridad: thumbnail, src, API thumbnail
		return item.thumbnail || item.src || `/api/images/${item.id}/thumbnail`;
	}, [item.thumbnail, item.src, item.id]);

	// Manejador para cuando la imagen se carga
	const handleImageLoad = useCallback(() => {
		setImageLoaded(true);
	}, []);

	// Renderizar el elemento con motion para animaciones
	return (
		<motion.button
			type="button"
			ref={itemRef}
			className={itemClassName}
			onClick={handleClick}
			onDoubleClick={handleDoubleClick}
			onContextMenu={handleContextMenu}
			onKeyDown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					handleClick(e as unknown as React.MouseEvent);
				}
			}}
			style={{
				...style,
				// Estilos específicos para el grid item
				borderRadius: GRID_CONFIG.cornerRadius,
				transformOrigin: 'center',
			}}
			initial={{ scale: 0.95, opacity: 0 }}
			animate={{
				scale: isLoaded ? 1 : 0.95,
				opacity: isLoaded ? 1 : 0,
			}}
			transition={{
				duration: GRID_CONFIG.animationDuration,
				ease: 'easeOut',
			}}
			data-selected={isSelected}
			data-active={isActive}
			aria-selected={isSelected}
			aria-label={item.name}
			data-file-id={item.id}
		>
			{/* Renderizar imagen o icono según el tipo */}
			{isImage ? (
				<>
					{/* Usar imagen condicional con source correcto */}
					{(isLoaded || imageLoaded) && (
						<ImageRenderer
							src={imageUrl}
							alt={item.name}
							className="w-full h-full object-cover"
							objectFit="cover"
							priority={index < 12} // Priorizar carga para los primeros elementos visibles
							onLoad={handleImageLoad}
						/>
					)}
					{/* Fallback mientras carga */}
					{!imageLoaded && (
						<div className="w-full h-full bg-muted/20 animate-pulse" />
					)}
				</>
			) : (
				<div className="w-full h-full flex items-center justify-center bg-muted/30">
					<Meh className="h-10 w-10 text-muted-foreground/50" />
				</div>
			)}

			{/* Indicador de favorito */}
			{item.isFavorite && (
				<div className="absolute top-1.5 right-1.5 bg-background/80 rounded-full p-0.5 z-10">
					<Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
				</div>
			)}

			{/* Nombre del archivo */}
			<div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2 pt-6 text-white">
				<div className="truncate text-xs font-medium">{item.name}</div>
			</div>

			{/* Overlay de selección con AnimatePresence para salida limpia */}
			<AnimatePresence>
				{isSelected && (
					<motion.div
						className="absolute inset-0 bg-primary/20 z-0"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.15 }}
					/>
				)}
			</AnimatePresence>
		</motion.button>
	);
});

interface GridViewProps {
	items: FileItem[];
	onItemClick?: (item: FileItem, e: React.MouseEvent) => void;
	onItemDoubleClick?: (item: FileItem) => void;
	onContextMenu?: (item: FileItem, e: React.MouseEvent) => void;
	className?: string;
}

/**
 * Vista de cuadrícula para mostrar archivos
 */
export const GridView = memo<GridViewProps>(function GridView({
	items,
	onItemClick,
	onItemDoubleClick,
	onContextMenu,
	className,
}) {
	// Stores
	const { selectedIds, activeId } = useSelectionStore();
	const { itemSize } = useViewOptionsStore();

	// Estado para rastrear los elementos visibles
	const [visibleIndices, setVisibleIndices] = useState<Set<number>>(new Set());
	// Referencia al contenedor principal
	const containerRef = useRef<HTMLDivElement>(null);

	// Callback para actualizar los elementos visibles
	const handleVisibilityChange = useCallback((indices: number[]) => {
		setVisibleIndices(new Set(indices));
	}, []);

	// Callback para manejar evento de scroll
	const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
		// Extraer métricas del evento de scroll
		const target = e.currentTarget;
		const scrollTop = target.scrollTop;
		const clientHeight = target.clientHeight;
		const scrollHeight = target.scrollHeight;

		// Calcular si estamos cerca del final (para cargar más elementos)
		const isNearBottom = scrollTop + clientHeight > scrollHeight * 0.7;

		// Log para debugging (puedes quitar esto en producción)
		if (isNearBottom) {
			console.debug('GridView: Near bottom of scroll, loading more items if available');
		}
	}, []);

	// Renderizar un elemento de la lista
	const renderItem = useCallback(
		(index: number, item: FileItem) => {
			const isSelected = selectedIds.includes(item.id);
			const isActive = activeId === item.id;
			const isVisible = visibleIndices.has(index);

			return (
				<GridItem
					key={item.id}
					item={item}
					isSelected={isSelected}
					isActive={isActive}
					onClick={onItemClick}
					onDoubleClick={onItemDoubleClick}
					onContextMenu={onContextMenu}
					index={index}
					isVisible={isVisible}
				/>
			);
		},
		[selectedIds, activeId, onItemClick, onItemDoubleClick, onContextMenu, visibleIndices]
	);

	return (
		<div
			ref={containerRef}
			className="w-full h-full relative overflow-hidden"
			data-testid="grid-view-container"
		>
			<VirtualizerWrapper
				type="grid"
				data={items}
				itemContent={renderItem}
				itemSize={itemSize}
				gridClassName={cn('w-full h-full p-2', className)}
				layoutId="grid-view"
				gridGap={GRID_CONFIG.gap}
				aspectRatio={GRID_CONFIG.aspectRatio}
				onVisibilityChange={handleVisibilityChange}
				onScrollStart={() => console.debug('GridView: Scroll started')}
				onScrollEnd={() => console.debug('GridView: Scroll ended')}
			/>
		</div>
	);
});
