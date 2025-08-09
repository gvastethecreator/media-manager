import { AlertCircle, EraserIcon, Folder, FolderIcon, Info, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

// Helper functions to reduce component complexity
function createHierarchicalOrder(folderList: any[]) {
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
}

function getProcessingMessage(processStatus: any, isGloballyProcessing: boolean) {
	if (processStatus?.message) {
		return processStatus.message;
	}
	return isGloballyProcessing ? 'Reindexando todas las carpetas...' : 'Procesando carpeta...';
}

export function FoldersSettings() {
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

	// Hook para estadísticas generales de carpetas
	const { data: generalStats, isLoading: isStatsLoading, error: statsError } = useFolderStats();

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
		handleAddFolder,
		handleReindexFolder,
		handleFolderClick,
		reindexAll,
		handleClearCache,
		loadStats,
		setError,
	} = useFolders();

	// Funciones para manejar las nuevas características
	const handleUpdateFolder = (
		folderId: string,
		updates: { emoji?: string; description?: string; isFavorite?: boolean }
	) => {
		// TODO: Implementar la actualización de carpetas
		console.log('Updating folder:', folderId, updates);
	};

	const handleToggleExpanded = (folderId: string) => {
		setExpandedFolders((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(folderId)) {
				newSet.delete(folderId);
			} else {
				newSet.add(folderId);
			}
			return newSet;
		});
	};

	// Combinar errores
	const displayError = errorMessage || error || statsError?.message;

	if (displayError) {
		return (
			<Card className="rounded-sm border-none bg-muted/30">
				<div className="flex flex-col gap-2 p-3">
					<div className="flex items-center gap-2 text-destructive">
						<AlertCircle className="h-4 w-4" />
						<p className="text-sm">{displayError}</p>
					</div>
					<Button
						className="mt-1 w-full text-xs"
						onClick={() => {
							setErrorMessage(null);
							setError(null);
							loadStats();
						}}
						size="sm"
						variant="outline"
					>
						Reintentar
					</Button>
				</div>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			{/* Sección de gestión de carpetas */}
			<Card className="rounded-sm border-none bg-muted/30">
				<CardHeader className="p-3 pb-2" data-testid="folders-settings">
					<CardTitle className="flex items-center justify-between font-medium text-base text-muted-foreground">
						<div className="flex items-center gap-2">
							<FolderIcon className="h-4 w-4 text-primary" />
							<span>Gestión de Carpetas</span>
							{(isGloballyProcessing || isProcessing) && (
								<div
									className="flex animate-pulse items-center gap-2 text-muted-foreground text-sm"
									data-testid="reindex-status"
								>
									<RefreshCw className="h-4 w-4 animate-spin text-primary" />
									<span className="font-medium">
										{processStatus?.message ||
											(isGloballyProcessing ? 'Reindexando todas las carpetas...' : 'Procesando carpeta...')}
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
								disabled={isLoading || isGloballyProcessing}
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
									? `Reindexando... ${Math.round(globalReindexStatus.progress)}%`
									: 'Reindexar todo'}
							</Button>
						</div>
					</CardTitle>
				</CardHeader>

				<Separator className="my-0" />

				<CardContent className="p-3">
					<div className="space-y-3">
						{/* Formulario para agregar carpetas */}
						<FolderForm isLoading={isLoading} isProcessing={isProcessing} onAddFolder={handleAddFolder} />

						{/* Lista de carpetas - grid responsiva optimizada para desktop */}
						<div
							className={cn(
								'grid content-start items-stretch pr-3',
								// Base y tablets
								'grid-cols-1 gap-3 md:grid-cols-2 md:gap-4',
								// Desktop amplio: columnas automáticas con tamaño mínimo
								'lg:gap-4 lg:[grid-template-columns:repeat(auto-fill,minmax(320px,1fr))]',
								// 1440+
								'xl:gap-5 xl:[grid-template-columns:repeat(auto-fill,minmax(340px,1fr))]',
								// 2K+
								'2xl:gap-6 2xl:[grid-template-columns:repeat(auto-fill,minmax(360px,1fr))]',
								// Relleno denso para minimizar huecos
								'auto-rows-fr [grid-auto-flow:row_dense]'
							)}
						>
							{(() => {
								const sortedFolders = createHierarchicalOrder(folders);

								return sortedFolders.map((folder) => (
									<FolderCard
										allFolders={folders}
										folder={folder}
										getFolderIndexStatus={getFolderIndexStatus}
										isGloballyProcessing={isGloballyProcessing}
										isProcessing={isProcessing}
										key={folder.id}
										onFolderClick={handleFolderClick}
										onReindex={handleReindexFolder}
										processStatus={processStatus}
										selectedFolder={selectedFolder}
									/>
								));
							})()}

							{folders.length === 0 && (
								<motion.div
									animate={{
										opacity: [0, 1],
										y: [20, 0],
									}}
									className="col-span-full py-8 text-center"
								>
									<Folder className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
									<p className="text-muted-foreground text-sm">No hay carpetas indexadas</p>
									<p className="mt-1 text-muted-foreground/75 text-xs">
										Agrega una carpeta para comenzar a indexar imágenes
									</p>
								</motion.div>
							)}
						</div>

						{/* Progress bar para reindexado global */}
						{globalReindexStatus.isProcessing && (
							<div className="mt-2">
								<Progress className="h-2" data-testid="reindex-global-progress" value={globalReindexStatus.progress} />
								<p className="mt-1 text-center text-muted-foreground text-xs">
									Reindexando... {Math.round(globalReindexStatus.progress)}%
								</p>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Estadísticas generales al final */}
			{generalStats && !isStatsLoading && <FoldersStats stats={generalStats} />}
		</div>
	);
}
