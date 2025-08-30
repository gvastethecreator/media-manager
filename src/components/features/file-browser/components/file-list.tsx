import { useEffect, useMemo, useState } from 'react';
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuLabel,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from '@/components/ui/context-menu';
import type { ClickModifiers } from '../types/file-browser.types';
import { AddToEntityMenu } from './add-to-entity-menu';
import type { MediaItem } from './media-thumbnail';
import { MediaThumbnail } from './media-thumbnail';

// CONFIG local de la vista List (compacta y minimalista)
const CONFIG = {
	rowHeight: 90, // Altura máxima para acomodar thumbnails de 90px
	thumbnailSize: 90, // Thumbnail máximo 90x90px respetando aspect ratio
	// Overscan mayor para lista compacta
	increaseViewportBy: { top: 600, bottom: 1400 } as { top: number; bottom: number },
};

// Componente compacto para cada item de la lista
function CompactListItem({
	item,
	selected,
	onClick,
	onDoubleClick,
}: {
	item: MediaItem;
	selected: boolean;
	onClick?: (item: MediaItem, modifiers?: ClickModifiers) => void;
	onDoubleClick?: (item: MediaItem) => void;
}) {
	return (
		<button
			className={`flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent ${selected ? 'bg-accent font-medium' : ''}`}
			data-entity-card
			data-entity-type={item.entityType}
			onClick={(e) => onClick?.(item, { ctrlKey: e.ctrlKey, metaKey: e.metaKey, shiftKey: e.shiftKey })}
			onDoubleClick={() => onDoubleClick?.(item)}
			style={{ maxHeight: '90px', height: `${CONFIG.rowHeight}px` }}
			type="button"
		>
			{/* MediaThumbnail para todos los tipos */}
			<MediaThumbnail
				className="flex-shrink-0 rounded border"
				height={CONFIG.thumbnailSize}
				item={item}
				preloadMargin="600px"
				style={{
					objectFit: 'cover',
					maxHeight: `${CONFIG.thumbnailSize}px`,
					maxWidth: `${CONFIG.thumbnailSize}px`,
					height: `${CONFIG.thumbnailSize}px`,
					width: `${CONFIG.thumbnailSize}px`,
				}}
				width={CONFIG.thumbnailSize}
			/>

			{/* Nombre del archivo truncado */}
			<span className="flex-1 truncate font-medium">{item.name}</span>

			{/* Información adicional opcional */}
			{item.width && item.height && (
				<span className="font-mono text-muted-foreground text-xs">
					{item.width}×{item.height}
				</span>
			)}
		</button>
	);
}

interface FileListProps {
	items: MediaItem[];
	selectedIds?: string[];
	onItemClick?: (item: MediaItem, modifiers?: ClickModifiers) => void;
	onItemDoubleClick?: (item: MediaItem) => void;
	// Permite usar un contenedor de scroll externo (react-virtuoso: customScrollParent)
	scrollParent?: HTMLElement | null;
	// Key para forzar remount del componente Virtuoso
	virtuosoKey?: string;
}

export function FileList({
	items,
	selectedIds = [],
	onItemClick,
	onItemDoubleClick,
	scrollParent,
	virtuosoKey,
}: FileListProps) {
	const [VirtuosoComp, setVirtuosoComp] = useState<any>(null);

	// Definir itemContent de forma incondicional para mantener un orden de hooks estable
	const itemContent = useMemo(
		() => (index: number, item: MediaItem) => (
			<div data-testid={`list-row-${index}`}>
				<ContextMenu>
					<ContextMenuTrigger asChild>
						<CompactListItem
							item={item}
							key={item.id}
							onClick={onItemClick}
							onDoubleClick={onItemDoubleClick}
							selected={selectedIds.includes(item.id)}
						/>
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
		[onItemClick, onItemDoubleClick, selectedIds]
	);

	useEffect(() => {
		let mounted = true;
		import('react-virtuoso')
			.then((mod) => {
				if (!mounted) return;
				const Comp = (mod as any).Virtuoso || null;
				setVirtuosoComp(() => Comp);
			})
			.catch(() => {
				// fallback silencioso
			});
		return () => {
			mounted = false;
		};
	}, []);

	if (VirtuosoComp) {
		return (
			<div data-testid="listview-container" style={{ height: scrollParent ? 'auto' : '100%' }}>
				<VirtuosoComp
					computeItemKey={(index: number, item: MediaItem) => item.id} // Key para forzar remount
					customScrollParent={scrollParent ?? undefined}
					data={items}
					fixedItemSize={CONFIG.rowHeight}
					increaseViewportBy={CONFIG.increaseViewportBy}
					initialItemCount={Math.min(30, items.length)}
					itemContent={itemContent}
					key={virtuosoKey}
					style={{ height: scrollParent ? 'auto' : '100%' }}
					// Usar contenedor de scroll externo cuando se proporciona
					useWindowScroll={false}
				/>
			</div>
		);
	}

	// Fallback no virtualizado
	return (
		<div className="flex flex-col gap-1 p-2" data-testid="listview-container">
			{items.map((item, index) => (
				<div data-testid={`list-row-${index}`} key={item.id}>
					{itemContent(index, item)}
				</div>
			))}
		</div>
	);
}
