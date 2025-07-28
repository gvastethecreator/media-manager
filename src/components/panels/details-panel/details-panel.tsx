/**
 * @file Panel de detalles - Usa EntityWithStats y Registry System
 * @module components/features/file-browser/details/details-panel
 */

import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Cpu, FileImage, HardDrive, Info, Package } from 'lucide-react';
import { memo, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFolder } from '@/lib/api/folders';
import { cn } from '@/lib/utils';
import { formatBytes } from '@/lib/utils/format.utils';
import { AnyEntityWithStats, getEntityStatistics, getEntityStatsType } from '@/types/migration';

// Importar el sistema de registry
import { entityDetailsRegistry } from './entity-details-registry';
import { useEntityActions } from './integration-hook';
// Importar para inicializar el registro (side-effect)
import './registry-setup';

interface DetailsPanelProps {
	selectedItems: AnyEntityWithStats[];
	className?: string;
}

// Componente memoizado para una entidad usando el registry
const EntityDetailsView = memo<{ item: AnyEntityWithStats }>(function EntityDetailsView({ item }) {
	const { handleAction } = useEntityActions();
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
		<div className="space-y-2">
			{/* Vista previa compacta */}
			<div className="border-b pb-2">
				<h3 className="text-sm font-medium mb-2">Vista Previa</h3>
				<div className="aspect-video bg-muted/30 rounded overflow-hidden">
					<PreviewComponent entity={item} size="sm" showControls={false} onAction={handleAction} />
				</div>
			</div>

			{/* Componente de detalles específico - sin tarjetas */}
			<div className="border-b pb-2">
				<DetailsComponent entity={item} isSelected={true} onAction={handleAction} />
			</div>

			{/* Toolbar de acciones compacto */}
			<div className="border-b pb-2">
				<h3 className="text-sm font-medium mb-2">Acciones</h3>
				<ToolbarComponent entity={item} onAction={handleAction} />
			</div>

			{/* Metadatos compactos */}
			<div>
				<h3 className="text-sm font-medium mb-2">Información</h3>
				<MetadataComponent
					entity={item}
					editable={true}
					onUpdate={(updates) => {
						console.log('Updating metadata:', updates);
						// TODO: Implementar actualización de metadatos
					}}
				/>
			</div>
		</div>
	);
});

// Componente para información básica (fallback)
const BasicInfoSection = memo<{ item: AnyEntityWithStats }>(function BasicInfoSection({ item }) {
	const type = getEntityStatsType(item);
	const stats: any = getEntityStatistics(item);

	const infoItems = useMemo(() => {
		const items = [];

		// Nombre
		items.push({
			id: 'name',
			icon: <Info className="h-3 w-3" />,
			label: 'Nombre',
			value: ('name' in item ? item.name : undefined) || 'Sin nombre',
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
		if ('updatedAt' in item && item.updatedAt) {
			try {
				items.push({
					id: 'updated',
					icon: <Calendar className="h-3 w-3" />,
					label: 'Actualizado',
					value: formatDistanceToNow(new Date(item.updatedAt), {
						addSuffix: true,
						locale: es,
					}),
				});
			} catch (error) {
				// Si la fecha no es válida, no mostrar el campo
				console.warn('Invalid date for updatedAt:', item.updatedAt);
			}
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
const MultipleSelectionView = memo<{ items: AnyEntityWithStats[] }>(function MultipleSelectionView({ items }) {
	const itemsByType = useMemo(() => {
		const groups: Record<string, AnyEntityWithStats[]> = {};
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
						{items
							.slice(0, 9)
							.map((item) => {
								const type = getEntityStatsType(item);
								if (!type) return null;
								const config = entityDetailsRegistry.getConfig(type);
								if (!config) return null;

								const { previewComponent: PreviewComponent } = config;
								if (!PreviewComponent) return null;

								return (
									<div key={item.id} className="aspect-square rounded overflow-hidden bg-muted/30">
										<PreviewComponent entity={item} size="sm" showControls={false} onAction={() => { }} />
									</div>
								);
							})
							.filter(Boolean)}
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
export const DetailsPanel = memo<DetailsPanelProps>(function DetailsPanel({ selectedItems, className }) {
	const hasItems = selectedItems.length > 0;
	const singleItem = selectedItems.length === 1 ? selectedItems[0] : null;

	// Obtener información de la carpeta actual desde la URL
	const params = useParams<{ id: string }>();
	const currentFolderId = params.id;
	const { data: currentFolder } = useFolder(currentFolderId || '');

	if (!hasItems) {
		// Si no hay elementos seleccionados pero hay una carpeta actual, mostrar detalles de la carpeta
		if (currentFolder && currentFolderId) {
			// Transformar FolderComplete a FolderWithStats añadiendo las propiedades necesarias
			const folderWithStats: AnyEntityWithStats = {
				...currentFolder,
				entityType: 'folder' as const,
				stats: {
					// Métricas de jerarquía
					hierarchyDepth: 0,
					totalDescendants: currentFolder.children?.length || 0,
					directChildren: currentFolder.children?.length || 0,

					// Métricas de contenido
					contentDiversity: 0,
					organizationScore: 0,
					totalItems: currentFolder.totalFiles || 0,
					folderCount: currentFolder.children?.length || 0,
					totalFiles: currentFolder.totalFiles || 0,
					totalFolders: currentFolder.children?.length || 0,
					totalImages: 0,
					totalVideos: 0,
					totalDocuments: 0,
					imageCount: 0,
					videoCount: 0,
					noteCount: 0,
					documentCount: 0,
					totalAudio: 0,
					totalOthers: 0,

					// Métricas de tamaño
					formattedSize: `${((currentFolder.totalSize || 0) / 1024 / 1024).toFixed(2)} MB`,
					totalSize: currentFolder.totalSize || 0,
					averageFileSize: currentFolder.totalSize > 0 ? currentFolder.totalSize / Math.max(currentFolder.totalFiles, 1) : 0,
					largestFile: 0,

					// Análisis de nombres y organización
					hasConsistentNaming: false,
					hasDeepHierarchy: false,
					isWellOrganized: false,

					// Breadcrumbs y navegación
					breadcrumbs: [],
					fullPath: currentFolder.path || '',
					relativePath: currentFolder.path || '',

					// Auto-tags generados
					autoTags: [],

					// Calidad general
					qualityGrade: 'C' as const,

					// Relaciones
					totalRelations: 0,

					// Métricas de uso
					lastActivity: currentFolder.updatedAt ? new Date(currentFolder.updatedAt) : new Date(currentFolder.createdAt),
					accessFrequency: 0,
				}
			};

			return (
				<div className={cn('h-full', className)}>
					<EntityDetailsView item={folderWithStats} />
				</div>
			);
		}

		// Estado vacío por defecto
		return (
			<div className={cn('h-full', className)}>
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
		<div className={cn('h-full', className)}>
			{singleItem ? <EntityDetailsView item={singleItem} /> : <MultipleSelectionView items={selectedItems} />}
		</div>
	);
});

export default DetailsPanel;

/**
 * 📝 Características:
 * - Usa EntityWithStats en lugar de FileItem
 * - Type guards para mostrar información específica por tipo
 * - Vista para selección múltiple con agrupación por tipo
 * - Información técnica adaptativa según el tipo de media
 * - Componentes internos memorizados para rendimiento
 * - Diseño limpio y consistente con el resto de la app
 */
