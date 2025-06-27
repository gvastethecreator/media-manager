/**
 * @file Vista de lista V2 usando EntityWithStats
 * @module components/features/file-browser/views/list-view-v2
 */
'use client';

import { cn } from '@/lib/utils';
import type { EntityWithStats } from '@/types/migration';
import { getEntityStatistics, getEntityStatsType } from '@/types/migration';
import {
	FileIcon,
	FileTextIcon,
	FolderIcon,
	HashIcon,
	ImageIcon,
	MapPinIcon,
	MusicIcon,
	PackageIcon,
	TagIcon,
	UsersIcon,
	VideoIcon
} from 'lucide-react';
import { memo, useMemo } from 'react';

interface ListViewV2Props {
	items: EntityWithStats[];
	itemSize: number;
	selectedIds: string[];
	containerWidth: number;
	onItemClick: (item: EntityWithStats, e: React.MouseEvent) => void;
	onItemDoubleClick: (item: EntityWithStats) => void;
}

// Mapeo de tipos a iconos
const typeIcons: Record<string, React.ComponentType<any>> = {
	image: ImageIcon,
	video: VideoIcon,
	folder: FolderIcon,
	audio: MusicIcon,
	document: FileTextIcon,
	album: PackageIcon,
	collection: PackageIcon,
	tag: TagIcon,
	character: UsersIcon,
	place: MapPinIcon,
	concept: HashIcon,
	// Añadir más según necesidad
};

export const ListViewV2 = memo<ListViewV2Props>(function ListViewV2({
	items,
	itemSize,
	selectedIds,
	containerWidth,
	onItemClick,
	onItemDoubleClick,
}) {
	// Preparar datos de la tabla con información adicional
	const tableData = useMemo(() => {
		return items.map(item => {
			const type = getEntityStatsType(item);
			const stats = getEntityStatistics(item);
			const Icon = typeIcons[type] || FileIcon;

			// Obtener tamaño si está disponible
			let size = '-';
			if ('size' in item) {
				size = formatFileSize(item.size);
			} else if (stats?.fileSize) {
				size = `${stats.fileSize.toFixed(1)} MB`;
			}

			// Obtener fecha de modificación
			let modifiedDate = new Date();
			if ('updatedAt' in item) {
				modifiedDate = new Date(item.updatedAt);
			}

			return {
				item,
				type,
				Icon,
				size,
				modifiedDate,
				stats,
			};
		});
	}, [items]);

	return (
		<div className="w-full h-full overflow-auto">
			<table className="w-full border-collapse">
				<thead className="sticky top-0 bg-background border-b">
					<tr className="text-left text-sm text-muted-foreground">
						<th className="p-2 font-medium">Nombre</th>
						<th className="p-2 font-medium w-24">Tipo</th>
						<th className="p-2 font-medium w-24">Tamaño</th>
						<th className="p-2 font-medium w-40">Modificado</th>
						<th className="p-2 font-medium w-24">Elementos</th>
					</tr>
				</thead>
				<tbody>
					{tableData.map(({ item, type, Icon, size, modifiedDate, stats }) => {
						const isSelected = selectedIds.includes(item.id);

						return (
							<tr
								key={item.id}
								className={cn(
									"border-b transition-colors cursor-pointer",
									"hover:bg-muted/50",
									isSelected && "bg-primary/10 hover:bg-primary/15"
								)}
								onClick={(e) => {
									e.stopPropagation();
									onItemClick(item, e);
								}}
								onDoubleClick={(e) => {
									e.stopPropagation();
									onItemDoubleClick(item);
								}}
							>
								<td className="p-2">
									<div className="flex items-center gap-2">
										<Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
										<span className="truncate">{item.name || 'Sin nombre'}</span>
										{'isFavorite' in item && item.isFavorite && (
											<span className="text-yellow-500">★</span>
										)}
									</div>
								</td>
								<td className="p-2 text-sm text-muted-foreground capitalize">
									{type}
								</td>
								<td className="p-2 text-sm text-muted-foreground">
									{size}
								</td>
								<td className="p-2 text-sm text-muted-foreground">
									{formatDate(modifiedDate)}
								</td>
								<td className="p-2 text-sm text-muted-foreground text-center">
									{stats?.totalAssociations || stats?.totalItems || '-'}
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>

			{items.length === 0 && (
				<div className="flex items-center justify-center h-40 text-muted-foreground">
					No hay elementos para mostrar
				</div>
			)}
		</div>
	);
});

// Funciones auxiliares
function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(date: Date): string {
	const now = new Date();
	const diff = now.getTime() - date.getTime();
	const days = Math.floor(diff / (1000 * 60 * 60 * 24));

	if (days === 0) {
		return 'Hoy';
	}
	if (days === 1) {
		return 'Ayer';
	}
	if (days < 7) {
		return `Hace ${days} días`;
	}
	return date.toLocaleDateString();
}

/**
 * 📝 Características:
 * - Vista de tabla con columnas informativas
 * - Iconos específicos por tipo de entidad
 * - Formateo inteligente de fechas y tamaños
 * - Selección visual clara
 * - Información de estadísticas cuando está disponible
 */
