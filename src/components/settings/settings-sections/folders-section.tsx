"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
	TooltipProvider,
	Tooltip,
	TooltipTrigger,
	TooltipContent,
} from "@/components/ui/tooltip";
import {
	folderService,
	getFolders,
	type ProcessStatus,
	type ErrorResponse,
	type FolderResponse,
} from "@/services/folder.service";
import {
	createFolder,
	deleteFolder,
	reindexFolder,
	type FolderCreate,
} from "@/app/actions/folder.actions";
import { useToast } from "@/components/ui/use-toast";
import {
	Folder,
	FolderPlus,
	AlertCircle,
	RefreshCw,
	FolderIcon,
	Trash2,
} from "lucide-react";
import { formatBytes, cn } from "@/lib/utils";
import { motion } from "motion/react";
import type {
	FolderStats,
	ExtendedProcessStatus,
	Folder as FolderType,
} from "@/types/folders";
import { logger } from "@/lib/logger";

const folderLogger = logger.withContext("FoldersSection");

const initialStats: FolderStats = {
	totalFolders: 0,
	totalFiles: 0,
	totalSize: 0,
	lastIndexed: null,
	createdAt: new Date(),
	updatedAt: new Date(),
};

export function FoldersSection() {
	const { toast } = useToast();
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [processProgress, setProcessProgress] = useState(0);
	const [stats, setStats] = useState<FolderStats>(initialStats);
	const [folderPath, setFolderPath] = useState("");
	const [folders, setFolders] = useState<FolderType[]>([]);
	const [processStatus, setProcessStatus] = useState<ExtendedProcessStatus>({});
	const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

	// Suscribirse a eventos del FolderService
	useEffect(() => {
		const handleProgress = (status: ProcessStatus) => {
			if (!status) return;

			folderLogger.info("📊 Progreso del proceso:", status);
			const progress = status.progress || 0;
			setProcessProgress(progress);
			setProcessStatus((prevStatus) => ({
				...prevStatus,
				...status,
				status: status.status || "Procesando...",
			}));
		};

		const handleError = (error: ErrorResponse) => {
			folderLogger.error("❌ Error en el proceso:", error);
			let errorMessage = "Error desconocido al procesar la carpeta";

			if (error instanceof Error) {
				errorMessage = error.message;
			} else if (typeof error === "object" && error !== null) {
				errorMessage = error.message || error.details || JSON.stringify(error);
			}

			toast({
				title: "Error",
				description: errorMessage,
				variant: "destructive",
			});
		};

		const handleComplete = (data: FolderResponse) => {
			if (!data?.folder) return;

			folderLogger.info("✅ Proceso completado:", {
				folderId: data.folder.id,
				stats: data.stats,
			});

			setFolders((prevFolders) =>
				prevFolders.map((folder) =>
					folder.id === data.folder.id ?
						{
							...folder,
							...data.folder,
							_count: {
								images: data.stats?.total || folder._count?.images || 0,
							},
							totalSize: data.stats?.totalSize || folder.totalSize,
							lastIndexed: new Date(),
							createdAt:
								data.folder.createdAt ?
									new Date(data.folder.createdAt)
								:	new Date(),
							updatedAt:
								data.folder.updatedAt ?
									new Date(data.folder.updatedAt)
								:	new Date(),
						}
					:	{
							...folder,
							lastIndexed:
								folder.lastIndexed ? new Date(folder.lastIndexed) : null,
							createdAt: new Date(folder.createdAt),
							updatedAt: new Date(folder.updatedAt),
						}
				)
			);

			if (data.stats) {
				setStats((prevStats) => ({
					...prevStats,
					totalFiles: prevStats.totalFiles + (data.stats?.processed || 0),
					totalSize: prevStats.totalSize + (data.stats?.totalSize || 0),
					lastIndexed: new Date(),
				}));
			}
		};

		const handleStats = (stats: any) => {
			folderLogger.info("📊 Estadísticas actualizadas:", stats);
			setStats((prevStats) => ({
				...prevStats,
				...stats,
			}));
		};

		// Suscribirse a eventos
		folderService.onProgress(handleProgress);
		folderService.onError(handleError);
		folderService.onComplete(handleComplete);
		folderService.onStats(handleStats);

		// Cleanup
		return () => {
			folderLogger.info("🧹 Limpiando suscripciones de eventos");
			folderService.offProgress(handleProgress);
			folderService.offError(handleError);
			folderService.offComplete(handleComplete);
			folderService.offStats(handleStats);
		};
	}, [toast]);

	useEffect(() => {
		const loadInitialData = async () => {
			folderLogger.info("🚀 Cargando datos iniciales");
			await loadStats();
			folderLogger.info("✅ Datos iniciales cargados");
		};

		loadInitialData().catch((error) => {
			folderLogger.error("❌ Error cargando datos iniciales:", error);
			setError(
				error instanceof Error ?
					error.message
				:	"Error cargando datos iniciales"
			);
		});
	}, []);

	const loadFolders = async () => {
		try {
			setIsLoading(true);
			setError(null);
			const folders = await getFolders();

			// Transformar datos de manera segura
			const transformedFolders = folders.map((folder) => ({
				...folder,
				lastIndexed: folder.lastIndexed ? new Date(folder.lastIndexed) : null,
				createdAt: new Date(folder.createdAt || new Date()),
				updatedAt: new Date(folder.updatedAt || new Date()),
				_count: {
					images: folder._count?.images || 0,
				},
				totalSize: Number(folder.totalSize || 0),
			}));

			folderLogger.info("✅ Carpetas cargadas:", {
				count: transformedFolders.length,
			});
			setFolders(transformedFolders);
		} catch (error) {
			folderLogger.error("❌ Error cargando carpetas:", error);
			setError(
				error instanceof Error ?
					error.message
				:	"No se pudieron cargar las carpetas"
			);
		} finally {
			setIsLoading(false);
		}
	};

	const loadStats = async () => {
		try {
			setIsLoading(true);
			setError(null);
			const folders = await getFolders();

			// Calcular estadísticas de manera segura
			const indexStats: FolderStats = {
				totalFolders: folders.length,
				totalFiles: folders.reduce(
					(acc, folder) => acc + (folder._count?.images || 0),
					0
				),
				totalSize: folders.reduce(
					(acc, folder) => acc + Number(folder.totalSize || 0),
					0
				),
				lastIndexed: folders.reduce((acc: Date | null, folder) => {
					if (!folder.lastIndexed) return acc;
					const date = new Date(folder.lastIndexed);
					return !acc || date > acc ? date : acc;
				}, null),
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			folderLogger.info("✅ Estadísticas calculadas:", indexStats);
			setStats(indexStats);

			// Actualizar carpetas con la misma transformación segura
			const transformedFolders = folders.map((folder) => ({
				...folder,
				lastIndexed: folder.lastIndexed ? new Date(folder.lastIndexed) : null,
				createdAt: new Date(folder.createdAt || new Date()),
				updatedAt: new Date(folder.updatedAt || new Date()),
				_count: {
					images: folder._count?.images || 0,
				},
				totalSize: Number(folder.totalSize || 0),
			}));

			setFolders(transformedFolders);
		} catch (error) {
			folderLogger.error("❌ Error cargando estadísticas:", error);
			setError(
				error instanceof Error ?
					error.message
				:	"No se pudieron cargar las estadísticas"
			);
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

			folderLogger.info("🔄 Agregando carpeta:", { path: folderPath });
			await createFolder(folderPath);

			folderLogger.info("✅ Carpeta agregada correctamente");
			setFolderPath("");

			// Recargar datos
			await loadStats();

			toast({
				title: "Carpeta agregada",
				description: "La carpeta se ha agregado correctamente",
			});
		} catch (error) {
			folderLogger.error("❌ Error agregando carpeta:", error);
			toast({
				title: "Error",
				description:
					error instanceof Error ?
						error.message
					:	"Error al agregar la carpeta",
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

			folderLogger.info("🔄 Reindexando carpeta:", { folderId });
			await reindexFolder(folderId);

			folderLogger.info("✅ Carpeta reindexada correctamente");

			// Recargar datos
			await loadStats();

			toast({
				title: "Carpeta reindexada",
				description: "La carpeta se ha reindexado correctamente",
			});
		} catch (error) {
			folderLogger.error("❌ Error reindexando carpeta:", error);
			toast({
				title: "Error",
				description:
					error instanceof Error ?
						error.message
					:	"Error al reindexar la carpeta",
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
			folderLogger.info("🔄 Eliminando carpeta:", { folderId });

			await deleteFolder(folderId);

			folderLogger.info("✅ Carpeta eliminada correctamente");

			// Recargar datos
			await loadStats();

			toast({
				title: "Carpeta eliminada",
				description: "La carpeta se ha eliminado correctamente",
			});
		} catch (error) {
			folderLogger.error("❌ Error eliminando carpeta:", error);
			toast({
				title: "Error",
				description:
					error instanceof Error ?
						error.message
					:	"Error al eliminar la carpeta",
				variant: "destructive",
			});
		}
	};

	const handleFolderClick = async (folderId: string) => {
		if (selectedFolder === folderId) {
			try {
				folderLogger.info("🗑️ Eliminando carpeta por doble click:", {
					folderId,
				});
				await deleteFolder(folderId);

				folderLogger.info("✅ Carpeta eliminada correctamente");
				toast({
					title: "Carpeta eliminada",
					description: "La carpeta se eliminó correctamente",
				});

				await loadStats();
				setSelectedFolder(null);
			} catch (error) {
				folderLogger.error("❌ Error eliminando carpeta:", error);
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

	if (error) {
		return (
			<Card className="p-4">
				<div className="flex flex-col gap-2">
					<div className="flex items-center gap-2 text-destructive">
						<AlertCircle className="h-3.5 w-3.5" />
						<p className="text-xs">{error}</p>
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={() => {
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
								{isProcessing ?
									<>
										<RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
										<span>Agregando...</span>
									</>
								:	<>
										<FolderPlus className="h-3.5 w-3.5 mr-1.5" />
										<span>Agregar</span>
									</>
								}
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
															{folder.lastIndexed ?
																new Date(folder.lastIndexed).toLocaleString()
															:	"No indexado"}
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
															{selectedFolder === folder.id ?
																"Haz clic de nuevo para eliminar"
															:	"Haz clic para eliminar"}
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
					<div className="grid grid-cols-2 gap-3">
						<motion.div
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							className="space-y-1.5"
						>
							<div className="flex items-center justify-between bg-muted/50 p-2 rounded-lg">
								<span className="text-sm font-medium">
									{stats.totalFolders}
								</span>
								<Badge variant="secondary" className="text-xs">
									Carpetas
								</Badge>
							</div>
						</motion.div>

						<motion.div
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							className="space-y-1.5"
						>
							<div className="flex items-center justify-between bg-muted/50 p-2 rounded-lg">
								<span className="text-sm font-medium">{stats.totalFiles}</span>
								<Badge variant="secondary" className="text-xs">
									Archivos
								</Badge>
							</div>
						</motion.div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
