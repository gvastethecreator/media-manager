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
	Search,
	Share,
	Trash2,
	Upload,
} from 'lucide-react';
import { memo, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
		<div className="space-y-4">
			{/* Preview principal */}
			<FolderPreview entity={entity} size="lg" onAction={handleAction} />

			{/* Estadísticas rápidas */}
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="text-sm">Estadísticas</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<div className="grid grid-cols-2 gap-4 text-sm">
						<div className="text-center">
							<p className="text-2xl font-bold text-primary">{entity.stats?.totalItems || 0}</p>
							<p className="text-muted-foreground">Elementos</p>
						</div>
						<div className="text-center">
							<p className="text-2xl font-bold text-primary">{formatBytes(entity.totalSize || 0)}</p>
							<p className="text-muted-foreground">Tamaño total</p>
						</div>
					</div>

					{/* Distribución por tipo */}
					{entity.stats && (
						<div className="space-y-2">
							<div className="flex justify-between text-xs">
								<span>Carpetas: {entity.stats.folderCount || 0}</span>
								<span>Archivos: {entity.stats.totalItems ? (entity.stats.totalItems - (entity.stats.folderCount || 0)) : 0}</span>
							</div>
							<Progress
								value={
									entity.stats?.totalItems
										? ((entity.stats.folderCount || 0) / entity.stats.totalItems) * 100
										: 0
								}
								className="h-2"
							/>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Navegación de breadcrumb */}
			<FolderBreadcrumb entity={entity} onNavigate={handleAction} />

			{/* Metadatos */}
			<FolderMetadata entity={entity} editable={true} />

			{/* Toolbar de acciones */}
			<FolderToolbar entity={entity} onAction={handleAction} />
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
		sm: 'h-32',
		md: 'h-48',
		lg: 'h-64',
		xl: 'h-80',
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
			<CardHeader className="pb-2">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<FolderOpen className="h-4 w-4 text-primary" />
						<CardTitle className="text-sm truncate">{entity.name}</CardTitle>
					</div>
					{showContent && (
						<div className="flex items-center gap-1">
							<Button variant="ghost" size="sm" onClick={() => setShowHidden(!showHidden)} className="h-6 w-6 p-0">
								{showHidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
								className="h-6 w-6 p-0"
							>
								{viewMode === 'grid' ? <List className="h-3 w-3" /> : <Grid className="h-3 w-3" />}
							</Button>
						</div>
					)}
				</div>
			</CardHeader>
			<CardContent className="p-0">
				{showContent ? (
					<ScrollArea className={cn('p-3', sizeClasses[size])}>
						{viewMode === 'grid' ? (
							<div className="grid grid-cols-2 gap-2">
								{filteredContent.map((item) => (
									<div
										key={item.id}
										className="flex flex-col items-center p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
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
											<Folder className="h-8 w-8 text-primary mb-1" />
										) : (
											<div className="w-8 h-8 bg-muted rounded mb-1 flex items-center justify-center">
												{item.thumbnailUrl ? (
													<img src={item.thumbnailUrl} alt={item.name} className="w-full h-full object-cover rounded" />
												) : (
													<div className="w-2 h-2 bg-muted-foreground rounded" />
												)}
											</div>
										)}
										<span className="text-xs text-center truncate w-full">{item.name}</span>
									</div>
								))}
							</div>
						) : (
							<div className="space-y-1">
								{filteredContent.map((item) => (
									<div
										key={item.id}
										className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
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
											<Folder className="h-4 w-4 text-primary flex-shrink-0" />
										) : (
											<div className="w-4 h-4 bg-muted rounded flex-shrink-0" />
										)}
										<div className="flex-1 min-w-0">
											<p className="text-sm truncate">{item.name}</p>
											<p className="text-xs text-muted-foreground">
												{item.size ? formatBytes(item.size) : 'Carpeta'} • {item.modifiedAt.toLocaleDateString()}
											</p>
										</div>
										<ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
									</div>
								))}
							</div>
						)}

						{filteredContent.length === 0 && (
							<div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
								<Folder className="h-8 w-8 mb-2" />
								<p className="text-sm">Carpeta vacía</p>
							</div>
						)}
					</ScrollArea>
				) : (
					<div className={cn('flex items-center justify-center bg-muted/20', sizeClasses[size])}>
						<div className="text-center">
							<FolderOpen className="h-12 w-12 text-primary mx-auto mb-2" />
							<p className="text-sm text-muted-foreground">{entity.stats?.totalItems || 0} elementos</p>
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
				<CardContent className="p-3">
					<div className="flex items-center gap-1 text-sm">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => onNavigate('navigate', { path: '/' })}
							className="h-6 px-2"
						>
							<Home className="h-3 w-3" />
						</Button>
						{pathSegments.map((segment: string, index: number) => (
							<div key={index} className="flex items-center gap-1">
								<ChevronRight className="h-3 w-3 text-muted-foreground" />
								<Button
									variant="ghost"
									size="sm"
									onClick={() => {
										const path = `/${pathSegments.slice(0, index + 1).join('/')}`;
										onNavigate('navigate', { path });
									}}
									className="h-6 px-2 text-xs"
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
			<CardHeader className="pb-2">
				<CardTitle className="text-sm">Acciones</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-2 gap-2">
					{/* Acciones primarias */}
					<Button variant="default" size="sm" onClick={() => handleAction('open')} className="justify-start">
						<FolderOpen className="h-4 w-4 mr-2" />
						Abrir
					</Button>
					<Button variant="default" size="sm" onClick={() => handleAction('new-folder')} className="justify-start">
						<Plus className="h-4 w-4 mr-2" />
						Nueva carpeta
					</Button>

					{/* Gestión de archivos */}
					<Button variant="outline" size="sm" onClick={() => handleAction('upload')} className="justify-start">
						<Upload className="h-4 w-4 mr-2" />
						Subir archivos
					</Button>
					<Button variant="outline" size="sm" onClick={() => handleAction('search')} className="justify-start">
						<Search className="h-4 w-4 mr-2" />
						Buscar
					</Button>

					{/* Acciones secundarias */}
					<Button variant="outline" size="sm" onClick={() => handleAction('rename')} className="justify-start">
						<Edit className="h-4 w-4 mr-2" />
						Renombrar
					</Button>
					<Button variant="outline" size="sm" onClick={() => handleAction('share')} className="justify-start">
						<Share className="h-4 w-4 mr-2" />
						Compartir
					</Button>
					<Button variant="outline" size="sm" onClick={() => handleAction('download')} className="justify-start">
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
							<DropdownMenuItem onClick={() => handleAction('compress')}>
								<Archive className="h-4 w-4 mr-2" />
								Comprimir
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => handleAction('copy-path')}>Copiar ruta</DropdownMenuItem>
							<DropdownMenuItem onClick={() => handleAction('properties')}>Propiedades</DropdownMenuItem>
							<Separator />
							<DropdownMenuItem onClick={() => handleAction('delete')} className="text-destructive">
								<Trash2 className="h-4 w-4 mr-2" />
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
					value: stats.totalItems?.toString() || '0',
					category: 'stats',
				},
				{
					label: 'Tamaño total',
					value: formatBytes(entity.totalSize || 0),
					category: 'stats',
				},
			]
		: [];

	const basicMetadata = metadata.filter((m) => m.category === 'basic');

	return (
		<div className="space-y-4">
			{/* Información básica */}
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="text-sm">Información básica</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2">
					{basicMetadata.map((meta) => (
						<div key={meta.label} className="space-y-1">
							<span className="text-xs text-muted-foreground">{meta.label}:</span>
							<p className="text-sm font-medium break-all">{meta.value}</p>
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

			{/* Permisos y acceso */}
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="text-sm">Permisos</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-sm text-muted-foreground">
						<p>Lectura: ✓ Permitido</p>
						<p>Escritura: ✓ Permitido</p>
						<p>Ejecución: ✓ Permitido</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
});
