/**
 * @file Panel de detalles - Usa EntityWithStats y Registry System
 * @module components/features/file-browser/details/details-panel
 */

import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Cpu, FileImage, HardDrive, Info, Package } from 'lucide-react';
import { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatBytes } from '@/lib/utils/format.utils';
import { EntityWithStats, getEntityStatistics, getEntityStatsType } from '@/types/migration';

// Importar el sistema de registry
import { entityDetailsRegistry } from './entity-details-registry';
import { useEntityActions } from './integration-hook';

interface DetailsPanelV2Props {
	selectedItems: EntityWithStats[];
	className?: string;
}

// Componente memoizado para una entidad usando el registry
const EntityDetailsView = memo<{ item: EntityWithStats }>(function EntityDetailsView({ item }) {
	const type = getEntityStatsType(item);
	if (type === null) {
		return (
			<div className="p-4 text-center text-muted-foreground">
				<p>Tipo de entidad no reconocido</p>
				<BasicInfoSection item={item} />
			</div>
		);
	}
	const config = entityDetailsRegistry.getConfig(type);
	const { handleAction } = useEntityActions();

	if (!config) {
		// Fallback para tipos no registrados
		return (
			<div className="p-4 text-center text-muted-foreground">
				<p>Tipo de entidad no soportado: {type}</p>
				<BasicInfoSection item={item} />
			</div>
		);
	}

	const {
		detailsComponent: DetailsComponent,
		previewComponent: PreviewComponent,
		toolbarComponent: ToolbarComponent,
		metadataComponent: MetadataComponent,
	} = config;

	return (
		<div className="space-y-4">
			{/* Vista previa */}
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="text-sm">Vista Previa</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="aspect-video bg-muted/30 rounded-lg overflow-hidden">
						<PreviewComponent entity={item} size="lg" showControls={true} onAction={handleAction} />
					</div>
				</CardContent>
			</Card>

			{/* Componente de detalles específico */}
			<DetailsComponent entity={item} isSelected={true} onAction={handleAction} />

			{/* Toolbar de acciones */}
			<ToolbarComponent entity={item} onAction={handleAction} />

			{/* Metadatos */}
			<MetadataComponent
				entity={item}
				editable={true}
				onUpdate={(updates) => {
					console.log('Updating metadata:', updates);
					// TODO: Implementar actualización de metadatos
				}}
			/>
		</div>
	);
});

// Componente para información básica (fallback)
const BasicInfoSection = memo<{ item: EntityWithStats }>(function BasicInfoSection({ item }) {
	const type = getEntityStatsType(item);
	const stats: any = getEntityStatistics(item);

	const infoItems = useMemo(() => {
		const items = [];

		// Nombre
		items.push({
			id: 'name',
			icon: <Info className="h-3 w-3" />,
			label: 'Nombre',
			value: item.name || 'Sin nombre',
		});

		// Tipo
		items.push({
			id: 'type',
			icon: <Cpu className="h-3 w-3" />,
			label: 'Tipo',
			value: type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Desconocido',
		});

		// Tamaño (para archivos)
		if ('size' in item && typeof item.size === 'number') {
			items.push({
				id: 'size',
				icon: <HardDrive className="h-3 w-3" />,
				label: 'Tamaño',
				value: formatBytes(item.size),
			});
		}

		// Fecha de actualización
		if ('updatedAt' in item) {
			items.push({
				id: 'updated',
				icon: <Calendar className="h-3 w-3" />,
				label: 'Actualizado',
				value: formatDistanceToNow(new Date(item.updatedAt), {
					addSuffix: true,
					locale: es,
				}),
			});
		}

		// Estadísticas
		if (stats) {
			if (stats.totalAssociations > 0) {
				items.push({
					id: 'associations',
					icon: <Package className="h-3 w-3" />,
					label: 'Asociaciones',
					value: stats.totalAssociations.toString(),
				});
			}

			if (stats.totalItems !== undefined) {
				items.push({
					id: 'items',
					icon: <FileImage className="h-3 w-3" />,
					label: 'Elementos',
					value: stats.totalItems.toString(),
				});
			}
		}

		return items;
	}, [item, type, stats]);

	return (
		<div className="space-y-2">
			{infoItems.map((info) => (
				<div key={info.id} className="flex items-center justify-between text-sm">
					<div className="flex items-center gap-2 text-muted-foreground">
						{info.icon}
						<span>{info.label}</span>
					</div>
					<span className="font-medium truncate max-w-[60%]">{info.value}</span>
				</div>
			))}
		</div>
	);
});

// Vista de selección múltiple simplificada
const MultipleSelectionView = memo<{ items: EntityWithStats[] }>(function MultipleSelectionView({ items }) {
	const itemsByType = useMemo(() => {
		const groups: Record<string, EntityWithStats[]> = {};
		for (const item of items) {
			const type = getEntityStatsType(item);
			if (!type) continue;
			if (!groups[type]) {
				groups[type] = [];
			}
			groups[type].push(item);
		}
		return groups;
	}, [items]);

	return (
		<div className="space-y-4">
			<Card>
				<CardHeader>
					<CardTitle className="text-sm">Selección Múltiple ({items.length} elementos)</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					{Object.entries(itemsByType).map(([type, typeItems]) => (
						<div key={type} className="flex items-center justify-between text-sm">
							<span className="capitalize">{type}</span>
							<span className="font-medium">{typeItems.length}</span>
						</div>
					))}
				</CardContent>
			</Card>

			{/* Grid de previews */}
			<Card>
				<CardHeader>
					<CardTitle className="text-sm">Vista Previa</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-3 gap-2">
						{items.slice(0, 9).map((item) => {
						const type = getEntityStatsType(item);
						if (!type) return null;
						const config = entityDetailsRegistry.getConfig(type);
						if (!config) return null;

						const { previewComponent: PreviewComponent } = config;

						return (
							<div key={item.id} className="aspect-square rounded overflow-hidden bg-muted/30">
								<PreviewComponent entity={item} size="sm" showControls={false} onAction={() => {}} />
							</div>
						);
					})}
					</div>
					{items.length > 9 && (
						<p className="text-xs text-muted-foreground mt-2 text-center">+{items.length - 9} elementos más</p>
					)}
				</CardContent>
			</Card>
		</div>
	);
});

// Componente principal del panel
export const DetailsPanelV2 = memo<DetailsPanelV2Props>(function DetailsPanelV2({ selectedItems, className }) {
	const hasItems = selectedItems.length > 0;
	const singleItem = selectedItems.length === 1 ? selectedItems[0] : null;

	if (!hasItems) {
		return (
			<div className={cn('w-80 border-l bg-background', className)}>
				<div className="flex items-center justify-center h-full text-muted-foreground">
					<div className="text-center">
						<FileImage className="h-12 w-12 mx-auto mb-4 opacity-50" />
						<p className="text-sm">Selecciona un elemento para ver sus detalles</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className={cn('w-80 border-l bg-background', className)}>
			<ScrollArea className="h-full">
				<div className="p-4">
					{singleItem ? <EntityDetailsView item={singleItem} /> : <MultipleSelectionView items={selectedItems} />}
				</div>
			</ScrollArea>
		</div>
	);
});

export default DetailsPanelV2;

/**
 * 📝 Características:
 * - Usa EntityWithStats en lugar de FileItem
 * - Type guards para mostrar información específica por tipo
 * - Vista para selección múltiple con agrupación por tipo
 * - Información técnica adaptativa según el tipo de media
 * - Componentes internos memorizados para rendimiento
 * - Diseño limpio y consistente con el resto de la app
 */
