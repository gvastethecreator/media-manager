"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	addFolder,
	reindexFolder,
	getFolders,
	type IndexStats,
	deleteFolder,
} from "@/services/folder.service";
import { useToast } from "@/components/ui/use-toast";
import {
	Folder,
	FolderPlus,
	AlertCircle,
	RefreshCw,
	FolderIcon,
} from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import {
	TooltipProvider,
	Tooltip,
	TooltipTrigger,
	TooltipContent,
} from "@/components/ui/tooltip";
import { Trash2 } from "lucide-react";

interface FolderStats {
	totalFolders: number;
	totalFiles: number;
	totalSize: number;
	lastIndexed: Date | null;
}

interface ProcessStatus {
	status?: string;
	currentFile?: string;
	current?: number;
	total?: number;
	progress?: number;
	folderId?: string;
}

const initialStats: FolderStats = {
	totalFolders: 0,
	totalFiles: 0,
	totalSize: 0,
	lastIndexed: null,
};

export function FoldersSection() {
	const { toast } = useToast();

	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [processProgress, setProcessProgress] = useState(0);
	const [stats, setStats] = useState<FolderStats>(initialStats);
	const [folderPath, setFolderPath] = useState("");
	const [folders, setFolders] = useState<any[]>([]);
	const [processStatus, setProcessStatus] = useState<ProcessStatus>({});
	const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

	// Cargar carpetas al montar el componente
	useEffect(() => {
		loadStats();
	}, []);

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
				onProgress: (stats) => {
					setProcessProgress(stats.progress || 0);
					setProcessStatus((prevStatus) => ({
						...prevStatus,
						...stats,
						status: stats.status || "Procesando...",
					}));
				},
				onError: (error) => {
					console.error("Error en el proceso:", error);
					if (error.name === "FOLDER_EXISTS") {
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
							description: error.message || "Error al procesar la carpeta",
							variant: "destructive",
						});
					}
				},
				onComplete: async (data) => {
					toast({
						title: "Carpeta agregada",
						description: `Se agregó la carpeta correctamente`,
					});
					setFolderPath("");
					await loadStats();
				},
			});
		} catch (error) {
			console.error("Error agregando carpeta:", error);
			toast({
				title: "Error",
				description:
					error instanceof Error
						? error.message
						: "No se pudo agregar la carpeta",
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

			await reindexFolder({
				id: folderId,
				onProgress: (stats) => {
					setProcessProgress(stats.progress || 0);
					setProcessStatus((prevStatus) => ({
						...prevStatus,
						...stats,
						folderId,
						status: stats.status || "Procesando...",
					}));
				},
				onError: (error) => {
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
				onComplete: async (data) => {
					toast({
						title: "Reindexación completada",
						description:
							data?.errors > 0
								? `Se completó la reindexación con ${data.errors} errores`
								: "Se ha completado la reindexación correctamente",
						variant: data?.errors > 0 ? "destructive" : "default",
					});
					await loadStats();
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
			await reindexFolder({
				id: folderId,
				onProgress: () => {},
				onError: () => {},
				onComplete: () => {},
			});

			// Recargar carpetas y estadísticas
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
		<div>
			<Card className="border-none">
				<CardHeader className="px-2 py-0">
					<CardTitle className="text-base font-semibold flex items-center gap-2">
						<FolderIcon className="h-5 w-5" /> Carpetas Indexadas
					</CardTitle>
				</CardHeader>
				<CardContent className="p-2 w-full">
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

					{isProcessing && (
						<div className="space-y-1.5 px-2">
							<div className="flex justify-between text-xs text-muted-foreground">
								<span>{processStatus.status || "Procesando..."}</span>
								<span>
									{processStatus.current}/{processStatus.total} archivos
								</span>
							</div>
							<Progress value={processProgress} className="h-1.5" />
						</div>
					)}

					{isLoading ? (
						<div className="py-4 text-center text-xs text-muted-foreground">
							<RefreshCw className="h-3.5 w-3.5 animate-spin mx-auto mb-2" />
							Cargando carpetas...
						</div>
					) : folders.length > 0 ? (
						<div className="space-y-2 mt-2 grid grid-cols-2 gap-2">
							{folders.map((folder) => (
								<Card key={folder.id} className="bg-muted/30 rounded-none">
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

											<div className="flex items-center gap-1 absolute right-0 top-0">
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
											</div>
										</div>

										{isProcessing && processStatus.folderId === folder.id && (
											<div className="mt-3 space-y-1.5">
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
											</div>
										)}
									</CardContent>
								</Card>
							))}
						</div>
					) : (
						<div className="py-4 text-center">
							<Folder className="h-6 w-6 mx-auto mb-2 text-muted-foreground/50" />
							<p className="text-xs text-muted-foreground">
								No hay carpetas indexadas
							</p>
							<p className="text-[10px] mt-1 text-muted-foreground/75">
								Agrega una carpeta para comenzar a indexar imágenes
							</p>
						</div>
					)}

					<div className="pt-2 grid grid-cols-2 items-center gap-4">
						<div className="flex items-center justify-between">
							<span className="text-xs text-muted-foreground">
								Carpetas indexadas
							</span>
							<Badge
								variant="outline"
								className="text-[10px] font-mono h-4 px-1"
							>
								{stats.totalFolders}
							</Badge>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-xs text-muted-foreground">
								Archivos indexados
							</span>
							<Badge
								variant="outline"
								className="text-[10px] font-mono h-4 px-1"
							>
								{stats.totalFiles}
							</Badge>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-xs text-muted-foreground">
								Espacio total
							</span>
							<Badge
								variant="outline"
								className="text-[10px] font-mono h-4 px-1"
							>
								{formatBytes(stats.totalSize)}
							</Badge>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-xs text-muted-foreground">
								Última indexación
							</span>
							<Badge
								variant="outline"
								className="text-[10px] font-mono h-4 px-1"
							>
								{stats.lastIndexed
									? stats.lastIndexed.toLocaleString()
									: "Nunca"}
							</Badge>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
