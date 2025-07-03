/**
 * @file Componentes específicos para detalles de colecciones
 * @module components/panels/details-panel/entities/collection-details
 */

import { memo, useCallback, useState } from 'react';
import {
	Collection,
	Plus,
	Search,
	Filter,
	Grid,
	List,
	MoreHorizontal,
	Star,
	Heart,
	Share,
	Download,
	Edit,
	Trash2,
	Tag,
	Calendar,
	User,
	Eye,
	Shuffle,
	Play,
	Palette,
	Layout
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { formatBytes } from '@/lib/utils/format.utils';
import { isCollectionWithStats } from '@/types/migration';
import type {
	EntityDetailsProps,
	EntityPreviewProps,
	EntityToolbarProps,
	EntityMetadataProps
} from '../entity-details-registry';
import type { CollectionWithStats } from '@/types/entities/collection.types';

// Tipos para elementos de colección
interface CollectionItem {
	id: string;
	name: string;
	type: 'image' | 'video' | 'document' | 'audio';
	thumbnailUrl?: string;
	size?: number;
	addedAt: Date;
}

// Componente principal de detalles para colecciones
export const CollectionDetails = memo<EntityDetailsProps<CollectionWithStats>>(
	function CollectionDetails({ entity, isSelected, onAction }) {
		const handleAction = useCallback((action: string, data?: any) => {
			onAction?.(action, data);
		}, [onAction]);

		if (!isCollectionWithStats(entity)) {
			return <div>Error: Entidad no es una colección válida</div>;
		}

		return (
			<div className="space-y-4">
				{/* Preview principal */}
				<CollectionPreview
					entity={entity}
					size="lg"
					showItems={true}
					onAction={handleAction}
				/>

				{/* Información de la colección */}
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm">Información de la colección</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<div className="flex items-start gap-3">
							<Avatar className="h-12 w-12">
								<AvatarImage src={entity.coverImageUrl} alt={entity.name} />
								<AvatarFallback>
									<Collection className="h-6 w-6" />
								</AvatarFallback>
							</Avatar>
							<div className="flex-1 min-w-0">
								<h3 className="font-medium truncate">{entity.name}</h3>
								<p className="text-sm text-muted-foreground mt-1">
									{entity.description || 'Sin descripción'}
								</p>
								<div className="flex items-center gap-2 mt-2">
									<Badge variant="secondary" className="text-xs">
										{entity.statistics?.totalItems || 0} elementos
									</Badge>
									{entity.isPublic && (
										<Badge variant="outline" className="text-xs">
											Pública
										</Badge>
									)}
									{entity.isFavorite && (
										<Heart className="h-3 w-3 text-red-500 fill-current" />
									)}
								</div>
							</div>
						</div>

						{/* Estadísticas rápidas */}
						<div className="grid grid-cols-3 gap-2 pt-2 border-t">
							<div className="text-center">
								<p className="text-lg font-bold text-primary">
									{entity.statistics?.totalItems || 0}
								</p>
								<p className="text-xs text-muted-foreground">Elementos</p>
							</div>
							<div className="text-center">
								<p className="text-lg font-bold text-primary">
									{formatBytes(entity.totalSize || 0)}
								</p>
								<p className="text-xs text-muted-foreground">Tamaño</p>
							</div>
							<div className="text-center">
								<p className="text-lg font-bold text-primary">
									{entity.statistics?.totalViews || 0}
								</p>
								<p className="text-xs text-muted-foreground">Vistas</p>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Tags y categorías */}
				{entity.tags && entity.tags.length > 0 && (
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm">Tags</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex flex-wrap gap-1">
								{entity.tags.map((tag) => (
									<Badge key={tag.id} variant="outline" className="text-xs">
										<Tag className="h-2 w-2 mr-1" />
										{tag.name}
									</Badge>
								))}
							</div>
						</CardContent>
					</Card>
				)}

				{/* Metadatos */}
				<CollectionMetadata entity={entity} editable={true} />

				{/* Toolbar de acciones */}
				<CollectionToolbar entity={entity} onAction={handleAction} />
			</div>
		);
	}
);

// Componente de preview para colecciones
export const CollectionPreview = memo<EntityPreviewProps<CollectionWithStats>>(
	function CollectionPreview({ entity, size = 'md', showItems = false, onAction }) {
		const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
		const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date');

		if (!isCollectionWithStats(entity)) {
			return null;
		}

		const sizeClasses = {
			sm: 'h-32',
			md: 'h-48',
			lg: 'h-64',
			xl: 'h-80'
		};

		// Mock data - en producción vendría del store
		const mockItems: CollectionItem[] = [
			{
				id: '1',
				name: 'Paisaje montañoso.jpg',
				type: 'image',
				thumbnailUrl: '/api/thumbnails/paisaje.jpg',
				size: 2048000,
				addedAt: new Date('2024-01-15'),
			},
			{
				id: '2',
				name: 'Video promocional.mp4',
				type: 'video',
				size: 15728640,
				addedAt: new Date('2024-01-10'),
			},
			{
				id: '3',
				name: 'Documento técnico.pdf',
				type: 'document',
				size: 1024000,
				addedAt: new Date('2024-01-08'),
			}
		];

		const sortedItems = [...mockItems].sort((a, b) => {
			switch (sortBy) {
				case 'name':
					return a.name.localeCompare(b.name);
				case 'size':
					return (b.size || 0) - (a.size || 0);
				case 'date':
				default:
					return b.addedAt.getTime() - a.addedAt.getTime();
			}
		});

		const getTypeIcon = (type: CollectionItem['type']) => {
			const iconClass = "h-4 w-4";
			switch (type) {
				case 'image':
					return <div className={cn(iconClass, "bg-blue-500 rounded")} />;
				case 'video':
					return <Play className={cn(iconClass, "text-red-500")} />;
				case 'document':
					return <div className={cn(iconClass, "bg-green-500 rounded")} />;
				case 'audio':
					return <div className={cn(iconClass, "bg-purple-500 rounded")} />;
				default:
					return <div className={cn(iconClass, "bg-gray-500 rounded")} />;
			}
		};

		return (
			<Card className="overflow-hidden">
				<CardHeader className="pb-2">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Collection className="h-4 w-4 text-primary" />
							<CardTitle className="text-sm truncate">{entity.name}</CardTitle>
						</div>
						{showItems && (
							<div className="flex items-center gap-1">
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="ghost" size="sm" className="h-6 w-6 p-0">
											<Filter className="h-3 w-3" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent>
										<DropdownMenuItem onClick={() => setSortBy('name')}>
											Por nombre
										</DropdownMenuItem>
										<DropdownMenuItem onClick={() => setSortBy('date')}>
											Por fecha
										</DropdownMenuItem>
										<DropdownMenuItem onClick={() => setSortBy('size')}>
											Por tamaño
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
									className="h-6 w-6 p-0"
								>
									{viewMode === 'grid' ? (
										<List className="h-3 w-3" />
									) : (
										<Grid className="h-3 w-3" />
									)}
								</Button>
							</div>
						)}
					</div>
				</CardHeader>
				<CardContent className="p-0">
					{showItems ? (
						<ScrollArea className={cn("p-3", sizeClasses[size])}>
							{viewMode === 'grid' ? (
								<div className="grid grid-cols-2 gap-2">
									{sortedItems.map((item) => (
										<div
											key={item.id}
											className="flex flex-col items-center p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
											onClick={() => onAction?.('open-item', { item })}
										>
											{item.thumbnailUrl ? (
												<img
													src={item.thumbnailUrl}
													alt={item.name}
													className="w-12 h-12 object-cover rounded mb-1"
												/>
											) : (
												<div className="w-12 h-12 bg-muted rounded mb-1 flex items-center justify-center">
													{getTypeIcon(item.type)}
												</div>
											)}
											<span className="text-xs text-center truncate w-full">
												{item.name}
											</span>
										</div>
									))}
								</div>
							) : (
								<div className="space-y-1">
									{sortedItems.map((item) => (
										<div
											key={item.id}
											className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
											onClick={() => onAction?.('open-item', { item })}
										>
											{getTypeIcon(item.type)}
											<div className="flex-1 min-w-0">
												<p className="text-sm truncate">{item.name}</p>
												<p className="text-xs text-muted-foreground">
													{item.size ? formatBytes(item.size) : 'N/A'} • {' '}
													{item.addedAt.toLocaleDateString()}
												</p>
											</div>
											<Badge variant="outline" className="text-xs">
												{item.type}
											</Badge>
										</div>
									))}
								</div>
							)}

							{sortedItems.length === 0 && (
								<div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
									<Collection className="h-8 w-8 mb-2" />
									<p className="text-sm">Colección vacía</p>
									<Button
										variant="outline"
										size="sm"
										className="mt-2"
										onClick={() => onAction?.('add-items')}
									>
										<Plus className="h-3 w-3 mr-1" />
										Añadir elementos
									</Button>
								</div>
							)}
						</ScrollArea>
					) : (
						<div className={cn(
							"flex items-center justify-center bg-muted/20",
							sizeClasses[size]
						)}>
							<div className="text-center">
								{entity.coverImageUrl ? (
									<img
										src={entity.coverImageUrl}
										alt={entity.name}
										className="w-16 h-16 object-cover rounded-lg mx-auto mb-2"
									/>
								) : (
									<Collection className="h-12 w-12 text-primary mx-auto mb-2" />
								)}
								<p className="text-sm text-muted-foreground">
									{entity.statistics?.totalItems || 0} elementos
								</p>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		);
	}
);

// Toolbar específico para colecciones
export const CollectionToolbar = memo<EntityToolbarProps<CollectionWithStats>>(
	function CollectionToolbar({ entity, onAction }) {
		const handleAction = useCallback((action: string) => {
			onAction(action, { entity });
		}, [entity, onAction]);

		return (
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="text-sm">Acciones</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 gap-2">
						{/* Acciones primarias */}
						<Button
							variant="default"
							size="sm"
							onClick={() => handleAction('open')}
							className="justify-start"
						>
							<Eye className="h-4 w-4 mr-2" />
							Ver colección
						</Button>
						<Button
							variant="default"
							size="sm"
							onClick={() => handleAction('add-items')}
							className="justify-start"
						>
							<Plus className="h-4 w-4 mr-2" />
							Añadir elementos
						</Button>

						{/* Gestión de contenido */}
						<Button
							variant="outline"
							size="sm"
							onClick={() => handleAction('slideshow')}
							className="justify-start"
						>
							<Play className="h-4 w-4 mr-2" />
							Presentación
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => handleAction('shuffle')}
							className="justify-start"
						>
							<Shuffle className="h-4 w-4 mr-2" />
							Aleatorio
						</Button>

						{/* Organización */}
						<Button
							variant="outline"
							size="sm"
							onClick={() => handleAction('organize')}
							className="justify-start"
						>
							<Layout className="h-4 w-4 mr-2" />
							Organizar
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => handleAction('add-tags')}
							className="justify-start"
						>
							<Tag className="h-4 w-4 mr-2" />
							Etiquetar
						</Button>

						{/* Acciones secundarias */}
						<Button
							variant="outline"
							size="sm"
							onClick={() => handleAction('favorite')}
							className="justify-start"
						>
							<Heart className="h-4 w-4 mr-2" />
							{entity.isFavorite ? 'Quitar favorito' : 'Favorito'}
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => handleAction('share')}
							className="justify-start"
						>
							<Share className="h-4 w-4 mr-2" />
							Compartir
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => handleAction('download')}
							className="justify-start"
						>
							<Download className="h-4 w-4 mr-2" />
							Descargar
						</Button>

						{/* Más opciones */}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" size="sm" className="justify-start">
									<MoreHorizontal className="h-4 w-4 mr-2" />
									Más
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent>
								<DropdownMenuItem onClick={() => handleAction('edit')}>
									<Edit className="h-4 w-4 mr-2" />
									Editar detalles
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => handleAction('duplicate')}>
									Duplicar colección
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => handleAction('export')}>
									Exportar
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => handleAction('change-cover')}>
									<Palette className="h-4 w-4 mr-2" />
									Cambiar portada
								</DropdownMenuItem>
								<Separator />
								<DropdownMenuItem
									onClick={() => handleAction('delete')}
									className="text-destructive"
								>
									<Trash2 className="h-4 w-4 mr-2" />
									Eliminar
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</CardContent>
			</Card>
		);
	}
);

// Componente de metadatos para colecciones
export const CollectionMetadata = memo<EntityMetadataProps<CollectionWithStats>>(
	function CollectionMetadata({ entity, editable = false, onUpdate }) {
		if (!isCollectionWithStats(entity)) {
			return null;
		}

		const metadata = [
			{
				label: 'Creador',
				value: entity.createdBy || 'Desconocido',
				category: 'basic'
			},
			{
				label: 'Visibilidad',
				value: entity.isPublic ? 'Pública' : 'Privada',
				category: 'basic'
			},
			{
				label: 'Fecha creación',
				value: entity.createdAt
					? new Date(entity.createdAt).toLocaleDateString()
					: 'N/A',
				category: 'basic'
			},
			{
				label: 'Última modificación',
				value: entity.updatedAt
					? new Date(entity.updatedAt).toLocaleDateString()
					: 'N/A',
				category: 'basic'
			},
		];

		const stats = entity.statistics;
		const statisticsMetadata = stats ? [
			{
				label: 'Total elementos',
				value: stats.totalItems?.toString() || '0',
				category: 'stats'
			},
			{
				label: 'Imágenes',
				value: stats.imageCount?.toString() || '0',
				category: 'stats'
			},
			{
				label: 'Videos',
				value: stats.videoCount?.toString() || '0',
				category: 'stats'
			},
			{
				label: 'Documentos',
				value: stats.documentCount?.toString() || '0',
				category: 'stats'
			},
			{
				label: 'Total vistas',
				value: stats.totalViews?.toString() || '0',
				category: 'stats'
			},
			{
				label: 'Tamaño total',
				value: formatBytes(entity.totalSize || 0),
				category: 'stats'
			}
		] : [];

		const basicMetadata = metadata.filter(m => m.category === 'basic');

		return (
			<div className="space-y-4">
				{/* Información básica */}
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm">Información básica</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						{basicMetadata.map((meta) => (
							<div key={meta.label} className="flex justify-between text-sm">
								<span className="text-muted-foreground">{meta.label}:</span>
								<span className="font-medium">{meta.value}</span>
							</div>
						))}
					</CardContent>
				</Card>

				{/* Estadísticas detalladas */}
				{statisticsMetadata.length > 0 && (
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm">Estadísticas detalladas</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2">
							{statisticsMetadata.map((meta) => (
								<div key={meta.label} className="flex justify-between text-sm">
									<span className="text-muted-foreground">{meta.label}:</span>
									<span className="font-medium">{meta.value}</span>
								</div>
							))}
						</CardContent>
					</Card>
				)}

				{/* Actividad reciente */}
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm">Actividad reciente</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-sm text-muted-foreground space-y-1">
							<p>• Último elemento añadido: hace 2 días</p>
							<p>• Última visualización: hace 1 hora</p>
							<p>• Compartida: 3 veces</p>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}
);