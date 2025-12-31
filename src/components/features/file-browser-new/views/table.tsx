/**
 * @file Vista de Tabla para File Browser
 * @module file-browser-new/views/table
 */

import { ArrowDown, ArrowUp, ArrowUpDown, CornerUpLeft, Folder } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { type MediaItem, MediaThumbnail } from '../components/media-thumbnail';
import type {
	BrowserItem,
	BrowserViewProps,
	ClickModifiers,
	ItemContextMenuHandler,
	SortOption,
	TableViewConfig,
} from '../types';
import { ENTITY_TYPE_DISPLAY_NAMES } from '../utils';

export interface TableViewProps extends Omit<BrowserViewProps, 'config'> {
	/** Configuración de tabla */
	config: TableViewConfig;
	/** IDs seleccionados */
	selectedIds?: Set<string>;
	/** ID activo */
	activeId?: string | null;
	/** Opciones de ordenamiento */
	sortOptions?: SortOption[];
	/** Handler de cambio de sort */
	onSortChange?: (field: string) => void;
	/** Handler de context menu */
	onItemContextMenu?: ItemContextMenuHandler;
}

interface TableColumn {
	key: string;
	label: string;
	width?: number;
	sortable?: boolean;
	render?: (item: BrowserItem) => React.ReactNode;
}

/**
 * Convierte BrowserItem a MediaItem compatible
 */
function toMediaItem(item: BrowserItem): MediaItem {
	return {
		id: item.id,
		name: item.name,
		entityType: item.entityType === 'json' ? 'jsonFile' : (item.entityType as MediaItem['entityType']),
		thumbnailUrl: item.thumbnailUrl,
		mimeType: item.mimeType,
		createdAt: item.createdAt,
		size: item.size,
		path: item.path,
		width: item.width,
		height: item.height,
		parentId: item.parentId,
		totalItems: item.totalItems,
		emoji: item.emoji,
		color: item.color,
	};
}

/**
 * Renderiza thumbnail compacto para tabla
 */
function TableThumbnail({ item }: { item: BrowserItem }) {
	// Item sintético de navegación
	if (item.isSynthetic && item.name === '..') {
		return (
			<div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted">
				<CornerUpLeft className="h-3.5 w-3.5 text-muted-foreground" />
			</div>
		);
	}

	// Carpeta
	if (item.entityType === 'folder') {
		return (
			<div
				className="flex h-6 w-6 shrink-0 items-center justify-center rounded"
				style={{ backgroundColor: item.color ?? 'hsl(var(--muted))' }}
			>
				{item.emoji ? <span className="text-xs">{item.emoji}</span> : <Folder className="h-3.5 w-3.5 text-amber-600" />}
			</div>
		);
	}

	// Archivo multimedia
	const mediaItem = toMediaItem(item);
	return (
		<div className="h-6 w-6 shrink-0 overflow-hidden rounded">
			<MediaThumbnail className="h-full w-full object-cover" item={mediaItem} />
		</div>
	);
}

const DEFAULT_COLUMNS: TableColumn[] = [
	{
		key: 'name',
		label: 'Nombre',
		width: 300,
		sortable: true,
		render: (item) => (
			<div className="flex items-center gap-2">
				<TableThumbnail item={item} />
				<span className="truncate">{item.isSynthetic && item.name === '..' ? 'Subir nivel' : item.name}</span>
			</div>
		),
	},
	{
		key: 'entityType',
		label: 'Tipo',
		width: 100,
		sortable: true,
		render: (item) => ENTITY_TYPE_DISPLAY_NAMES[item.entityType] ?? item.entityType,
	},
	{
		key: 'size',
		label: 'Tamaño',
		width: 100,
		sortable: true,
		render: (item) => (item.size != null ? formatFileSize(item.size) : '-'),
	},
	{
		key: 'createdAt',
		label: 'Fecha',
		width: 150,
		sortable: true,
		render: (item) => (item.createdAt ? formatDate(item.createdAt) : '-'),
	},
];

function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

function formatDate(date: Date | string | number): string {
	const d = date instanceof Date ? date : new Date(date);
	if (Number.isNaN(d.getTime())) return '-';
	return d.toLocaleDateString('es-ES', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	});
}

export function TableView({
	items,
	onItemClick,
	onItemDoubleClick,
	onItemContextMenu,
	config,
	scrollContainer,
	onContainerReady,
	selectedIds = new Set(),
	activeId,
	sortOptions = [],
	onSortChange,
}: TableViewProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [internalScrollEl, setInternalScrollEl] = useState<HTMLDivElement | null>(null);

	const rowHeight = config.rowHeight;
	const columns = DEFAULT_COLUMNS.filter((col) => !config.visibleColumns || config.visibleColumns.includes(col.key));

	// Obtener estado de sort para una columna
	const getSortState = (field: string): 'asc' | 'desc' | null => {
		const opt = sortOptions.find((s) => s.field === field);
		return opt?.direction ?? null;
	};

	// Scroll al item activo cuando cambia
	useEffect(() => {
		if (!activeId) return;
		const container = containerRef.current;
		if (!container) return;
		const activeElement = container.querySelector(`[data-item-id="${activeId}"]`);
		if (activeElement) {
			activeElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
		}
	}, [activeId]);

	// Handlers
	const handleItemClick = useCallback(
		(item: BrowserItem, e: React.MouseEvent) => {
			const modifiers: ClickModifiers = {
				ctrlKey: e.ctrlKey,
				metaKey: e.metaKey,
				shiftKey: e.shiftKey,
			};
			onItemClick?.(item, modifiers);
		},
		[onItemClick]
	);

	const handleItemDoubleClick = useCallback(
		(item: BrowserItem) => {
			onItemDoubleClick?.(item);
		},
		[onItemDoubleClick]
	);

	const handleItemContextMenu = useCallback(
		(item: BrowserItem, e: React.MouseEvent) => {
			e.preventDefault();
			onItemContextMenu?.(e, item);
		},
		[onItemContextMenu]
	);

	const handleSort = useCallback(
		(field: string) => {
			onSortChange?.(field);
		},
		[onSortChange]
	);

	return (
		<div
			className="h-full w-full overflow-auto"
			data-testid="file-browser-scroll-area-viewport"
			ref={(el) => {
				setInternalScrollEl(el);
				containerRef.current = el;
				onContainerReady?.(el);
			}}
		>
			<table className="w-full border-collapse text-sm" data-testid="table-view">
				{/* Header */}
				<thead className="sticky top-0 z-10 border-b bg-background">
					<tr>
						{columns.map((col) => {
							const sortState = getSortState(col.key);
							const SortIcon = sortState === 'asc' ? ArrowUp : sortState === 'desc' ? ArrowDown : ArrowUpDown;

							return (
								<th
									className="px-3 py-2 text-left font-medium text-muted-foreground"
									key={col.key}
									style={{ width: col.width }}
								>
									{col.sortable ? (
										<Button
											className="h-auto p-0 font-medium hover:text-foreground"
											onClick={() => handleSort(col.key)}
											variant="ghost"
										>
											{col.label}
											<SortIcon className="ml-1 h-3 w-3" />
										</Button>
									) : (
										col.label
									)}
								</th>
							);
						})}
					</tr>
				</thead>

				{/* Body */}
				<tbody>
					{items.map((item) => (
						<tr
							className={cn(
								'border-b',
								'cursor-pointer',
								'transition-colors',
								'hover:bg-accent/50',
								selectedIds.has(item.id) && 'bg-accent',
								activeId === item.id && 'ring-1 ring-primary/50 ring-inset'
							)}
							data-item-id={item.id}
							key={item.id}
							onClick={(e) => handleItemClick(item, e)}
							onContextMenu={(e) => handleItemContextMenu(item, e)}
							onDoubleClick={() => handleItemDoubleClick(item)}
							style={{ height: rowHeight }}
						>
							{columns.map((col) => (
								<td className="truncate px-3 py-2" key={col.key}>
									{col.render
										? col.render(item)
										: ((item as unknown as Record<string, unknown>)[col.key] as React.ReactNode)}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
