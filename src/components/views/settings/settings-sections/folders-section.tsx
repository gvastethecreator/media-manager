"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
	TooltipProvider,
	Tooltip,
	TooltipTrigger,
	TooltipContent,
} from "@/components/ui/tooltip";
import {
	addFolder,
	reindexFolder,
	getFolders,
	deleteFolder,
	type ProcessStatus,
} from "@/services/folder.service";
import { useToast } from "@/components/ui/use-toast";
import {
	Folder,
	FolderPlus,
	AlertCircle,
	RefreshCw,
	FolderIcon,
	Trash2,
	Zap,
	Settings2,
} from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { motion, AnimateSharedLayout } from "motion/react";
import Image from "next/image";
import { useSettingsContext } from "@/context/settings-context";
import { type ThumbnailQuality } from "@/services/thumbnail.service";
import { useThumbnailStore } from "@/store/thumbnails";
import { useThumbnailEvents } from "@/hooks/use-thumbnail-events";
import * as thumbnailActions from "@/actions/thumbnails";

interface FolderStats {
	totalFolders: number;
	totalFiles: number;
	totalSize: number;
	lastIndexed: Date | null;
}

interface ExtendedProcessStatus extends ProcessStatus {
	currentFile?: string;
	folderId?: string;
}

interface LastProcessedThumbnail {
	id: string;
	path: string;
	processedAt: string;
}

interface ThumbnailProcessStatus extends ProcessStatus {
	lastProcessed?: LastProcessedThumbnail;
}

interface OptimizeResult {
	optimized: number;
	totalSaved: number;
}

interface CleanResult {
	cleaned: number;
	totalFreed: number;
}

interface ReprocessResult {
	processed: number;
}

interface ThumbnailCallbacks {
	onProgress?: (status: ThumbnailProcessStatus) => void;
	onError?: (error: unknown) => void;
	onComplete?: (data: OptimizeResult | CleanResult | ReprocessResult) => void;
}

interface ErrorResponse {
	message?: string;
	details?: string;
	code?: string;
}

interface FolderResponse {
	folder: {
		id: string;
		name: string;
		path: string;
	};
	stats?: {
		processed: number;
		total: number;
	};
}

const initialStats: FolderStats = {
	totalFolders: 0,
	totalFiles: 0,
	totalSize: 0,
	lastIndexed: null,
};

const thumbnailQualityOptions: { value: ThumbnailQuality; label: string }[] = [
	{ value: "compressed", label: "Comprimida (más rápido, menos espacio)" },
	{ value: "low", label: "Baja (balance entre calidad y espacio)" },
	{ value: "mid", label: "Media (recomendado)" },
	{ value: "high", label: "Alta (mejor calidad, más espacio)" },
];

export function FoldersSection() {
	const { toast } = useToast();
	const { settings, updateSettings } = useSettingsContext();
	const {
		stats: thumbnailStats,
		isLoading: isThumbnailLoading,
		isProcessing: isThumbnailProcessing,
		processStatus: thumbnailProcessStatus,
		error: thumbnailError,
		initialize: initializeThumbnails,
		setProcessing: setThumbnailProcessing,
	} = useThumbnailStore();

	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [processProgress, setProcessProgress] = useState(0);
	const [stats, setStats] = useState<FolderStats>(initialStats);
	const [folderPath, setFolderPath] = useState("");
	const [folders, setFolders] = useState<any[]>([]);
	const [processStatus, setProcessStatus] = useState<ExtendedProcessStatus>({});
	const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
	const [showErrors, setShowErrors] = React.useState(false);
	const [lastProcessedThumbnails, setLastProcessedThumbnails] = React.useState<
		LastProcessedThumbnail[]
	>([]);

	// Inicializar eventos SSE
	useThumbnailEvents();

	// Cargar estadísticas iniciales
	React.useEffect(() => {
		initializeThumbnails();
		loadStats();
	}, [initializeThumbnails]);

	const loadFolders = async () => {
		try {
			setIsLoading(true);
			setError(null);
			const folders = await getFolders();
			setFolders(folders);
			await loadStats();
		} catch (error) {
			console.error("Error cargando carpetas:", error);
			setError("No se pudieron cargar las carpetas");
		} finally {
			setIsLoading(false);
		}
	};

	const loadStats = async () => {
		try {
			setIsLoading(true);
			setError(null);
			const folders = await getFolders();
			const indexStats: FolderStats = {
				totalFolders: folders.length,
				totalFiles: folders.reduce(
					(acc: number, folder: any) => acc + (folder._count?.images || 0),
					0
				),
				totalSize: folders.reduce(
					(acc: number, folder: any) => acc + Number(folder.totalSize || 0),
					0
				),
				lastIndexed: folders.reduce((acc: Date | null, folder: any) => {
					if (!acc || !folder.lastIndexed) return acc;
					const date = new Date(folder.lastIndexed);
					return acc > date ? acc : date;
				}, null as Date | null),
			};
			setStats(indexStats);
			setFolders(folders);
		} catch (error) {
			console.error("Error cargando estadísticas:", error);
			setError("No se pudieron cargar las estadísticas");
			setStats(initialStats);
		} finally {
			setIsLoading(false);
		}
	};

	const handleAddFolder = async () => {
		if (!folderPath.trim()) return;

		try {
			setError(null);
			setIsProcessing(true);
			setProcessProgress(0);
			setProcessStatus({
				status: "Iniciando proceso...",
				currentFile: "",
				current: 0,
				total: 0,
				progress: 0,
			});

			await addFolder(folderPath, {
				onProgress: (stats: ProcessStatus) => {
					if (stats && typeof stats.progress === "number") {
						setProcessProgress(stats.progress);
						setProcessStatus((prevStatus) => ({
							...prevStatus,
							...stats,
							status: stats.status || "Procesando...",
						}));
					}
				},
				onError: (error: Error | ErrorResponse) => {
					console.error("Error en el proceso:", error);
					let errorMessage = "Error desconocido al procesar la carpeta";

					if (error instanceof Error) {
						errorMessage = error.message;
					} else if (typeof error === "object" && error !== null) {
						errorMessage =
							error.message || error.details || JSON.stringify(error);
					}

					if (errorMessage.includes("FOLDER_EXISTS")) {
						toast({
							title: "Carpeta existente",
							description:
								"Esta carpeta ya está indexada. Puedes reindexarla usando el botón de actualización.",
							variant: "default",
							action: (
								<Button
									size="sm"
									variant="outline"
									onClick={() => {
										const folder = folders.find((f) => f.path === folderPath);
										if (folder) {
											handleReindexFolder(folder.id);
										}
									}}
								>
									Reindexar ahora
								</Button>
							),
						});
					} else {
						toast({
							title: "Error",
							description: errorMessage,
							variant: "destructive",
						});
					}
				},
				onComplete: (data: FolderResponse) => {
					if (data?.folder) {
						toast({
							title: "Carpeta agregada",
							description: `Se agregó la carpeta "${data.folder.name}" correctamente`,
						});
						setFolderPath("");
						loadStats();
					} else {
						toast({
							title: "Advertencia",
							description:
								"La carpeta se agregó pero no se recibieron datos completos",
							variant: "default",
						});
					}
				},
			});
		} catch (error) {
			console.error("Error agregando carpeta:", error);
			let errorMessage = "No se pudo agregar la carpeta";

			if (error instanceof Error) {
				errorMessage = error.message;
			} else if (
				typeof error === "object" &&
				error !== null &&
				(error as ErrorResponse)
			) {
				const errorResponse = error as ErrorResponse;
				errorMessage =
					errorResponse.message ||
					errorResponse.details ||
					JSON.stringify(error);
			}

			toast({
				title: "Error",
				description: errorMessage,
				variant: "destructive",
			});
		} finally {
			await new Promise((resolve) => setTimeout(resolve, 500));
			setIsProcessing(false);
			setProcessProgress(0);
			setProcessStatus({});
		}
	};

	const handleReindexFolder = async (folderId: string) => {
		if (isProcessing) return;

		try {
			setError(null);
			setIsProcessing(true);
			setProcessProgress(0);
			setProcessStatus({
				folderId,
				status: "Iniciando reindexación...",
				current: 0,
				total: 0,
				progress: 0,
			});

			await reindexFolder(folderId, {
				onProgress: (stats: ProcessStatus) => {
					setProcessProgress(stats.progress || 0);
					setProcessStatus((prevStatus) => ({
						...prevStatus,
						...stats,
						folderId,
						status: stats.status || "Procesando...",
					}));
				},
				onError: (error: Error) => {
					console.error("Error en reindexación:", error);
					if (error.name === "FOLDER_NOT_FOUND") {
						toast({
							title: "Carpeta no encontrada",
							description: "La carpeta ya no existe en el sistema",
							variant: "destructive",
						});
						loadStats(); // Recargar para actualizar la lista
					} else {
						toast({
							title: "Error",
							description: error.message || "Error al reindexar la carpeta",
							variant: "destructive",
						});
					}
				},
				onComplete: () => {
					toast({
						title: "Reindexación completada",
						description: "Se ha completado la reindexación correctamente",
						variant: "default",
					});
					loadStats();
				},
			});
		} catch (error) {
			console.error("Error reindexando carpeta:", error);
			toast({
				title: "Error",
				description:
					error instanceof Error
						? error.message
						: "Error al reindexar la carpeta",
				variant: "destructive",
			});
		} finally {
			await new Promise((resolve) => setTimeout(resolve, 500));
			setIsProcessing(false);
			setProcessProgress(0);
			setProcessStatus({});
		}
	};

	const handleRemoveFolder = async (folderId: string) => {
		try {
			setError(null);
			await deleteFolder(folderId);
			await loadFolders();

			toast({
				title: "Carpeta eliminada",
				description: "Se ha eliminado la carpeta correctamente.",
			});
		} catch (error) {
			console.error("Error eliminando carpeta:", error);
			toast({
				title: "Error",
				description:
					error instanceof Error
						? error.message
						: "Error al eliminar la carpeta",
				variant: "destructive",
			});
		}
	};

	const handleFolderClick = async (folderId: string) => {
		if (selectedFolder === folderId) {
			try {
				await deleteFolder(folderId);
				toast({
					title: "Carpeta eliminada",
					description: "La carpeta se eliminó correctamente",
				});
				await loadStats();
				setSelectedFolder(null);
			} catch (error) {
				console.error("Error deleting folder:", error);
				toast({
					title: "Error",
					description: "No se pudo eliminar la carpeta",
					variant: "destructive",
				});
			}
		} else {
			setSelectedFolder(folderId);
		}
	};

	const handleQualityChange = async (quality: ThumbnailQuality) => {
		await updateSettings({ thumbnailQuality: quality });
	};

	const handleVideoAnimationToggle = async (enabled: boolean) => {
		await updateSettings({ videoThumbnailAnimation: enabled });
	};

	const handleOptimizeThumbnails = async () => {
		try {
			setThumbnailProcessing(true);
			await thumbnailActions.optimizeThumbnails({
				onProgress: (status: ThumbnailProcessStatus) => {
					if (status?.lastProcessed) {
						setLastProcessedThumbnails((prev) => [
							status.lastProcessed as LastProcessedThumbnail,
							...prev.slice(0, 4),
						]);
					}
				},
				onError: (error: unknown) => {
					console.error("Error optimizando miniaturas:", error);
					toast({
						title: "Error",
						description:
							error instanceof Error
								? `Error: ${error.message}`
								: typeof error === "object" && error && "message" in error
								? String(error.message)
								: "Error desconocido al optimizar miniaturas",
						variant: "destructive",
					});
				},
				onComplete: (data: OptimizeResult) => {
					toast({
						title: "Optimización completada",
						description: `Se optimizaron ${
							data.optimized
						} miniaturas, ahorrando ${formatBytes(data.totalSaved)}`,
					});
					initializeThumbnails();
				},
			} as ThumbnailCallbacks);
		} catch (error: unknown) {
			console.error("Error optimizando miniaturas:", error);
			toast({
				title: "Error",
				description:
					error instanceof Error
						? `Error: ${error.message}`
						: typeof error === "object" && error && "message" in error
						? String(error.message)
						: "Error desconocido al optimizar miniaturas",
				variant: "destructive",
			});
		} finally {
			setThumbnailProcessing(false);
		}
	};

	const handleReprocessThumbnails = async () => {
		try {
			setThumbnailProcessing(true);
			await thumbnailActions.reprocessThumbnails({
				onProgress: (status: ThumbnailProcessStatus) => {
					if (status?.lastProcessed) {
						setLastProcessedThumbnails((prev) => [
							status.lastProcessed as LastProcessedThumbnail,
							...prev.slice(0, 4),
						]);
					}
				},
				onError: (error: unknown) => {
					console.error("Error reprocesando miniaturas:", error);
					toast({
						title: "Error",
						description:
							error instanceof Error
								? `Error: ${error.message}`
								: typeof error === "object" && error && "message" in error
								? String(error.message)
								: "Error desconocido al reprocesar miniaturas",
						variant: "destructive",
					});
				},
				onComplete: (data: ReprocessResult) => {
					toast({
						title: "Reprocesamiento completado",
						description: `Se reprocesaron ${data.processed} miniaturas`,
					});
					initializeThumbnails();
				},
			} as ThumbnailCallbacks);
		} catch (error: unknown) {
			console.error("Error reprocesando miniaturas:", error);
			toast({
				title: "Error",
				description:
					error instanceof Error
						? `Error: ${error.message}`
						: typeof error === "object" && error && "message" in error
						? String(error.message)
						: "Error desconocido al reprocesar miniaturas",
				variant: "destructive",
			});
		} finally {
			setThumbnailProcessing(false);
		}
	};

	const handleCleanThumbnails = async () => {
		try {
			setThumbnailProcessing(true);
			await thumbnailActions.cleanThumbnails({
				onProgress: (status: ThumbnailProcessStatus) => {
					if (status?.lastProcessed) {
						setLastProcessedThumbnails((prev) => [
							status.lastProcessed as LastProcessedThumbnail,
							...prev.slice(0, 4),
						]);
					}
				},
				onError: (error: unknown) => {
					console.error("Error limpiando miniaturas:", error);
					toast({
						title: "Error",
						description:
							error instanceof Error
								? `Error: ${error.message}`
								: typeof error === "object" && error && "message" in error
								? String(error.message)
								: "Error desconocido al limpiar miniaturas",
						variant: "destructive",
					});
				},
				onComplete: (data: CleanResult) => {
					toast({
						title: "Limpieza completada",
						description: `Se limpiaron ${
							data.cleaned
						} miniaturas, liberando ${formatBytes(data.totalFreed)}`,
					});
					initializeThumbnails();
				},
			} as ThumbnailCallbacks);
		} catch (error: unknown) {
			console.error("Error limpiando miniaturas:", error);
			toast({
				title: "Error",
				description:
					error instanceof Error
						? `Error: ${error.message}`
						: typeof error === "object" && error && "message" in error
						? String(error.message)
						: "Error desconocido al limpiar miniaturas",
				variant: "destructive",
			});
		} finally {
			setThumbnailProcessing(false);
		}
	};

	const handleFullReindex = async () => {
		if (isProcessing || isThumbnailProcessing) return;

		try {
			toast({
				title: "Iniciando reindexado completo",
				description: "Este proceso puede tomar varios minutos...",
			});

			// 1. Limpiar miniaturas
			setThumbnailProcessing(true);
			await thumbnailActions.cleanThumbnails();

			// 2. Reindexar todas las carpetas
			setIsProcessing(true);
			for (const folder of folders) {
				try {
					await reindexFolder(folder.id);
				} catch (error) {
					console.error(`Error reindexando carpeta ${folder.path}:`, error);
					toast({
						title: "Error en carpeta",
						description: `No se pudo reindexar ${folder.path}`,
						variant: "destructive",
					});
				}
			}

			// 3. Reprocesar miniaturas
			await thumbnailActions.reprocessThumbnails();

			toast({
				title: "Reindexado completo finalizado",
				description: "Se han actualizado todas las carpetas y miniaturas",
			});

			// 4. Recargar estadísticas
			await loadStats();
			await initializeThumbnails();
		} catch (error) {
			console.error("Error en reindexado completo:", error);
			toast({
				title: "Error",
				description:
					error instanceof Error
						? error.message
						: "Error en el reindexado completo",
				variant: "destructive",
			});
		} finally {
			setIsProcessing(false);
			setThumbnailProcessing(false);
		}
	};

	// Actualizar últimas miniaturas procesadas cuando cambia el estado
	React.useEffect(() => {
		if (thumbnailProcessStatus.currentFile && thumbnailProcessStatus.status) {
			setLastProcessedThumbnails((prev) => {
				const newThumbnails = [...prev];
				if (thumbnailProcessStatus.currentFile) {
					newThumbnails.unshift({
						id: thumbnailProcessStatus.currentFile,
						path: thumbnailProcessStatus.currentFile,
						processedAt: new Date().toISOString(),
					});
				}
				return newThumbnails.slice(0, 9);
			});
		}
	}, [thumbnailProcessStatus]);

	if (error) {
		return (
			<Card className="p-4">
				<div className="flex items-center gap-2 text-destructive">
					<AlertCircle className="h-3.5 w-3.5" />
					<p className="text-xs">{error}</p>
				</div>
			</Card>
		);
	}

	return (
		<Card className="flex flex-col gap-2 bg-muted/30 rounded-sm">
			<CardHeader className="p-2 pb-0 bg-transparent">
				<CardTitle className="text-base text-muted-foreground font-semibold flex items-center justify-between pl-1">
					<span className="flex items-center gap-2 h-7">
						<FolderIcon className="h-5 w-5" /> Carpetas y Miniaturas
					</span>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={handleFullReindex}
							className="h-7 text-xs"
							disabled={isLoading || isProcessing || isThumbnailProcessing}
						>
							<RefreshCw
								className={cn(
									"h-3.5 w-3.5 mr-1.5",
									(isProcessing || isThumbnailProcessing) && "animate-spin"
								)}
							/>
							{isProcessing || isThumbnailProcessing
								? "Reindexando..."
								: "Reindexar Todo"}
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={loadStats}
							className="h-7 text-xs"
							disabled={isLoading || isProcessing}
						>
							<RefreshCw
								className={cn("h-3.5 w-3.5", isLoading && "animate-spin")}
							/>
						</Button>
					</div>
				</CardTitle>
			</CardHeader>
			<Separator className="my-0" />
			<CardContent className="p-2">
				<div className="space-y-3">
					<div className="space-y-3">
						<div className="flex items-center gap-2 p-0 border-none">
							<div className="flex-1">
								<Input
									type="text"
									placeholder="Ruta de la carpeta (ej: C:\Users\Usuario\Imágenes)"
									value={folderPath}
									onChange={(e) => setFolderPath(e.target.value)}
									className="h-7 text-xs"
									disabled={isProcessing}
								/>
							</div>
							<Button
								size="sm"
								className="h-7 text-xs"
								onClick={handleAddFolder}
								disabled={isLoading || isProcessing || !folderPath.trim()}
							>
								{isProcessing ? (
									<>
										<RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
										<span>Agregando...</span>
									</>
								) : (
									<>
										<FolderPlus className="h-3.5 w-3.5 mr-1.5" />
										<span>Agregar</span>
									</>
								)}
							</Button>
						</div>

						<div className="grid grid-cols-2 gap-2">
							{folders.map((folder, index) => (
								<motion.div
									key={folder.id}
									animate={{
										opacity: [0, 1],
										y: [20, 0],
									}}
									transition={{ delay: index * 0.1 }}
									className={cn(
										"bg-muted/30 group rounded-sm",
										selectedFolder === folder.id && "ring-1 ring-primary"
									)}
								>
									<CardContent className="p-2">
										<div className="flex items-center justify-between relative">
											<div className="flex items-center justify-between gap-1 w-full">
												<div className="min-w-full">
													<span className="text-xs font-xs block truncate inline-flex items-center gap-1">
														<Folder className="h-3.5 w-3.5 text-muted-foreground" />
														{folder.name}
													</span>
													<p className="text-[10px] text-muted-foreground truncate">
														{folder.path}
													</p>
													<div className="flex items-center justify-between gap-2 w-full mt-2">
														<Badge
															variant="secondary"
															className="text-[10px] px-2 h-4"
														>
															{folder._count?.images || 0} imágenes
														</Badge>
														<Badge
															variant="secondary"
															className="text-[10px] px-1 h-4"
														>
															{formatBytes(Number(folder.totalSize || 0))}
														</Badge>
														<span className="text-[10px] text-muted-foreground">
															{folder.lastIndexed
																? new Date(folder.lastIndexed).toLocaleString()
																: "No indexado"}
														</span>
													</div>
												</div>
											</div>

											<motion.div
												initial={{ opacity: 0, x: 20 }}
												whileHover={{ opacity: 1, x: 0 }}
												className="flex items-center gap-1 absolute right-0 top-0"
											>
												<TooltipProvider>
													<Tooltip>
														<TooltipTrigger asChild>
															<Button
																size="icon"
																variant="ghost"
																className="h-6 w-6"
																onClick={() => handleReindexFolder(folder.id)}
																disabled={isProcessing}
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
																onClick={() => handleFolderClick(folder.id)}
																disabled={isProcessing}
															>
																<Trash2
																	className={cn(
																		"h-3.5 w-3.5",
																		selectedFolder === folder.id &&
																			"text-destructive-foreground"
																	)}
																/>
															</Button>
														</TooltipTrigger>
														<TooltipContent className="text-xs">
															{selectedFolder === folder.id
																? "Haz clic de nuevo para eliminar"
																: "Haz clic para eliminar"}
														</TooltipContent>
													</Tooltip>
												</TooltipProvider>
											</motion.div>
										</div>

										{isProcessing && processStatus.folderId === folder.id && (
											<motion.div
												initial={{ opacity: 0, height: 0 }}
												animate={{ opacity: 1, height: "auto" }}
												exit={{ opacity: 0, height: 0 }}
												className="mt-3 space-y-1.5"
											>
												<div className="flex justify-between text-xs text-muted-foreground">
													<span>{processStatus.status || "Procesando..."}</span>
													<span>{Math.round(processProgress)}%</span>
												</div>
												<Progress value={processProgress} className="h-1.5" />
												<div className="flex flex-col gap-1">
													{processStatus.currentFile && (
														<p className="text-[10px] text-muted-foreground truncate">
															Archivo actual: {processStatus.currentFile}
														</p>
													)}
													{processStatus.current !== undefined &&
														processStatus.total !== undefined && (
															<p className="text-[10px] text-muted-foreground">
																{processStatus.current} de {processStatus.total}{" "}
																archivos procesados
															</p>
														)}
												</div>
											</motion.div>
										)}
									</CardContent>
								</motion.div>
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
									<p className="text-xs text-muted-foreground">
										No hay carpetas indexadas
									</p>
									<p className="text-[10px] mt-1 text-muted-foreground/75">
										Agrega una carpeta para comenzar a indexar imágenes
									</p>
								</motion.div>
							)}
						</div>
					</div>

					<Separator className="my-2" />
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-1.5">
							<Label className="text-sm">Calidad de Miniaturas</Label>
							<Select
								value={settings.thumbnailQuality}
								onValueChange={handleQualityChange}
							>
								<SelectTrigger className="h-8 text-xs">
									<SelectValue placeholder="Selecciona la calidad" />
								</SelectTrigger>
								<SelectContent>
									{thumbnailQualityOptions.map((option) => (
										<SelectItem
											key={option.value}
											value={option.value}
											className="text-xs"
										>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<p className="text-xs text-muted-foreground">
								Una calidad más alta resultará en miniaturas más nítidas pero
								ocupará más espacio
							</p>
						</div>

						<div className="flex items-center justify-between space-x-4 py-1">
							<div className="space-y-0.5">
								<Label htmlFor="video-animation" className="text-sm">
									Animación en videos
								</Label>
								<p className="text-xs text-muted-foreground">
									Mostrar un preview animado al pasar el cursor sobre videos
								</p>
							</div>
							<Switch
								id="video-animation"
								checked={settings.videoThumbnailAnimation}
								onCheckedChange={handleVideoAnimationToggle}
								className="scale-90"
							/>
						</div>
					</div>

					<div className="flex flex-wrap gap-1.5 pt-2">
						<Button
							variant="outline"
							size="sm"
							className="h-7 text-xs"
							onClick={handleOptimizeThumbnails}
							disabled={isThumbnailLoading || isThumbnailProcessing}
						>
							{isThumbnailProcessing ? (
								<>
									<Zap className="h-3.5 w-3.5 mr-1.5 animate-spin" />
									Optimizando...
								</>
							) : (
								<>
									<Zap className="h-3.5 w-3.5 mr-1.5" />
									Optimizar
								</>
							)}
						</Button>
						<Button
							variant="outline"
							size="sm"
							className="h-7 text-xs"
							onClick={handleReprocessThumbnails}
							disabled={isThumbnailLoading || isThumbnailProcessing}
						>
							{isThumbnailProcessing ? (
								<>
									<Settings2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
									Procesando...
								</>
							) : (
								<>
									<Settings2 className="h-3.5 w-3.5 mr-1.5" />
									Reprocesar
								</>
							)}
						</Button>
						<Button
							variant="outline"
							size="sm"
							className="h-7 text-xs"
							onClick={handleCleanThumbnails}
							disabled={isThumbnailLoading || isThumbnailProcessing}
						>
							{isThumbnailProcessing ? (
								<>
									<Trash2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
									Limpiando...
								</>
							) : (
								<>
									<Trash2 className="h-3.5 w-3.5 mr-1.5" />
									Limpiar
								</>
							)}
						</Button>

						{isThumbnailProcessing && (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setThumbnailProcessing(false)}
								className="h-7 text-xs text-red-500 hover:text-red-600"
							>
								Cancelar
							</Button>
						)}
					</div>

					<Separator className="my-2" />
					<div className="grid grid-cols-2 gap-3">
						<motion.div
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							className="space-y-1.5"
						>
							<Label className="text-sm">Carpetas Indexadas</Label>
							<div className="flex items-center justify-between bg-muted/50 p-2 rounded-lg">
								<span className="text-sm font-medium">
									{stats.totalFolders}
								</span>
								<Badge variant="secondary" className="text-xs">
									Activas
								</Badge>
							</div>
						</motion.div>

						<motion.div
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							className="space-y-1.5"
						>
							<Label className="text-sm">Archivos Indexados</Label>
							<div className="flex items-center justify-between bg-muted/50 p-2 rounded-lg">
								<span className="text-sm font-medium">{stats.totalFiles}</span>
								<Badge variant="secondary" className="text-xs">
									Total
								</Badge>
							</div>
						</motion.div>

						{thumbnailStats && (
							<>
								<motion.div
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: 0.1 }}
									className="space-y-1.5"
								>
									<Label className="text-sm">Miniaturas Pendientes</Label>
									<div className="flex items-center justify-between bg-muted/50 p-2 rounded-lg">
										<span className="text-sm font-medium">
											{thumbnailStats.pending}
										</span>
										<Badge
											variant="secondary"
											className={cn(
												"text-xs",
												thumbnailStats.pending === 0 &&
													"bg-green-500/20 text-green-500"
											)}
										>
											{thumbnailStats.pending === 0 ? "Al día" : "Pendiente"}
										</Badge>
									</div>
								</motion.div>

								<motion.div
									initial={{ opacity: 0, x: 20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: 0.1 }}
									className="space-y-1.5"
								>
									<Label className="text-sm">Errores en Miniaturas</Label>
									<div className="flex items-center justify-between bg-muted/50 p-2 rounded-lg">
										<span className="text-sm font-medium">
											{thumbnailStats.errors.length}
										</span>
										{thumbnailStats.errors.length > 0 ? (
											<Button
												variant="ghost"
												size="sm"
												className="h-6 text-xs text-red-500 hover:text-red-600"
												onClick={() => setShowErrors(true)}
											>
												<AlertCircle className="h-3.5 w-3.5 mr-1" />
												Ver detalles
											</Button>
										) : (
											<Badge
												variant="secondary"
												className="text-xs bg-green-500/20 text-green-500"
											>
												Sin errores
											</Badge>
										)}
									</div>
								</motion.div>
							</>
						)}
					</div>

					{(isProcessing || isThumbnailProcessing) && (
						<motion.div
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: "auto" }}
							exit={{ opacity: 0, height: 0 }}
							className="space-y-1.5 bg-muted/30 p-3 rounded-lg mt-3"
						>
							<div className="flex justify-between text-xs">
								<span>
									{isProcessing
										? `${processStatus.current || 0} de ${
												processStatus.total || 0
										  } (${Math.round(processProgress)}%)`
										: `${thumbnailProcessStatus.current || 0} de ${
												thumbnailProcessStatus.total || 0
										  } (${Math.round(thumbnailProcessStatus.progress || 0)}%)`}
								</span>
								<span className="text-muted-foreground">
									{isProcessing
										? processStatus.status || "Procesando..."
										: thumbnailProcessStatus.status || "Procesando..."}
								</span>
							</div>
							<Progress
								value={
									isProcessing
										? processProgress
										: thumbnailProcessStatus.progress
								}
								className="h-1.5"
							/>
							{(processStatus.currentFile ||
								thumbnailProcessStatus.currentFile) && (
								<p className="text-xs text-muted-foreground truncate">
									{processStatus.currentFile ||
										thumbnailProcessStatus.currentFile}
								</p>
							)}
						</motion.div>
					)}

					{lastProcessedThumbnails.length > 0 && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.3 }}
							className="space-y-1.5 mt-3"
						>
							<Label className="text-sm">Últimas Procesadas</Label>
							<div className="grid grid-cols-3 gap-1.5 bg-muted/30 p-2 rounded-lg">
								<AnimateSharedLayout>
									{lastProcessedThumbnails.map((image, index) => (
										<motion.div
											key={image.id}
											initial={{ opacity: 0, scale: 0.8 }}
											animate={{ opacity: 1, scale: 1 }}
											exit={{ opacity: 0, scale: 0.8 }}
											transition={{ delay: index * 0.1 }}
											className="relative aspect-square rounded-md overflow-hidden bg-muted group"
											style={{
												transform: `scale(${
													image.processedAt ===
													thumbnailProcessStatus.currentFile
														? 1.05
														: 1
												})`,
											}}
										>
											<Image
												src={`/api/images/${image.id}/thumbnail`}
												alt={image.path}
												fill
												className="object-cover transition-transform group-hover:scale-105"
											/>
											<motion.div
												initial={{ opacity: 0 }}
												whileHover={{ opacity: 1 }}
												className="absolute inset-0 bg-black/60 p-1.5"
											>
												<p className="text-[10px] text-white truncate">
													{image.path}
												</p>
												<p className="text-[10px] text-white/70 absolute bottom-1.5 left-1.5">
													{new Date(image.processedAt).toLocaleTimeString()}
												</p>
											</motion.div>
										</motion.div>
									))}
									{Array(9 - lastProcessedThumbnails.length)
										.fill(0)
										.map((_, i) => (
											<motion.div
												key={`empty-${i}`}
												initial={{ opacity: 0 }}
												animate={{ opacity: 1 }}
												transition={{ delay: 0.3 + i * 0.1 }}
												className="aspect-square rounded-md bg-muted/50"
											/>
										))}
								</AnimateSharedLayout>
							</div>
						</motion.div>
					)}
				</div>
			</CardContent>

			<Dialog open={showErrors} onOpenChange={setShowErrors}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>Errores en Miniaturas</DialogTitle>
					</DialogHeader>
					<ScrollArea className="h-[400px] mt-4">
						<div className="space-y-4">
							{thumbnailStats?.errors.map((error) => (
								<motion.div
									key={error.imageId}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									className="p-4 rounded-lg border bg-muted/50"
								>
									<div className="flex justify-between items-start mb-2">
										<span className="font-medium">{error.imagePath}</span>
										<span className="text-sm text-muted-foreground">
											{new Date(error.timestamp).toLocaleString()}
										</span>
									</div>
									<p className="text-sm text-red-500">{error.error}</p>
								</motion.div>
							))}
						</div>
					</ScrollArea>
				</DialogContent>
			</Dialog>
		</Card>
	);
}
