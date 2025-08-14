/**
 * @file Vista masonry mejorada tipo Pinterest con configuración avanzada
 * @module components/features/file-browser/views/masonry-view
 */

import { AnimatePresence, motion } from 'motion/react';
import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { OptimizedEntityCard } from '@/components/cards/entity-card';
import { type MasonryLayoutItem, useMasonryViewConfig } from '@/hooks/use-masonry-view-config';
import { cn } from '@/lib/utils';
import type { AnyEntityWithStats } from '@/types/migration';

interface MasonryViewProps {
	items: AnyEntityWithStats[];
	selectedIds: string[];
	containerWidth: number;
	itemSize?: number; // nuevo: controla ancho base de columnas
	onItemClick: (item: AnyEntityWithStats, e: React.MouseEvent) => void;
	onItemDoubleClick: (item: AnyEntityWithStats) => void;
	interfaceConfig?: any;
}

interface MasonryConfigObject {
	shouldUseAnimations: boolean;
	animationDuration: number;
	hoverEffects: boolean;
	showShadows: boolean;
	roundedCorners: boolean;
	showSelectionIndicators: boolean;
	ultra: boolean;
}

interface MasonryItemProps {
	layoutItem: MasonryLayoutItem;
	itemIndex: number;
	isSelected: boolean;
	masonryConfig: MasonryConfigObject;
	onItemClick: (id: string, event: React.MouseEvent<HTMLButtonElement>) => void;
	onItemDoubleClick: (id: string, event: React.MouseEvent<HTMLButtonElement>) => void;
	thumbnailQuality?: 'low' | 'medium' | 'high';
	borderRadiusPx?: number;
}

const MasonryItem = memo<MasonryItemProps>(
	function MasonryItemComponent({
		layoutItem,
		isSelected,
		itemIndex,
		onItemClick,
		onItemDoubleClick,
		masonryConfig,
		thumbnailQuality,
		borderRadiusPx,
	}) {
		const style: React.CSSProperties = {
			position: 'absolute',
			left: layoutItem.x,
			top: layoutItem.y,
			width: layoutItem.width,
			height: layoutItem.height,
		};

		const handleClick = useCallback(
			(e: React.MouseEvent<HTMLButtonElement>) => {
				e.stopPropagation();
				onItemClick(layoutItem.item.id, e);
			},
			[layoutItem.item.id, onItemClick]
		);

		const handleDoubleClick = useCallback(
			(e: React.MouseEvent<HTMLButtonElement>) => {
				e.stopPropagation();
				onItemDoubleClick(layoutItem.item.id, e);
			},
			[layoutItem.item.id, onItemDoubleClick]
		);

		// OPTIMIZACIÓN: Propiedades de motion estables que no cambian entre renders
		const staticMotionProps = useMemo(
			() => ({
				layout: masonryConfig.shouldUseAnimations,
				initial: masonryConfig.shouldUseAnimations ? { opacity: 0, scale: 0.9 } : undefined,
				animate: masonryConfig.shouldUseAnimations ? { opacity: 1, scale: 1 } : undefined,
				exit: masonryConfig.shouldUseAnimations ? { opacity: 0, scale: 0.8 } : undefined,
				'data-testid': 'file-browser-item',
				'data-entity-id': layoutItem.item.id,
				'data-item-index': itemIndex,
			}),
			[masonryConfig.shouldUseAnimations, layoutItem.item.id, itemIndex]
		);

		const transition = useMemo(
			() => ({
				duration: masonryConfig.animationDuration / 1000,
				ease: [0.17, 0.67, 0.83, 0.67] as [number, number, number, number],
			}),
			[masonryConfig.animationDuration]
		);

		const itemClasses = cn(
			'group relative cursor-pointer select-none overflow-hidden border bg-background/40 outline-none',
			{
				'transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary':
					!masonryConfig.ultra && masonryConfig.shouldUseAnimations,
				'rounded-lg': masonryConfig.roundedCorners && !borderRadiusPx,
				'shadow-sm transition-shadow duration-200 hover:shadow-md': masonryConfig.showShadows && !masonryConfig.ultra,
				'ring-2 ring-primary': isSelected && masonryConfig.showSelectionIndicators,
			}
		);

		// Para elementos no animados, usar div simple
		if (!masonryConfig.shouldUseAnimations) {
			return (
				<button
					className={itemClasses}
					data-entity-card=""
					data-entity-id={layoutItem.item.id}
					data-item-id={layoutItem.item.id}
					data-item-index={itemIndex}
					data-testid="file-browser-item"
					onClick={handleClick}
					onDoubleClick={handleDoubleClick}
					style={{
						...(style as React.CSSProperties),
						borderRadius: borderRadiusPx ? `${borderRadiusPx}px` : undefined,
					}}
					type="button"
				>
					<OptimizedEntityCard
						className="h-full w-full"
						compact
						entity={layoutItem.item}
						isSelected={isSelected}
						onClick={() => {}}
						onDoubleClick={() => {}}
						thumbnailQuality={thumbnailQuality}
					/>
				</button>
			);
		}

		return (
			<motion.button
				{...staticMotionProps}
				className={itemClasses}
				data-entity-card=""
				data-item-id={layoutItem.item.id}
				onClick={handleClick}
				onDoubleClick={handleDoubleClick}
				style={{ ...style, borderRadius: borderRadiusPx ? `${borderRadiusPx}px` : undefined }}
				transition={transition}
				type="button"
			>
				<OptimizedEntityCard
					className="h-full w-full"
					compact
					entity={layoutItem.item}
					isSelected={isSelected}
					onClick={() => {}}
					onDoubleClick={() => {}}
				/>
			</motion.button>
		);
	},
	(prevProps, nextProps) => {
		// OPTIMIZACIÓN: Comparación más eficiente que evita re-renders innecesarios
		const layoutChanged =
			prevProps.layoutItem.x !== nextProps.layoutItem.x ||
			prevProps.layoutItem.y !== nextProps.layoutItem.y ||
			prevProps.layoutItem.width !== nextProps.layoutItem.width ||
			prevProps.layoutItem.height !== nextProps.layoutItem.height;

		const propsChanged =
			prevProps.layoutItem.item.id !== nextProps.layoutItem.item.id ||
			prevProps.isSelected !== nextProps.isSelected ||
			prevProps.itemIndex !== nextProps.itemIndex;

		// OPTIMIZACIÓN: Comparación superficial de la configuración de masonry
		const configChanged =
			prevProps.masonryConfig.shouldUseAnimations !== nextProps.masonryConfig.shouldUseAnimations ||
			prevProps.masonryConfig.animationDuration !== nextProps.masonryConfig.animationDuration ||
			prevProps.masonryConfig.hoverEffects !== nextProps.masonryConfig.hoverEffects ||
			prevProps.masonryConfig.showShadows !== nextProps.masonryConfig.showShadows ||
			prevProps.masonryConfig.roundedCorners !== nextProps.masonryConfig.roundedCorners ||
			prevProps.masonryConfig.showSelectionIndicators !== nextProps.masonryConfig.showSelectionIndicators;

		// OPTIMIZACIÓN: No comparar funciones directamente ya que pueden cambiar de referencia
		// En su lugar, confiar en que los handlers estables no cambien innecesariamente
		return !(layoutChanged || propsChanged || configChanged);
	}
);

export const MasonryView = memo<MasonryViewProps>(function MasonryViewComponent({
	items,
	selectedIds,
	containerWidth,
	itemSize = 160,
	onItemClick,
	onItemDoubleClick,
	interfaceConfig,
}) {
	const parentRef = useRef<any>(null);
	const { config, calculateLayout } = useMasonryViewConfig();

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

	// OPTIMIZACIÓN: Estabilizar handlers con dependencias mínimas usando useRef
	const stableHandlersRef = useRef({
		onItemClickById: (_id: string, _e: React.MouseEvent) => {
			// Placeholder
		},
		onItemDoubleClickById: (_id: string) => {
			// Placeholder
		},
	});

	// Actualizar handlers sin cambiar referencia
	useEffect(() => {
		stableHandlersRef.current.onItemClickById = (id: string, e: React.MouseEvent) => {
			const item = itemsById.get(id);
			if (item) {
				onItemClick(item, e);
			}
		};

		stableHandlersRef.current.onItemDoubleClickById = (id: string) => {
			const item = itemsById.get(id);
			if (item) {
				onItemDoubleClick(item);
			}
		};
	}, [itemsById, onItemClick, onItemDoubleClick]);

	// OPTIMIZACIÓN: Handlers estables que no cambian de referencia
	const handleItemClickById = useCallback((id: string, e: React.MouseEvent) => {
		stableHandlersRef.current.onItemClickById(id, e);
	}, []);

	const handleItemDoubleClickById = useCallback((id: string) => {
		stableHandlersRef.current.onItemDoubleClickById(id);
	}, []);

	// OPTIMIZACIÓN: Configuración estable de masonry para evitar cambios de props
	const masonryConfig = useMemo(
		() => ({
			shouldUseAnimations:
				interfaceConfig?.global?.animations &&
				config.animationsEnabled &&
				items.length < 100 &&
				!interfaceConfig?.global?.ultra,
			animationDuration: config.animationDuration,
			hoverEffects: config.hoverEffects,
			showShadows: config.showShadows,
			roundedCorners: config.roundedCorners,
			showSelectionIndicators: config.showSelectionIndicators,
			ultra: Boolean(interfaceConfig?.global?.ultra),
		}),
		[
			interfaceConfig?.global?.animations,
			interfaceConfig?.global?.ultra,
			config.animationsEnabled,
			config.animationDuration,
			config.hoverEffects,
			config.showShadows,
			config.roundedCorners,
			config.showSelectionIndicators,
			items.length,
		]
	);

	// Derivar ancho de columna desde itemSize (clamp 120-320) sin mutar config original
	const effectiveColumnWidth = Math.max(120, Math.min(itemSize, 320));

	// Calcular layout usando el nuevo algoritmo con override temporal de columnWidth
	const layoutResult = useMemo(
		() => calculateLayout(items, containerWidth, effectiveColumnWidth),
		[calculateLayout, items, containerWidth, effectiveColumnWidth]
	);

	// Handler para clicks en espacio vacío
	const handleEmptySpaceClick = useCallback(
		(e: React.MouseEvent) => {
			const target = e.target as HTMLElement;
			const currentTarget = e.currentTarget as HTMLElement;

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
					target.closest('[style*="position: absolute"]') ||
					target.closest('[data-virtualized-item="true"]')
				);

			if (isEmptySpaceClick && selectedIds.length > 0) {
				currentTarget.style.transition = 'background-color 0.15s ease';
				currentTarget.style.backgroundColor = 'rgba(var(--primary), 0.08)';

				setTimeout(() => {
					currentTarget.style.backgroundColor = '';
					currentTarget.style.transition = '';
				}, 150);
			}
		},
		[selectedIds.length]
	);

	// Efecto eliminado - usando altura flexible
	// useEffect eliminado para evitar encogimiento al cargar

	if (!containerWidth || containerWidth <= 0) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="text-muted-foreground">Calculando layout masonry...</div>
			</div>
		);
	}

	return (
		<section
			className="h-full w-full"
			data-testid="masonry-view"
			data-view-type="masonry"
			ref={parentRef}
			style={{
				// Evitar contain: 'strict' que limita el cálculo de altura dentro de ScrollArea
				// y provoca contenedor muy pequeño sin scroll visible
				padding: `${config.spacing.padding}px`,
			}}
		>
			<div
				className={cn('file-browser-view')}
				style={{ fontFamily: 'var(--app-font-family)', fontSize: 'var(--app-font-size)' }}
			>
				{/* Contenedor de items con posicionamiento absoluto */}
				<div
					style={{
						position: 'relative',
						width: '100%',
						// Altura total del layout para que el viewport pueda hacer scroll
						height: `${layoutResult.totalHeight}px`,
					}}
				>
					<AnimatePresence initial={false}>
						{layoutResult.items.map((layoutItem, index) => {
							const isSelected = selectedIdsSet.has(layoutItem.item.id);

							return (
								<MasonryItem
									borderRadiusPx={interfaceConfig?.global?.borderRadius?.mosaic}
									isSelected={isSelected}
									itemIndex={index}
									key={layoutItem.item.id}
									layoutItem={layoutItem}
									masonryConfig={masonryConfig}
									onItemClick={handleItemClickById}
									onItemDoubleClick={handleItemDoubleClickById}
									thumbnailQuality={interfaceConfig?.performance?.thumbnailQuality}
								/>
							);
						})}
					</AnimatePresence>
				</div>
			</div>
		</section>
	);
});

MasonryView.displayName = 'MasonryView';
