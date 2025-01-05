"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
	RefreshCw,
	AlertCircle,
	Settings2,
	Zap,
	ImageIcon,
	Trash2,
} from "lucide-react";
import { useSettingsContext } from "@/context/settings-context";
import {
	thumbnailService,
	type ThumbnailStats,
	type ThumbnailQuality,
} from "@/services/thumbnail.service";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { formatBytes, cn } from "@/lib/utils";
import Image from "next/image";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";

const MotionCard = motion(Card);

interface ProcessStatus {
	status?: string;
	currentFile?: string;
	current?: number;
	total?: number;
	progress?: number;
}

interface LastProcessedThumbnail {
	id: string;
	path: string;
	thumbnailPath: string;
	processedAt: string;
}

const thumbnailQualityOptions: { value: ThumbnailQuality; label: string }[] = [
	{ value: "compressed", label: "Comprimida (más rápido, menos espacio)" },
	{ value: "low", label: "Baja (balance entre calidad y espacio)" },
	{ value: "mid", label: "Media (recomendado)" },
	{ value: "high", label: "Alta (mejor calidad, más espacio)" },
];

export function ThumbnailsSection() {
	const { settings, updateSettings } = useSettingsContext();
	const [stats, setStats] = useState<ThumbnailStats | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [isOptimizing, setIsOptimizing] = useState(false);
	const [isCleaning, setIsCleaning] = useState(false);
	const [showConfirmClean, setShowConfirmClean] = useState(false);
	const [progress, setProgress] = useState<{
		current: number;
		total: number;
		progress: number;
		currentFile: string;
		status: string;
	} | null>(null);
	const [showErrors, setShowErrors] = useState(false);
	const { toast } = useToast();
	const [error, setError] = useState<string | null>(null);
	const [processProgress, setProcessProgress] = useState(0);
	const [processStatus, setProcessStatus] = useState<ProcessStatus>({});
	const [lastProcessedThumbnails, setLastProcessedThumbnails] = useState<
		LastProcessedThumbnail[]
	>([]);
	const [selectedQuality, setSelectedQuality] =
		useState<ThumbnailQuality>("mid");

	const loadStats = React.useCallback(async () => {
		try {
			const stats = await thumbnailService.getStats();
			setStats(stats);
		} catch (error) {
			console.error("Error cargando estadísticas:", error);
			toast({
				title: "Error",
				description:
					error instanceof Error
						? error.message
						: "Error al cargar estadísticas de miniaturas",
				variant: "destructive",
			});
		}
	}, [toast]);

	const updateProgressSmooth = React.useCallback(
		(newProgress: typeof progress) => {
			if (!newProgress) return;

			setProgress((prev) => {
				if (!prev) return newProgress;

				// Suavizar la transición del progreso
				return {
					...newProgress,
					progress:
						prev.progress + (newProgress.progress - prev.progress) * 0.3,
				};
			});
		},
		[]
	);

	const handleReprocessThumbnails = async () => {
		if (isProcessing) return;

		try {
			setError(null);
			setIsProcessing(true);
			setProcessProgress(0);
			setProcessStatus({
				status: "Iniciando reprocesamiento...",
				current: 0,
				total: 0,
				progress: 0,
			});

			await thumbnailService.reprocessAll((event) => {
				if (event.type === "progress") {
					setProcessProgress(event.data.progress || 0);
					setProcessStatus((prevStatus) => ({
						...prevStatus,
						...event.data,
						status: event.data.status || "Procesando...",
					}));

					if (event.data.lastProcessed) {
						setLastProcessedThumbnails((prev) => {
							const newThumbnails = [...prev];
							newThumbnails.unshift(event.data.lastProcessed);
							return newThumbnails.slice(0, 9); // Mantener solo los últimos 9
						});
					}
				} else if (event.type === "error") {
					toast({
						title: "Error",
						description: event.data.error || "Error al procesar miniaturas",
						variant: "destructive",
					});
				} else if (event.type === "complete") {
					toast({
						title: "Proceso completado",
						description: `Se procesaron ${event.data.processed} de ${
							event.data.total
						} miniaturas${
							event.data.errors > 0 ? ` con ${event.data.errors} errores` : ""
						}`,
						variant: event.data.errors > 0 ? "destructive" : "default",
					});
					loadStats();
				}
			});
		} catch (error) {
			console.error("Error reprocesando miniaturas:", error);
			toast({
				title: "Error",
				description:
					error instanceof Error
						? error.message
						: "Error al reprocesar miniaturas",
				variant: "destructive",
			});
		} finally {
			await new Promise((resolve) => setTimeout(resolve, 500));
			setIsProcessing(false);
			setProcessProgress(0);
			setProcessStatus({});
		}
	};

	const handleQualityChange = async (quality: ThumbnailQuality) => {
		await updateSettings({ thumbnailQuality: quality });
	};

	const handleVideoAnimationToggle = async (enabled: boolean) => {
		await updateSettings({ videoThumbnailAnimation: enabled });
	};

	const handleCleanThumbnails = async () => {
		if (isProcessing) return;

		try {
			setError(null);
			setIsProcessing(true);
			setProcessProgress(0);
			setProcessStatus({
				status: "Iniciando limpieza...",
				current: 0,
				total: 0,
				progress: 0,
			});

			await thumbnailService.cleanThumbnails((event) => {
				if (event.type === "progress") {
					setProcessProgress(event.data.progress || 0);
					setProcessStatus((prevStatus) => ({
						...prevStatus,
						...event.data,
						status: event.data.status || "Limpiando...",
					}));
				} else if (event.type === "error") {
					toast({
						title: "Error",
						description: event.data.error || "Error al limpiar miniaturas",
						variant: "destructive",
					});
				} else if (event.type === "complete") {
					toast({
						title: "Limpieza completada",
						description: `Se limpiaron ${event.data.cleaned} de ${event.data.total} miniaturas`,
					});
					setLastProcessedThumbnails([]); // Limpiar grid de miniaturas
					loadStats();
				}
			});
		} catch (error) {
			console.error("Error limpiando miniaturas:", error);
			toast({
				title: "Error",
				description:
					error instanceof Error
						? error.message
						: "Error al limpiar miniaturas",
				variant: "destructive",
			});
		} finally {
			await new Promise((resolve) => setTimeout(resolve, 500));
			setIsProcessing(false);
			setProcessProgress(0);
			setProcessStatus({});
		}
	};

	const handleOptimizeThumbnails = async () => {
		if (isProcessing) return;

		try {
			setError(null);
			setIsProcessing(true);
			setProcessProgress(0);
			setProcessStatus({
				status: "Iniciando optimización...",
				current: 0,
				total: 0,
				progress: 0,
			});

			await thumbnailService.optimizeThumbnails((event) => {
				if (event.type === "progress") {
					setProcessProgress(event.data.progress || 0);
					setProcessStatus((prevStatus) => ({
						...prevStatus,
						...event.data,
						status: event.data.status || "Optimizando...",
					}));

					if (event.data.lastProcessed) {
						setLastProcessedThumbnails((prev) => {
							const newThumbnails = [...prev];
							newThumbnails.unshift(event.data.lastProcessed);
							return newThumbnails.slice(0, 9);
						});
					}
				} else if (event.type === "error") {
					toast({
						title: "Error",
						description: event.data.error || "Error al optimizar miniaturas",
						variant: "destructive",
					});
				} else if (event.type === "complete") {
					toast({
						title: "Optimización completada",
						description: `Se optimizaron ${event.data.optimized} de ${event.data.total} miniaturas`,
					});
					loadStats();
				}
			});
		} catch (error) {
			console.error("Error optimizando miniaturas:", error);
			toast({
				title: "Error",
				description:
					error instanceof Error
						? error.message
						: "Error al optimizar miniaturas",
				variant: "destructive",
			});
		} finally {
			await new Promise((resolve) => setTimeout(resolve, 500));
			setIsProcessing(false);
			setProcessProgress(0);
			setProcessStatus({});
		}
	};

	const handleCancel = () => {
		thumbnailService.cancelProcessing();
		setIsProcessing(false);
		setIsOptimizing(false);
		setProgress(null);
		toast({
			title: "Cancelado",
			description: "El proceso ha sido cancelado",
		});
	};

	React.useEffect(() => {
		loadStats();
	}, [loadStats]);

	return (
		<Card className="flex flex-col gap-2 bg-muted/30 rounded-sm">
			<CardHeader className="p-2 pb-0 bg-transparent">
				<CardTitle className="text-base text-muted-foreground font-semibold flex items-center justify-between pl-1">
					<span className="flex items-center gap-2 h-7">
						<ImageIcon className="h-5 w-5" /> Configuración de Miniaturas
					</span>
				</CardTitle>
			</CardHeader>
			<Separator className="my-0" />
			<CardContent className="p-2">
				<div className="grid grid-cols-1 gap-2">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						className="grid grid-cols-2 gap-2"
					>
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
					</motion.div>

					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.1 }}
						className="flex flex-wrap gap-1.5 pt-2"
					>
						<Button
							variant="outline"
							size="sm"
							className="h-7 text-xs"
							onClick={handleOptimizeThumbnails}
							disabled={isLoading || isOptimizing || isProcessing || isCleaning}
						>
							{isOptimizing ? (
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
							disabled={isLoading || isOptimizing || isProcessing || isCleaning}
						>
							{isProcessing ? (
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
							onClick={() => setShowConfirmClean(true)}
							disabled={isLoading || isOptimizing || isProcessing || isCleaning}
						>
							{isCleaning ? (
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

						{(isProcessing || isOptimizing || isCleaning) && (
							<Button
								variant="ghost"
								size="sm"
								onClick={handleCancel}
								className="h-7 text-xs text-red-500 hover:text-red-600"
							>
								Cancelar
							</Button>
						)}
					</motion.div>

					{stats && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.2 }}
						>
							<Separator className="my-2" />
							<div className="grid grid-cols-2 gap-3">
								<motion.div
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									className="space-y-1.5"
								>
									<Label className="text-sm">Total de Miniaturas</Label>
									<div className="flex items-center justify-between bg-muted/50 p-2 rounded-lg">
										<span className="text-sm font-medium">{stats.total}</span>
										<Badge variant="secondary" className="text-xs">
											Generadas
										</Badge>
									</div>
								</motion.div>

								<motion.div
									initial={{ opacity: 0, x: 20 }}
									animate={{ opacity: 1, x: 0 }}
									className="space-y-1.5"
								>
									<Label className="text-sm">Peso en Base de Datos</Label>
									<div className="flex items-center justify-between bg-muted/50 p-2 rounded-lg">
										<span className="text-sm font-medium">
											{formatBytes(stats.totalSize)}
										</span>
										<Badge variant="secondary" className="text-xs">
											Optimizado
										</Badge>
									</div>
								</motion.div>

								<motion.div
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: 0.1 }}
									className="space-y-1.5"
								>
									<Label className="text-sm">Pendientes</Label>
									<div className="flex items-center justify-between bg-muted/50 p-2 rounded-lg">
										<span className="text-sm font-medium">
											{stats.pending}
										</span>
										<Badge
											variant="secondary"
											className={cn(
												"text-xs",
												stats.pending === 0 &&
													"bg-green-500/20 text-green-500"
											)}
										>
											{stats.pending === 0 ? "Al día" : "Pendiente"}
										</Badge>
									</div>
								</motion.div>

								<motion.div
									initial={{ opacity: 0, x: 20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: 0.1 }}
									className="space-y-1.5"
								>
									<Label className="text-sm">Con Error</Label>
									<div className="flex items-center justify-between bg-muted/50 p-2 rounded-lg">
										<span className="text-sm font-medium">
											{stats.errors.length}
										</span>
										{stats.errors.length > 0 ? (
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
							</div>

							{progress && (
								<motion.div
									initial={{ opacity: 0, height: 0 }}
									animate={{ opacity: 1, height: "auto" }}
									exit={{ opacity: 0, height: 0 }}
									className="space-y-1.5 bg-muted/30 p-3 rounded-lg mt-3"
								>
									<div className="flex justify-between text-xs">
										<span>
											{progress.current} de {progress.total} (
											{Math.round(progress.progress)}%)
										</span>
										<span className="text-muted-foreground">
											{progress.status}
										</span>
									</div>
									<Progress value={progress.progress} className="h-1.5" />
									<p className="text-xs text-muted-foreground truncate">
										{progress.currentFile}
									</p>
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
										<AnimatePresence>
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
															image.processedAt === progress?.currentFile
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
										</AnimatePresence>
									</div>
								</motion.div>
							)}
						</motion.div>
					)}
				</div>
			</CardContent>

			<Dialog open={showConfirmClean} onOpenChange={setShowConfirmClean}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Confirmar Limpieza</DialogTitle>
						<DialogDescription>
							¿Estás seguro de que quieres eliminar todas las miniaturas? Esta
							acción no se puede deshacer.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowConfirmClean(false)}
							disabled={isCleaning}
						>
							Cancelar
						</Button>
						<Button
							variant="destructive"
							onClick={handleCleanThumbnails}
							disabled={isCleaning}
						>
							{isCleaning ? "Limpiando..." : "Limpiar"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={showErrors} onOpenChange={setShowErrors}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>Errores en Miniaturas</DialogTitle>
					</DialogHeader>
					<ScrollArea className="h-[400px] mt-4">
						<div className="space-y-4">
							{stats?.errors.map((error) => (
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
