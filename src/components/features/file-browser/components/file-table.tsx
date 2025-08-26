import { useEffect, useMemo, useState } from 'react';
import type { MediaItem } from './media-thumbnail';
import { MediaThumbnail } from './media-thumbnail';

// CONFIG local de la vista Table
const CONFIG = {
	headerClass: 'border-b text-muted-foreground',
	cellPaddingClass: 'py-2 pr-2',
	increaseViewportBy: { top: 200, bottom: 600 } as { top: number; bottom: number },
	thumbSize: 32,
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
			{ key: 'name', header: 'Nombre' },
			{ key: 'date', header: 'Fecha' },
			{ key: 'dimensions', header: 'Dimensiones' },
			{ key: 'size', header: 'Tamaño' },
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
								<th className={CONFIG.cellPaddingClass} key={c.key}>
									{c.header}
								</th>
							))}
						</tr>
					)}
					increaseViewportBy={CONFIG.increaseViewportBy}
					itemContent={(index: number, item: MediaItem) => (
						<>
							<td className={CONFIG.cellPaddingClass}>
								<div className="flex items-center gap-2">
									<MediaThumbnail
										className="rounded"
										height={CONFIG.thumbSize}
										item={item}
										style={{ objectFit: 'cover' }}
										width={CONFIG.thumbSize}
									/>
									<button
										className={
											selectedIds.includes(item.id)
												? 'truncate font-medium underline'
												: 'truncate font-medium hover:underline'
										}
										onClick={() => onItemClick?.(item)}
										onDoubleClick={() => onItemDoubleClick?.(item)}
										type="button"
									>
										{item.name}
									</button>
									<span className="sr-only" data-index={index} />
								</div>
							</td>
							<td className={`whitespace-nowrap ${CONFIG.cellPaddingClass}`}>
								{new Date(item.createdAt as any).toLocaleDateString('es-ES')}
							</td>
							<td className={`whitespace-nowrap ${CONFIG.cellPaddingClass}`}>
								{item.width && item.height ? `${item.width}x${item.height}` : 'N/A'}
							</td>
							<td className={`whitespace-nowrap ${CONFIG.cellPaddingClass}`}>
								{item.size ? `${(item.size / 1024).toFixed(1)} KB` : 'N/A'}
							</td>
						</>
					)}
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
						<th className={CONFIG.cellPaddingClass}>Nombre</th>
						<th className={CONFIG.cellPaddingClass}>Fecha</th>
						<th className={CONFIG.cellPaddingClass}>Dimensiones</th>
						<th className={CONFIG.cellPaddingClass}>Tamaño</th>
					</tr>
				</thead>
				<tbody>
					{items.map((item) => (
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
							<td className={CONFIG.cellPaddingClass}>
								<div className="flex items-center gap-2">
									<MediaThumbnail
										className="rounded"
										height={CONFIG.thumbSize}
										item={item}
										style={{ objectFit: 'cover' }}
										width={CONFIG.thumbSize}
									/>
									<span className="truncate">{item.name}</span>
								</div>
							</td>
							<td className={`whitespace-nowrap ${CONFIG.cellPaddingClass}`}>
								{new Date(item.createdAt as any).toLocaleDateString('es-ES')}
							</td>
							<td className={`whitespace-nowrap ${CONFIG.cellPaddingClass}`}>
								{item.width && item.height ? `${item.width}x${item.height}` : 'N/A'}
							</td>
							<td className={`whitespace-nowrap ${CONFIG.cellPaddingClass}`}>
								{item.size ? `${(item.size / 1024).toFixed(1)} KB` : 'N/A'}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
