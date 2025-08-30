import { forwardRef, useEffect, useMemo, useState } from 'react';
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuLabel,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from '@/components/ui/context-menu';
import type { ViewMode } from '@/store/ui/view-options.slice';
import type { ClickModifiers } from '../types/file-browser.types';
import { AddToEntityMenu } from './add-to-entity-menu';
import { GridItem } from './grid-item';
import type { MediaItem } from './media-thumbnail';

// CONFIG local de la vista Grid
const CONFIG = {
	gap: 8, // px
	padding: 8, // px
	baseItemSize: 150,
	// Overscan mayor para suavizar scroll en grid
	increaseViewportBy: { top: 700, bottom: 1400 } as { top: number; bottom: number },
};

interface FileGridProps {
	items: MediaItem[];
	viewMode?: ViewMode;
	onItemClick?: (item: MediaItem, modifiers?: ClickModifiers) => void;
	onItemDoubleClick?: (item: MediaItem) => void;
	style?: React.CSSProperties;
	itemSize?: number;
	// Lista opcional de IDs seleccionados (usada por controladores externos)
	selectedIds?: string[];
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
			className={`grid${className ? ` ${className}` : ''}`}
			ref={ref}
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
	onItemClick,
	onItemDoubleClick,
	viewMode,
	style,
	itemSize = CONFIG.baseItemSize,
	scrollParent,
	virtuosoKey,
}: FileGridProps) {
	const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
	const [VirtuosoGridComp, setVirtuosoGridComp] = useState<any>(null);

	const handleKeyDownCapture = (e: React.KeyboardEvent<HTMLDivElement>) => {
		const target = e.target as HTMLElement | null;
		if (!target) return;
		if (target.getAttribute('data-entity-card') == null) return; // solo cuando el foco está en una card
		if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
		e.preventDefault();
		e.stopPropagation();
		const container = e.currentTarget as HTMLElement;
		const cards = Array.from(container.querySelectorAll<HTMLElement>('[data-entity-card]'));
		const idx = cards.indexOf(target);
		if (idx === -1) return;
		const nextIdx = e.key === 'ArrowRight' ? idx + 1 : idx - 1;
		const next = cards[nextIdx];
		if (next) {
			next.scrollIntoView({ block: 'nearest', inline: 'nearest' });
			next.focus();
		}
	};

	// Crear el componente List memoizado con itemSize
	const GridListWithSize = useMemo(
		() =>
			forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => (
				<GridList {...props} gridStyle={style} itemSize={itemSize} ref={ref} />
			)),
		[itemSize, style]
	);

	// Estabilizar el objeto components para VirtuosoGrid y evitar remounts innecesarios
	const components = useMemo(() => ({ List: GridListWithSize }), [GridListWithSize]);

	// Estabilizar itemContent para no crear nueva función en cada render
	const renderItemContent = useMemo(
		() => (index: number, item: MediaItem) => (
			<div data-index={index}>
				<ContextMenu>
					<ContextMenuTrigger asChild>
						<GridItem item={item} onClick={onItemClick} onDoubleClick={onItemDoubleClick} size={itemSize} />
					</ContextMenuTrigger>
					<ContextMenuContent>
						<ContextMenuLabel>Acciones</ContextMenuLabel>
						<ContextMenuItem onSelect={() => onItemClick?.(item)}>Abrir</ContextMenuItem>
						<ContextMenuItem>Mostrar en carpeta</ContextMenuItem>
						<ContextMenuSeparator />
						<AddToEntityMenu entityType={item.entityType} itemId={item.id} />
						<ContextMenuSeparator />
						<ContextMenuItem variant="destructive">Eliminar</ContextMenuItem>
					</ContextMenuContent>
				</ContextMenu>
			</div>
		),
		[onItemClick, onItemDoubleClick, itemSize]
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
			<div
				data-testid="grid-view"
				onKeyDownCapture={handleKeyDownCapture}
				style={{ height: scrollParent ? 'auto' : '100%', minHeight: 200 }}
			>
				<VirtuosoGridComp
					components={components} // Estable para evitar remounts
					computeItemKey={(index: number, item: MediaItem) => item.id}
					customScrollParent={scrollParent ?? undefined}
					data={items}
					increaseViewportBy={CONFIG.increaseViewportBy}
					initialItemCount={Math.min(30, items.length)}
					// Usar components.List para el contenedor del grid
					itemContent={renderItemContent}
					// Estilos del contenedor externo del virtuoso (altura)
					key={virtuosoKey}
					style={{ height: scrollParent ? 'auto' : '100%', minHeight: 200 }}
					useWindowScroll={false}
				/>
			</div>
		);
	}

	// Fallback no virtualizado con scroll
	return (
		<div
			className="h-full overflow-auto"
			data-testid="grid-view"
			onKeyDownCapture={handleKeyDownCapture}
			style={{ minHeight: 200 }}
		>
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
					<ContextMenu key={item.id}>
						<ContextMenuTrigger asChild>
							<GridItem item={item} onClick={onItemClick} onDoubleClick={onItemDoubleClick} size={itemSize} />
						</ContextMenuTrigger>
						<ContextMenuContent>
							<ContextMenuLabel>Acciones</ContextMenuLabel>
							<ContextMenuItem onSelect={() => onItemClick?.(item)}>Abrir</ContextMenuItem>
							<ContextMenuItem>Mostrar en carpeta</ContextMenuItem>
							<ContextMenuSeparator />
							<AddToEntityMenu entityType={item.entityType} itemId={item.id} />
							<ContextMenuSeparator />
							<ContextMenuItem variant="destructive">Eliminar</ContextMenuItem>
						</ContextMenuContent>
					</ContextMenu>
				))}
			</div>
		</div>
	);
}
