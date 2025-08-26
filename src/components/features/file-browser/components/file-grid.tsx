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

export function FileGrid({
	items,
	selectedIds = [],
	onItemClick,
	onItemDoubleClick,
	style,
	itemSize = CONFIG.baseItemSize,
}: FileGridProps) {
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
			<div style={{ height: '100%' }}>
				<VirtuosoGridComp
					data={items}
					increaseViewportBy={CONFIG.increaseViewportBy}
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
					// Estilos del contenedor de la lista (grid): usar components.List para evitar props no válidas
					listClassName="grid"
					components={{ List: GridListWithSize }}
					// Estilos del contenedor externo del virtuoso (altura)
					style={{ height: '100%' }}
				/>
			</div>
		);
	}

	// Fallback no virtualizado
	return (
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
	);
}
