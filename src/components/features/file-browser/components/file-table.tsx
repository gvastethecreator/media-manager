import React, { useEffect, useMemo, useState } from 'react';
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

// Utilidad para formatear el tamaño del archivo
function formatFileSize(bytes: number | null | undefined): string {
	if (!bytes) return 'N/A';

	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

// Utilidad para obtener la extensión del archivo
function getFileExtension(filename: string): string {
	const parts = filename.split('.');
	const lastPart = parts.at(-1);
	if (parts.length > 1 && lastPart && lastPart !== filename) {
		return `.${lastPart.toUpperCase()}`;
	}
	return 'N/A';
}

// CONFIG local de la vista Table
const CONFIG = {
	headerClass: 'border-b text-muted-foreground text-left',
	cellPaddingClass: 'py-2 px-3',
	// Overscan mayor para tablas: filas pequeñas
	increaseViewportBy: { top: 600, bottom: 1200 } as { top: number; bottom: number },
	thumbSize: 20,
};

interface FileTableProps {
	items: MediaItem[];
	selectedIds?: string[];
	onItemClick?: (item: MediaItem, modifiers?: ClickModifiers) => void;
	onItemDoubleClick?: (item: MediaItem) => void;
	// Contenedor de scroll externo opcional
	scrollParent?: HTMLElement | null;
	// Key para forzar remount del componente Virtuoso
	virtuosoKey?: string;
}

// Celdas de fila para modo virtualizado: obtiene estado de selección desde el store
const VirtualRowCellsInner = ({
	item,
	onItemClick,
	onItemDoubleClick,
}: {
	item: MediaItem;
	onItemClick?: (item: MediaItem, modifiers?: ClickModifiers) => void;
	onItemDoubleClick?: (item: MediaItem) => void;
}) => {
	const isSelected = useSelectionStore((s) => s.isSelected(item.id));

	return (
		<>
			{/* Columna Nombre con thumbnail y menú contextual */}
			<td className={CONFIG.cellPaddingClass}>
				<div className="flex items-center gap-2">
					<MediaThumbnail
						className="flex-shrink-0 rounded border"
						height={CONFIG.thumbSize}
						item={item}
						preloadMargin="500px"
						style={{
							objectFit: 'cover',
							maxHeight: CONFIG.thumbSize,
							maxWidth: CONFIG.thumbSize,
							minHeight: CONFIG.thumbSize,
							minWidth: CONFIG.thumbSize,
						}}
						width={CONFIG.thumbSize}
					/>
					<ContextMenu>
						<ContextMenuTrigger asChild>
							<button
								className={`flex-1 truncate text-left font-medium text-sm ${
									isSelected ? 'text-primary' : 'hover:text-primary'
								}`}
								data-entity-card
								onClick={(e) =>
									onItemClick?.(item, {
										ctrlKey: e.ctrlKey,
										metaKey: e.metaKey,
										shiftKey: e.shiftKey,
									})
								}
								onDoubleClick={() => onItemDoubleClick?.(item)}
								title={item.name}
								type="button"
							>
								{item.name}
							</button>
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
			</td>

			{/* Columna Tipo */}
			<td className={`whitespace-nowrap text-xs ${CONFIG.cellPaddingClass}`}>
				<span className="rounded bg-muted px-2 py-0.5 font-mono text-xs uppercase">{item.entityType}</span>
			</td>

			{/* Columna Fecha */}
			<td className={`whitespace-nowrap text-sm ${CONFIG.cellPaddingClass}`}>
				{item.createdAt ? new Date(item.createdAt as any).toLocaleDateString('es-ES') : 'N/A'}
			</td>

			{/* Columna Dimensiones */}
			<td className={`whitespace-nowrap font-mono text-sm ${CONFIG.cellPaddingClass}`}>
				{item.width && item.height ? `${item.width}×${item.height}` : 'N/A'}
			</td>

			{/* Columna Tamaño */}
			<td className={`whitespace-nowrap font-mono text-sm ${CONFIG.cellPaddingClass}`}>{formatFileSize(item.size)}</td>

			{/* Columna Extensión */}
			<td className={`whitespace-nowrap font-mono text-xs ${CONFIG.cellPaddingClass}`}>
				<span className="rounded bg-secondary px-1 py-0.5 text-secondary-foreground">
					{getFileExtension(item.name)}
				</span>
			</td>
		</>
	);
};

const VirtualRowCells = React.memo(VirtualRowCellsInner, (prev, next) => {
	return (
		prev.item.id === next.item.id &&
		prev.onItemClick === next.onItemClick &&
		prev.onItemDoubleClick === next.onItemDoubleClick
	);
});

// Fila completa para modo no virtualizado (fallback) con selección desde store
function FallbackRow({
	item,
	onItemClick,
	onItemDoubleClick,
}: {
	item: MediaItem;
	onItemClick?: (item: MediaItem, modifiers?: ClickModifiers) => void;
	onItemDoubleClick?: (item: MediaItem) => void;
}) {
	const isSelected = useSelectionStore((s) => s.isSelected(item.id));

	return (
		<ContextMenu key={item.id}>
			<ContextMenuTrigger asChild>
				<tr
					className={isSelected ? 'cursor-pointer border-b bg-accent' : 'cursor-pointer border-b hover:bg-accent'}
					onClick={(e) =>
						onItemClick?.(item, {
							ctrlKey: e.ctrlKey,
							metaKey: e.metaKey,
							shiftKey: e.shiftKey,
						})
					}
					onDoubleClick={() => onItemDoubleClick?.(item)}
				>
					{/* Columna Nombre */}
					<td className={CONFIG.cellPaddingClass}>
						<div className="flex items-center gap-2">
							<MediaThumbnail
								className="flex-shrink-0 rounded border"
								height={CONFIG.thumbSize}
								item={item}
								preloadMargin="500px"
								style={{
									objectFit: 'cover',
									maxHeight: CONFIG.thumbSize,
									maxWidth: CONFIG.thumbSize,
									minHeight: CONFIG.thumbSize,
									minWidth: CONFIG.thumbSize,
								}}
								width={CONFIG.thumbSize}
							/>
							<button
								className={`flex-1 truncate text-left font-medium text-sm ${
									isSelected ? 'text-primary' : 'hover:text-primary'
								}`}
								title={item.name}
								type="button"
							>
								{item.name}
							</button>
						</div>
					</td>

					{/* Columna Tipo */}
					<td className={`whitespace-nowrap text-xs ${CONFIG.cellPaddingClass}`}>
						<span className="rounded bg-muted px-2 py-0.5 font-mono text-xs uppercase">{item.entityType}</span>
					</td>

					{/* Columna Fecha */}
					<td className={`whitespace-nowrap text-sm ${CONFIG.cellPaddingClass}`}>
						{item.createdAt ? new Date(item.createdAt as any).toLocaleDateString('es-ES') : 'N/A'}
					</td>

					{/* Columna Dimensiones */}
					<td className={`whitespace-nowrap font-mono text-sm ${CONFIG.cellPaddingClass}`}>
						{item.width && item.height ? `${item.width}×${item.height}` : 'N/A'}
					</td>

					{/* Columna Tamaño */}
					<td className={`whitespace-nowrap font-mono text-sm ${CONFIG.cellPaddingClass}`}>
						{formatFileSize(item.size)}
					</td>

					{/* Columna Extensión */}
					<td className={`whitespace-nowrap font-mono text-xs ${CONFIG.cellPaddingClass}`}>
						<span className="rounded bg-secondary px-1 py-0.5 text-secondary-foreground">
							{getFileExtension(item.name)}
						</span>
					</td>
				</tr>
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
	);
}

export function FileTable({
	items,
	selectedIds = [],
	onItemClick,
	onItemDoubleClick,
	scrollParent,
	virtuosoKey,
}: FileTableProps) {
	const [TableVirtuosoComp, setTableVirtuosoComp] = useState<any>(null);

	useEffect(() => {
		let mounted = true;
		import('react-virtuoso')
			.then((mod) => {
				if (!mounted) return;
				const Comp = (mod as any).TableVirtuoso || null;
				setTableVirtuosoComp(() => Comp);
			})
			.catch(() => {
				// fallback silencioso
			});
		return () => {
			mounted = false;
		};
	}, []);

	const columns = useMemo(
		() => [
			{ key: 'name', header: 'Nombre', width: '35%' },
			{ key: 'type', header: 'Tipo', width: '10%' },
			{ key: 'date', header: 'Fecha', width: '15%' },
			{ key: 'dimensions', header: 'Dimensiones', width: '15%' },
			{ key: 'size', header: 'Tamaño', width: '15%' },
			{ key: 'extension', header: 'Ext.', width: '10%' },
		],
		[]
	);

	if (TableVirtuosoComp) {
		return (
			<div className="h-full" style={{ height: scrollParent ? 'auto' : '100%' }}>
				<TableVirtuosoComp
					computeItemKey={(index: number, item: MediaItem) => item.id} // Key para forzar remount
					customScrollParent={scrollParent ?? undefined}
					data={items}
					fixedHeaderContent={() => (
						<tr className={CONFIG.headerClass}>
							{columns.map((c) => (
								<th className={CONFIG.cellPaddingClass} key={c.key} style={{ width: c.width }}>
									{c.header}
								</th>
							))}
						</tr>
					)}
					increaseViewportBy={CONFIG.increaseViewportBy}
					initialItemCount={Math.min(30, items.length)}
					itemContent={(index: number, item: MediaItem) => (
						<VirtualRowCells item={item} onItemClick={onItemClick} onItemDoubleClick={onItemDoubleClick} />
					)}
					key={virtuosoKey}
					style={{ height: scrollParent ? 'auto' : '100%' }}
					useWindowScroll={false}
				/>
			</div>
		);
	}

	// Fallback no virtualizado con scroll
	return (
		<div className="h-full overflow-auto">
			<table className="w-full text-left text-sm">
				<thead>
					<tr className={CONFIG.headerClass}>
						{columns.map((c) => (
							<th className={CONFIG.cellPaddingClass} key={c.key} style={{ width: c.width }}>
								{c.header}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{items.map((item) => (
						<FallbackRow item={item} key={item.id} onItemClick={onItemClick} onItemDoubleClick={onItemDoubleClick} />
					))}
				</tbody>
			</table>
		</div>
	);
}
