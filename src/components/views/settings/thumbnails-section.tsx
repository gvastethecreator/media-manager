import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ThumbnailService, ProcessStatus } from "@/services/thumbnail.service";
import { useToast } from "@/components/ui/use-toast";
import { logger } from "@/lib/logger";

const thumbLogger = logger.withContext("ThumbnailsSection");

interface ThumbnailStats {
	total: number;
	pending: number;
	totalSize: number;
	errors: Array<{
		imageId: string;
		imagePath: string;
		error: string;
		timestamp: string;
	}>;
}

export function ThumbnailsSection() {
	const [stats, setStats] = useState<ThumbnailStats | null>(null);
	const [isProcessing, setIsProcessing] = useState(false);
	const [processProgress, setProcessProgress] = useState(0);
	const [processStatus, setProcessStatus] = useState<ProcessStatus>({});
	const { toast } = useToast();
	const thumbnailService = new ThumbnailService();

	const handleOptimizeThumbnails = async () => {
		try {
			setIsProcessing(true);
			setProcessProgress(0);
			setProcessStatus({
				status: "Iniciando optimización...",
				current: 0,
				total: 0,
				progress: 0,
			});

			await thumbnailService.optimizeThumbnails({
				onProgress: (status) => {
					setProcessProgress(status.progress || 0);
					setProcessStatus(status);
				},
				onError: (error) => {
					toast({
						title: "Error",
						description: error.message || "Error al optimizar miniaturas",
						variant: "destructive",
					});
				},
				onComplete: (data) => {
					toast({
						title: "Optimización completada",
						description: `Se optimizaron ${data.optimized} de ${data.total} miniaturas`,
					});
					setIsProcessing(false);
					setProcessProgress(0);
					setProcessStatus({});
				},
			});
		} catch (error) {
			thumbLogger.error("Error optimizing thumbnails:", error);
			toast({
				title: "Error",
				description:
					error instanceof Error
						? error.message
						: "Error al optimizar miniaturas",
				variant: "destructive",
			});
			setIsProcessing(false);
		}
	};

	const handleReprocessThumbnails = async () => {
		try {
			setIsProcessing(true);
			setProcessProgress(0);
			setProcessStatus({
				status: "Iniciando reprocesamiento...",
				current: 0,
				total: 0,
				progress: 0,
			});

			await thumbnailService.reprocessAll({
				onProgress: (status) => {
					setProcessProgress(status.progress || 0);
					setProcessStatus(status);
				},
				onError: (error) => {
					toast({
						title: "Error",
						description: error.message || "Error al reprocesar miniaturas",
						variant: "destructive",
					});
				},
				onComplete: (data) => {
					toast({
						title: "Reprocesamiento completado",
						description: `Se procesaron ${data.processed} de ${data.total} miniaturas`,
					});
					setIsProcessing(false);
					setProcessProgress(0);
					setProcessStatus({});
				},
			});
		} catch (error) {
			thumbLogger.error("Error reprocessing thumbnails:", error);
			toast({
				title: "Error",
				description:
					error instanceof Error
						? error.message
						: "Error al reprocesar miniaturas",
				variant: "destructive",
			});
			setIsProcessing(false);
		}
	};

	const handleCleanThumbnails = async () => {
		try {
			setIsProcessing(true);
			setProcessProgress(0);
			setProcessStatus({
				status: "Iniciando limpieza...",
				current: 0,
				total: 0,
				progress: 0,
			});

			await thumbnailService.cleanThumbnails({
				onProgress: (status) => {
					setProcessProgress(status.progress || 0);
					setProcessStatus(status);
				},
				onError: (error) => {
					toast({
						title: "Error",
						description: error.message || "Error al limpiar miniaturas",
						variant: "destructive",
					});
				},
				onComplete: (data) => {
					toast({
						title: "Limpieza completada",
						description: `Se limpiaron ${data.cleaned} de ${data.total} miniaturas`,
					});
					setIsProcessing(false);
					setProcessProgress(0);
					setProcessStatus({});
				},
			});
		} catch (error) {
			thumbLogger.error("Error cleaning thumbnails:", error);
			toast({
				title: "Error",
				description:
					error instanceof Error
						? error.message
						: "Error al limpiar miniaturas",
				variant: "destructive",
			});
			setIsProcessing(false);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Miniaturas</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex flex-col gap-4">
					<div className="flex gap-4">
						<Button onClick={handleOptimizeThumbnails} disabled={isProcessing}>
							Optimizar miniaturas
						</Button>
						<Button onClick={handleReprocessThumbnails} disabled={isProcessing}>
							Reprocesar miniaturas
						</Button>
						<Button
							onClick={handleCleanThumbnails}
							disabled={isProcessing}
							variant="destructive"
						>
							Limpiar miniaturas
						</Button>
					</div>

					{isProcessing && (
						<div className="space-y-2">
							<Progress value={processProgress} />
							<Alert>
								<AlertDescription>
									{processStatus.status} {processStatus.current} de{" "}
									{processStatus.total}
									{processStatus.lastProcessed && (
										<div className="text-sm text-muted-foreground mt-1">
											Último archivo: {processStatus.lastProcessed.path}
										</div>
									)}
								</AlertDescription>
							</Alert>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
