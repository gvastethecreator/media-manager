import { EraserIcon, Grid3X3, List, RefreshCw, Search, Settings, SlidersHorizontal } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { FoldersGrid } from './components/folders-grid';
import { FoldersTable } from './components/folders-table';
import { MemoizedErrorWrapper } from './components/ui-primitives';
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
	const [searchTerm, setSearchTerm] = useState('');

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
	} = useReindexConfig();

	// Hook para estadísticas generales de carpetas (memoizado para evitar re-renders)
	const memoizedStatsQuery = useFolderStats();
	const { data: generalStats, isLoading: isStatsLoading, error: statsError } = memoizedStatsQuery;

	const {
		folders,
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

	// Memoizar ordenación/derivaciones para evitar trabajo repetido
	const orderedFolders = useMemo(() => {
		const base = createHierarchicalOrder(folders);
		// Si hay reindexado global, aplicar orden dinámico
		if (isGloballyProcessing && reindexOrder && reindexOrder.length > 0) {
			return applyReindexOrder(base, reindexOrder);
		}
		// Filtrado simple por búsqueda si no hay reindex global
		if (!isGloballyProcessing && searchTerm) {
			const lower = searchTerm.toLowerCase();
			return base.filter(f => f.name.toLowerCase().includes(lower) || f.path.toLowerCase().includes(lower));
		}
		return base;
	}, [folders, isGloballyProcessing, reindexOrder, searchTerm]);

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
		<div className="h-full flex flex-col lg:flex-row bg-background" data-testid="folders-settings">
			{/* Left Panel: Folder Management */}
			<div className="flex-1 flex flex-col min-w-0 border-r border-border/40">
				<div className="p-6 pb-2 space-y-4">
					{/* Header */}
					<div className="flex items-center justify-between">
						<h2 className="text-xl font-bold tracking-tight">Folder Management</h2>
						{/* View Toggles & Actions */}
						<div className="flex items-center gap-2">
							<ToggleGroup
								className="border border-border/30 bg-background/50 p-0.5 rounded-md"
								onValueChange={(value) => value && setViewMode(value as 'table' | 'grid')}
								size="sm"
								type="single"
								value={viewMode}
							>
								<ToggleGroupItem
									className="h-7 w-7 p-0 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
									value="table"
								>
									<List className="h-4 w-4" />
								</ToggleGroupItem>
								<ToggleGroupItem
									className="h-7 w-7 p-0 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
									value="grid"
								>
									<Grid3X3 className="h-4 w-4" />
								</ToggleGroupItem>
							</ToggleGroup>

							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button className="h-8 w-8 p-0" variant="ghost">
										<SlidersHorizontal className="h-4 w-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="w-56">
									<DropdownMenuLabel>Maintenance</DropdownMenuLabel>
									<DropdownMenuItem onClick={handleClearCache}>
										<EraserIcon className="mr-2 h-4 w-4" />
										Clear Cache
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem onClick={() => setShowAdvancedConfig(true)}>
										<Settings className="mr-2 h-4 w-4" />
										Re-index Config
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</div>

					{/* Search Bar */}
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search folders..."
							className="pl-9 bg-muted/30 border-border/50"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>
				</div>

				{/* Content Area */}
				<div className="flex-1 min-h-0 relative">
					<ScrollArea className="h-full">
						<div className="p-6 pt-2">
							{isGloballyProcessing ? (
								<ReindexTerminal isActive={true} />
							) : viewMode === 'table' ? (
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
							) : (
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
							)}
						</div>
					</ScrollArea>
				</div>
			</div>

			{/* Right Panel: Config & Stats */}
			<div className="w-full lg:w-[400px] flex flex-col bg-muted/10">
				<ScrollArea className="h-full">
					<div className="p-6 space-y-6">
						<h2 className="text-xl font-bold tracking-tight">Configuration & Statistics</h2>

						{/* Config Section */}
						<div className="space-y-4">
							<FolderForm isLoading={isLoading} isProcessing={isProcessing} onAddFolder={handleAddFolder} />

							<Button
								className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-10 shadow-sm"
								data-testid="reindex-all-button"
								disabled={globalReindexStatus.isProcessing || folders.length === 0}
								onClick={handleReindexAll}
								size="default"
							>
								<RefreshCw
									className={cn(
										'mr-2 h-4 w-4 transition-transform',
										(isLoading || globalReindexStatus.isProcessing) && 'animate-spin'
									)}
								/>
								{globalReindexStatus.isProcessing
									? `Re-indexing (${Math.round(globalReindexStatus.progress)}%)`
									: 'Re-index All'}
							</Button>
						</div>

						{/* Stats Section */}
						<div data-testid="folders-stats">
							{isStatsLoading ? (
								<div className="text-sm text-muted-foreground p-4 text-center">Loading stats...</div>
							) : generalStats ? (
								<FoldersStats stats={generalStats} />
							) : (
								<div className="text-sm text-muted-foreground p-4 text-center">No stats available</div>
							)}
						</div>

						{/* Modals outside the flow */}
						{showAdvancedConfig && (
							<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
								<div className="bg-background rounded-lg shadow-xl max-w-md w-full p-4 relative">
									<Button
										variant="ghost"
										size="icon"
										className="absolute right-2 top-2"
										onClick={() => setShowAdvancedConfig(false)}
									>
										<EraserIcon className="h-4 w-4 rotate-45" /> {/* Close icon workaround */}
									</Button>
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
							</div>
						)}
					</div>
				</ScrollArea>
			</div>
		</div>
	);
});

// Exportar con nombre para compatibilidad
export { FoldersSettings };
