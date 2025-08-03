/**
 * @file Vista de tarjetas mejorada con configuración avanzada
 * @module components/features/file-browser/views/cards-view
 */

import { useVirtualizer } from '@tanstack/react-virtual';
import { AnimatePresence, motion } from 'motion/react';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { OptimizedEntityCard } from '@/components/cards/entity-card';
import { useCardsViewConfig } from '@/hooks/use-cards-view-config';
import { cn } from '@/lib/utils';
import type { AnyEntityWithStats } from '@/types/migration';
import { CardActionButtons } from './card-action-buttons';
import { CardInfoOverlay } from './card-info-overlay';

interface CardsViewProps {
	items: AnyEntityWithStats[];
	selectedIds: string[];
	containerWidth: number;
	onItemClick: (item: AnyEntityWithStats, e: React.MouseEvent) => void;
	onItemDoubleClick: (item: AnyEntityWithStats) => void;
}

// Componente interno memoizado para cada carta
const CardItem = memo<{
	item: AnyEntityWithStats;
	isSelected: boolean;
	itemIndex: number;
	cardWidth: number;
	cardHeight: number;
	onItemClickById: (id: string, e: React.MouseEvent) => void;
	onItemDoubleClickById: (id: string) => void;
}>(function CardItem({ item, isSelected, itemIndex, cardWidth, cardHeight, onItemClickById, onItemDoubleClickById }) {
	const { config } = useCardsViewConfig();
	const [isHovered, setIsHovered] = useState(false);
	const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

	const handleMouseEnter = useCallback(() => {
		if (config.interactiveConfig.enabled) {
			const timeout = setTimeout(() => {
				setIsHovered(true);
			}, config.interactiveConfig.hoverDelay);
			setHoverTimeout(timeout);
		}
	}, [config.interactiveConfig.enabled, config.interactiveConfig.hoverDelay]);

	const handleMouseLeave = useCallback(() => {
		if (hoverTimeout) {
			clearTimeout(hoverTimeout);
			setHoverTimeout(null);
		}
		setIsHovered(false);
	}, [hoverTimeout]);

	const handleClick = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			onItemClickById(item.id, e);
		},
		[item.id, onItemClickById]
	);

	const handleDoubleClick = useCallback(() => {
		onItemDoubleClickById(item.id);
	}, [item.id, onItemDoubleClickById]);

	const cardStyleClasses = useMemo(() => {
		const baseClasses = 'relative overflow-hidden transition-all duration-200';
		const shadowClasses = config.showShadows ? 'shadow-sm hover:shadow-md' : '';
		const roundedClasses = config.roundedCorners ? 'rounded-lg' : '';
		const selectionClasses = isSelected && config.showSelectionIndicators ? 'ring-2 ring-primary ring-offset-2' : '';

		return cn(
			baseClasses,
			shadowClasses,
			roundedClasses,
			selectionClasses,
			'cursor-pointer',
			'hover:z-10 hover:scale-105',
			config.animationsEnabled && 'hover:transition-transform'
		);
	}, [config, isSelected]);

	const transition = useMemo(() => {
		if (!config.animationsEnabled) return {};

		return {
			duration: config.animationDuration / 1000,
			delay: Math.min(itemIndex * 0.02, 0.3),
		};
	}, [config.animationsEnabled, config.animationDuration, itemIndex]);

	return (
		<motion.div
			key={item.id}
			initial={config.animationsEnabled ? { opacity: 0, y: 20 } : false}
			animate={config.animationsEnabled ? { opacity: 1, y: 0 } : false}
			transition={transition}
			className={cardStyleClasses}
			style={{
				width: `${cardWidth}px`,
				height: `${cardHeight}px`,
			}}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
		>
			{/* Tarjeta base con menú contextual */}
			{/* Menú contextual deshabilitado para optimizar performance */}
			<OptimizedEntityCard
				entity={item}
				isSelected={isSelected}
				compact={config.cardStyle === 'compact'}
				className="h-full w-full"
				onClick={handleClick}
				onDoubleClick={handleDoubleClick}
			/>

			{/* Overlay de información */}
			{config.interactiveConfig.enabled && config.interactiveConfig.showInfoOverlay && (
				<CardInfoOverlay
					entity={item}
					visible={isHovered}
					position={config.interactiveConfig.overlayPosition}
					metadataConfig={config.metadataConfig}
					animationDuration={config.animationDuration}
				/>
			)}

			{/* Botones de acción */}
			{config.interactiveConfig.enabled && config.interactiveConfig.showActionButtons && (
				<CardActionButtons
					entity={item}
					visible={isHovered}
					actionButtons={config.interactiveConfig.actionButtons}
					animationDuration={config.animationDuration}
				/>
			)}
		</motion.div>
	);
});

export const CardsView = memo<CardsViewProps>(function CardsView({
	items,
	selectedIds,
	containerWidth,
	onItemClick,
	onItemDoubleClick,
}) {
	const parentRef = useRef<any>(null);
	const { config, calculateLayout } = useCardsViewConfig();

	// Map optimizado para lookups O(1)
	const itemsById = useMemo(() => {
		const map = new Map<string, AnyEntityWithStats>();
		for (const item of items) {
			map.set(item.id, item);
		}
		return map;
	}, [items]);

	// Set optimizado para verificación de selección O(1)
	const selectedIdsSet = useMemo(() => new Set(selectedIds), [selectedIds]);

	// Handlers optimizados con Map lookups
	const handleItemClickById = useCallback(
		(id: string, e: React.MouseEvent) => {
			const item = itemsById.get(id);
			if (item) {
				onItemClick(item, e);
			}
		},
		[itemsById, onItemClick]
	);

	const handleItemDoubleClickById = useCallback(
		(id: string) => {
			const item = itemsById.get(id);
			if (item) {
				onItemDoubleClick(item);
			}
		},
		[itemsById, onItemDoubleClick]
	);

	// Calcular layout dinámico
	const layout = useMemo(() => {
		return calculateLayout(containerWidth, items.length);
	}, [calculateLayout, containerWidth, items.length]);

	// Handler para clicks en espacio vacío - mejorado para deselección
	const handleEmptySpaceClick = useCallback(
		(e: React.MouseEvent) => {
			const target = e.target as HTMLElement;
			const currentTarget = e.currentTarget as HTMLElement;

			// Verificar si el click fue en espacio vacío (no en un item)
			const isEmptySpaceClick =
				target === currentTarget ||
				(!target.closest('.entity-card') &&
					!target.closest('[data-entity-card]') &&
					!target.closest('button') &&
					!target.closest('[role="button"]') &&
					!target.closest('input') &&
					!target.closest('textarea') &&
					!target.closest('[data-testid="file-browser-item"]') &&
					!target.closest('.grid > div') &&
					!target.closest('[style*="position: absolute"]') &&
					!target.closest('[data-virtualized-item="true"]'));

			if (isEmptySpaceClick) {
				// Propagar el evento hacia arriba para que el FileBrowser maneje la deselección
				// No hacer preventDefault() para permitir que el evento burbujee

				// Feedback visual opcional si hay elementos seleccionados
				if (selectedIds.length > 0) {
					currentTarget.style.transition = 'background-color 0.15s ease';
					currentTarget.style.backgroundColor = 'rgba(var(--primary), 0.08)';

					setTimeout(() => {
						currentTarget.style.backgroundColor = '';
						currentTarget.style.transition = '';
					}, 150);
				}
			}
		},
		[selectedIds.length]
	);

	// Estado para altura del contenedor
	const [containerHeight, setContainerHeight] = useState<number>(0);

	// Efecto para medir altura del contenedor
	useEffect(() => {
		if (parentRef.current) {
			const scrollAreaViewport = parentRef.current.closest('[data-radix-scroll-area-viewport]');
			if (scrollAreaViewport) {
				const height = scrollAreaViewport.clientHeight - layout.padding * 2;
				setContainerHeight(height);
			}
		}
	}, [layout.padding]);

	// Configurar virtualizador para filas
	const rowVirtualizer = useVirtualizer({
		count: layout.rows,
		getScrollElement: () => {
			const scrollAreaViewport = parentRef.current?.closest('[data-radix-scroll-area-viewport]');
			return scrollAreaViewport || parentRef.current?.parentElement || parentRef.current;
		},
		estimateSize: () => layout.cardHeight + layout.gap,
		overscan: 5,
	});

	// Función para obtener items de una fila específica
	const getRowItems = useCallback(
		(rowIndex: number): AnyEntityWithStats[] => {
			const startIndex = rowIndex * layout.columns;
			const endIndex = Math.min(startIndex + layout.columns, items.length);
			return items.slice(startIndex, endIndex);
		},
		[items, layout.columns]
	);

	return (
		<div
			ref={parentRef}
			data-testid="cards-view"
			data-view-type="cards"
			className="w-full"
			onClick={handleEmptySpaceClick}
			style={{
				contain: 'layout style',
				padding: `${layout.padding}px`,
				height: containerHeight > 0 ? `${containerHeight}px` : '100%',
				overflow: 'auto',
			}}
		>
			<div
				style={{
					height: `${rowVirtualizer.getTotalSize()}px`,
					width: '100%',
					position: 'relative',
				}}
			>
				<AnimatePresence initial={false}>
					{rowVirtualizer.getVirtualItems().map((virtualRow) => {
						const rowItems = getRowItems(virtualRow.index);

						return (
							<div
								key={virtualRow.key}
								style={{
									position: 'absolute',
									top: 0,
									left: 0,
									width: '100%',
									height: `${layout.cardHeight + layout.gap}px`,
									transform: `translateY(${virtualRow.start}px)`,
								}}
							>
								<div
									className="grid"
									style={{
										gridTemplateColumns: `repeat(${layout.columns}, 1fr)`,
										gap: `${layout.gap}px`,
										height: `${layout.cardHeight}px`,
									}}
								>
									{rowItems.map((item, columnIndex) => {
										const isSelected = selectedIdsSet.has(item.id);
										const itemIndex = virtualRow.index * layout.columns + columnIndex;

										return (
											<CardItem
												key={item.id}
												item={item}
												isSelected={isSelected}
												itemIndex={itemIndex}
												cardWidth={layout.cardWidth}
												cardHeight={layout.cardHeight}
												onItemClickById={handleItemClickById}
												onItemDoubleClickById={handleItemDoubleClickById}
											/>
										);
									})}
								</div>
							</div>
						);
					})}
				</AnimatePresence>
			</div>
		</div>
	);
});
