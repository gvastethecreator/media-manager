import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuLabel,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { useSelectionStore } from '@/store/ui/selection.slice';
import type { ClickModifiers } from '../types/file-browser.types';
import { AddToEntityMenu } from './add-to-entity-menu';
import type { MediaItem } from './media-thumbnail';
import { MediaThumbnail } from './media-thumbnail';

// CONFIG local de la vista Cards
const CONFIG = {
	thumbSize: 240,
	rowPadding: 12, // px
	cardPadding: 12, // px
	// Overscan mayor para evitar pop-in de thumbnails al hacer scroll rápido
	increaseViewportBy: { top: 800, bottom: 1600 } as { top: number; bottom: number },
	dateLocale: 'es-ES',
};

interface FileCardsProps {
	items: MediaItem[];
	selectedIds?: string[];
	onItemClick?: (item: MediaItem, modifiers?: ClickModifiers) => void;
	onItemDoubleClick?: (item: MediaItem) => void;
	// Permite usar un contenedor de scroll externo
	scrollParent?: HTMLElement | null;
	// Key para forzar remount del componente Virtuoso
	virtuosoKey?: string;
}

function getExtLabel(item: MediaItem): string {
	const n = (item.name || '').toLowerCase();
	const ext = n.includes('.') ? n.slice(n.lastIndexOf('.') + 1) : '';
	return ext || 'image';
}

const CardRowInner = ({
	item,
	selected,
	onItemClick,
	onItemDoubleClick,
	withContextMenuTrigger = true,
}: {
	item: MediaItem;
	selected: boolean;
	onItemClick?: (item: MediaItem, modifiers?: ClickModifiers) => void;
	onItemDoubleClick?: (item: MediaItem) => void;
	/**
	 * Si es true, el botón principal se envuelve con ContextMenuTrigger asChild
	 * para garantizar que el clic derecho abra el menú contextual de forma determinista.
	 */
	withContextMenuTrigger?: boolean;
}) => {
	const isSelected = useSelectionStore((s) => s.isSelected(item.id));
	const selectedState = typeof selected === 'boolean' ? selected : isSelected;
	const handleClick = (e: React.MouseEvent<HTMLButtonElement>) =>
		onItemClick?.(item, { ctrlKey: e.ctrlKey, metaKey: e.metaKey, shiftKey: e.shiftKey });
	const handleDoubleClick = () => onItemDoubleClick?.(item);
	const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
		if (e.key === 'Enter' || e.key === ' ') {
			onItemClick?.(item);
		}
	};

	return (
		<div className="w-full p-3" style={{ padding: CONFIG.rowPadding }}>
			<ContextMenuTrigger asChild>
				<div className="flex gap-4 rounded-md border-none bg-card p-3" style={{ padding: CONFIG.cardPadding }}>
					<button
						aria-pressed={selectedState}
						className="shrink-0 overflow-hidden rounded-md border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
						data-entity-card
						data-entity-type={item.entityType}
						onClick={handleClick}
						onDoubleClick={handleDoubleClick}
						onKeyDown={handleKeyDown}
						style={{ width: CONFIG.thumbSize, height: CONFIG.thumbSize }}
						type="button"
					>
						<MediaThumbnail
							className="h-full w-full"
							item={item}
							preloadMargin="800px"
							style={{ objectFit: 'cover' }}
						/>
					</button>
					<div className="min-w-0 flex-1 self-stretch">
						<div className="mb-2 flex items-start justify-between gap-2">
							<div className="min-w-0">
								<h3 className={selectedState ? 'truncate font-semibold' : 'truncate font-medium'}>{item.name}</h3>
								<p className="text-muted-foreground text-xs">{getExtLabel(item)}</p>
							</div>
							<div className="text-muted-foreground text-xs">
								{item.createdAt ? new Date(item.createdAt as any).toLocaleDateString(CONFIG.dateLocale) : ''}
							</div>
						</div>
						<div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3 lg:grid-cols-4">
							<div>
								<span className="text-muted-foreground">Tamaño:</span>{' '}
								<span>{item.size ? `${(item.size / 1024).toFixed(1)} KB` : 'N/A'}</span>
							</div>
							<div>
								<span className="text-muted-foreground">Dimensiones:</span>{' '}
								<span>{item.width && item.height ? `${item.width}×${item.height}` : 'N/A'}</span>
							</div>
							<div>
								<span className="text-muted-foreground">ID:</span> <span className="break-all">{item.id}</span>
							</div>
							<div className="col-span-2 sm:col-span-3 lg:col-span-4">
								<span className="text-muted-foreground">Ruta:</span> <span className="break-all">{item.path}</span>
							</div>
						</div>
					</div>
				</div>
			</ContextMenuTrigger>
		</div>
	);
};

const CardRow = React.memo(
	CardRowInner,
	(prev, next) =>
		prev.item.id === next.item.id &&
		prev.selected === next.selected &&
		prev.onItemClick === next.onItemClick &&
		prev.onItemDoubleClick === next.onItemDoubleClick
);

export function FileCards({
	items,
	selectedIds = [],
	onItemClick,
	onItemDoubleClick,
	scrollParent,
	virtuosoKey,
}: FileCardsProps) {
	const [VirtuosoComp, setVirtuosoComp] = useState<any>(null);

	// Mantener orden de hooks estable entre renders: definir itemContent siempre
	const itemContent = useMemo(
		() => (index: number, item: MediaItem) => (
			<div data-index={index}>
				<ContextMenu>
					<CardRow
						item={item}
						onItemClick={onItemClick}
						onItemDoubleClick={onItemDoubleClick}
						selected={false} // Usar store interno en CardRow
					/>
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
		[onItemClick, onItemDoubleClick]
	);

	const handleKeyDownCapture = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
		const target = e.target as HTMLElement | null;
		if (!target) return;
		if (target.getAttribute('data-entity-card') == null) return;
		if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
		e.preventDefault();
		e.stopPropagation();
		const container = e.currentTarget as HTMLElement;
		const cards = Array.from(container.querySelectorAll<HTMLElement>('[data-entity-card]'));
		// Obtener el índice del elemento enfocado en la lista
		const idx = cards.indexOf(target);
		if (idx === -1) return;
		const nextIdx = e.key === 'ArrowRight' ? idx + 1 : idx - 1;
		const next = cards[nextIdx];
		if (next) {
			next.scrollIntoView({ block: 'nearest', inline: 'nearest' });
			next.focus();
		}
	}, []);

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
			<div
				data-testid="cards-view"
				onKeyDownCapture={handleKeyDownCapture}
				style={{ height: scrollParent ? 'auto' : '100%', minHeight: 200 }}
			>
				<VirtuosoComp
					computeItemKey={(index: number, item: MediaItem) => item.id} // Key para forzar remount
					customScrollParent={scrollParent ?? undefined}
					data={items}
					increaseViewportBy={CONFIG.increaseViewportBy}
					initialItemCount={Math.min(60, items.length)}
					itemContent={itemContent}
					key={virtuosoKey}
					style={{ height: scrollParent ? 'auto' : '100%', minHeight: 200 }}
					useWindowScroll={false}
				/>
			</div>
		);
	}

	// Fallback no virtualizado
	return (
		<div
			className="h-full overflow-auto"
			data-testid="cards-view"
			onKeyDownCapture={handleKeyDownCapture}
			style={{ minHeight: 200 }}
		>
			{items.map((item, index) => (
				<React.Fragment key={item.id}>{itemContent(index, item)}</React.Fragment>
			))}
		</div>
	);
}
