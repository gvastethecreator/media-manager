import {
	AlertCircle,
	ArrowUpDown,
	AudioLines,
	Calendar,
	EraserIcon,
	Eye,
	FileText,
	Filter,
	Folder,
	FolderIcon,
	Grid3X3,
	Heart,
	Image,
	Info,
	List,
	RefreshCw,
	Settings,
	SlidersHorizontal,
	Star,
	Trash2,
	Video,
} from 'lucide-react';
import { memo, useCallback, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
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
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { FolderCard } from './folder-card';
import { FolderIndexStatusBadge, type IndexStatus } from './folder-card-index-status-badge';
import { getFolderIndexStatus } from './folder-utils';
import { FolderForm } from './folders-form';
import { StructuredReindexConfig } from './folders-reindex-config';
import { FoldersStats } from './folders-stats';
import { useFolderStats } from './hooks/use-folder-stats';
import { useFolders } from './hooks/use-folders';
import { ReindexTerminal } from './reindex-terminal';
import { computeIsReindexing } from './utils/is-reindexing';
import { getStatusMessage } from './utils/status-message';

// OPTIMIZACIÓN: Provider global de tooltips para evitar 3400+ renders
const GlobalTooltipProvider = memo(function GlobalTooltipProvider({ children }: { children: React.ReactNode }) {
	return (
		<TooltipProvider delayDuration={300} skipDelayDuration={100}>
			{children}
		</TooltipProvider>
	);
});

const EmptyFoldersState = memo(function EmptyFoldersState() {
	return (
		<div className="col-span-full py-8 text-center">
			<Folder className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
			<p className="text-muted-foreground text-sm">No hay carpetas indexadas</p>
			<p className="mt-1 text-muted-foreground/75 text-xs">Agrega una carpeta para comenzar a indexar imágenes</p>
		</div>
	);
});

const ErrorCard = memo(function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
	return (
		<div className="rounded-sm border-none bg-muted/30">
			<div className="flex flex-col gap-2 p-3">
				<div className="flex items-center gap-2 text-destructive">
					<AlertCircle className="h-4 w-4" />
					<p className="text-sm">{message}</p>
				</div>
				<Button className="mt-1 w-full text-xs" onClick={onRetry} size="sm" variant="outline">
					Reintentar
				</Button>
			</div>
		</div>
	);
});

// Optimización adicional: memoizar el callback de retry para evitar re-renders del ErrorCard
const MemoizedErrorWrapper = memo(function MemoizedErrorWrapper({
	displayError,
	setErrorMessage,
	setError,
	loadStats,
}: {
	displayError: string;
	setErrorMessage: (msg: string | null) => void;
	setError: (err: string | null) => void;
	loadStats: () => void;
}) {
	const handleRetry = useCallback(() => {
		setErrorMessage(null);
		setError(null);
		loadStats();
	}, [setErrorMessage, setError, loadStats]);

	return <ErrorCard message={displayError} onRetry={handleRetry} />;
});

// Micro card reutilizable para condensar información en celdas
const MicroCell = memo(function MicroCell({
	children,
	className,
	tone = 'default',
}: {
	children: React.ReactNode;
	className?: string;
	// estilos suaves por tono; default para la mayoría
	tone?: 'default' | 'info' | 'success' | 'warning' | 'danger';
}) {
	const toneClasses =
		tone === 'danger'
			? 'border-red-200/40 bg-red-50/60 dark:bg-red-950/20'
			: tone === 'warning'
				? 'border-amber-200/40 bg-amber-50/60 dark:bg-amber-950/20'
				: tone === 'success'
					? 'border-emerald-200/40 bg-emerald-50/60 dark:bg-emerald-950/20'
					: tone === 'info'
						? 'border-blue-200/40 bg-blue-50/60 dark:bg-blue-950/20'
						: 'border-border/40 bg-muted/10';
	return <div className={cn('rounded-sm border px-2.5 py-2', toneClasses, className)}>{children}</div>;
});

// Función pura para crear la ordenación jerárquica con niveles visuales (optimizada fuera del componente)
const createHierarchicalOrderPure = (folderList: any[]) => {
	const result: any[] = [];

	// Comparador: favoritos primero, luego alfabético por nombre
	const byFavoriteThenName = (a: any, b: any) => {
		const favA = a.isFavorite ? 1 : 0;
		const favB = b.isFavorite ? 1 : 0;
		if (favA !== favB) return favB - favA; // favoritos primero
		return (a.name || '').localeCompare(b.name || '');
	};

	// Función recursiva para agregar carpetas con su nivel de anidación
	const addFolderWithChildren = (folder: any, level = 0) => {
		// Agregar carpeta con información de nivel
		result.push({ ...folder, _hierarchyLevel: level, _hasParent: level > 0 });

		// Encontrar y agregar subcarpetas ordenadas recursivamente
		const subfolders = folderList.filter((f) => f.parentId === folder.id).sort(byFavoriteThenName);

		for (const subfolder of subfolders) {
			addFolderWithChildren(subfolder, level + 1);
		}
	};

	// Obtener carpetas padre (sin parentId) y procesarlas recursivamente
	const parentFolders = folderList.filter((folder) => !folder.parentId).sort(byFavoriteThenName);

	for (const parent of parentFolders) {
		addFolderWithChildren(parent);
	}

	// Agregar carpetas huérfanas (que tienen parentId pero el padre no existe)
	const orphanFolders = folderList
		.filter((folder) => folder.parentId && !folderList.some((parent) => parent.id === folder.parentId))
		.sort(byFavoriteThenName);

	for (const orphan of orphanFolders) {
		result.push({ ...orphan, _hierarchyLevel: 0, _hasParent: false, _isOrphan: true });
	}

	return result;
};

const FoldersSettings = memo(function FoldersSettings() {
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

	// Estados para configuración de reindexado estructurado
	const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);
	const [useStructuredFlow, setUseStructuredFlow] = useState(false);
	const [skipThumbnails, setSkipThumbnails] = useState(false);
	const [skipMetadata, setSkipMetadata] = useState(false);

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
		reindexAll({
			useStructuredFlow,
			skipThumbnails,
			skipMetadata,
		});
	}, [reindexAll, useStructuredFlow, skipThumbnails, skipMetadata]);

	// Función de reindexado individual que usa la configuración avanzada
	const handleReindexFolderAdvanced = useCallback(
		(folderId: string) => {
			handleReindexFolder(folderId, {
				useStructuredFlow,
				skipThumbnails,
				skipMetadata,
			});
		},
		[handleReindexFolder, useStructuredFlow, skipThumbnails, skipMetadata]
	);

	// Derivar nombre de carpeta actual cuando hay reindex global (optimizado)
	const currentFolderName = useMemo(() => {
		if (!globalReindexStatus.currentFolder) return null;
		const f = folders.find((x) => x.id === globalReindexStatus.currentFolder);
		return f?.name ?? null;
	}, [globalReindexStatus.currentFolder, folders]);

	// Memoizar ordenación/derivaciones para evitar trabajo repetido
	const orderedFolders = useMemo(() => {
		const base = createHierarchicalOrderPure(folders);
		// Si hay reindexado global, priorizar orden dinámico observado
		if (isGloballyProcessing && reindexOrder && reindexOrder.length > 0) {
			const orderMap = new Map(reindexOrder.map((id, idx) => [id, idx] as const));
			return [...base].sort((a, b) => {
				const ai = orderMap.has(a.id) ? (orderMap.get(a.id) as number) : Number.MAX_SAFE_INTEGER;
				const bi = orderMap.has(b.id) ? (orderMap.get(b.id) as number) : Number.MAX_SAFE_INTEGER;
				if (ai !== bi) {
					return ai - bi;
				}
				// Si no están en el orden, mantener alfabético por nombre
				return a.name.localeCompare(b.name);
			});
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

function FoldersTable({
	orderedFolders,
	folders,
	selectedFolder,
	progressByFolder,
	processStatus,
	isProcessing,
	isGloballyProcessing,
	globalCurrentFolderId,
	onFolderClick,
	onReindex,
}: {
	orderedFolders: any[];
	folders: any[];
	selectedFolder: string | null;
	progressByFolder: Record<string, any>;
	processStatus: any;
	isProcessing: boolean;
	isGloballyProcessing: boolean;
	globalCurrentFolderId: string | null | undefined;
	onFolderClick: (id: string) => void;
	onReindex: (id: string) => void;
}) {
	// Estados para herramientas de tabla
	const [sortBy, setSortBy] = useState<'name' | 'lastIndexed' | 'images' | 'videos'>('name');
	const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
	const [filterText, setFilterText] = useState('');
	const [filterStatus, setFilterStatus] = useState<'all' | 'indexed' | 'never' | 'favorite'>('all');

	const getParentName = useCallback(
		(folder: any) => {
			if (!folder?.parentId) return null;
			const parent = folders.find((f: any) => f.id === folder.parentId);
			return parent?.name ?? null;
		},
		[folders]
	);

	// Función para obtener el valor de ordenación
	const getSortValue = useCallback((folder: any, field: string) => {
		switch (field) {
			case 'name':
				return folder.name?.toLowerCase() || '';
			case 'lastIndexed':
				return folder.lastIndexed ? new Date(folder.lastIndexed).getTime() : 0;
			case 'images':
				return folder.totalImages ?? folder.imageCount ?? 0;
			case 'videos':
				return folder.totalVideos ?? folder.videoCount ?? 0;
			default:
				return '';
		}
	}, []);

	// Función para manejar ordenación
	const handleSort = useCallback(
		(field: 'name' | 'lastIndexed' | 'images' | 'videos') => {
			if (sortBy === field) {
				setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
			} else {
				setSortBy(field);
				setSortDirection('asc');
			}
		},
		[sortBy]
	);

	// Filtrado y ordenación de filas
	const rows = useMemo(() => {
		const filtered = orderedFolders.filter((folder) => {
			// Filtro por texto
			if (filterText) {
				const searchText = filterText.toLowerCase();
				const matchesName = folder.name?.toLowerCase().includes(searchText);
				const parentName = getParentName(folder)?.toLowerCase();
				const matchesParent = parentName?.includes(searchText);
				if (!(matchesName || matchesParent)) {
					return false;
				}
			}

			// Filtro por estado
			switch (filterStatus) {
				case 'indexed':
					return folder.lastIndexed;
				case 'never':
					return !folder.lastIndexed;
				case 'favorite':
					return folder.isFavorite;
				default:
					return true;
			}
		});

		// Ordenación
		filtered.sort((a, b) => {
			const aVal = getSortValue(a, sortBy);
			const bVal = getSortValue(b, sortBy);

			let comparison = 0;
			if (typeof aVal === 'string' && typeof bVal === 'string') {
				comparison = aVal.localeCompare(bVal);
			} else if (typeof aVal === 'number' && typeof bVal === 'number') {
				comparison = aVal - bVal;
			}

			return sortDirection === 'desc' ? -comparison : comparison;
		});

		return filtered;
	}, [orderedFolders, filterText, filterStatus, sortBy, sortDirection, getSortValue, getParentName]);

	// Función para obtener color de estado (ampliada)
	const getStatusColor = (status: string) => {
		switch (status) {
			case 'indexed':
				return 'text-emerald-600';
			case 'never':
				return 'text-orange-600';
			case 'processing':
				return 'text-blue-600';
			case 'pending':
				return 'text-blue-600';
			case 'outdated':
				return 'text-amber-600';
			case 'not_found':
			case 'error':
				return 'text-red-600';
			default:
				return 'text-muted-foreground';
		}
	};

	// Mapa de estado a tono visual de MicroCell
	const getStatusTone = (status: string): 'default' | 'info' | 'success' | 'warning' | 'danger' => {
		switch (status) {
			case 'indexed':
				return 'success';
			case 'processing':
			case 'pending':
				return 'info';
			case 'outdated':
				return 'warning';
			case 'error':
			case 'not_found':
				return 'danger';
			default:
				return 'default';
		}
	};

	// Función para formatear fecha
	const formatDate = (date: string | Date | null) => {
		if (!date) return '—';
		const d = new Date(date);
		return d.toLocaleDateString('es-ES', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	return (
		<div className="p-2">
			{/* Herramientas de tabla mejoradas */}
			<div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex flex-1 items-center gap-3">
					<Input
						className="max-w-sm border-border/40 focus:border-primary"
						onChange={(e) => setFilterText(e.target.value)}
						placeholder="Buscar carpetas..."
						value={filterText}
					/>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button size="sm" variant="outline">
								<Filter className="mr-2 h-4 w-4" />
								{filterStatus === 'all'
									? 'Todos'
									: filterStatus === 'indexed'
										? 'Indexadas'
										: filterStatus === 'never'
											? 'Sin indexar'
											: 'Favoritas'}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start">
							<DropdownMenuItem onClick={() => setFilterStatus('all')}>
								<Eye className="mr-2 h-4 w-4" />
								Mostrar todas
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => setFilterStatus('indexed')}>
								<Folder className="mr-2 h-4 w-4 text-emerald-600" />
								Solo indexadas
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => setFilterStatus('never')}>
								<Folder className="mr-2 h-4 w-4 text-orange-600" />
								Sin indexar
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => setFilterStatus('favorite')}>
								<Heart className="mr-2 h-4 w-4 text-red-500" />
								Favoritas
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
				<div className="text-muted-foreground text-sm">
					{rows.length} de {orderedFolders.length} carpetas
				</div>
			</div>

			{/* Tabla mejorada con mejor diseño */}
			<div className="overflow-hidden border border-border/30">
				<Table>
					<TableHeader>
						<TableRow className="border-b bg-muted/20 hover:bg-muted/30">
							<TableHead className="min-w-[300px] font-semibold text-[13px]">
								<Button
									className="h-auto p-0 font-semibold hover:bg-transparent hover:text-primary"
									onClick={() => handleSort('name')}
									size="sm"
									variant="ghost"
								>
									Carpeta
									<ArrowUpDown
										className={cn(
											'ml-2 h-3.5 w-3.5 transition-colors',
											sortBy === 'name' ? 'text-primary' : 'text-muted-foreground'
										)}
									/>
								</Button>
							</TableHead>
							<TableHead className="w-44 font-semibold text-[13px]">
								<Button
									className="h-auto p-0 font-semibold hover:bg-transparent hover:text-primary"
									onClick={() => handleSort('lastIndexed')}
									size="sm"
									variant="ghost"
								>
									<Calendar className="mr-1.5 h-3.5 w-3.5" />
									Estado
									<ArrowUpDown
										className={cn(
											'ml-2 h-3.5 w-3.5 transition-colors',
											sortBy === 'lastIndexed' ? 'text-primary' : 'text-muted-foreground'
										)}
									/>
								</Button>
							</TableHead>
							<TableHead className="w-28 text-center font-semibold text-[13px]">
								<Button
									className="h-auto p-0 font-semibold hover:bg-transparent hover:text-primary"
									onClick={() => handleSort('images')}
									size="sm"
									variant="ghost"
								>
									<Image className="mr-1 h-3.5 w-3.5" />
									Medios
									<ArrowUpDown
										className={cn(
											'ml-1.5 h-3.5 w-3.5 transition-colors',
											sortBy === 'images' ? 'text-primary' : 'text-muted-foreground'
										)}
									/>
								</Button>
							</TableHead>
							<TableHead className="w-32 text-right font-semibold text-[13px]">Acciones</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{rows.length === 0 ? (
							<TableRow>
								<TableCell className="py-12 text-center text-muted-foreground" colSpan={4}>
									{filterText || filterStatus !== 'all' ? (
										<div className="space-y-4">
											<Folder className="mx-auto h-12 w-12 text-muted-foreground/30" />
											<div className="space-y-2">
												<p className="font-medium">No se encontraron carpetas</p>
												<p className="text-sm">No hay carpetas que coincidan con los filtros aplicados</p>
											</div>
											<Button
												className="mt-4"
												onClick={() => {
													setFilterText('');
													setFilterStatus('all');
												}}
												variant="outline"
											>
												Limpiar filtros
											</Button>
										</div>
									) : (
										<EmptyFoldersState />
									)}
								</TableCell>
							</TableRow>
						) : (
							rows.map((folder: any) => {
								const parentName = getParentName(folder);
								const status = getFolderIndexStatus(folder);
								const isSelected = selectedFolder === folder.id;
								const rowProgress =
									(progressByFolder[folder.id]?.progress as number | undefined) ??
									(processStatus?.folderId === folder.id ? processStatus?.progress : undefined);
								const disabled = isGloballyProcessing
									? globalCurrentFolderId !== folder.id
									: Boolean(progressByFolder[folder.id]?.isProcessing) || isProcessing;
								const hasError = Boolean(folder.error);

								return (
									<TableRow
										className={cn(
											'transition-all hover:bg-muted/40',
											isSelected && 'border-l-2 border-l-primary bg-primary/5',
											hasError && 'border-l-2 border-l-destructive bg-destructive/5'
										)}
										data-state={isSelected ? 'selected' : undefined}
										key={folder.id}
									>
										<TableCell className="max-w-[420px] py-2.5">
											<MicroCell className="bg-background">
												<div className="flex items-center gap-2.5 text-[13px]">
													{/* Indentación visual para mostrar jerarquía */}
													{folder._hierarchyLevel > 0 && (
														<div
															className="flex items-center"
															style={{ marginLeft: `${folder._hierarchyLevel * 16}px` }}
														>
															{/* Línea vertical conectora */}
															<div className="mr-2 h-3.5 w-px bg-border" />
															{/* Línea horizontal conectora */}
															<div className="mr-2 h-px w-2.5 bg-border" />
														</div>
													)}
													<div className="relative">
														{folder.emoji ? (
															<div className="flex h-8 w-8 items-center justify-center bg-primary/5 text-xs">
																{folder.emoji}
															</div>
														) : (
															<div className="flex h-8 w-8 items-center justify-center bg-primary/5">
																<FolderIcon
																	className={cn(
																		'h-4 w-4 text-primary',
																		folder._hierarchyLevel > 0 && 'text-primary/70'
																	)}
																/>
															</div>
														)}
														{hasError && <AlertCircle className="-right-1 -top-1 absolute h-3 w-3 text-destructive" />}
													</div>
													<div className="min-w-0 flex-1">
														<div className="flex items-center gap-2">
															<span
																className={cn(
																	'truncate font-medium text-[13px]',
																	folder._hierarchyLevel > 0 && 'text-[12px] text-muted-foreground'
																)}
															>
																{folder.name}
															</span>
															{folder.isFavorite && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
															{folder._isOrphan && (
																<Badge className="text-[11px]" variant="destructive">
																	Huérfana
																</Badge>
															)}
														</div>
														{parentName && (
															<div className="truncate text-[12px] text-muted-foreground">
																{parentName} / {folder.name}
															</div>
														)}
													</div>
												</div>
											</MicroCell>
										</TableCell>
										<TableCell className="py-2.5">
											{(() => {
												const indexStatus = status as IndexStatus;
												const isReindexing = computeIsReindexing({
													folderId: folder.id,
													processStatus,
													isGloballyProcessing,
													globalCurrentFolderId,
													isProcessingFlag: Boolean(progressByFolder[folder.id]?.isProcessing) || isProcessing,
												});
												const statusMsg = getStatusMessage(isReindexing, false, isProcessing);
												return (
													<MicroCell tone={getStatusTone(indexStatus)}>
														<div className="flex items-center gap-2">
															<FolderIndexStatusBadge lastIndexed={folder.lastIndexed} status={indexStatus} />
															{statusMsg && <span className="text-[11px] text-muted-foreground">{statusMsg}</span>}
															<Tooltip>
																<TooltipTrigger asChild>
																	<span className="cursor-help text-[11px] text-muted-foreground">
																		{formatDate(folder.lastIndexed)}
																	</span>
																</TooltipTrigger>
																<TooltipContent>
																	{folder.lastIndexed
																		? `Indexado el ${formatDate(folder.lastIndexed)}`
																		: 'Nunca indexado'}
																</TooltipContent>
															</Tooltip>
														</div>
													</MicroCell>
												);
											})()}
										</TableCell>
										<TableCell className="py-2.5 text-center text-[13px]">
											<MicroCell className="inline-flex">
												<div className="flex items-center justify-center gap-3">
													<div className="flex items-center gap-1.5">
														<Image className="h-3.5 w-3.5 text-muted-foreground" />
														<span className="font-medium text-[12px]">
															{folder.totalImages ?? folder.imageCount ?? 0}
														</span>
													</div>
													<div className="flex items-center gap-1.5">
														<Video className="h-3.5 w-3.5 text-muted-foreground" />
														<span className="font-medium text-[12px]">
															{folder.totalVideos ?? folder.videoCount ?? 0}
														</span>
													</div>
													<div className="flex items-center gap-1.5">
														<AudioLines className="h-3.5 w-3.5 text-muted-foreground" />
														<span className="font-medium text-[12px]">
															{folder.totalAudio ?? folder.audioCount ?? 0}
														</span>
													</div>
													<div className="flex items-center gap-1.5">
														<FileText className="h-3.5 w-3.5 text-muted-foreground" />
														<span className="font-medium text-[12px]">
															{folder.totalDocuments ?? folder.documentCount ?? 0}
														</span>
													</div>
												</div>
											</MicroCell>
										</TableCell>
										<TableCell className="py-2.5 text-right">
											<MicroCell className="inline-flex">
												<div className="flex justify-end gap-1.5">
													<Tooltip>
														<TooltipTrigger asChild>
															<Button
																className="h-7 w-7 p-0 shadow-sm transition-all hover:shadow-md"
																disabled={disabled}
																onClick={() => onReindex(folder.id)}
																size="sm"
																variant="outline"
															>
																<RefreshCw className={cn('h-3 w-3', disabled && 'opacity-50')} />
															</Button>
														</TooltipTrigger>
														<TooltipContent>Reindexar carpeta</TooltipContent>
													</Tooltip>
													<Tooltip>
														<TooltipTrigger asChild>
															<Button
																className="h-7 w-7 p-0 shadow-sm transition-all hover:shadow-md"
																onClick={() => onFolderClick(folder.id)}
																size="sm"
																variant={isSelected ? 'destructive' : 'outline'}
															>
																<Trash2 className="h-3 w-3" />
															</Button>
														</TooltipTrigger>
														<TooltipContent>{isSelected ? 'Confirmar eliminación' : 'Eliminar carpeta'}</TooltipContent>
													</Tooltip>
												</div>
											</MicroCell>
										</TableCell>
									</TableRow>
								);
							})
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}

const FoldersGrid = memo(function FoldersGrid({
	orderedFolders,
	folders,
	progressByFolder,
	isGloballyProcessing,
	globalCurrentFolderId,
	processStatus,
	onFolderClick,
	onReindex,
	selectedFolder,
	isProcessing,
}: {
	orderedFolders: any[];
	folders: any[];
	progressByFolder: Record<string, any>;
	isGloballyProcessing: boolean;
	globalCurrentFolderId: string | null | undefined;
	processStatus: any;
	onFolderClick: (id: string) => void;
	onReindex: (id: string) => void;
	selectedFolder: string | null;
	isProcessing: boolean;
}) {
	// Memoizar la función getFolderIndexStatus para evitar re-renders
	const memoizedGetFolderIndexStatus = useCallback(getFolderIndexStatus, []);

	// OPTIMIZACIÓN: Durante reindexado global, mostrar solo la carpeta actual
	const displayFolders = useMemo(() => {
		if (isGloballyProcessing && globalCurrentFolderId) {
			// Solo mostrar la carpeta que se está reindexando actualmente
			const currentFolder = orderedFolders.find((folder) => folder.id === globalCurrentFolderId);
			return currentFolder ? [currentFolder] : [];
		}
		// En modo normal, mostrar todas las carpetas
		return orderedFolders;
	}, [isGloballyProcessing, globalCurrentFolderId, orderedFolders]);

	// OPTIMIZACIÓN: Grid adaptativo según el modo (layout en filas para desktop)
	const gridClassName = useMemo(() => {
		if (isGloballyProcessing && globalCurrentFolderId) {
			// Modo reindexado: una sola carpeta más grande y centrada
			return cn('grid place-items-center content-center', 'mx-auto max-w-2xl grid-cols-1', 'auto-rows-fr gap-6');
		}
		// Modo normal: filas optimizadas para desktop
		return cn(
			'mx-auto w-full max-w-[1600px]',
			'grid content-start items-stretch',
			// 1 columna en móviles, 2 en md, 3 en xl y 4 en 2xl
			'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4',
			'auto-rows-fr gap-1'
		);
	}, [isGloballyProcessing, globalCurrentFolderId]);

	return (
		<div className={gridClassName} data-density={isGloballyProcessing ? 'focused' : 'compact'}>
			{displayFolders.map((folder) => (
				<FolderCard
					allFolders={folders}
					folder={folder}
					getFolderIndexStatus={memoizedGetFolderIndexStatus}
					globalCurrentFolderId={globalCurrentFolderId}
					isGloballyProcessing={isGloballyProcessing}
					isProcessing={
						isGloballyProcessing
							? globalCurrentFolderId === folder.id || Boolean(progressByFolder[folder.id]?.isProcessing)
							: isProcessing || Boolean(progressByFolder[folder.id]?.isProcessing)
					}
					key={folder.id}
					onFolderClick={onFolderClick}
					onReindex={onReindex}
					processStatus={progressByFolder[folder.id] || processStatus}
					selectedFolder={selectedFolder}
				/>
			))}
			{folders.length === 0 && <EmptyFoldersState />}
		</div>
	);
});

const GlobalReindexProgress = memo(function GlobalReindexProgress({
	show,
	progress,
}: {
	show: boolean;
	progress: number;
}) {
	if (!show) {
		return null;
	}
	return (
		<div className="mt-2">
			<Progress className="h-2" data-testid="reindex-global-progress" value={progress} />
			<p className="mt-1 text-center text-muted-foreground text-xs">Reindexando... {Math.round(progress)}%</p>
		</div>
	);
});
