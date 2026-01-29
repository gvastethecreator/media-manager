/**
 * @file Modern Files Settings
 * @module components/settings/modern/files-settings-modern
 * @description Configuración de archivos: carpetas y miniaturas
 */

import { Folder, Image, HardDrive, RefreshCw, Search, Grid3X3, List, Plus, Trash2, Zap, AlertCircle } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFolders, useReindexFolder } from '@/lib/api/folders';
import {
	useCleanThumbnails,
	useLastProcessedThumbnails,
	useOptimizeThumbnails,
	useReprocessThumbnails,
	useThumbnailStats,
} from '@/lib/api/thumbnails';
import { useSettings } from '@/lib/contexts';
import { ThumbnailQuality } from '@/lib/config/thumbnail.config';
import { toastService } from '@/lib/ui/toast';
import { formatBytes } from '@/lib/utils/format.utils';
import type { FolderWithStats } from '@/types/entities/folder';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FolderForm } from '../folders/folders-form';
import type { CardActions } from '../common/entity-settings-view';

// ============================================================================
// COMPONENTE DE CARPETA
// ============================================================================

function FolderCard({
	folder,
	actions,
	isGrid,
	onReindex,
	isReindexing,
}: {
	folder: FolderWithStats;
	actions: CardActions;
	isGrid: boolean;
	onReindex: () => void;
	isReindexing: boolean;
}) {
	if (isGrid) {
		return (
			<Card className="group overflow-hidden">
				<div className="aspect-video bg-muted relative">
					<div className="absolute inset-0 flex items-center justify-center">
						<Folder className="h-12 w-12 text-muted-foreground/30" />
					</div>
					<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
						<Button size="sm" variant="secondary" onClick={actions.onEdit}>
							Editar
						</Button>
						<Button
							size="sm"
							variant="outline"
							onClick={onReindex}
							disabled={isReindexing}
						>
							{isReindexing ? '...' : 'Reindexar'}
						</Button>
					</div>
				</div>
				<CardHeader className="p-4">
					<CardTitle className="text-base truncate">{folder.name}</CardTitle>
					<p className="text-xs text-muted-foreground truncate">{folder.path}</p>
				</CardHeader>
				<CardContent className="p-4 pt-0">
					<div className="flex items-center justify-between text-xs text-muted-foreground">
						<span>{folder.stats?.imageCount || 0} imágenes</span>
						<Badge variant="default" className="text-xs">Activo</Badge>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/30 transition-colors">
			<div className="flex items-center gap-3 flex-1 min-w-0">
				<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
					<Folder className="h-5 w-5 text-primary" />
				</div>
				<div className="min-w-0 flex-1">
					<p className="font-medium truncate">{folder.name}</p>
					<p className="text-sm text-muted-foreground truncate">{folder.path}</p>
				</div>
			</div>
			<div className="flex items-center gap-4">
				<span className="text-sm text-muted-foreground">{folder.stats?.imageCount || 0} items</span>
				<Badge variant="default" className="text-xs">Activo</Badge>
				<Button
					variant="outline"
					size="sm"
					onClick={onReindex}
					disabled={isReindexing}
					className="gap-1"
				>
					<RefreshCw className={cn('h-3 w-3', isReindexing && 'animate-spin')} />
					{isReindexing ? 'Reindexando...' : 'Reindexar'}
				</Button>
				<Button variant="ghost" size="sm" onClick={actions.onDelete}>
					<Trash2 className="h-4 w-4" />
				</Button>
			</div>
		</div>
	);
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function FilesSettingsModern() {
	const [activeTab, setActiveTab] = useState('folders');
	const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
	const [searchQuery, setSearchQuery] = useState('');
	const [showFolderForm, setShowFolderForm] = useState(false);
	const [editingFolder, setEditingFolder] = useState<FolderWithStats | null>(null);
	const [reindexingFolderId, setReindexingFolderId] = useState<string | null>(null);

	const { settings, updateSettings } = useSettings();

	// Hooks de datos
	const foldersQuery = useFolders({ search: searchQuery });
	const thumbnailStatsQuery = useThumbnailStats();
	const _lastProcessedQuery = useLastProcessedThumbnails(9);

	// Mutations
	const reindexFolderMutation = useReindexFolder();
	const optimizeMutation = useOptimizeThumbnails();
	const reprocessMutation = useReprocessThumbnails();
	const cleanMutation = useCleanThumbnails();

	const folders = Array.isArray(foldersQuery.data) ? foldersQuery.data : [];
	const thumbnailStats = thumbnailStatsQuery.data as unknown as { total: number; pending: number; errors: number; totalSize?: number } | undefined;

	// Stats
	const folderStats = useMemo(
		() => [
			{
				label: 'Carpetas',
				value: folders.length,
				icon: <Folder className="h-5 w-5" />,
				color: 'var(--entity-folder)',
			},
			{
				label: 'Imágenes',
				value: folders.reduce((acc: number, f: FolderWithStats) => acc + (f.stats?.imageCount || 0), 0),
				icon: <Image className="h-5 w-5" />,
				color: 'var(--entity-image)',
			},
			{
				label: 'Espacio',
				value: formatBytes(folders.reduce((acc: number, f: FolderWithStats) => acc + (f.stats?.totalSize || 0), 0)),
				icon: <HardDrive className="h-5 w-5" />,
				color: 'var(--primary)',
			},
		],
		[folders]
	);

	const thumbnailStatCards = useMemo(
		() => [
			{
				label: 'Total Miniaturas',
				value: thumbnailStats?.total || 0,
				icon: <Image className="h-5 w-5" />,
				color: 'var(--entity-image)',
				subtitle: thumbnailStats?.totalSize ? formatBytes(thumbnailStats.totalSize) : '0 B',
			},
			{
				label: 'Pendientes',
				value: thumbnailStats?.pending || 0,
				icon: <AlertCircle className="h-5 w-5" />,
				color: 'var(--warning)',
				subtitle: 'Por generar',
			},
			{
				label: 'Errores',
				value: thumbnailStats?.errors || 0,
				icon: <AlertCircle className="h-5 w-5" />,
				color: 'var(--destructive)',
				subtitle: thumbnailStats?.errors ? 'Requieren atención' : 'Todo correcto',
			},
		],
		[thumbnailStats]
	);

	// Handlers
	const handleCreateFolder = useCallback(() => {
		setEditingFolder(null);
		setShowFolderForm(true);
	}, []);

	const handleEditFolder = useCallback((folder: FolderWithStats) => {
		setEditingFolder(folder);
		setShowFolderForm(true);
	}, []);

	const handleReindexFolder = useCallback(
		async (folderId: string) => {
			setReindexingFolderId(folderId);
			try {
				await reindexFolderMutation.mutateAsync({
					id: folderId,
					options: { skipThumbnails: false },
				});
				toastService.success('Carpeta reindexada correctamente');
			} catch (err) {
				toastService.error('Error al reindexar carpeta');
			} finally {
				setReindexingFolderId(null);
			}
		},
		[reindexFolderMutation]
	);

	const handleOptimizeThumbnails = useCallback(async () => {
		try {
			await optimizeMutation.mutateAsync({});
			toastService.success('Miniaturas optimizadas');
		} catch (err) {
			toastService.error('Error al optimizar miniaturas');
		}
	}, [optimizeMutation]);

	const handleReprocessThumbnails = useCallback(async () => {
		try {
			await reprocessMutation.mutateAsync({});
			toastService.success('Reprocesando miniaturas');
		} catch (err) {
			toastService.error('Error al reprocesar miniaturas');
		}
	}, [reprocessMutation]);

	const handleCleanThumbnails = useCallback(async () => {
		try {
			await cleanMutation.mutateAsync({});
			toastService.success('Miniaturas huérfanas eliminadas');
		} catch (err) {
			toastService.error('Error al limpiar miniaturas');
		}
	}, [cleanMutation]);

	const handleQualityChange = useCallback(
		async (quality: ThumbnailQuality) => {
			try {
				await updateSettings({ thumbnailQuality: quality });
				toastService.success('Calidad de miniaturas actualizada');
			} catch (err) {
				toastService.error('Error al actualizar calidad');
			}
		},
		[updateSettings]
	);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h2 className="text-2xl font-semibold text-foreground">Archivos y Almacenamiento</h2>
				<p className="mt-1 text-sm text-muted-foreground">
					Gestiona carpetas, miniaturas y configuración de almacenamiento
				</p>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
					<TabsTrigger value="folders" className="gap-2">
						<Folder className="h-4 w-4" />
						Carpetas
					</TabsTrigger>
					<TabsTrigger value="thumbnails" className="gap-2">
						<Image className="h-4 w-4" />
						Miniaturas
					</TabsTrigger>
				</TabsList>

				<div className="mt-6 space-y-6">
					<TabsContent value="folders" className="m-0 space-y-6">
						{/* Stats */}
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
							{folderStats.map((stat) => (
								<Card key={stat.label} className="border-l-4" style={{ borderLeftColor: stat.color }}>
									<CardContent className="p-4">
										<div className="flex items-center justify-between">
											<div>
												<p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
												<p className="text-2xl font-bold">{stat.value}</p>
											</div>
											<div
												className="flex h-10 w-10 items-center justify-center rounded-lg"
												style={{ backgroundColor: `${stat.color}20` }}
											>
												<div style={{ color: stat.color }}>{stat.icon}</div>
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>

						{/* Toolbar */}
						<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
							<div className="relative max-w-sm">
								<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
								<input
									type="text"
									placeholder="Buscar carpetas..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="w-full px-4 py-2 pl-10 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
								/>
							</div>
							<div className="flex items-center gap-2">
								<div className="flex items-center border rounded-lg p-0.5">
									<Button
										variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
										size="sm"
										className="h-8 w-8 p-0"
										onClick={() => setViewMode('grid')}
									>
										<Grid3X3 className="h-4 w-4" />
									</Button>
									<Button
										variant={viewMode === 'list' ? 'secondary' : 'ghost'}
										size="sm"
										className="h-8 w-8 p-0"
										onClick={() => setViewMode('list')}
									>
										<List className="h-4 w-4" />
									</Button>
								</div>
								<Button onClick={handleCreateFolder} className="gap-2">
									<Plus className="h-4 w-4" />
									Agregar Carpeta
								</Button>
							</div>
						</div>

						{/* Folders List */}
						{foldersQuery.isLoading ? (
							<div className="flex items-center justify-center p-12">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
							</div>
						) : folders.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-12 text-center">
								<div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
									<Folder className="h-6 w-6 text-muted-foreground" />
								</div>
								<h3 className="text-lg font-medium">No hay carpetas</h3>
								<p className="text-sm text-muted-foreground mt-1">
									{searchQuery ? 'No se encontraron resultados' : 'Agrega una carpeta para comenzar'}
								</p>
								<div className="mt-4">
									{searchQuery ? (
										<Button variant="outline" onClick={() => setSearchQuery('')}>
											Limpiar búsqueda
										</Button>
									) : (
										<Button onClick={handleCreateFolder}>Agregar Carpeta</Button>
									)}
								</div>
							</div>
						) : (
							<div
								className={
									viewMode === 'grid'
										? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
										: 'flex flex-col gap-2'
								}
							>
								{folders.map((folder: FolderWithStats) => (
									<FolderCard
										key={folder.id}
										folder={folder}
										actions={{
											onEdit: () => handleEditFolder(folder),
											onDelete: () => {}, // TODO: Implementar
										}}
										isGrid={viewMode === 'grid'}
										onReindex={() => handleReindexFolder(folder.id)}
										isReindexing={reindexingFolderId === folder.id}
									/>
								))}
							</div>
						)}
					</TabsContent>

					<TabsContent value="thumbnails" className="m-0 space-y-6">
						{/* Stats */}
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
							{thumbnailStatCards.map((stat) => (
								<Card key={stat.label} className="border-l-4" style={{ borderLeftColor: stat.color }}>
									<CardContent className="p-4">
										<div className="flex items-center justify-between">
											<div>
												<p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
												<p className="text-2xl font-bold">{stat.value}</p>
												{stat.subtitle && (
													<p className="text-xs text-muted-foreground">{stat.subtitle}</p>
												)}
											</div>
											<div
												className="flex h-10 w-10 items-center justify-center rounded-lg"
												style={{ backgroundColor: `${stat.color}20` }}
											>
												<div style={{ color: stat.color }}>{stat.icon}</div>
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>

						{/* Quality Settings */}
						<Card>
							<CardHeader>
								<CardTitle className="text-lg flex items-center gap-2">
									<Image className="h-5 w-5" />
									Configuración de Miniaturas
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-6">
								<div className="flex items-center justify-between">
									<div>
										<p className="font-medium">Calidad de miniaturas</p>
										<p className="text-sm text-muted-foreground">
											Balance entre calidad visual y espacio en disco
										</p>
									</div>
									<Select
										value={settings?.thumbnailQuality || ThumbnailQuality.MEDIUM}
										onValueChange={(v) => handleQualityChange(v as ThumbnailQuality)}
									>
										<SelectTrigger className="w-[200px]">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value={ThumbnailQuality.LOW}>Baja (rápido)</SelectItem>
											<SelectItem value={ThumbnailQuality.MEDIUM}>Media (recomendado)</SelectItem>
											<SelectItem value={ThumbnailQuality.HIGH}>Alta (calidad)</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<Separator />

								<div className="flex items-center justify-between">
									<div>
										<p className="font-medium">Animación en videos</p>
										<p className="text-sm text-muted-foreground">
											Mostrar preview animado al pasar el cursor
										</p>
									</div>
									<Switch
										checked={settings?.videoThumbnailAnimation ?? true}
										onCheckedChange={async (checked) => {
											await updateSettings({ videoThumbnailAnimation: checked });
										}}
									/>
								</div>
							</CardContent>
						</Card>

						{/* Maintenance */}
						<Card>
							<CardHeader>
								<CardTitle className="text-lg flex items-center gap-2">
									<Zap className="h-5 w-5" />
									Mantenimiento
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex flex-wrap gap-2">
									<Button variant="outline" className="gap-2" onClick={handleOptimizeThumbnails}>
										<Zap className="h-4 w-4" />
										Optimizar
									</Button>
									<Button variant="outline" className="gap-2" onClick={handleReprocessThumbnails}>
										<RefreshCw className="h-4 w-4" />
										Reprocesar todo
									</Button>
									<Button
										variant="outline"
										className="gap-2 text-destructive hover:text-destructive"
										onClick={handleCleanThumbnails}
									>
										<Trash2 className="h-4 w-4" />
										Limpiar huérfanas
									</Button>
								</div>
							</CardContent>
						</Card>
					</TabsContent>
				</div>
			</Tabs>

			{/* Folder Form Dialog */}
			<Dialog open={showFolderForm} onOpenChange={setShowFolderForm}>
				<DialogContent className="sm:max-w-[600px]">
					<DialogHeader>
						<DialogTitle>{editingFolder ? 'Editar Carpeta' : 'Agregar Carpeta'}</DialogTitle>
					</DialogHeader>
					<FolderForm
						onAddFolder={async (_path: string) => {
							console.log('Add folder');
							setShowFolderForm(false);
						}}
						isProcessing={false}
						isLoading={false}
					/>
				</DialogContent>
			</Dialog>
		</div>
	);
}
