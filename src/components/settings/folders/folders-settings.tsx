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
		<div className="h-full w-full bg-background" data-testid="folders-settings">
			<div className="h-full w-full grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
				{/* Left Column: Folder Management */}
				<div className="flex flex-col gap-4 min-w-0">
					{/* Header */}
					<div className="flex items-center justify-between">
						<h2 className="text-2xl font-bold tracking-tight text-foreground">Folder Management</h2>

						{/* View Toggles & Actions */}
						<div className="flex items-center gap-2">
							<ToggleGroup
								className="border border-border bg-muted/30 p-0.5 rounded-lg"
								onValueChange={(value) => value && setViewMode(value as 'table' | 'grid')}
								size="sm"
								type="single"
								value={viewMode}
							>
								<ToggleGroupItem
									className="h-8 w-8 p-0 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground transition-colors"
									value="table"
								>
									<List className="h-4 w-4" />
								</ToggleGroupItem>
								<ToggleGroupItem
									className="h-8 w-8 p-0 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground transition-colors"
									value="grid"
								>
									<Grid3X3 className="h-4 w-4" />
								</ToggleGroupItem>
							</ToggleGroup>

							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										className="h-8 w-8 p-0 hover:bg-muted/80 transition-colors"
										variant="ghost"
									>
										<SlidersHorizontal className="h-4 w-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="w-56 bg-popover border-border">
									<DropdownMenuLabel className="text-popover-foreground">Maintenance</DropdownMenuLabel>
									<DropdownMenuItem
										onClick={handleClearCache}
										className="hover:bg-accent hover:text-accent-foreground transition-colors"
									>
										<EraserIcon className="mr-2 h-4 w-4" />
										Clear Cache
									</DropdownMenuItem>
									<DropdownMenuSeparator className="bg-border" />
									<DropdownMenuItem
										onClick={() => setShowAdvancedConfig(true)}
										className="hover:bg-accent hover:text-accent-foreground transition-colors"
									>
										<Settings className="mr-2 h-4 w-4" />
										Re-index Config
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</div>

					{/* Config Section */}
					<div className="rounded-lg border border-border/40 bg-card/30 p-4 shadow-sm space-y-3">
						<FolderForm isLoading={isLoading} isProcessing={isProcessing} onAddFolder={handleAddFolder} />

						<Button
							className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-10 shadow-sm transition-colors"
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

					{/* Search Bar */}
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search folders..."
							className="pl-9 bg-muted/20 border-border/60 focus-visible:ring-primary/30 focus-visible:border-primary/50 transition-colors"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>

					{/* Content Area */}
					<div className="flex-1 min-h-0 rounded-lg border border-border/40 bg-card/30 shadow-sm">
						<ScrollArea className="h-full">
							<div className="p-4">
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

				{/* Right Column: Statistics Only */}
				<div className="flex flex-col gap-4 min-w-0">
					<h2 className="text-2xl font-bold tracking-tight text-foreground">Statistics</h2>

					<div className="flex-1 min-h-0 rounded-lg border border-border/40 bg-card/30 p-5 shadow-sm">
						<ScrollArea className="h-full">
							<div className="space-y-4" data-testid="folders-stats">
								{isStatsLoading ? (
									<div className="text-sm text-muted-foreground p-8 text-center">Loading stats...</div>
								) : generalStats ? (
									<FoldersStats stats={generalStats} />
								) : (
									<div className="text-sm text-muted-foreground p-8 text-center">No stats available</div>
								)}
							</div>
						</ScrollArea>
					</div>
				</div>
			</div>

			{/* Modal: Advanced Config */}
			{showAdvancedConfig && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
					<div className="bg-background rounded-lg shadow-2xl max-w-md w-full p-6 relative border border-border">
						<Button
							variant="ghost"
							size="icon"
							className="absolute right-2 top-2 hover:bg-muted transition-colors"
							onClick={() => setShowAdvancedConfig(false)}
						>
							<EraserIcon className="h-4 w-4 rotate-45" />
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
	);
});

// Exportar con nombre para compatiblidad
export { FoldersSettings };
