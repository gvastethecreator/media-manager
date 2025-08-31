import { AlertCircle, EraserIcon, Folder, FolderIcon, Info, RefreshCw } from 'lucide-react';
import { memo, useMemo, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { FolderCard } from './folder-card';
import { FolderForm } from './folder-form';
import { getFolderIndexStatus } from './folder-utils';
import { FoldersStats } from './folders-stats';
import { useFolderStats } from './hooks/use-folder-stats';
import { useFolders } from './hooks/use-folders';

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

// Optimización: función memoizada para la ordenación jerárquica
const createHierarchicalOrder = (folderList: any[]) => {
	const result: any[] = [];

	// Obtener carpetas padre (sin parentId) y ordenarlas alfabéticamente
	const parentFolders = folderList.filter((folder) => !folder.parentId).sort((a, b) => a.name.localeCompare(b.name));

	// Para cada carpeta padre, agregar la carpeta y sus subcarpetas
	for (const parent of parentFolders) {
		result.push(parent);

		// Encontrar y agregar subcarpetas del padre actual, ordenadas alfabéticamente
		const subfolders = folderList
			.filter((folder) => folder.parentId === parent.id)
			.sort((a, b) => a.name.localeCompare(b.name));

		result.push(...subfolders);
	}

	// Agregar carpetas huérfanas (que tienen parentId pero el padre no existe)
	const orphanFolders = folderList
		.filter((folder) => folder.parentId && !folderList.some((parent) => parent.id === folder.parentId))
		.sort((a, b) => a.name.localeCompare(b.name));

	result.push(...orphanFolders);

	return result;
};

export function FoldersSettings() {
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

	// Derivar nombre de carpeta actual cuando hay reindex global (optimizado)
	const currentFolderName = useMemo(() => {
		if (!globalReindexStatus.currentFolder) return null;
		const f = folders.find((x) => x.id === globalReindexStatus.currentFolder);
		return f?.name ?? null;
	}, [globalReindexStatus.currentFolder, folders]);

	// Memoizar ordenación/derivaciones para evitar trabajo repetido
	const orderedFolders = useMemo(() => {
		const base = createHierarchicalOrder(folders);
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
				setErrorMessage={setErrorMessage}
				setError={setError}
				loadStats={loadStats}
			/>
		);
	}

	return (
		<div className="space-y-1">
			{/* Sección de gestión de carpetas */}
			<div className="border-none bg-muted/30">
				<div className="p-4 pb-2" data-testid="folders-settings">
					<div className="flex items-center justify-between font-medium text-base text-muted-foreground">
						<div className="flex items-center gap-2">
							<FolderIcon className="h-4 w-4 text-primary" />
							<span>Gestión de Carpetas</span>
							{(isGloballyProcessing || isProcessing) && (
								<div className="flex items-center gap-2 text-muted-foreground text-sm" data-testid="reindex-status">
									<RefreshCw className="h-4 w-4 animate-spin text-primary motion-reduce:animate-none" />
									<span className="font-medium">
										{processStatus?.message ||
											(isGloballyProcessing ? 'Reindexando todas las carpetas...' : 'Procesando carpeta...')}
										{isGloballyProcessing && currentFolderName && <span className="ml-1">• {currentFolderName}</span>}
										{processStatus?.progress !== undefined && (
											<span className="ml-1">({Math.round(processStatus.progress)}%)</span>
										)}
									</span>
								</div>
							)}
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<Info className="h-3.5 w-3.5 cursor-pointer text-muted-foreground" />
									</TooltipTrigger>
									<TooltipContent className="max-w-xs text-xs" side="top">
										Administra las carpetas donde se almacenan tus imágenes. Agrega nuevas carpetas y mantén actualizado
										tu índice.
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</div>

						<div className="flex items-center gap-1.5">
							<Button
								className="h-7 cursor-pointer text-xs transition-colors hover:bg-destructive/10 hover:text-destructive"
								disabled={isLoading || isProcessing}
								onClick={handleClearCache}
								size="sm"
								type="button"
								variant="outline"
							>
								<EraserIcon className="mr-1 h-3.5 w-3.5" />
								Limpiar caché
							</Button>

							<Button
								className="h-7 cursor-pointer text-xs transition-colors hover:bg-accent hover:text-accent-foreground"
								data-testid="reindex-all-button"
								disabled={globalReindexStatus.isProcessing}
								onClick={() => reindexAll()}
								size="sm"
								type="button"
								variant="outline"
							>
								<RefreshCw
									className={cn(
										'mr-1 h-3.5 w-3.5 transition-transform',
										(isLoading || globalReindexStatus.isProcessing) && 'animate-spin'
									)}
								/>
								{globalReindexStatus.isProcessing
									? `Reindexando... ${Math.round(globalReindexStatus.progress)}%${currentFolderName ? ` • ${currentFolderName}` : ''}`
									: 'Reindexar todo'}
							</Button>
						</div>
					</div>
				</div>

				<Separator className="my-0" />

				<div className="p-3">
					<div className="space-y-2">
						{/* Formulario para agregar carpetas */}
						<FolderForm isLoading={isLoading} isProcessing={isProcessing} onAddFolder={handleAddFolder} />

						{/* Lista de carpetas - grid responsiva optimizada para desktop */}
						<FoldersGrid
							folders={folders}
							globalCurrentFolderId={globalReindexStatus.currentFolder}
							isGloballyProcessing={isGloballyProcessing}
							isProcessing={isProcessing}
							onFolderClick={handleFolderClick}
							onReindex={handleReindexFolder}
							orderedFolders={orderedFolders}
							processStatus={processStatus}
							progressByFolder={progressByFolder}
							selectedFolder={selectedFolder}
						/>

						{/* Progress bar para reindexado global */}
						<GlobalReindexProgress progress={globalReindexStatus.progress} show={globalReindexStatus.isProcessing} />
					</div>
				</div>
			</div>

			{/* Estadísticas generales al final */}
			{generalStats && !isStatsLoading && <FoldersStats stats={generalStats} />}
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
	return (
		<div
			className={cn(
				'grid content-start items-stretch',
				'grid-cols-[repeat(auto-fill,minmax(330px,1fr))]',
				'auto-rows-fr gap-3 [grid-auto-flow:row_dense]'
			)}
			data-density="compact"
		>
			{orderedFolders.map((folder) => (
				<FolderCard
					allFolders={folders}
					folder={folder}
					getFolderIndexStatus={getFolderIndexStatus}
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

function GlobalReindexProgress({ show, progress }: { show: boolean; progress: number }) {
	if (!show) {
		return null;
	}
	return (
		<div className="mt-2">
			<Progress className="h-2" data-testid="reindex-global-progress" value={progress} />
			<p className="mt-1 text-center text-muted-foreground text-xs">Reindexando... {Math.round(progress)}%</p>
		</div>
	);
}
