/**
 * @file Modern Files Settings
 * @module components/settings/modern/files-settings-modern
 * @description Configuración de archivos: carpetas y miniaturas
 */

import {
	AlertCircle,
	Folder,
	Grid3X3,
	HardDrive,
	Image,
	List,
	Plus,
	RefreshCw,
	Search,
	Settings2,
	Trash2,
	Zap,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
	useCreateFolder,
	useDeleteFolder,
	useFolders,
	useReindexAllFolders,
	useReindexFolder,
} from '@/lib/api/folders';
import {
	useCleanThumbnails,
	useLastProcessedThumbnails,
	useOptimizeThumbnails,
	useReprocessThumbnails,
	useThumbnailStats,
} from '@/lib/api/thumbnails';
import { ThumbnailQuality } from '@/lib/config/thumbnail.config';
import { useSettings } from '@/lib/contexts';
import { toastService } from '@/lib/ui/toast';
import { cn } from '@/lib/utils';
import { formatBytes } from '@/lib/utils/format.utils';
import type { FolderWithStats } from '@/types/entities/folder';
import type { CardActions } from '../common/entity-settings-view';
import { FolderForm } from '../folders/folders-form';
import { StructuredReindexConfig } from '../folders/folders-reindex-config';
import { useReindexConfig } from '../folders/hooks/use-reindex-config';
import { ReindexTerminal } from '../folders/reindex-terminal';

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
				<div className="relative aspect-video bg-muted">
					<div className="absolute inset-0 flex items-center justify-center">
						<Folder className="h-12 w-12 text-muted-foreground/30" />
					</div>
					<div
						className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 transition-opacity group-hover:opacity-100"
						style={{ backgroundColor: 'color-mix(in oklch, var(--background) 50%, transparent)' }}
					>
						<Button onClick={actions.onEdit} size="sm" variant="secondary">
							Editar
						</Button>
						<Button disabled={isReindexing} onClick={onReindex} size="sm" variant="outline">
							{isReindexing ? '...' : 'Reindexar'}
						</Button>
					</div>
				</div>
				<CardHeader className="p-4">
					<CardTitle className="truncate text-base">{folder.name}</CardTitle>
					<p className="truncate text-muted-foreground text-sm">{folder.path}</p>
				</CardHeader>
				<CardContent className="p-4 pt-0">
					<div className="flex items-center justify-between text-muted-foreground text-sm">
						<span>{folder.stats?.imageCount || 0} imágenes</span>
						<Badge className="text-sm" variant="default">
							Activo
						</Badge>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/30">
			<div className="flex min-w-0 flex-1 items-center gap-3">
				<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
					<Folder className="h-5 w-5 text-primary" />
				</div>
				<div className="min-w-0 flex-1">
					<p className="truncate font-medium">{folder.name}</p>
					<p className="truncate text-muted-foreground text-sm">{folder.path}</p>
				</div>
			</div>
			<div className="flex items-center gap-4">
				<span className="text-muted-foreground text-sm">{folder.stats?.imageCount || 0} items</span>
				<Badge className="text-sm" variant="default">
					Activo
				</Badge>
				<Button className="gap-1" disabled={isReindexing} onClick={onReindex} size="sm" variant="outline">
					<RefreshCw className={cn('h-3 w-3', isReindexing && 'animate-spin')} />
					{isReindexing ? 'Reindexando...' : 'Reindexar'}
				</Button>
				<Button onClick={actions.onDelete} size="sm" variant="ghost">
					<Trash2 className="h-4 w-4" />
				</Button>
			</div>
		</div>
	);
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function FilesSettingsModern({ defaultTab = 'folders' }: { defaultTab?: string }) {
	const [activeTab, setActiveTab] = useState(defaultTab);

	// Sync with prop when URL changes
	useEffect(() => {
		if (defaultTab === 'folders' || defaultTab === 'thumbnails') {
			setActiveTab(defaultTab);
		}
	}, [defaultTab]);
	const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
	const [searchQuery, setSearchQuery] = useState('');
	const [showFolderForm, setShowFolderForm] = useState(false);
	const [editingFolder, setEditingFolder] = useState<FolderWithStats | null>(null);
	const [reindexingFolderId, setReindexingFolderId] = useState<string | null>(null);

	const { settings, updateSettings } = useSettings();

	// Advanced Reindex Config Hook
	const {
		showAdvancedConfig,
		useStructuredFlow,
		skipThumbnails,
		skipMetadata,
		setShowAdvancedConfig,
		setUseStructuredFlow,
		setSkipThumbnails,
		setSkipMetadata,
		getConfig,
	} = useReindexConfig();

	// Hooks de datos
	const foldersQuery = useFolders({ search: searchQuery });
	const thumbnailStatsQuery = useThumbnailStats();
	const _lastProcessedQuery = useLastProcessedThumbnails(9);

	// Mutations
	const createFolderMutation = useCreateFolder();
	const deleteFolderMutation = useDeleteFolder();
	const reindexFolderMutation = useReindexFolder();
	const reindexAllFoldersMutation = useReindexAllFolders();
	const optimizeMutation = useOptimizeThumbnails();
	const reprocessMutation = useReprocessThumbnails();
	const cleanMutation = useCleanThumbnails();

	const folders = foldersQuery.data?.data || [];
	const thumbnailStats = thumbnailStatsQuery.data as unknown as
		| { total: number; pending: number; errors: number; totalSize?: number }
		| undefined;

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
				// Use advanced config
				const config = getConfig();
				await reindexFolderMutation.mutateAsync({
					id: folderId,
					options: config,
				});
				toastService.success('Carpeta reindexada correctamente');
			} catch (err) {
				toastService.error('Error al reindexar carpeta');
			} finally {
				setReindexingFolderId(null);
			}
		},
		[reindexFolderMutation, getConfig]
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
				<h2 className="font-semibold text-2xl text-foreground">Archivos y Almacenamiento</h2>
				<p className="mt-1 text-muted-foreground text-sm">
					Gestiona carpetas, miniaturas y configuración de almacenamiento
				</p>
			</div>

			<Tabs onValueChange={setActiveTab} value={activeTab}>
				<TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
					<TabsTrigger className="gap-2" value="folders">
						<Folder className="h-4 w-4" />
						Carpetas
					</TabsTrigger>
					<TabsTrigger className="gap-2" value="thumbnails">
						<Image className="h-4 w-4" />
						Miniaturas
					</TabsTrigger>
				</TabsList>

				<div className="mt-6 space-y-6">
					<TabsContent className="m-0 space-y-6" value="folders">
						{/* Stats */}
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
							{folderStats.map((stat) => (
								<Card
									className="border-l-4"
									key={stat.label}
									style={{ borderLeftColor: `color-mix(in oklch, ${stat.color} 60%, transparent)` }}
								>
									<CardContent className="p-4">
										<div className="flex items-center justify-between">
											<div>
												<p className="font-medium text-muted-foreground text-sm">{stat.label}</p>
												<p className="font-bold text-2xl">{stat.value}</p>
											</div>
											<div
												className="flex h-10 w-10 items-center justify-center rounded-lg"
												style={{ backgroundColor: `color-mix(in oklch, ${stat.color} 12%, transparent)` }}
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
								<Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
								<input
									className="w-full rounded-lg border bg-background px-4 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
									onChange={(e) => setSearchQuery(e.target.value)}
									placeholder="Buscar carpetas..."
									type="text"
									value={searchQuery}
								/>
							</div>
							<div className="flex items-center gap-2">
								<div className="flex items-center rounded-lg border p-0.5">
									<Button
										className="h-8 w-8 p-0"
										onClick={() => setViewMode('grid')}
										size="sm"
										variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
									>
										<Grid3X3 className="h-4 w-4" />
									</Button>
									<Button
										className="h-8 w-8 p-0"
										onClick={() => setViewMode('list')}
										size="sm"
										variant={viewMode === 'list' ? 'secondary' : 'ghost'}
									>
										<List className="h-4 w-4" />
									</Button>
								</div>

								<Button
									onClick={() => setShowAdvancedConfig(true)}
									size="icon"
									title="Configuración Avanzada de Reindexado"
									variant="outline"
								>
									<Settings2 className="h-4 w-4" />
								</Button>

								<Button className="gap-2" onClick={handleCreateFolder}>
									<Plus className="h-4 w-4" />
									Agregar Carpeta
								</Button>

								<Button
									className="gap-2"
									disabled={reindexAllFoldersMutation.isPending}
									onClick={async () => {
										try {
											const config = getConfig();
											await reindexAllFoldersMutation.mutateAsync(config);
											toastService.success('Reindexación global iniciada');
										} catch (err) {
											toastService.error('Error al iniciar reindexación global');
										}
									}}
									variant="default"
								>
									<RefreshCw className={cn('h-4 w-4', reindexAllFoldersMutation.isPending && 'animate-spin')} />
									{reindexAllFoldersMutation.isPending ? 'Reindexando...' : 'Reindexar Todo'}
								</Button>
							</div>
						</div>

						{/* Folders List */}
						{foldersQuery.isLoading ? (
							<div className="flex items-center justify-center p-6">
								<div className="h-8 w-8 animate-spin rounded-full border-primary border-b-2" />
							</div>
						) : folders.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-6 text-center">
								<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
									<Folder className="h-6 w-6 text-muted-foreground" />
								</div>
								<h3 className="font-medium text-lg">No hay carpetas</h3>
								<p className="mt-1 text-muted-foreground text-sm">
									{searchQuery ? 'No se encontraron resultados' : 'Agrega una carpeta para comenzar'}
								</p>
								<div className="mt-4">
									{searchQuery ? (
										<Button onClick={() => setSearchQuery('')} variant="outline">
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
									viewMode === 'grid' ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3' : 'flex flex-col gap-2'
								}
							>
								{folders.map((folder: FolderWithStats) => (
									<FolderCard
										actions={{
											onEdit: () => handleEditFolder(folder),
											onDelete: async () => {
												if (confirm('¿Estás seguro de eliminar esta carpeta?')) {
													try {
														await deleteFolderMutation.mutateAsync(folder.id);
														toastService.success('Carpeta eliminada');
													} catch (error) {
														toastService.error('Error al eliminar carpeta');
													}
												}
											},
										}}
										folder={folder}
										isGrid={viewMode === 'grid'}
										isReindexing={reindexingFolderId === folder.id}
										key={folder.id}
										onReindex={() => handleReindexFolder(folder.id)}
									/>
								))}
							</div>
						)}
					</TabsContent>

					<TabsContent className="m-0 space-y-6" value="thumbnails">
						{/* Stats */}
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
							{thumbnailStatCards.map((stat) => (
								<Card
									className="border-l-4"
									key={stat.label}
									style={{ borderLeftColor: `color-mix(in oklch, ${stat.color} 60%, transparent)` }}
								>
									<CardContent className="p-4">
										<div className="flex items-center justify-between">
											<div>
												<p className="font-medium text-muted-foreground text-sm">{stat.label}</p>
												<p className="font-bold text-2xl">{stat.value}</p>
												{stat.subtitle && <p className="text-muted-foreground text-sm">{stat.subtitle}</p>}
											</div>
											<div
												className="flex h-10 w-10 items-center justify-center rounded-lg"
												style={{ backgroundColor: `color-mix(in oklch, ${stat.color} 12%, transparent)` }}
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
								<CardTitle className="flex items-center gap-2 text-lg">
									<Image className="h-5 w-5" />
									Configuración de Miniaturas
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-6">
								<div className="flex items-center justify-between">
									<div>
										<p className="font-medium">Calidad de miniaturas</p>
										<p className="text-muted-foreground text-sm">Balance entre calidad visual y espacio en disco</p>
									</div>
									<Select
										onValueChange={(v) => handleQualityChange(v as ThumbnailQuality)}
										value={settings?.thumbnailQuality || ThumbnailQuality.MEDIUM}
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
										<p className="text-muted-foreground text-sm">Mostrar preview animado al pasar el cursor</p>
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
								<CardTitle className="flex items-center gap-2 text-lg">
									<Zap className="h-5 w-5" />
									Mantenimiento
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex flex-wrap gap-2">
									<Button className="gap-2" onClick={handleOptimizeThumbnails} variant="outline">
										<Zap className="h-4 w-4" />
										Optimizar
									</Button>
									<Button className="gap-2" onClick={handleReprocessThumbnails} variant="outline">
										<RefreshCw className="h-4 w-4" />
										Reprocesar todo
									</Button>
									<Button
										className="gap-2 text-destructive hover:text-destructive"
										onClick={handleCleanThumbnails}
										variant="outline"
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
			<Dialog onOpenChange={setShowFolderForm} open={showFolderForm}>
				<DialogContent className="sm:max-w-[600px]">
					<DialogHeader>
						<DialogTitle>{editingFolder ? 'Editar Carpeta' : 'Agregar Carpeta'}</DialogTitle>
					</DialogHeader>
					<FolderForm
						isLoading={createFolderMutation.isPending}
						isProcessing={createFolderMutation.isPending}
						onAddFolder={async (path: string) => {
							try {
								await createFolderMutation.mutateAsync({ name: path.split(/[\\/]/).pop() || 'Nueva Carpeta', path });
								toastService.success('Carpeta agregada correctamente');
								setShowFolderForm(false);
							} catch (error) {
								toastService.error('Error al agregar carpeta');
							}
						}}
					/>
				</DialogContent>
			</Dialog>

			{/* Advanced Reindex Config Dialog */}
			<StructuredReindexConfig
				isOpen={showAdvancedConfig}
				onSkipMetadataChange={setSkipMetadata}
				onSkipThumbnailsChange={setSkipThumbnails}
				onToggle={() => setShowAdvancedConfig(!showAdvancedConfig)}
				onUseStructuredFlowChange={setUseStructuredFlow}
				skipMetadata={skipMetadata}
				skipThumbnails={skipThumbnails}
				useStructuredFlow={useStructuredFlow}
			/>

			{/* Reindex Terminal - Solo visible cuando hay actividad de reindexado */}
			{(reindexFolderMutation.isPending || reindexAllFoldersMutation.isPending) && (
				<div className="mt-6 border-border/30 border-t pt-6">
					<div className="mb-4 flex items-center justify-between">
						<h3 className="flex items-center gap-2 font-medium text-base">
							<Zap className="h-4 w-4 text-primary" />
							Terminal de Procesamiento
						</h3>
						<span className="text-muted-foreground text-xs">
							{reindexingFolderId ? 'Reindexando carpeta...' : 'Reindexando todas las carpetas...'}
						</span>
					</div>
					<Card className="h-[300px] overflow-hidden border-border/30 bg-muted/50">
						<ReindexTerminal className="h-full" isActive={true} showProgress={true} />
					</Card>
				</div>
			)}
		</div>
	);
}
