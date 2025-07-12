import { AlertCircle, EraserIcon, Folder, FolderIcon, Info, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { FolderCard } from './folder-card';
import { FolderForm } from './folder-form';
import { FolderGroup } from './folder-group';
import { getFolderIndexStatus } from './folder-utils';
import { FoldersStats } from './folders-stats';
import { useFolders } from './hooks/use-folders';

export function FoldersSettings() {
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
		handleAutoReindexToggle,
		handleClearCache,
		loadStats,
		setError,
	} = useFolders();

	// Combinar errores
	const displayError = errorMessage || error;

	if (displayError) {
		return (
			<Card className="bg-muted/30 rounded-sm border-none">
				<div className="p-3 flex flex-col gap-2">
					<div className="flex items-center gap-2 text-destructive">
						<AlertCircle className="h-4 w-4" />
						<p className="text-sm">{displayError}</p>
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							setErrorMessage(null);
							setError(null);
							loadStats();
						}}
						className="mt-1 w-full text-xs"
					>
						Reintentar
					</Button>
				</div>
			</Card>
		);
	}

	return (
		<Card className="bg-muted/30 rounded-sm border-none">
			<CardHeader className="p-3 pb-2">
				<CardTitle className="text-base text-muted-foreground font-medium flex items-center justify-between">
					<div className="flex items-center gap-2">
						<FolderIcon className="h-4 w-4 text-primary" />
						<span>Carpetas</span>
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<Info className="h-3.5 w-3.5 text-muted-foreground cursor-pointer" />
								</TooltipTrigger>
								<TooltipContent side="top" className="text-xs max-w-xs">
									Administra las carpetas donde se almacenan tus imágenes. Agrega nuevas carpetas y mantén actualizado
									tu índice.
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>

					<div className="flex items-center gap-1.5">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={handleClearCache}
							className="h-7 text-xs"
							disabled={isLoading || isProcessing}
						>
							<EraserIcon className="h-3.5 w-3.5 mr-1" />
							Limpiar caché
						</Button>

						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => reindexAll()}
							className="h-7 text-xs"
							disabled={isLoading || isGloballyProcessing}
						>
							<RefreshCw
								className={cn('h-3.5 w-3.5 mr-1', (isLoading || globalReindexStatus.isProcessing) && 'animate-spin')}
							/>
							{globalReindexStatus.isProcessing ? `${Math.round(globalReindexStatus.progress)}%` : 'Reindexar todo'}
						</Button>
					</div>
				</CardTitle>
			</CardHeader>

			<Separator className="my-0" />

			<CardContent className="p-3">
				<div className="space-y-3">
					{/* Formulario para agregar carpetas */}
					<FolderForm isProcessing={isProcessing} isLoading={isLoading} onAddFolder={handleAddFolder} />

					{/* Lista de carpetas con jerarquía mejorada */}
					<ScrollArea className="h-[300px] w-full">
						<div className="space-y-3 pr-3">
							{(() => {
								// Separar carpetas padre de subcarpetas
								const parentFolders = folders.filter((folder) => !folder.parentId);
								const subfolders = folders.filter((folder) => folder.parentId);

								// Agrupar subcarpetas por padre
								const folderGroups = parentFolders.map((parent) => {
									const children = subfolders.filter((sub) => sub.parentId === parent.id);
									return { parent, children };
								});

								// Ordenar grupos por nombre del padre
								folderGroups.sort((a, b) => a.parent.name.localeCompare(b.parent.name));

								return folderGroups.map(({ parent, children }) => (
									<FolderGroup
										key={parent.id}
										parentFolder={parent}
										subfolders={children}
										allFolders={folders}
										selectedFolder={selectedFolder}
										isProcessing={isProcessing}
										processStatus={processStatus}
										isGloballyProcessing={isGloballyProcessing}
										onReindex={handleReindexFolder}
										onToggleAutoReindex={handleAutoReindexToggle}
										onFolderClick={handleFolderClick}
										getFolderIndexStatus={getFolderIndexStatus}
									/>
								));
							})()}

							{folders.length === 0 && (
								<motion.div
									animate={{
										opacity: [0, 1],
										y: [20, 0],
									}}
									className="py-8 text-center"
								>
									<Folder className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
									<p className="text-sm text-muted-foreground">No hay carpetas indexadas</p>
									<p className="text-xs mt-1 text-muted-foreground/75">
										Agrega una carpeta para comenzar a indexar imágenes
									</p>
								</motion.div>
							)}
						</div>
					</ScrollArea>

					{/* Estadísticas */}
					<FoldersStats stats={stats} />

					{/* Progress bar para reindexado global */}
					{globalReindexStatus.isProcessing && (
						<div className="mt-2">
							<Progress value={globalReindexStatus.progress} className="h-2" />
							<p className="text-xs text-muted-foreground mt-1 text-center">
								Reindexando... {Math.round(globalReindexStatus.progress)}%
							</p>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
