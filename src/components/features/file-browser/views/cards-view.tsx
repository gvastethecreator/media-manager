/**
 * @file Vista de tarjetas mejorada con configuración avanzada
 * @module components/features/file-browser/views/cards-view
 */

import { useVirtualizer } from '@tanstack/react-virtual';
import { AnimatePresence, motion } from 'motion/react';
import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
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

// Componente interno memoizado para cada carta - OPTIMIZADO
const CardItem = memo<{
	entity: AnyEntityWithStats;
	isSelected: boolean;
	itemIndex: number;
	cardWidth: number;
	cardHeight: number;
	onItemClickById: (id: string, e: React.MouseEvent) => void;
	onItemDoubleClickById: (id: string) => void;
}>(function CardItemComponent({
	entity,
	isSelected,
	itemIndex,
	cardWidth,
	cardHeight,
	onItemClickById,
	onItemDoubleClickById,
}) {
	const { config } = useCardsViewConfig();
	const [isHovered, setIsHovered] = useState(false);
	const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

	// OPTIMIZACIÓN: Memoizar props derivadas para evitar re-cálculos
	const derivedProps = useMemo(
		() => ({
			interactiveEnabled: config.interactiveConfig.enabled,
			hoverDelay: config.interactiveConfig.hoverDelay,
			showInfoOverlay: config.interactiveConfig.showInfoOverlay,
			showActionButtons: config.interactiveConfig.showActionButtons,
			isCompact: config.cardStyle === 'compact',
		}),
		[
			config.interactiveConfig.enabled,
			config.interactiveConfig.hoverDelay,
			config.interactiveConfig.showInfoOverlay,
			config.interactiveConfig.showActionButtons,
			config.cardStyle,
		]
	);

	// OPTIMIZACIÓN: Handlers estables con useRef
	const handlersRef = useRef({
		onMouseEnter: () => {
			if (derivedProps.interactiveEnabled) {
				const timeout = setTimeout(() => {
					setIsHovered(true);
				}, derivedProps.hoverDelay);
				setHoverTimeout(timeout);
			}
		},
		onMouseLeave: () => {
			if (hoverTimeout) {
				clearTimeout(hoverTimeout);
				setHoverTimeout(null);
			}
			setIsHovered(false);
		},
		onClick: (e: React.MouseEvent) => {
			e.stopPropagation();
			onItemClickById(entity.id, e);
		},
		onDoubleClick: () => {
			onItemDoubleClickById(entity.id);
		},
	});

	// Actualizar handlers cuando cambien las dependencias
	useMemo(() => {
		handlersRef.current.onMouseEnter = () => {
			if (derivedProps.interactiveEnabled) {
				const timeout = setTimeout(() => {
					setIsHovered(true);
				}, derivedProps.hoverDelay);
				setHoverTimeout(timeout);
			}
		};

		handlersRef.current.onClick = (e: React.MouseEvent) => {
			e.stopPropagation();
			onItemClickById(entity.id, e);
		};

		handlersRef.current.onDoubleClick = () => {
			onItemDoubleClickById(entity.id);
		};
	}, [derivedProps.interactiveEnabled, derivedProps.hoverDelay, onItemClickById, onItemDoubleClickById, entity.id]);

	// Handlers estables que no cambian entre renders
	const handleMouseEnter = useCallback(() => {
		handlersRef.current.onMouseEnter();
	}, []);

	const handleMouseLeave = useCallback(() => {
		handlersRef.current.onMouseLeave();
	}, []);

	const handleClick = useCallback((e: React.MouseEvent) => {
		handlersRef.current.onClick(e);
	}, []);

	const handleDoubleClick = useCallback(() => {
		handlersRef.current.onDoubleClick();
	}, []);

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
		if (!config.animationsEnabled) {
			return {};
		}
		return {
			duration: config.animationDuration / 1000,
			delay: Math.min(itemIndex * 0.02, 0.3),
		};
	}, [config.animationsEnabled, config.animationDuration, itemIndex]);

	return (
		<motion.div
			animate={config.animationsEnabled ? { opacity: 1, y: 0 } : false}
			className={cardStyleClasses}
			initial={config.animationsEnabled ? { opacity: 0, y: 20 } : false}
			key={entity.id}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			style={{
				width: `${cardWidth}px`,
				height: `${cardHeight}px`,
			}}
			transition={transition}
		>
			{/* Tarjeta base con menú contextual */}
			{/* Menú contextual deshabilitado para optimizar performance */}
			<OptimizedEntityCard
				className="h-full w-full"
				compact={config.cardStyle === 'compact'}
				entity={entity}
				isSelected={isSelected}
				onClick={handleClick}
				onDoubleClick={handleDoubleClick}
			/>

			{/* Overlay de información */}
			{config.interactiveConfig.enabled && config.interactiveConfig.showInfoOverlay && (
				<CardInfoOverlay
					animationDuration={config.animationDuration}
					entity={entity}
					metadataConfig={config.metadataConfig}
					position={config.interactiveConfig.overlayPosition}
					visible={isHovered}
				/>
			)}

			{/* Botones de acción */}
			{config.interactiveConfig.enabled && config.interactiveConfig.showActionButtons && (
				<CardActionButtons
					actionButtons={config.interactiveConfig.actionButtons}
					animationDuration={config.animationDuration}
					entity={entity}
					visible={isHovered}
				/>
			)}
		</motion.div>
	);
});

export const CardsView = memo<CardsViewProps>(function CardsViewComponent({
	items,
	selectedIds,
	containerWidth,
	onItemClick,
	onItemDoubleClick,
}) {
	const parentRef = useRef<any>(null);
	const { config, calculateLayout } = useCardsViewConfig();

	// OPTIMIZACIÓN AVANZADA: Memoización de props derivadas para evitar re-cálculos
	const derivedProps = useMemo(
		() => ({
			hasSelection: selectedIds.length > 0,
			itemCount: items.length,
			isVirtualized: items.length > 100,
			animationsEnabled: config.animationsEnabled,
			showShadows: config.showShadows,
			roundedCorners: config.roundedCorners,
			showSelectionIndicators: config.showSelectionIndicators,
		}),
		[
			selectedIds.length,
			items.length,
			config.animationsEnabled,
			config.showShadows,
			config.roundedCorners,
			config.showSelectionIndicators,
		]
	);

	// OPTIMIZACIÓN: Referencias estables con useRef para máximo rendimiento

	const itemsByIdRef = useRef(new Map<string, AnyEntityWithStats>());
	const selectedIdsSetRef = useRef(new Set<string>());

	// Actualizar refs solo cuando sea necesario - Optimizado para evitar re-cálculos
	useMemo(() => {
		const newMap = new Map<string, AnyEntityWithStats>();
		for (const item of items) {
			newMap.set(item.id, item);
		}
		itemsByIdRef.current = newMap;

		const newSet = new Set(selectedIds);
		selectedIdsSetRef.current = newSet;

		return { map: newMap, set: newSet };
	}, [items, selectedIds]);

	// OPTIMIZACIÓN AVANZADA: Handlers estables con useRef para máximo rendimiento
	const handlersRef = useRef({
		onItemClick: (id: string, e: React.MouseEvent) => {
			const item = itemsByIdRef.current.get(id);
			if (item) {
				onItemClick(item, e);
			}
		},
		onItemDoubleClick: (id: string) => {
			const item = itemsByIdRef.current.get(id);
			if (item) {
				onItemDoubleClick(item);
			}
		},
	});

	// Actualizar handlers cuando cambien las dependencias
	useMemo(() => {
		handlersRef.current.onItemClick = (id: string, e: React.MouseEvent) => {
			const item = itemsByIdRef.current.get(id);
			if (item) {
				onItemClick(item, e);
			}
		};

		handlersRef.current.onItemDoubleClick = (id: string) => {
			const item = itemsByIdRef.current.get(id);
			if (item) {
				onItemDoubleClick(item);
			}
		};
	}, [onItemClick, onItemDoubleClick]);

	// Handlers estables que no cambian entre renders
	const handleItemClickById = useCallback((id: string, e: React.MouseEvent) => {
		handlersRef.current.onItemClick(id, e);
	}, []);

	const handleItemDoubleClickById = useCallback((id: string) => {
		handlersRef.current.onItemDoubleClick(id);
	}, []);

	// Calcular layout dinámico - Optimizado con dependencias mínimas
	const layout = useMemo(() => {
		return calculateLayout(containerWidth, derivedProps.itemCount);
	}, [calculateLayout, containerWidth, derivedProps.itemCount]);

	// Handler para clicks en espacio vacío - mejorado para deselección
	const handleEmptySpaceClick = useCallback(
		(e: React.MouseEvent) => {
			const target = e.target as HTMLElement;
			const currentTarget = e.currentTarget as HTMLElement;

			// Verificar si el click fue en espacio vacío (no en un item)
			const isEmptySpaceClick =
				target === currentTarget ||
				!(
					target.closest('.entity-card') ||
					target.closest('[data-entity-card]') ||
					target.closest('button') ||
					target.closest('[role="button"]') ||
					target.closest('input') ||
					target.closest('textarea') ||
					target.closest('[data-testid="file-browser-item"]') ||
					target.closest('.grid > div') ||
					target.closest('[style*="position: absolute"]') ||
					target.closest('[data-virtualized-item="true"]')
				);

			if (isEmptySpaceClick && derivedProps.hasSelection) {
				currentTarget.style.transition = 'background-color 0.15s ease';
				currentTarget.style.backgroundColor = 'rgba(var(--primary), 0.08)';
				setTimeout(() => {
					currentTarget.style.backgroundColor = '';
					currentTarget.style.transition = '';
				}, 150);
			}
		},
		[derivedProps.hasSelection]
	);

	// Configurar virtualizador para filas
	const rowVirtualizer = useVirtualizer({
		count: layout.rows,
		getScrollElement: () => {
			const scrollAreaViewport = parentRef.current?.closest('[data-slot="scroll-area-viewport"]') as HTMLElement | null;
			return scrollAreaViewport ?? parentRef.current?.parentElement ?? parentRef.current;
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

	const handleEmptySpaceKeyDown = useCallback((e: React.KeyboardEvent) => {
		if (e.key === 'Escape') {
			// Permitir burbujeo para que el contenedor principal maneje la deselección
		}
	}, []);

	return (
		<button
			className="w-full cursor-default border-0 bg-transparent p-0 text-left"
			data-testid="cards-view"
			data-view-type="cards"
			onClick={handleEmptySpaceClick}
			onKeyDown={handleEmptySpaceKeyDown}
			ref={parentRef}
			style={{
				contain: 'layout style',
				padding: `${layout.padding}px`,
			}}
			type="button"
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
										const isSelected = selectedIdsSetRef.current.has(item.id);
										const itemIndex = virtualRow.index * layout.columns + columnIndex;

										return (
											<CardItem
												cardHeight={layout.cardHeight}
												cardWidth={layout.cardWidth}
												entity={item}
												isSelected={isSelected}
												itemIndex={itemIndex}
												key={item.id}
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
		</button>
	);
});
