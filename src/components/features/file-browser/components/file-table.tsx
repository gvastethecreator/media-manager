import { useEffect, useMemo, useState } from 'react';
import type { ImageWithStats } from '@/types/entities/image';

// CONFIG local de la vista Table
const CONFIG = {
	headerClass: 'border-b text-muted-foreground',
	cellPaddingClass: 'py-2 pr-2',
	increaseViewportBy: { top: 200, bottom: 600 } as { top: number; bottom: number },
	thumbSize: 32,
};

interface FileTableProps {
	items: ImageWithStats[];
	selectedIds?: string[];
	onItemClick?: (item: ImageWithStats) => void;
	onItemDoubleClick?: (item: ImageWithStats) => void;
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
								<th key={c.key} className={CONFIG.cellPaddingClass}>
									{c.header}
								</th>
							))}
						</tr>
					)}
					itemContent={(index: number, item: ImageWithStats) => (
						<>
							<td className={CONFIG.cellPaddingClass}>
								<div className="flex items-center gap-2">
									<img
										alt={item.name}
										className="rounded object-cover"
										style={{ width: CONFIG.thumbSize, height: CONFIG.thumbSize }}
										src={`/api/images/${item.id}/thumbnail`}
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
					increaseViewportBy={CONFIG.increaseViewportBy}
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
							onClick={() => onItemClick?.(item)}
							onDoubleClick={() => onItemDoubleClick?.(item)}
							key={item.id}
						>
							<td className={CONFIG.cellPaddingClass}>
								<div className="flex items-center gap-2">
									<img
										alt={item.name}
										className="rounded object-cover"
										style={{ width: CONFIG.thumbSize, height: CONFIG.thumbSize }}
										src={`/api/images/${item.id}/thumbnail`}
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
