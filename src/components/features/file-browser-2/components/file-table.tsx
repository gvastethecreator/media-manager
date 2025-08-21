import type { ImageWithStats } from '@/types/entities/image';

interface FileTableProps {
	items: ImageWithStats[];
	selectedIds?: string[];
	onItemClick?: (item: ImageWithStats) => void;
	onItemDoubleClick?: (item: ImageWithStats) => void;
}

export function FileTable({ items, selectedIds = [], onItemClick, onItemDoubleClick }: FileTableProps) {
	return (
		<div className="w-full overflow-auto p-2">
			<table className="w-full text-left text-sm">
				<thead>
					<tr className="border-b text-muted-foreground">
						<th className="py-2 pr-2">Nombre</th>
						<th className="py-2 pr-2">Fecha</th>
						<th className="py-2 pr-2">Dimensiones</th>
						<th className="py-2 pr-2">Tamaño</th>
					</tr>
				</thead>
				<tbody>
					{items.map((item) => (
						<tr
							key={item.id}
							className={
								selectedIds.includes(item.id)
									? 'cursor-pointer border-b bg-accent'
									: 'cursor-pointer border-b hover:bg-accent'
							}
							onClick={() => onItemClick?.(item)}
							onDoubleClick={() => onItemDoubleClick?.(item)}
						>
							<td className="py-2 pr-2">
								<div className="flex items-center gap-2">
									<img
										alt={item.name}
										src={`/api/images/${item.id}/thumbnail`}
										className="h-8 w-8 rounded object-cover"
									/>
									<span className="truncate">{item.name}</span>
								</div>
							</td>
							<td className="whitespace-nowrap py-2 pr-2">
								{new Date(item.createdAt as any).toLocaleDateString('es-ES')}
							</td>
							<td className="whitespace-nowrap py-2 pr-2">
								{item.width && item.height ? `${item.width}x${item.height}` : 'N/A'}
							</td>
							<td className="whitespace-nowrap py-2 pr-2">
								{item.size ? `${(item.size / 1024).toFixed(1)} KB` : 'N/A'}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
