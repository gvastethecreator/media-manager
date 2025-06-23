'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatBytes } from '@/lib/utils/format.utils';
import { AlertCircle, Folder, RefreshCw, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { FolderIndexStatusBadge, type IndexStatus } from './folder-index-status-badge';
import { FolderProgressDetails } from './folder-progress-details';
import type { ExtendedFolder } from './folder-types';
import type { ExtendedProcessStatus } from './hooks/use-folders';

interface FolderCardProps {
	folder: ExtendedFolder;
	selectedFolder: string | null;
	isProcessing: boolean;
	processStatus: ExtendedProcessStatus;
	isGloballyProcessing: boolean;
	onReindex: (folderId: string) => void;
	onToggleAutoReindex: (folderId: string, value: boolean) => void;
	onFolderClick: (folderId: string) => void;
	getFolderIndexStatus: (folder: ExtendedFolder) => IndexStatus;
}

export function FolderCard({
	folder,
	selectedFolder,
	isProcessing,
	processStatus,
	isGloballyProcessing,
	onReindex,
	onToggleAutoReindex,
	onFolderClick,
	getFolderIndexStatus,
}: FolderCardProps) {
	// Determinar si esta carpeta está siendo procesada actualmente
	const isReindexing = isProcessing && processStatus?.folderId === folder.id;

	// Verificar explícitamente si el proceso está completado
	const isComplete =
		(!isProcessing && processStatus?.folderId === folder.id && processStatus?.phase === 'complete') ||
		(!isProcessing && processStatus?.folderId === folder.id && processStatus?.progress === 100) ||
		(processStatus?.phase === 'complete' && processStatus?.folderId === folder.id) ||
		(processStatus?.progress === 100 && processStatus?.phase === 'metadata' && processStatus?.folderId === folder.id);

	const indexStatus = getFolderIndexStatus(folder);

	// Estado local para tracking
	const [lastProgress, setLastProgress] = useState<number>(0);
	const [showCompleteAnimation, setShowCompleteAnimation] = useState<boolean>(false);

	// Actualizar el progreso cuando cambie el estado
	useEffect(() => {
		const isActiveProcess = isReindexing && processStatus?.folderId === folder.id;

		if (isActiveProcess && typeof processStatus?.progress === 'number') {
			setLastProgress(processStatus.progress);

			// Si el progreso alcanza el 100%, mostrar animación de completado
			if (processStatus.progress >= 100) {
				setShowCompleteAnimation(true);

				// Ocultar la animación después de un tiempo
				const timer = setTimeout(() => {
					setShowCompleteAnimation(false);
				}, 3000);

				return () => clearTimeout(timer);
			}
		} else if (isComplete) {
			setLastProgress(100);
			setShowCompleteAnimation(true);

			// Ocultar la animación después de un tiempo
			const timer = setTimeout(() => {
				setShowCompleteAnimation(false);
			}, 3000);

			return () => clearTimeout(timer);
		}

		// Si no está procesando ni completo, asegurarse de que no mostramos animación
		if (!isReindexing && !isComplete) {
			setShowCompleteAnimation(false);
		}
	}, [isReindexing, isComplete, processStatus, folder.id]);

	// Obtener mensaje de estado
	const getStatusMessage = useCallback(() => {
		if (!isReindexing && !showCompleteAnimation) {
			return null;
		}

		if (!isProcessing && showCompleteAnimation) {
			return (
				<Badge
					variant="outline"
					className="ml-1 text-[9px] h-3.5 px-1 py-0 text-emerald-500 border-emerald-200 bg-emerald-50"
				>
					Completado
				</Badge>
			);
		}

		return (
			<Badge
				variant="outline"
				className="ml-1 text-[9px] h-3.5 px-1 py-0 text-blue-500 border-blue-200 bg-blue-50 animate-pulse"
			>
				Procesando...
			</Badge>
		);
	}, [isReindexing, showCompleteAnimation, isProcessing]);

	return (
		<motion.div
			animate={{
				opacity: [0, 1],
				y: [20, 0],
			}}
			className={cn('group rounded-sm', selectedFolder === folder.id && 'ring-1 ring-primary')}
		>
			<Card
				className={cn(
					'overflow-hidden transition-all border-0',
					isReindexing && 'ring-1 ring-primary/20',
					showCompleteAnimation && 'ring-1 ring-emerald-400/20'
				)}
			>
				{/* Indicador visual de procesamiento */}
				{(isReindexing || showCompleteAnimation) && (
					<div
						className={cn(
							'absolute inset-x-0 top-0 h-0.5 overflow-hidden',
							showCompleteAnimation ? 'bg-emerald-400/50' : 'bg-primary/50'
						)}
					>
						<div
							className={cn('h-full', showCompleteAnimation ? 'bg-emerald-400' : 'bg-primary animate-pulse')}
							style={{ width: `${lastProgress}%` }}
						/>
					</div>
				)}

				<CardContent className="p-3">
					<div className="space-y-2">
						{/* Cabecera de la carpeta */}
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-1">
								<Folder className="h-4 w-4 text-blue-500" />
								<span className="font-medium text-sm">{folder.name}</span>
								{getStatusMessage()}
							</div>

							<div className="flex items-center gap-1">
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<div className="flex items-center gap-1">
												<Switch
													checked={folder.autoReindex}
													onCheckedChange={(checked) => onToggleAutoReindex(folder.id, checked)}
													disabled={isGloballyProcessing}
													className="scale-75"
												/>
												<span className="text-[10px] text-muted-foreground">Auto</span>
											</div>
										</TooltipTrigger>
										<TooltipContent className="text-xs">
											{folder.autoReindex ? 'Desactivar reindexado automático' : 'Activar reindexado automático'}
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>

								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												size="icon"
												variant="ghost"
												className="h-6 w-6"
												onClick={() => onReindex(folder.id)}
												disabled={isGloballyProcessing}
											>
												<RefreshCw
													className={cn(
														'h-3.5 w-3.5',
														isProcessing && processStatus.folderId === folder.id && 'animate-spin'
													)}
												/>
											</Button>
										</TooltipTrigger>
										<TooltipContent className="text-xs">Reindexar carpeta</TooltipContent>
									</Tooltip>
								</TooltipProvider>

								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												size="icon"
												variant="ghost"
												className={cn(
													'h-6 w-6',
													selectedFolder === folder.id && 'bg-destructive hover:bg-destructive/90'
												)}
												onClick={() => onFolderClick(folder.id)}
												disabled={isGloballyProcessing}
											>
												<Trash2
													className={cn(
														'h-3.5 w-3.5',
														selectedFolder === folder.id ? 'text-background' : 'text-muted-foreground'
													)}
												/>
											</Button>
										</TooltipTrigger>
										<TooltipContent className="text-xs">
											{selectedFolder === folder.id ? 'Confirmar eliminación' : 'Eliminar carpeta'}
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							</div>
						</div>

						{/* Detalles de la carpeta */}
						<div className="flex items-center justify-between gap-1 w-full">
							<div className="w-full space-y-1">
								<div className="flex items-center">
									<span className="text-xs text-muted-foreground truncate">{folder.path}</span>
								</div>

								<div className="flex items-center justify-between gap-2 w-full">
									<Badge variant="secondary" className="text-[10px] px-2 h-4">
										{folder.totalFiles || 0} imágenes
									</Badge>
									<Badge variant="secondary" className="text-[10px] px-1 h-4">
										{formatBytes(Number(folder.totalSize || 0))}
									</Badge>
									<FolderIndexStatusBadge status={indexStatus} lastIndexed={folder.lastIndexed} />
								</div>
							</div>
						</div>

						{/* Muestra error si existe */}
						{folder.error && (
							<motion.div
								initial={{ opacity: 0, height: 0 }}
								animate={{ opacity: 1, height: 'auto' }}
								exit={{ opacity: 0, height: 0 }}
								className="mt-1"
							>
								<Alert variant="destructive" className="p-2">
									<AlertCircle className="h-3.5 w-3.5 mr-1" />
									<AlertTitle className="text-xs">Error en carpeta</AlertTitle>
									<AlertDescription className="text-xs mt-1">{folder.error}</AlertDescription>
								</Alert>
							</motion.div>
						)}

						{/* Detalles del proceso */}
						{isReindexing && (
							<div className="mt-1">
								<Progress value={lastProgress} className="h-1 my-1" />
								<FolderProgressDetails status={processStatus} isProcessing={isReindexing} className="mt-1" />
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		</motion.div>
	);
}
