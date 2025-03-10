"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, formatBytes } from "@/lib/utils";
import type { ExtendedProcessStatus, ProcessPhase } from "@/types/process";
import { Folder, RefreshCw, Trash2 } from "lucide-react";
import { AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import {
	FolderIndexStatusBadge,
	type IndexStatus,
} from "./folder-index-status-badge";
import { FolderProgressDetails } from "./folder-progress-details";
import type { ExtendedFolder } from "./folder-types";

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
	const indexStatus = getFolderIndexStatus(folder);

	// Agregar un estado para hacer seguimiento del último progreso recibido
	const [lastProgress, setLastProgress] = useState<number>(0);

	// Actualizar el progreso cuando cambie el estado
	useEffect(() => {
		if (isReindexing && processStatus?.progress) {
			setLastProgress(processStatus.progress);
		}
	}, [isReindexing, processStatus]);

	return (
		<motion.div
			animate={{
				opacity: [0, 1],
				y: [20, 0],
			}}
			className={cn(
				"bg-muted/30 group rounded-sm",
				selectedFolder === folder.id && "ring-1 ring-primary"
			)}
		>
			<Card
				className={cn(
					"overflow-hidden transition-all",
					isReindexing && "ring-1 ring-primary/20"
				)}
			>
				{/* Agregar indicador visual de procesamiento */}
				{isReindexing && (
					<div className="absolute inset-x-0 top-0 h-0.5 bg-primary/50 overflow-hidden">
						<div
							className="h-full bg-primary animate-pulse"
							style={{ width: `${lastProgress}%` }}
						/>
					</div>
				)}

				<CardHeader className="flex items-center justify-between">
					<div className="flex items-center gap-1.5">
						<Folder className="h-4 w-4 text-blue-500" />
						<div className="flex items-center gap-1">
							<span className="font-medium">{folder.name}</span>
							{isReindexing && (
								<Badge
									variant="outline"
									className="ml-1 text-[9px] h-3.5 px-1 py-0 text-blue-500 border-blue-200 bg-blue-50 animate-pulse"
								>
									Procesando...
								</Badge>
							)}
						</div>
					</div>
				</CardHeader>

				<CardContent className="p-2">
					<div className="flex items-center justify-between relative">
						<div className="flex items-center justify-between gap-1 w-full">
							<div className="min-w-full">
								<Folder className="h-3.5 w-3.5 justify-center text-muted-foreground inline-block mr-1" />
								<span className="text-xs font-xs text-muted-foreground truncate inline-flex items-center">
									{folder.path}
								</span>
								<div className="flex items-center justify-between gap-2 w-full mt-2">
									<Badge variant="secondary" className="text-[10px] px-2 h-4">
										{folder._count?.images || 0} imágenes
									</Badge>
									<Badge variant="secondary" className="text-[10px] px-1 h-4">
										{formatBytes(Number(folder.totalSize || 0))}
									</Badge>
									<FolderIndexStatusBadge
										status={indexStatus}
										lastIndexed={folder.lastIndexed}
									/>
								</div>
							</div>
						</div>
						<div className="flex items-center gap-1 absolute right-0 top-0">
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<div className="flex items-center gap-1.5 p-1">
											<Switch
												checked={folder.autoReindex}
												onCheckedChange={(checked) =>
													onToggleAutoReindex(folder.id, checked)
												}
												disabled={isGloballyProcessing}
												className="scale-75"
											/>
											<span className="text-[10px] text-muted-foreground mr-1">
												Auto
											</span>
										</div>
									</TooltipTrigger>
									<TooltipContent className="text-xs">
										{folder.autoReindex
											? "Desactivar reindexado automático"
											: "Activar reindexado automático"}
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
													"h-3.5 w-3.5",
													isProcessing &&
														processStatus.folderId === folder.id &&
														"animate-spin"
												)}
											/>
										</Button>
									</TooltipTrigger>
									<TooltipContent className="text-xs">
										Reindexar carpeta
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>

							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											size="icon"
											variant="ghost"
											className={cn(
												"h-6 w-6",
												selectedFolder === folder.id &&
													"bg-destructive hover:bg-destructive/90"
											)}
											onClick={() => onFolderClick(folder.id)}
											disabled={isGloballyProcessing}
										>
											<Trash2
												className={cn(
													"h-3.5 w-3.5",
													selectedFolder === folder.id
														? "text-background"
														: "text-muted-foreground"
												)}
											/>
										</Button>
									</TooltipTrigger>
									<TooltipContent className="text-xs">
										{selectedFolder === folder.id
											? "Confirmar eliminar"
											: "Eliminar carpeta"}
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</div>
					</div>

					{folder.error && (
						<motion.div
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: "auto" }}
							exit={{ opacity: 0, height: 0 }}
							className="mt-3"
						>
							<Alert variant="destructive" className="p-2">
								<AlertCircle className="h-3.5 w-3.5 mr-1" />
								<AlertTitle className="text-xs">Error en carpeta</AlertTitle>
								<AlertDescription className="text-xs mt-1">
									{folder.error}
								</AlertDescription>
							</Alert>
						</motion.div>
					)}

					{isReindexing && processStatus && (
						<div className="px-3 pb-2">
							<FolderProgressDetails
								status={processStatus}
								isProcessing={isReindexing}
								className="mt-2"
							/>
						</div>
					)}
				</CardContent>
			</Card>
		</motion.div>
	);
}
