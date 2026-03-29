/**
 * @file Modern Files Settings
 * @module components/settings/modern/files-settings-modern
 * @description Configuración de archivos: carpetas y miniaturas
 */

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import {
	AlertCircle,
	Folder,
	Grid3X3,
	HardDrive,
	Image,
	List,
	Plus,
	RefreshCw, Terminal,
	Search,
	Settings2,
	Trash2,
	Zap,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useReindexStore } from '@/store/reindex.store';

import { SettingsPageHeader, SettingsStatsGrid } from './settings-card';

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
			<Card className="group relative flex flex-col justify-between overflow-hidden p-4 transition-colors hover:bg-muted/50">
				<div className="flex items-start justify-between">
					<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
						<Folder className="h-6 w-6 text-primary" />
					</div>
					<div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
						<Button className="h-8 w-8" onClick={actions.onEdit} size="icon" variant="ghost">
							<Settings2 className="h-4 w-4" />
						</Button>
						<Button className="h-8 w-8" disabled={isReindexing} onClick={onReindex} size="icon" variant="ghost">
							{isReindexing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
						</Button>
						<Button className="h-8 w-8 text-destructive" onClick={actions.onDelete} size="icon" variant="ghost">
							<Trash2 className="h-4 w-4" />
						</Button>
					</div>
				</div>
				<div className="mt-4">
					<CardTitle className="truncate text-base" title={folder.name}>
						{folder.name}
					</CardTitle>
					<p className="truncate text-muted-foreground text-sm" title={folder.path}>
						{folder.path}
					</p>
				</div>
				<div className="mt-4 flex items-center justify-between text-muted-foreground text-sm">
					<span>{folder.stats?.imageCount || 0} imágenes</span>
					<Badge className="text-xs" variant="secondary">
						Activo
					</Badge>
				</div>
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

	const containerRef = useRef<HTMLDivElement>(null);

	// GSAP Animations
	useGSAP(
		() => {
			if (!folders || folders.length === 0) return;

			gsap.fromTo(
				'.folder-card-anim',
				{ opacity: 0, y: 20, scale: 0.95 },
				{ opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.05, ease: 'back.out(1.2)', clearProps: 'all' }
			);
		},
		{ scope: containerRef, dependencies: [viewMode, activeTab, folders?.length, foldersQuery.isLoading] }
	);

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

	const totalFiles = useMemo(
		() =>
			folders.reduce(
				(acc: number, folder: FolderWithStats) => acc + (folder.totalFiles ?? folder.stats?.totalFiles ?? 0),
				0
			),
		[folders]
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
								useReindexStore.getState().setOpen(true);
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
		<div className="space-y-6" ref={containerRef}>
			<SettingsPageHeader
				description="Gestiona carpetas, miniaturas y configuración de almacenamiento"
				title="Archivos y Almacenamiento"
			/>

			

			<Tabs onValueChange={setActiveTab} value={activeTab}>
				<TabsList className="grid w-full grid-cols-2 lg:w-80">
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
					<TabsContent className="m-0 space-y-6" data-testid="folders-settings" value="folders">
						{/* Stats */}
						<SettingsStatsGrid className="2xl:grid-cols-4" data-testid="folders-stats">
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
							<Card
								className="border-l-4"
								style={{ borderLeftColor: 'color-mix(in oklch, var(--entity-video) 60%, transparent)' }}
							>
								<CardContent className="p-4">
									<div className="flex items-center justify-between">
										<div>
											<p className="font-medium text-muted-foreground text-sm">Archivos</p>
											<p className="font-bold text-2xl" data-testid="stats-total-files">
												{totalFiles}
											</p>
										</div>
										<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
											<HardDrive className="h-5 w-5 text-primary" />
										</div>
									</div>
								</CardContent>
							</Card>
						</SettingsStatsGrid>

						<div className="sr-only" data-testid="stats-total-folders">
							{folders.length}
						</div>

						{/* Toolbar */}
						<div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
							<div className="relative w-full max-w-xl xl:max-w-sm">
								<Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
								<input
									className="w-full rounded-lg border bg-background px-4 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
									onChange={(e) => setSearchQuery(e.target.value)}
									placeholder="Buscar carpetas..."
									type="text"
									value={searchQuery}
								/>
							</div>
							<div className="flex flex-wrap items-center gap-2 xl:justify-end">
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

								<Button onClick={() => useReindexStore.getState().setOpen(true)} size="icon" title="Ver Terminal" variant="outline"><Terminal className="h-4 w-4" /></Button>
																<Button className="gap-2" data-testid="reindex-all-button"
									disabled={reindexAllFoldersMutation.isPending}
									onClick={async () => {
										try {
											const config = getConfig();
											useReindexStore.getState().setOpen(true);
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
									viewMode === 'grid'
										? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
										: 'flex flex-col gap-2'
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
						<SettingsStatsGrid className="2xl:grid-cols-3">
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
						</SettingsStatsGrid>

						{/* Quality Settings */}
						<div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
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
											<SelectTrigger className="w-50">
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
						</div>
					</TabsContent>
				</div>
			</Tabs>

			{/* Folder Form Dialog */}
			<Dialog onOpenChange={setShowFolderForm} open={showFolderForm}>
				<DialogContent className="sm:max-w-150">
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
		</div>
	);
}
