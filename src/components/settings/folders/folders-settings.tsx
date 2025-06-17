'use client';

import { AlertCircle, EraserIcon, Folder, FolderIcon, Info, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { ReindexConfirmationDialog } from '@/components/settings/folders/reindex-confirmation-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { FolderCard } from './folder-card';
import { FolderForm } from './folder-form';
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
		showReindexDialog,
		reindexAllDialogOpen,
		handleAddFolder,
		handleReindexFolder,
		handleFolderClick,
		handleReindexAll,
		handleConfirmReindexAll,
		handleAutoReindexToggle,
		handleClearCache,
		loadStats,
		setShowReindexDialog,
		setReindexAllDialogOpen,
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
							onClick={handleReindexAll}
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

					{/* Lista de carpetas */}
					<div className="grid grid-cols-2 gap-2">
						{folders.map((folder) => (
							<FolderCard
								key={folder.id}
								folder={folder}
								selectedFolder={selectedFolder}
								isProcessing={isProcessing}
								processStatus={processStatus}
								isGloballyProcessing={isGloballyProcessing}
								onReindex={handleReindexFolder}
								onToggleAutoReindex={handleAutoReindexToggle}
								onFolderClick={handleFolderClick}
								getFolderIndexStatus={getFolderIndexStatus}
							/>
						))}

						{folders.length === 0 && (
							<motion.div
								animate={{
									opacity: [0, 1],
									y: [20, 0],
								}}
								className="py-4 text-center"
							>
								<Folder className="h-6 w-6 mx-auto mb-2 text-muted-foreground/50" />
								<p className="text-xs text-muted-foreground">No hay carpetas indexadas</p>
								<p className="text-[10px] mt-1 text-muted-foreground/75">
									Agrega una carpeta para comenzar a indexar imágenes
								</p>
							</motion.div>
						)}
					</div>

					{/* Estadísticas */}
					<FoldersStats stats={stats} />

					{globalReindexStatus.isProcessing && (
						<div className="mt-2">
							<Progress value={globalReindexStatus.progress} className="h-1.5" />
						</div>
					)}
				</div>
			</CardContent>

			<ReindexConfirmationDialog
				open={showReindexDialog}
				onOpenChange={setShowReindexDialog}
				onConfirm={handleConfirmReindexAll}
				isProcessing={globalReindexStatus.isProcessing}
				progress={globalReindexStatus.progress}
			/>

			<Dialog open={reindexAllDialogOpen} onOpenChange={setReindexAllDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Reindexar todas las carpetas</DialogTitle>
						<DialogDescription>
							Este proceso analizará todas las carpetas y actualizará la base de datos con nuevos archivos. Podría tomar
							varios minutos dependiendo de la cantidad de archivos.
						</DialogDescription>
					</DialogHeader>
					<div className="flex items-center space-x-2 py-4">
						<Switch id="clear-cache" checked={false} onCheckedChange={() => {}} />
						<Label htmlFor="clear-cache" className="text-sm font-normal cursor-pointer">
							Limpiar caché de metadatos (recomendado si hay problemas)
						</Label>
					</div>
					<DialogFooter className="flex flex-row justify-between sm:justify-between gap-2">
						<Button type="button" variant="outline" onClick={() => setReindexAllDialogOpen(false)}>
							Cancelar
						</Button>
						<Button type="button" onClick={handleConfirmReindexAll} disabled={isLoading}>
							Reindexar todas
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</Card>
	);
}
