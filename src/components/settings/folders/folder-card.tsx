"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
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
	processProgress: number;
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
	processProgress,
	isGloballyProcessing,
	onReindex,
	onToggleAutoReindex,
	onFolderClick,
	getFolderIndexStatus,
}: FolderCardProps) {
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
									status={getFolderIndexStatus(folder)}
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

				{isProcessing && processStatus.folderId === folder.id && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: "auto" }}
						exit={{ opacity: 0, height: 0 }}
						className="mt-3 space-y-1.5"
					>
						<div className="flex justify-between text-xs text-muted-foreground">
							<span>
								{processStatus.phase === "error"
									? "Error: "
									: processStatus.status || "Procesando..."}
							</span>
							<span>{Math.round(processProgress)}%</span>
						</div>
						<Progress
							value={processProgress}
							className={cn(
								"h-1.5",
								processStatus.phase === "error" && "bg-destructive"
							)}
						/>
						<FolderProgressDetails status={processStatus} />
					</motion.div>
				)}
			</CardContent>
		</motion.div>
	);
}
