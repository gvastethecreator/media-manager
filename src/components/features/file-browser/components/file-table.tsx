import { useEffect, useMemo, useState } from 'react';
import type { MediaItem } from './media-thumbnail';
import { MediaThumbnail } from './media-thumbnail';
import { FileIcon, ImageIcon, VideoIcon } from 'lucide-react';

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

// Utilidad para obtener el icono según el tipo
function getEntityTypeIcon(
	entityType: MediaItem['entityType']
): React.ComponentType<{ size: number; className?: string }> {
	switch (entityType) {
		case 'image':
			return ImageIcon;
		case 'video':
			return VideoIcon;
		default:
			return FileIcon;
	}
}

// CONFIG local de la vista Table
const CONFIG = {
	headerClass: 'border-b text-muted-foreground text-left',
	cellPaddingClass: 'py-2 px-3',
	increaseViewportBy: { top: 200, bottom: 600 } as { top: number; bottom: number },
	thumbSize: 20,
};

interface FileTableProps {
	items: MediaItem[];
	selectedIds?: string[];
	onItemClick?: (item: MediaItem) => void;
	onItemDoubleClick?: (item: MediaItem) => void;
}

export function FileTable({ items, selectedIds = [], onItemClick, onItemDoubleClick }: FileTableProps) {
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
			<div style={{ height: '100%' }}>
				<TableVirtuosoComp
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
					itemContent={(index: number, item: MediaItem) => {
						const IconComponent = getEntityTypeIcon(item.entityType);

						return (
							<>
								{/* Columna Nombre con thumbnail/icono */}
								<td className={CONFIG.cellPaddingClass}>
									<div className="flex items-center gap-2">
										{item.entityType === 'image' || item.entityType === 'video' ? (
											<MediaThumbnail
												className="flex-shrink-0 rounded border"
												height={CONFIG.thumbSize}
												item={item}
												style={{
													objectFit: 'cover',
													minWidth: CONFIG.thumbSize,
													minHeight: CONFIG.thumbSize,
													maxWidth: CONFIG.thumbSize,
													maxHeight: CONFIG.thumbSize,
												}}
												width={CONFIG.thumbSize}
											/>
										) : (
											<IconComponent size={CONFIG.thumbSize} className="flex-shrink-0 text-muted-foreground" />
										)}
										<button
											className={`flex-1 truncate text-left font-medium text-sm ${
												selectedIds.includes(item.id) ? 'text-primary' : 'hover:text-primary'
											}`}
											onClick={() => onItemClick?.(item)}
											onDoubleClick={() => onItemDoubleClick?.(item)}
											type="button"
											title={item.name}
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
							</>
						);
					}}
					style={{ height: '100%' }}
				/>
			</div>
		);
	}

	// Fallback no virtualizado
	return (
		<div className="w-full overflow-auto p-2">
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
					{items.map((item) => {
						const IconComponent = getEntityTypeIcon(item.entityType);

						return (
							<tr
								className={
									selectedIds.includes(item.id)
										? 'cursor-pointer border-b bg-accent'
										: 'cursor-pointer border-b hover:bg-accent'
								}
								key={item.id}
								onClick={() => onItemClick?.(item)}
								onDoubleClick={() => onItemDoubleClick?.(item)}
							>
								{/* Columna Nombre */}
								<td className={CONFIG.cellPaddingClass}>
									<div className="flex items-center gap-2">
										{item.entityType === 'image' || item.entityType === 'video' ? (
											<MediaThumbnail
												className="flex-shrink-0 rounded border"
												height={CONFIG.thumbSize}
												item={item}
												style={{
													objectFit: 'cover',
													minWidth: CONFIG.thumbSize,
													minHeight: CONFIG.thumbSize,
													maxWidth: CONFIG.thumbSize,
													maxHeight: CONFIG.thumbSize,
												}}
												width={CONFIG.thumbSize}
											/>
										) : (
											<IconComponent size={CONFIG.thumbSize} className="flex-shrink-0 text-muted-foreground" />
										)}
										<span className="truncate font-medium text-sm" title={item.name}>
											{item.name}
										</span>
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
						);
					})}
				</tbody>
			</table>
		</div>
	);
}
