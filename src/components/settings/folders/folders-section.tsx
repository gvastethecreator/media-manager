'use client';

import { ReindexConfirmationDialog } from '@/components/settings/reindex-confirmation-dialog';
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
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { AlertCircle, EraserIcon, FolderIcon, RefreshCw } from 'lucide-react';
import { Folder } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { FolderCard } from './folder-card';
import { FolderForm } from './folder-form';
import { getFolderIndexStatus } from './folder-utils';
import { FoldersStats } from './folders-stats';
import { useFolders } from './hooks/use-folders';

export function FoldersSection() {
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
			<Card className="p-4">
				<div className="flex flex-col gap-2">
					<div className="flex items-center gap-2 text-destructive">
						<AlertCircle className="h-3.5 w-3.5" />
						<p className="text-xs">{displayError}</p>
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							setErrorMessage(null);
							setError(null);
							loadStats();
						}}
						className="w-full text-xs"
					>
						Reintentar
					</Button>
				</div>
			</Card>
		);
	}

	return (
		<Card className="flex flex-col gap-2 bg-muted/30 rounded-sm">
			<CardHeader className="p-2 pb-0 bg-transparent">
				<CardTitle className="text-base text-muted-foreground font-semibold flex items-center justify-between pl-1">
					<span className="flex items-center gap-2 h-7">
						<FolderIcon className="h-5 w-5" /> Carpetas
					</span>
					<div className="flex items-center gap-2">
						<Button
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
							variant="outline"
							size="sm"
							onClick={handleReindexAll}
							className="h-7 text-xs"
							disabled={isLoading || isGloballyProcessing}
						>
							<RefreshCw
								className={cn('h-3.5 w-3.5', (isLoading || globalReindexStatus.isProcessing) && 'animate-spin')}
							/>
							{globalReindexStatus.isProcessing
								? `Reindexando (${Math.round(globalReindexStatus.progress)}%)`
								: 'Reindexar todo'}
						</Button>
					</div>
				</CardTitle>
			</CardHeader>
			<Separator className="my-0" />
			<CardContent className="p-2">
				<div className="space-y-3">
					<div className="space-y-3">
						<FolderForm isProcessing={isProcessing} isLoading={isLoading} onAddFolder={handleAddFolder} />

						<div className="grid grid-cols-1 gap-2">
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
									className="py-4 text-center col-span-2"
								>
									<Folder className="h-6 w-6 mx-auto mb-2 text-muted-foreground/50" />
									<p className="text-xs text-muted-foreground">No hay carpetas indexadas</p>
									<p className="text-[10px] mt-1 text-muted-foreground/75">
										Agrega una carpeta para comenzar a indexar imágenes
									</p>
								</motion.div>
							)}
						</div>
					</div>

					<FoldersStats stats={stats} />
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
