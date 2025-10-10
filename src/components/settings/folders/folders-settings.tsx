import { EraserIcon, FolderIcon, Grid3X3, Info, List, RefreshCw, Settings, SlidersHorizontal } from 'lucide-react';
import { memo, useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { FoldersGrid } from './components/folders-grid';
import { FoldersTable } from './components/folders-table';
import { GlobalReindexProgress } from './components/global-reindex-progress';
import { GlobalTooltipProvider, MemoizedErrorWrapper } from './components/ui-primitives';
import { FolderForm } from './folders-form';
import { StructuredReindexConfig } from './folders-reindex-config';
import { FoldersStats } from './folders-stats';
import { useFolderStats } from './hooks/use-folder-stats';
import { useFolders } from './hooks/use-folders';
import { useReindexConfig } from './hooks/use-reindex-config';
import { ReindexTerminal } from './reindex-terminal';
import { applyReindexOrder, createHierarchicalOrder } from './utils/hierarchical-order';

/**
 * Componente principal para la gestión de carpetas
 * Orquesta la UI de configuración, tabla/grid y estadísticas
 */
const FoldersSettings = memo(function FoldersSettings() {
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

	// Hook para configuración avanzada de reindexado
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
		toggleAdvanced,
	} = useReindexConfig();

	// Hook para estadísticas generales de carpetas (memoizado para evitar re-renders)
	const memoizedStatsQuery = useFolderStats();
	const { data: generalStats, isLoading: isStatsLoading, error: statsError } = memoizedStatsQuery;

	const {
		folders,
		stats,
		error,
		isLoading,
		isProcessing,
		isGloballyProcessing,
		processStatus,
		selectedFolder,
		globalReindexStatus,
		progressByFolder,
		reindexOrder,
		handleAddFolder,
		handleReindexFolder,
		handleFolderClick,
		reindexAll,
		handleClearCache,
		loadStats,
		setError,
	} = useFolders();

	// Función de reindexado que usa la configuración avanzada
	const handleReindexAll = useCallback(() => {
		reindexAll(getConfig());
	}, [reindexAll, getConfig]);

	// Función de reindexado individual que usa la configuración avanzada
	const handleReindexFolderAdvanced = useCallback(
		(folderId: string) => {
			handleReindexFolder(folderId, getConfig());
		},
		[handleReindexFolder, getConfig]
	);

	// Derivar nombre de carpeta actual cuando hay reindex global (optimizado)
	const currentFolderName = useMemo(() => {
		if (!globalReindexStatus.currentFolder) return null;
		const f = folders.find((x) => x.id === globalReindexStatus.currentFolder);
		return f?.name ?? null;
	}, [globalReindexStatus.currentFolder, folders]);

	// Memoizar ordenación/derivaciones para evitar trabajo repetido
	const orderedFolders = useMemo(() => {
		const base = createHierarchicalOrder(folders);
		// Si hay reindexado global, aplicar orden dinámico
		if (isGloballyProcessing && reindexOrder && reindexOrder.length > 0) {
			return applyReindexOrder(base, reindexOrder);
		}
		return base;
	}, [folders, isGloballyProcessing, reindexOrder]);

	// Combinar errores
	const displayError = errorMessage || error || statsError?.message;

	if (displayError) {
		return (
			<MemoizedErrorWrapper
				displayError={displayError}
				loadStats={loadStats}
				setError={setError}
				setErrorMessage={setErrorMessage}
			/>
		);
	}

	return (
		<div className="h-fit" data-testid="folders-settings">
			{/* Layout en 2 columnas mejorado */}
			<div className="flex">
				{/* Columna izquierda: Tabla de carpetas */}
				<div className="flex h-full w-full flex-col">
					{/* Header de la tabla mejorado */}

					<div className="flex items-center justify-between p-4">
						<div className="flex items-center gap-3">
							<div className="flex h-9 w-9 items-center justify-center bg-primary/5">
								<FolderIcon className="h-5 w-5 text-primary" />
							</div>
							<div>
								<h2 className="font-semibold text-lg leading-none">Gestión de Carpetas</h2>
								<p className="mt-1 text-muted-foreground text-sm">{folders?.length || 0} carpetas configuradas</p>
							</div>
						</div>
						{/* Progress bar para reindexado global */}
						{globalReindexStatus.isProcessing && (
							<div className="w-[200px] p-1">
								<GlobalReindexProgress
									progress={globalReindexStatus.progress}
									show={globalReindexStatus.isProcessing}
								/>
							</div>
						)}
						{/* Selector de vista mejorado */}
						<div className="flex items-center gap-3">
							{(isGloballyProcessing || isProcessing) && (
								<div className="flex items-center gap-2 bg-primary/5 px-3 py-2 text-primary">
									<RefreshCw className="h-4 w-4 animate-spin motion-reduce:animate-none" />
									<span className="font-medium text-sm">
										{processStatus?.message || (isGloballyProcessing ? 'Reindexando...' : 'Procesando...')}
									</span>
								</div>
							)}
							<ToggleGroup
								className="border border-border/30 bg-background p-1"
								onValueChange={(value) => value && setViewMode(value as 'table' | 'grid')}
								size="sm"
								type="single"
								value={viewMode}
							>
								<ToggleGroupItem
									className="h-8 w-8 p-0 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
									value="table"
								>
									<List className="h-4 w-4" />
								</ToggleGroupItem>
								<ToggleGroupItem
									className="h-8 w-8 p-0 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
									value="grid"
								>
									<Grid3X3 className="h-4 w-4" />
								</ToggleGroupItem>
							</ToggleGroup>
						</div>
					</div>

					{/* Contenido principal de la columna izquierda */}
					<div className="flex w-full p-4">
						{isGloballyProcessing ? (
							<ReindexTerminal isActive={true} />
						) : viewMode === 'table' ? (
							<ScrollArea className="h-full">
								<div className="p-4">
									<FoldersTable
										folders={folders}
										globalCurrentFolderId={globalReindexStatus.currentFolder}
										isGloballyProcessing={isGloballyProcessing}
										isProcessing={isProcessing}
										onFolderClick={handleFolderClick}
										onReindex={handleReindexFolderAdvanced}
										orderedFolders={orderedFolders}
										processStatus={processStatus}
										progressByFolder={progressByFolder}
										selectedFolder={selectedFolder}
									/>
								</div>
							</ScrollArea>
						) : (
							<ScrollArea className="h-full">
								<div className="p-4">
									<FoldersGrid
										globalCurrentFolderId={globalReindexStatus.currentFolder}
										isGloballyProcessing={isGloballyProcessing}
										isProcessing={isProcessing}
										onFolderClick={handleFolderClick}
										orderedFolders={orderedFolders}
										processStatus={processStatus}
										progressByFolder={progressByFolder}
										selectedFolder={selectedFolder}
									/>
								</div>
							</ScrollArea>
						)}
					</div>
				</div>

				{/* Columna derecha: Configuración, input y stats mejorada */}
				<div className="flex h-full max-w-1/3 flex-col pr-4">
					{/* Formulario para agregar carpetas mejorado */}
					<div className="h-full py-4">
						<div data-testid="folder-form-section">
							<div className="mb-1 flex items-center gap-3">
								<div className="flex h-8 w-8 items-center justify-center bg-primary/5">
									<Settings className="h-4 w-4 text-primary" />
								</div>
								<div className="flex-1">
									<h3 className="font-semibold leading-none">Configuración</h3>
									<p className="mt-1 text-muted-foreground text-sm">Administra carpetas y opciones</p>
								</div>
								<GlobalTooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<Info className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-foreground" />
										</TooltipTrigger>
										<TooltipContent className="max-w-xs text-sm" side="left">
											Administra las carpetas donde se almacenan tus imágenes. Agrega nuevas carpetas y mantén
											actualizado tu índice.
										</TooltipContent>
									</Tooltip>
								</GlobalTooltipProvider>
							</div>
						</div>

						<div className="p-4">
							<div className="space-y-2">
								{/* Formulario para agregar carpetas */}
								<FolderForm isLoading={isLoading} isProcessing={isProcessing} onAddFolder={handleAddFolder} />

								{/* Botones de acción mejorados */}
								<div className="flex gap-2">
									<Button
										className="flex-1 font-medium text-sm transition-all hover:shadow-sm"
										data-testid="reindex-all-button"
										disabled={globalReindexStatus.isProcessing}
										onClick={handleReindexAll}
										size="sm"
										type="button"
										variant="outline"
									>
										<RefreshCw
											className={cn(
												'mr-2 h-4 w-4 transition-transform',
												(isLoading || globalReindexStatus.isProcessing) && 'animate-spin'
											)}
										/>
										{globalReindexStatus.isProcessing
											? `${Math.round(globalReindexStatus.progress)}%`
											: 'Reindexar todo'}
									</Button>

									{/* Menú de acciones mejorado */}
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button className="h-9 w-9 p-0" size="sm" variant="outline">
												<SlidersHorizontal className="h-4 w-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end" className="w-64">
											<DropdownMenuLabel className="font-medium text-sm">Reindexado</DropdownMenuLabel>
											<DropdownMenuItem
												className="cursor-pointer"
												disabled={!selectedFolder}
												onClick={() => selectedFolder && handleReindexFolderAdvanced(selectedFolder)}
											>
												<RefreshCw className="mr-2 h-4 w-4" />
												Reindexar carpeta seleccionada
											</DropdownMenuItem>

											<DropdownMenuSeparator />
											<DropdownMenuLabel className="font-medium text-sm">Configuración</DropdownMenuLabel>
											<DropdownMenuItem className="cursor-pointer" onClick={() => setShowAdvancedConfig(true)}>
												<Settings className="mr-2 h-4 w-4" />
												Configurar reindexado…
											</DropdownMenuItem>

											<DropdownMenuSeparator />
											<DropdownMenuLabel className="font-medium text-sm">Mantenimiento</DropdownMenuLabel>
											<DropdownMenuItem
												className="cursor-pointer"
												disabled={isLoading || isProcessing}
												onClick={handleClearCache}
											>
												<EraserIcon className="mr-2 h-4 w-4" />
												Limpiar caché
											</DropdownMenuItem>
											<DropdownMenuItem className="cursor-pointer" onClick={loadStats}>
												<RefreshCw className="mr-2 h-4 w-4" />
												Actualizar estadísticas
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							</div>
						</div>

						{/* Configuración avanzada de reindexado mejorada */}
						{showAdvancedConfig && (
							<>
								<Separator />
								<div className="p-2">
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
							</>
						)}
					</div>

					{/* Estadísticas generales mejoradas */}
					<div data-testid="folders-stats">
						{isStatsLoading ? (
							<div className="rounded-sm border-none bg-muted/30 p-4 text-muted-foreground text-sm">
								Cargando estadísticas…
							</div>
						) : generalStats ? (
							<FoldersStats stats={generalStats} />
						) : (
							<div className="rounded-sm border-none bg-muted/30 p-4 text-muted-foreground text-sm">
								Sin estadísticas disponibles
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
});

// Exportar con nombre para compatibilidad
export { FoldersSettings };
