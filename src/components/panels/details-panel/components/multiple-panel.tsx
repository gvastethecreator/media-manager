import { cn } from '@/lib/utils';
import { formatFileSize } from '@/lib/utils/format.utils';
import type { AnyEntityWithStats } from '@/types/entities';
import { getEntityIcon } from '../utils/icon-utils';

interface MultiplePanelProps {
	className?: string;
	items: AnyEntityWithStats[];
}

export const MultiplePanel: React.FC<MultiplePanelProps> = ({ items, className = '' }) => {
	const totalSize = items.reduce((accumulator, item) => {
		return accumulator + ('size' in item && typeof item.size === 'number' ? item.size : 0);
	}, 0);

	return (
		<div className={cn('details-panel flex h-full w-full flex-col border-l bg-background', className)}>
			<div className="border-b p-4">
				<h2 className="heading-sm">Selección múltiple</h2>
				<p className="body-sm text-muted-foreground">{items.length} elementos seleccionados</p>
			</div>

			<div className="flex-1 overflow-y-auto p-4">
				<div className="space-y-4">
					{/* Estadísticas generales */}
					<div className="grid grid-cols-2 gap-4">
						<div className="rounded-dt-md border p-3 text-center">
							<div className="font-bold text-2xl">{items.length}</div>
							<div className="text-muted-foreground text-xs">Elementos</div>
						</div>
						<div className="rounded-dt-md border p-3 text-center">
							<div className="font-bold text-2xl">{formatFileSize(totalSize)}</div>
							<div className="text-muted-foreground text-xs">Tamaño total</div>
						</div>
					</div>

					{/* Lista de elementos */}
					<div className="space-y-2">
						<h3 className="font-medium text-body-sm">Elementos seleccionados</h3>
						{items.map((item) => {
							const EntityIcon = getEntityIcon(item.entityType || 'file');
							return (
								<div className="flex items-center gap-2 rounded-dt-md border p-2" key={item.id}>
									<EntityIcon className="h-4 w-4 text-muted-foreground" />
									<span className="flex-1 truncate text-sm">{'name' in item ? item.name : 'Sin nombre'}</span>
									{'size' in item && typeof item.size === 'number' && (
										<span className="text-muted-foreground text-xs">{formatFileSize(item.size)}</span>
									)}
								</div>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
};
