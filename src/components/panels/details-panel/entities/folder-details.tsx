/**
 * @file Componentes específicos para detalles de carpetas
 * @module components/panels/details-panel/entities/folder-details
 */

import {
	Archive,
	ArrowRight,
	ChevronRight,
	Download,
	Edit,
	Eye,
	EyeOff,
	Folder,
	FolderOpen,
	Grid,
	Home,
	List,
	MoreHorizontal,
	Plus,
	RefreshCw,
	RotateCcw,
	Search,
	Share,
	Star,
	Trash2,
	Upload,
} from 'lucide-react';
import { memo, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useFavorites } from '@/lib/api/favorites';
import { useReindexFolder } from '@/lib/api/folders';
import { toastService } from '@/lib/ui/toast';
import { cn } from '@/lib/utils';
import { formatBytes } from '@/lib/utils/format.utils';
import type { FolderWithStats } from '@/types/entities/folder/types';
import { isFolderWithStats } from '@/types/migration';
import type {
	EntityDetailsProps,
	EntityMetadataProps,
	EntityPreviewProps,
	EntityToolbarProps,
} from '../entity-details-registry';

// Tipos para contenido de carpeta
interface FolderContentItem {
	id: string;
	name: string;
	type: 'file' | 'folder';
	size?: number;
	modifiedAt: Date;
	thumbnailUrl?: string;
}

// Componente principal de detalles para carpetas
export const FolderDetails = memo<EntityDetailsProps<FolderWithStats>>(function FolderDetails({ entity, onAction }) {
	const handleAction = useCallback(
		(action: string, data?: any) => {
			onAction?.(action, data);
		},
		[onAction]
	);

	if (!isFolderWithStats(entity)) {
		return <div>Error: Entidad no es una carpeta válida</div>;
	}

	return (
		<div className="space-y-3">
			{/* Encabezado con nombre y icono */}
			<div className="flex items-center gap-2 pb-2 border-b">
				<FolderOpen className="h-4 w-4 text-primary" />
				<h2 className="text-sm font-semibold truncate">{entity.name}</h2>
			</div>

			{/* Estadísticas principales */}
			<div className="grid grid-cols-2 gap-2 text-xs">
				<div className="bg-muted/50 rounded p-2 text-center">
					<div className="font-bold text-sm text-primary">{entity.stats?.totalItems || 0}</div>
					<div className="text-muted-foreground">Elementos</div>
				</div>
				<div className="bg-muted/50 rounded p-2 text-center">
					<div className="font-bold text-sm text-primary">{formatBytes(entity.totalSize || 0)}</div>
					<div className="text-muted-foreground">Tamaño</div>
				</div>
			</div>

			{/* Distribución de archivos */}
			{entity.stats && (
				<div className="space-y-2">
					<div className="text-xs font-medium">Distribución</div>
					<div className="flex justify-between text-xs bg-muted/30 rounded p-2">
						<span>📁 {entity.stats.folderCount || 0}</span>
						<span>📄 {entity.stats.totalItems ? entity.stats.totalItems - (entity.stats.folderCount || 0) : 0}</span>
					</div>
					<Progress
						value={entity.stats?.totalItems ? ((entity.stats.folderCount || 0) / entity.stats.totalItems) * 100 : 0}
						className="h-1"
					/>
				</div>
			)}

			{/* Información de la ruta */}
			<div className="space-y-1">
				<div className="text-xs font-medium">Ubicación</div>
				<div className="flex items-center gap-1 text-xs bg-muted/30 rounded p-2">
					<Home className="h-3 w-3" />
					<span className="truncate" title={entity.path}>{entity.path}</span>
				</div>
			</div>

			{/* Sección de favoritos compacta */}
			<FavoritesGrid folderId={entity.id} />

			{/* Acciones principales */}
			<div className="space-y-1">
				<div className="text-xs font-medium">Acciones</div>
				<div className="flex flex-wrap gap-1">
					<Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => handleAction('open')}>
						<FolderOpen className="h-3 w-3 mr-1" />
						Abrir
					</Button>
					<Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => handleAction('refresh')}>
						<RefreshCw className="h-3 w-3 mr-1" />
						Recargar
					</Button>
					<Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => handleAction('upload')}>
						<Upload className="h-3 w-3 mr-1" />
						Subir
					</Button>
				</div>
			</div>

			{/* Metadatos esenciales */}
			<div className="space-y-1">
				<div className="text-xs font-medium">Detalles</div>
				<div className="space-y-1 text-xs">
					<div className="flex justify-between">
						<span className="text-muted-foreground">Tipo:</span>
						<span>Carpeta del sistema</span>
					</div>
					{entity.createdAt && (
						<div className="flex justify-between">
							<span className="text-muted-foreground">Creada:</span>
							<span>{new Date(entity.createdAt).toLocaleDateString()}</span>
						</div>
					)}
					{entity.updatedAt && (
						<div className="flex justify-between">
							<span className="text-muted-foreground">Modificada:</span>
							<span>{new Date(entity.updatedAt).toLocaleDateString()}</span>
						</div>
					)}
				</div>
			</div>

			{/* Permisos */}
			<div className="text-xs bg-green-50 text-green-700 rounded p-2">
				Permisos: ✓ Lectura ✓ Escritura ✓ Ejecución
			</div>
		</div>
	);
});

// Componente de preview para carpetas
export const FolderPreview = memo<EntityPreviewProps<FolderWithStats>>(function FolderPreview({
	entity,
	size = 'md',
	onAction,
}) {
	const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
	const [showHidden, setShowHidden] = useState(false);
	const [showContent, setShowContent] = useState(true);

	if (!isFolderWithStats(entity)) {
		return null;
	}

	const sizeClasses = {
		sm: 'h-20',
		md: 'h-32',
		lg: 'h-48',
		xl: 'h-64',
	};

	// Mock data - en producción vendría del store
	const mockContent: FolderContentItem[] = [
		{
			id: '1',
			name: 'Documentos',
			type: 'folder',
			modifiedAt: new Date('2024-01-15'),
		},
		{
			id: '2',
			name: 'imagen.jpg',
			type: 'file',
			size: 2048000,
			modifiedAt: new Date('2024-01-10'),
			thumbnailUrl: '/api/thumbnails/imagen.jpg',
		},
		{
			id: '3',
			name: 'video.mp4',
			type: 'file',
			size: 15728640,
			modifiedAt: new Date('2024-01-08'),
		},
	];

	const filteredContent = showHidden ? mockContent : mockContent.filter((item) => !item.name.startsWith('.'));

	return (
		<Card className="overflow-hidden">
			<CardContent className="p-2">
				<div className="flex items-center justify-between mb-2">
					<div className="flex items-center gap-2 min-w-0 flex-1">
						<FolderOpen className="h-3 w-3 text-primary flex-shrink-0" />
						<span className="text-xs font-medium truncate">{entity.name}</span>
					</div>
					{showContent && (
						<div className="flex items-center gap-1">
							<Button variant="ghost" size="sm" onClick={() => setShowHidden(!showHidden)} className="h-5 w-5 p-0">
								{showHidden ? <EyeOff className="h-2 w-2" /> : <Eye className="h-2 w-2" />}
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
								className="h-5 w-5 p-0"
							>
								{viewMode === 'grid' ? <List className="h-2 w-2" /> : <Grid className="h-2 w-2" />}
							</Button>
						</div>
					)}
				</div>
				{showContent ? (
					<ScrollArea className={cn('px-1', sizeClasses[size])}>
						{viewMode === 'grid' ? (
							<div className="grid grid-cols-3 gap-1">
								{filteredContent.map((item) => (
									<div
										key={item.id}
										className="flex flex-col items-center p-1 rounded-sm hover:bg-muted/50 cursor-pointer transition-colors"
										onClick={() => onAction?.('navigate', { path: item.name })}
										onKeyDown={(e) => {
											if (e.key === 'Enter' || e.key === ' ') {
												e.preventDefault();
												onAction?.('navigate', { path: item.name });
											}
										}}
										tabIndex={0}
										role="button"
										aria-label={`Abrir ${item.name}`}
									>
										{item.type === 'folder' ? (
											<Folder className="h-4 w-4 text-primary mb-1" />
										) : (
											<div className="w-4 h-4 bg-muted rounded mb-1 flex items-center justify-center">
												{item.thumbnailUrl ? (
													<img src={item.thumbnailUrl} alt={item.name} className="w-full h-full object-cover rounded" />
												) : (
													<div className="w-1 h-1 bg-muted-foreground rounded" />
												)}
											</div>
										)}
										<span className="text-[10px] text-center truncate w-full leading-3">{item.name}</span>
									</div>
								))}
							</div>
						) : (
							<div className="space-y-1">
								{filteredContent.map((item) => (
									<div
										key={item.id}
										className="flex items-center gap-2 p-1 rounded-sm hover:bg-muted/50 cursor-pointer transition-colors"
										onClick={() => onAction?.('navigate', { path: item.name })}
										onKeyDown={(e) => {
											if (e.key === 'Enter' || e.key === ' ') {
												e.preventDefault();
												onAction?.('navigate', { path: item.name });
											}
										}}
										tabIndex={0}
										role="button"
										aria-label={`Abrir ${item.name}`}
									>
										{item.type === 'folder' ? (
											<Folder className="h-3 w-3 text-primary flex-shrink-0" />
										) : (
											<div className="w-3 h-3 bg-muted rounded flex-shrink-0" />
										)}
										<div className="flex-1 min-w-0">
											<p className="text-xs truncate">{item.name}</p>
											<p className="text-[10px] text-muted-foreground leading-3">
												{item.size ? formatBytes(item.size) : 'Carpeta'} • {item.modifiedAt.toLocaleDateString()}
											</p>
										</div>
										<ArrowRight className="h-2 w-2 text-muted-foreground flex-shrink-0" />
									</div>
								))}
							</div>
						)}

						{filteredContent.length === 0 && (
							<div className="flex flex-col items-center justify-center h-16 text-muted-foreground">
								<Folder className="h-4 w-4 mb-1" />
								<p className="text-xs">Carpeta vacía</p>
							</div>
						)}
					</ScrollArea>
				) : (
					<div className={cn('flex items-center justify-center bg-muted/20', sizeClasses[size])}>
						<div className="text-center">
							<FolderOpen className="h-6 w-6 text-primary mx-auto mb-1" />
							<p className="text-xs text-muted-foreground">{entity.stats?.totalItems || 0} elementos</p>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
});

// Componente de breadcrumb para navegación
const FolderBreadcrumb = memo<{ entity: FolderWithStats; onNavigate: (action: string, data?: any) => void }>(
	function FolderBreadcrumb({ entity, onNavigate }) {
		// Mock path - en producción vendría del store de navegación
		const pathSegments = entity.path?.split('/').filter(Boolean) || [entity.name];

		return (
			<Card>
				<CardContent className="p-2">
					<div className="flex items-center gap-1 text-xs">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => onNavigate('navigate', { path: '/' })}
							className="h-5 px-1"
						>
							<Home className="h-2 w-2" />
						</Button>
						{pathSegments.map((segment: string, index: number) => (
							<div key={`segment-${index}`} className="flex items-center gap-1">
								<ChevronRight className="h-2 w-2 text-muted-foreground" />
								<Button
									variant="ghost"
									size="sm"
									onClick={() => {
										const path = `/${pathSegments.slice(0, index + 1).join('/')}`;
										onNavigate('navigate', { path });
									}}
									className="h-5 px-1 text-[10px]"
									disabled={index === pathSegments.length - 1}
								>
									{segment}
								</Button>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		);
	}
);

// Componente de grilla de archivos favoritos
const FavoritesGrid = memo<{ folderId: string }>(function FavoritesGrid() {
	// Buscar favoritos que tengan entityType como 'folder' y entityId como folderId
	// o mejor aún, buscar archivos favoritos que estén dentro de esta carpeta
	const { data: favoritesResponse, isLoading } = useFavorites({
		limit: 4,
		sortBy: 'addedAt',
		sortOrder: 'desc',
	});

	// Filtrar favoritos relevantes para esta carpeta
	// En un escenario real, necesitaríamos una API específica para obtener favoritos de una carpeta
	const favorites = favoritesResponse?.data || [];

	if (isLoading) {
		return (
			<div className="space-y-1">
				<div className="text-xs font-medium">Favoritos</div>
				<div className="text-xs text-muted-foreground bg-muted/30 rounded p-2">
					Cargando favoritos...
				</div>
			</div>
		);
	}

	if (!favorites.length) {
		return (
			<div className="space-y-1">
				<div className="text-xs font-medium flex items-center gap-1">
					<Star className="h-3 w-3" />
					Favoritos
				</div>
				<div className="text-xs text-muted-foreground bg-muted/30 rounded p-2">
					Sin favoritos
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-1">
			<div className="text-xs font-medium flex items-center gap-1">
				<Star className="h-3 w-3 text-yellow-500" />
				Favoritos ({favorites.length})
			</div>
			<div className="grid grid-cols-2 gap-1">
				{favorites.slice(0, 4).map((favorite) => (
					<div
						key={favorite.id}
						className="bg-muted/30 rounded p-1 text-xs truncate hover:bg-muted/50 cursor-pointer transition-colors"
						title={favorite.entityId}
					>
						{favorite.entityId}
					</div>
				))}
			</div>
		</div>
	);
});

// Componente de botones de acción para carpeta
const FolderActionButtons = memo<{ folderId: string; onRefresh?: () => void }>(function FolderActionButtons({
	folderId,
	onRefresh,
}) {
	const [isReindexing, setIsReindexing] = useState(false);
	const reindexFolderMutation = useReindexFolder();

	const handleReindex = useCallback(async () => {
		if (isReindexing || !folderId) return;

		setIsReindexing(true);
		try {
			toastService.info('Iniciando reindexado de carpeta...');
			await reindexFolderMutation.mutateAsync(folderId);
			toastService.success('Carpeta reindexada correctamente');
			onRefresh?.();
		} catch (error) {
			console.error('Error al reindexar carpeta:', error);
			toastService.error('Error al reindexar la carpeta');
		} finally {
			setIsReindexing(false);
		}
	}, [folderId, isReindexing, reindexFolderMutation, onRefresh]);

	const handleReload = useCallback(async () => {
		try {
			toastService.info('Recargando carpeta...');
			// Forzar recarga de la carpeta
			onRefresh?.();
			// Simular una pequeña pausa para dar feedback visual
			await new Promise((resolve) => setTimeout(resolve, 500));
			toastService.success('Carpeta recargada');
		} catch (error) {
			console.error('Error al recargar carpeta:', error);
			toastService.error('Error al recargar la carpeta');
		}
	}, [onRefresh]);

	return (
		<Card>
			<CardContent className="p-2">
				<div className="flex items-center gap-2 mb-2">
					<span className="text-xs font-medium">Acciones</span>
				</div>
				<div className="grid grid-cols-2 gap-1">
					<Button variant="outline" size="sm" onClick={handleReindex} disabled={isReindexing} className="justify-start h-6 text-xs">
						<RefreshCw className={`h-2 w-2 mr-1 ${isReindexing ? 'animate-spin' : ''}`} />
						{isReindexing ? 'Reindexando...' : 'Reindexar'}
					</Button>
					<Button variant="outline" size="sm" onClick={handleReload} className="justify-start h-6 text-xs">
						<RotateCcw className="h-2 w-2 mr-1" />
						Recargar
					</Button>
				</div>
			</CardContent>
		</Card>
	);
});

// Toolbar específico para carpetas
export const FolderToolbar = memo<EntityToolbarProps<FolderWithStats>>(function FolderToolbar({ entity, onAction }) {
	const handleAction = useCallback(
		(action: string) => {
			onAction(action, { entity });
		},
		[entity, onAction]
	);

	return (
		<Card>
			<CardContent className="p-2">
				<div className="flex items-center gap-2 mb-2">
					<span className="text-xs font-medium">Opciones</span>
				</div>
				<div className="grid grid-cols-2 gap-1 text-xs">
					{/* Acciones primarias */}
					<Button variant="default" size="sm" onClick={() => handleAction('open')} className="justify-start h-6">
						<FolderOpen className="h-2 w-2 mr-1" />
						Abrir
					</Button>
					<Button variant="default" size="sm" onClick={() => handleAction('new-folder')} className="justify-start h-6">
						<Plus className="h-2 w-2 mr-1" />
						Nueva
					</Button>

					{/* Gestión de archivos */}
					<Button variant="outline" size="sm" onClick={() => handleAction('upload')} className="justify-start h-6">
						<Upload className="h-2 w-2 mr-1" />
						Subir
					</Button>
					<Button variant="outline" size="sm" onClick={() => handleAction('search')} className="justify-start h-6">
						<Search className="h-2 w-2 mr-1" />
						Buscar
					</Button>

					{/* Acciones secundarias */}
					<Button variant="outline" size="sm" onClick={() => handleAction('rename')} className="justify-start h-6">
						<Edit className="h-2 w-2 mr-1" />
						Renombrar
					</Button>
					<Button variant="outline" size="sm" onClick={() => handleAction('share')} className="justify-start h-6">
						<Share className="h-2 w-2 mr-1" />
						Compartir
					</Button>

					{/* Más opciones */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="sm" className="justify-start h-6 col-span-2">
								<MoreHorizontal className="h-2 w-2 mr-1" />
								Más opciones
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuItem onClick={() => handleAction('download')}>
								<Download className="h-3 w-3 mr-2" />
								Descargar
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => handleAction('compress')}>
								<Archive className="h-3 w-3 mr-2" />
								Comprimir
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => handleAction('copy-path')}>Copiar ruta</DropdownMenuItem>
							<DropdownMenuItem onClick={() => handleAction('properties')}>Propiedades</DropdownMenuItem>
							<Separator />
							<DropdownMenuItem onClick={() => handleAction('delete')} className="text-destructive">
								<Trash2 className="h-3 w-3 mr-2" />
								Eliminar
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</CardContent>
		</Card>
	);
});

// Componente de metadatos para carpetas
export const FolderMetadata = memo<EntityMetadataProps<FolderWithStats>>(function FolderMetadata({ entity }) {
	if (!isFolderWithStats(entity)) {
		return null;
	}

	const metadata = [
		{
			label: 'Ruta completa',
			value: entity.path || 'N/A',
			category: 'basic',
		},
		{
			label: 'Tipo',
			value: 'Carpeta del sistema',
			category: 'basic',
		},
		{
			label: 'Fecha creación',
			value: entity.createdAt ? new Date(entity.createdAt).toLocaleDateString() : 'N/A',
			category: 'basic',
		},
		{
			label: 'Última modificación',
			value: entity.updatedAt ? new Date(entity.updatedAt).toLocaleDateString() : 'N/A',
			category: 'basic',
		},
		{
			label: 'Emoji',
			value: entity.emoji || '📁',
			category: 'basic',
		},
		{
			label: 'Color',
			value: entity.color || '#3b82f6',
			category: 'basic',
		},
		{
			label: 'Es favorita',
			value: entity.isFavorite ? 'Sí' : 'No',
			category: 'basic',
		},
		{
			label: 'Auto-reindexar',
			value: entity.autoReindex ? 'Habilitado' : 'Deshabilitado',
			category: 'basic',
		},
		{
			label: 'Última indexación',
			value: entity.lastIndexed ? new Date(entity.lastIndexed).toLocaleDateString() : 'Nunca',
			category: 'basic',
		},
		{
			label: 'ID Padre',
			value: entity.parentId || 'Carpeta raíz',
			category: 'advanced',
		},
		{
			label: 'ID Preset',
			value: entity.presetId || 'Sin preset',
			category: 'advanced',
		},
		{
			label: 'Imagen destacada',
			value: entity.featuredImage ? 'Configurada' : 'Sin imagen',
			category: 'advanced',
		},
	];

	const stats = entity.stats;
	const statisticsMetadata = stats
		? [
				{
					label: 'Total elementos',
					value: stats.totalItems?.toString() || '0',
					category: 'stats',
				},
				{
					label: 'Carpetas',
					value: stats.folderCount?.toString() || '0',
					category: 'stats',
				},
				{
					label: 'Archivos',
					value: (stats.totalItems - (stats.folderCount || 0))?.toString() || '0',
					category: 'stats',
				},
				{
					label: 'Imágenes',
					value: stats.imageCount?.toString() || '0',
					category: 'stats',
				},
				{
					label: 'Videos',
					value: stats.videoCount?.toString() || '0',
					category: 'stats',
				},
				{
					label: 'Documentos',
					value: stats.documentCount?.toString() || '0',
					category: 'stats',
				},
				{
					label: 'Tamaño total (DB)',
					value: formatBytes(entity.totalSize || 0),
					category: 'stats',
				},
				{
					label: 'Total archivos (DB)',
					value: entity.totalFiles?.toString() || '0',
					category: 'stats',
				},
				{
					label: 'Profundidad jerarquía',
					value: stats.hierarchyDepth?.toString() || '0',
					category: 'stats',
				},
				{
					label: 'Descendientes totales',
					value: stats.totalDescendants?.toString() || '0',
					category: 'stats',
				},
				{
					label: 'Hijos directos',
					value: stats.directChildren?.toString() || '0',
					category: 'stats',
				},
				{
					label: 'Diversidad contenido',
					value: `${stats.contentDiversity?.toFixed(1) || '0'}%`,
					category: 'stats',
				},
				{
					label: 'Puntuación organización',
					value: `${stats.organizationScore?.toFixed(1) || '0'}%`,
					category: 'stats',
				},
				{
					label: 'Frecuencia acceso',
					value: `${stats.accessFrequency?.toFixed(1) || '0'}%`,
					category: 'stats',
				},
				{
					label: 'Última actividad',
					value: stats.lastActivity ? new Date(stats.lastActivity).toLocaleDateString() : 'Sin actividad',
					category: 'stats',
				},
			]
		: [];

	const basicMetadata = metadata.filter((m) => m.category === 'basic');
	const advancedMetadata = metadata.filter((m) => m.category === 'advanced');

	return (
		<Card>
			<CardContent className="p-2">
				<div className="flex items-center gap-2 mb-2">
					<span className="text-xs font-medium">Información</span>
					{entity.emoji && <span className="text-sm">{entity.emoji}</span>}
				</div>

				{/* Información básica compacta */}
				<div className="space-y-1 mb-2">
					{basicMetadata.slice(0, 4).map((meta) => (
						<div key={meta.label} className="flex justify-between text-xs">
							<span className="text-muted-foreground truncate">{meta.label}:</span>
							{meta.label === 'Color' ? (
								<div className="flex items-center gap-1">
									<div className="w-2 h-2 rounded border" style={{ backgroundColor: meta.value }} />
									<span className="text-[10px]">{meta.value}</span>
								</div>
							) : meta.label === 'Es favorita' ? (
								<div className="flex items-center gap-1">
									<span>{meta.value}</span>
									{entity.isFavorite && <span className="text-yellow-500 text-xs">⭐</span>}
								</div>
							) : (
								<span className="font-medium truncate max-w-[120px]">{meta.value}</span>
							)}
						</div>
					))}
				</div>

				{/* Estadísticas más importantes en forma compacta */}
				{statisticsMetadata.length > 0 && (
					<div className="border-t pt-2">
						<div className="grid grid-cols-2 gap-1 text-xs">
							{statisticsMetadata.slice(0, 6).map((meta) => (
								<div key={meta.label} className="flex flex-col">
									<span className="text-muted-foreground text-[10px] truncate">{meta.label}:</span>
									<span className="font-medium text-xs">{meta.value}</span>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Permisos compactos */}
				<div className="border-t pt-2 mt-2">
					<div className="text-[10px] text-muted-foreground">
						<span>Permisos: ✓ Lectura ✓ Escritura ✓ Ejecución</span>
					</div>
				</div>
			</CardContent>
		</Card>
	);
});
