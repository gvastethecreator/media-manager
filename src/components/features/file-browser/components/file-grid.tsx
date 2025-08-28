import { forwardRef, useEffect, useState, useMemo } from 'react';
import type { ViewMode } from '@/store/ui/view-options.slice';
import { GridItem } from './grid-item';
import type { MediaItem } from './media-thumbnail';

// CONFIG local de la vista Grid
const CONFIG = {
	gap: 8, // px
	padding: 8, // px
	baseItemSize: 150,
	increaseViewportBy: { top: 200, bottom: 600 } as { top: number; bottom: number },
};

interface FileGridProps {
	items: MediaItem[];
	selectedIds?: string[];
	viewMode?: ViewMode;
	onItemClick?: (item: MediaItem) => void;
	onItemDoubleClick?: (item: MediaItem) => void;
	style?: React.CSSProperties;
	itemSize?: number;
	// Contenedor de scroll externo opcional
	scrollParent?: HTMLElement | null;
	// Key para forzar remount del componente Virtuoso
	virtuosoKey?: string;
}

// Componente de lista para VirtuosoGrid (hoisted para evitar definir componentes dentro de otros)
const GridList = forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement> & { itemSize?: number; gridStyle?: React.CSSProperties }
>(({ className, style, itemSize = CONFIG.baseItemSize, gridStyle, ...props }, ref) => {
	// Usar gridStyle si se proporciona, de lo contrario usar el estilo por defecto basado en itemSize
	const finalGridTemplateColumns =
		gridStyle?.gridTemplateColumns || `repeat(auto-fill, minmax(${Math.max(80, itemSize)}px, 1fr))`;

	return (
		<div
			ref={ref}
			className={`grid${className ? ` ${className}` : ''}`}
			style={{
				gap: CONFIG.gap,
				padding: CONFIG.padding,
				gridTemplateColumns: finalGridTemplateColumns,
				...(style || {}),
			}}
			{...props}
		/>
	);
});

export default function FileGrid({
	items,
	selectedIds = [],
	onItemClick,
	onItemDoubleClick,
	viewMode,
	style,
	itemSize = CONFIG.baseItemSize,
	scrollParent,
	virtuosoKey,
}: FileGridProps) {
	console.log('[FileGrid] Rendering with items:', items.length);

	const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
	const [VirtuosoGridComp, setVirtuosoGridComp] = useState<any>(null);

	// Crear el componente List memoizado con itemSize
	const GridListWithSize = useMemo(
		() =>
			forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => (
				<GridList {...props} ref={ref} itemSize={itemSize} gridStyle={style} />
			)),
		[itemSize, style]
	);

	useEffect(() => {
		let mounted = true;
		import('react-virtuoso')
			.then((mod) => {
				if (!mounted) return;
				const Comp = (mod as any).VirtuosoGrid || null;
				setVirtuosoGridComp(() => Comp);
			})
			.catch(() => {
				// fallback silencioso
			});
		return () => {
			mounted = false;
		};
	}, []);

	if (VirtuosoGridComp) {
		return (
			<div style={{ height: scrollParent ? 'auto' : '100%' }} data-testid="grid-view">
				<VirtuosoGridComp
					key={virtuosoKey} // Key para forzar remount
					data={items}
					computeItemKey={(index: number, item: MediaItem) => item.id}
					increaseViewportBy={CONFIG.increaseViewportBy}
					initialItemCount={Math.min(50, items.length)}
					itemContent={(index: number, item: MediaItem) => (
						<div data-index={index}>
							<GridItem
								item={item}
								onClick={onItemClick}
								onDoubleClick={onItemDoubleClick}
								selected={selectedIds.includes(item.id)}
								size={itemSize}
							/>
						</div>
					)}
					// Usar components.List para el contenedor del grid
					components={{ List: GridListWithSize }}
					// Estilos del contenedor externo del virtuoso (altura)
					style={{ height: scrollParent ? 'auto' : '100%' }}
					useWindowScroll={false}
					customScrollParent={scrollParent ?? undefined}
				/>
			</div>
		);
	}

	// Fallback no virtualizado con scroll
	return (
		<div className="h-full overflow-auto" data-testid="grid-view">
			<div
				className="grid"
				style={{
					gap: CONFIG.gap,
					padding: CONFIG.padding,
					gridTemplateColumns: `repeat(auto-fill, minmax(${Math.max(80, itemSize)}px, 1fr))`,
					...style,
				}}
			>
				{items.map((item) => (
					<GridItem
						item={item}
						key={item.id}
						onClick={onItemClick}
						onDoubleClick={onItemDoubleClick}
						selected={selectedIds.includes(item.id)}
						size={itemSize}
					/>
				))}
			</div>
		</div>
	);
}
