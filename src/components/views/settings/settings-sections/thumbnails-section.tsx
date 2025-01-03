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
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { formatBytes } from "@/lib/utils";

const thumbnailQualityOptions: { value: ThumbnailQuality; label: string }[] = [
	{ value: "compressed", label: "Comprimida (más rápido, menos espacio)" },
	{ value: "low", label: "Baja (balance entre calidad y espacio)" },
	{ value: "mid", label: "Media (recomendado)" },
	{ value: "high", label: "Alta (mejor calidad, más espacio)" },
];

export function ThumbnailsSection() {
	const { settings, updateSettings } = useSettingsContext();
	const [stats, setStats] = React.useState<ThumbnailStats>();
	const [isLoading, setIsLoading] = React.useState(false);
	const [isOptimizing, setIsOptimizing] = React.useState(false);
	const [progress, setProgress] = React.useState<{
		current: number;
		total: number;
		progress: number;
		currentFile: string;
		status: string;
	} | null>(null);
	const [showErrors, setShowErrors] = React.useState(false);
	const { toast } = useToast();

	const handleQualityChange = async (quality: ThumbnailQuality) => {
		await updateSettings({ thumbnailQuality: quality });
	};

	const handleVideoAnimationToggle = async (enabled: boolean) => {
		await updateSettings({ videoThumbnailAnimation: enabled });
	};

	const handleReprocessThumbnails = async () => {
		try {
			setIsLoading(true);
			setProgress(null);

			let errorCount = 0;
			const maxErrors = 5; // Máximo de errores antes de abortar

			await thumbnailService.reprocessAll((event) => {
				if (event.type === "progress") {
					setProgress(event.data);
				} else if (event.type === "error") {
					errorCount++;
					toast({
						title: "Error",
						description: (
							<div className="space-y-2">
								<p>Error procesando {event.data.file}:</p>
								<p className="text-sm text-red-500">{event.data.error}</p>
								{errorCount >= maxErrors && (
									<p className="text-sm font-medium">
										Demasiados errores, el proceso se detendrá.
									</p>
								)}
							</div>
						),
						variant: "destructive",
					});

					if (errorCount >= maxErrors) {
						throw new Error("Demasiados errores consecutivos");
					}
				} else if (event.type === "complete") {
					toast({
						title: "Completado",
						description: `Se procesaron ${event.data.processed} de ${event.data.total} imágenes`,
					});
					loadStats();
				}
			});
		} catch (error) {
			console.error("Error reprocesando miniaturas:", error);
			toast({
				title: "Error",
				description: (
					<div className="space-y-2">
						<p>
							{error instanceof Error
								? error.message
								: "Error al reprocesar las miniaturas"}
						</p>
						<p className="text-sm text-muted-foreground">
							Revisa los logs para más detalles
						</p>
					</div>
				),
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
			setProgress(null);
		}
	};

	const handleOptimizeThumbnails = async () => {
		try {
			setIsOptimizing(true);
			setProgress(null);

			let errorCount = 0;
			const maxErrors = 5;

			await thumbnailService.optimizeThumbnails((event) => {
				if (event.type === "progress") {
					setProgress(event.data);
				} else if (event.type === "error") {
					errorCount++;
					toast({
						title: "Error",
						description: (
							<div className="space-y-2">
								<p>Error optimizando {event.data.file}:</p>
								<p className="text-sm text-red-500">{event.data.error}</p>
								{errorCount >= maxErrors && (
									<p className="text-sm font-medium">
										Demasiados errores, el proceso se detendrá.
									</p>
								)}
							</div>
						),
						variant: "destructive",
					});

					if (errorCount >= maxErrors) {
						throw new Error("Demasiados errores consecutivos");
					}
				} else if (event.type === "complete") {
					toast({
						title: "Completado",
						description: `Se optimizaron ${event.data.optimized} de ${event.data.total} miniaturas`,
					});
					loadStats();
				}
			});
		} catch (error) {
			console.error("Error optimizando miniaturas:", error);
			toast({
				title: "Error",
				description: (
					<div className="space-y-2">
						<p>
							{error instanceof Error
								? error.message
								: "Error al optimizar las miniaturas"}
						</p>
						<p className="text-sm text-muted-foreground">
							Revisa los logs para más detalles
						</p>
					</div>
				),
				variant: "destructive",
			});
		} finally {
			setIsOptimizing(false);
			setProgress(null);
		}
	};

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

	React.useEffect(() => {
		loadStats();
	}, [loadStats]);

	return (
		<div className="space-y-6">
			<Card className="border-none py-6">
				<CardHeader className="px-4 py-2">
					<CardTitle className="text-xl font-semibold flex items-center">
						<ImageIcon className="h-6 w-6 mr-2" /> Miniaturas
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="space-y-4 flex flex-col-2 gap-4">
						<div className="space-y-2 w-1/2">
							<Label>Calidad de Miniaturas</Label>
							<Select
								value={settings.thumbnailQuality}
								onValueChange={handleQualityChange}
							>
								<SelectTrigger>
									<SelectValue placeholder="Selecciona la calidad" />
								</SelectTrigger>
								<SelectContent>
									{thumbnailQualityOptions.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<p className="text-sm text-muted-foreground">
								Una calidad más alta resultará en miniaturas más nítidas pero
								ocupará más espacio
							</p>
						</div>

						<div className="flex items-center justify-between space-x-2">
							<div className="space-y-0.5">
								<Label htmlFor="video-animation">Animación en videos</Label>
								<p className="text-sm text-muted-foreground">
									Mostrar un preview animado al pasar el cursor sobre videos
								</p>
							</div>
							<Switch
								id="video-animation"
								checked={settings.videoThumbnailAnimation}
								onCheckedChange={handleVideoAnimationToggle}
							/>
						</div>

						<div className="space-y-4 flex flex-col-2 gap-4">
							<div className="flex items-center justify-between">
								<div className="flex items-center space-x-2">
									<Button
										variant="outline"
										size="sm"
										onClick={handleOptimizeThumbnails}
										disabled={isLoading || isOptimizing}
									>
										{isOptimizing ? (
											<>
												<Zap className="h-4 w-4 mr-2 animate-spin" />
												Optimizando...
											</>
										) : (
											<>
												<Zap className="h-4 w-4 mr-2" />
												Optimizar
											</>
										)}
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={handleReprocessThumbnails}
										disabled={isLoading || isOptimizing}
									>
										{isLoading ? (
											<>
												<Settings2 className="h-4 w-4 mr-2 animate-spin" />
												Procesando...
											</>
										) : (
											<>
												<Settings2 className="h-4 w-4 mr-2" />
												Reprocesar
											</>
										)}
									</Button>
								</div>
							</div>

							{progress && (
								<div className="space-y-2">
									<div className="flex justify-between text-sm text-muted-foreground">
										<span>
											{progress.current} de {progress.total} (
											{progress.progress}%)
										</span>
										<span>{progress.status}</span>
									</div>
									<Progress value={progress.progress} />
									<p className="text-sm text-muted-foreground truncate">
										{progress.currentFile}
									</p>
								</div>
							)}
						</div>

						{stats && (
							<div className="space-y-4 pt-4 border-t">
								<div className="space-y-2">
									<Label>Total de Miniaturas</Label>
									<div className="flex items-center justify-between bg-muted p-2 rounded-md">
										<span className="text-sm font-medium">{stats.total}</span>
										<Badge variant="secondary">Generadas</Badge>
									</div>
								</div>

								<div className="space-y-2">
									<Label>Peso en Base de Datos</Label>
									<div className="flex items-center justify-between bg-muted p-2 rounded-md">
										<span className="text-sm font-medium">
											{formatBytes(stats.totalSize)}
										</span>
										<Badge variant="secondary">Optimizado</Badge>
									</div>
								</div>

								<div className="space-y-2">
									<Label>Pendientes</Label>
									<div className="flex items-center justify-between bg-muted p-2 rounded-md">
										<span className="text-sm font-medium">{stats.pending}</span>
										<Badge
											variant="secondary"
											className={
												stats.pending === 0 ? "bg-green-500" : undefined
											}
										>
											{stats.pending === 0 ? "Al día" : "Pendiente"}
										</Badge>
									</div>
								</div>

								<div className="space-y-2">
									<Label>Con Error</Label>
									<div className="flex items-center justify-between bg-muted p-2 rounded-md">
										<span className="text-sm font-medium">
											{stats.errors.length}
										</span>
										{stats.errors.length > 0 ? (
											<Button
												variant="ghost"
												size="sm"
												className="h-6 text-red-500 hover:text-red-600"
												onClick={() => setShowErrors(true)}
											>
												<AlertCircle className="h-4 w-4 mr-1" />
												Ver detalles
											</Button>
										) : (
											<Badge variant="secondary" className="bg-green-500">
												Sin errores
											</Badge>
										)}
									</div>
								</div>

								{stats.recentlyProcessed.length > 0 && (
									<div className="space-y-2">
										<Label>Últimas Procesadas</Label>
										<div className="space-y-2">
											{stats.recentlyProcessed.map((image) => (
												<div
													key={image.id}
													className="flex items-center justify-between bg-muted p-2 rounded-md"
												>
													<span className="text-sm font-medium truncate flex-1 mr-4">
														{image.path}
													</span>
													<span className="text-sm text-muted-foreground">
														{new Date(image.processedAt).toLocaleString()}
													</span>
												</div>
											))}
										</div>
									</div>
								)}
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			<Dialog open={showErrors} onOpenChange={setShowErrors}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>Errores en Miniaturas</DialogTitle>
					</DialogHeader>
					<ScrollArea className="h-[400px] mt-4">
						<div className="space-y-4">
							{stats?.errors.map((error) => (
								<div
									key={error.imageId}
									className="p-4 rounded-lg border bg-muted"
								>
									<div className="flex justify-between items-start mb-2">
										<span className="font-medium">{error.imagePath}</span>
										<span className="text-sm text-muted-foreground">
											{new Date(error.timestamp).toLocaleString()}
										</span>
									</div>
									<p className="text-sm text-red-500">{error.error}</p>
								</div>
							))}
						</div>
					</ScrollArea>
				</DialogContent>
			</Dialog>
		</div>
	);
}
