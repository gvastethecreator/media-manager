"use client";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatBytes } from "@/lib/format-utils";
import { cn } from "@/lib/utils";
import type { ExtendedProcessStatus, ProcessPhase } from "@/types/process";
import { Code, File, FileWarning, Folder, HelpCircle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";

interface FolderProgressDetailsProps {
	status: ExtendedProcessStatus;
	isProcessing: boolean;
	className?: string;
}

export function FolderProgressDetails({
	status,
	isProcessing,
	className,
}: FolderProgressDetailsProps) {
	const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());
	const [isStale, setIsStale] = useState<boolean>(false);

	// Verificar si el estado está estancado (sin actualizaciones por más de 10 segundos)
	useEffect(() => {
		if (isProcessing && status.status) {
			setLastUpdateTime(Date.now());
			setIsStale(false);
		}

		// Configurar un temporizador para verificar si el estado se ha quedado estancado
		const timer = setInterval(() => {
			if (isProcessing && Date.now() - lastUpdateTime > 10000) {
				setIsStale(true);
			}
		}, 5000);

		return () => clearInterval(timer);
	}, [isProcessing, status, lastUpdateTime]);

	// Función para renderizar el icono según la fase actual
	const getPhaseIcon = useCallback(() => {
		const phase = status.phase as ProcessPhase;
		switch (phase) {
			case "scanning":
				return <Folder className="h-3.5 w-3.5 text-blue-500" />;
			case "indexing":
				return <File className="h-3.5 w-3.5 text-green-500" />;
			case "thumbnails":
				return <File className="h-3.5 w-3.5 text-purple-500" />;
			case "metadata":
				return <Code className="h-3.5 w-3.5 text-yellow-500" />;
			case "error":
				return <FileWarning className="h-3.5 w-3.5 text-red-500" />;
			default:
				return <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />;
		}
	}, [status.phase]);

	// Obtener el progreso actual
	const progress = status.progress || 0;

	// Averiguar si se debe mostrar el contador de archivos
	const showFileCounter =
		isProcessing &&
		typeof status.filesProcessed === "number" &&
		typeof status.totalFiles === "number";

	// Formatear el tiempo de procesamiento
	const getProcessingTime = useCallback(() => {
		if (!status.startTime) {
			return "";
		}

		const endTime = status.endTime || Date.now();
		const duration = Math.max(1, endTime - status.startTime);

		// Formato como minutos:segundos si es relevante
		const minutes = Math.floor(duration / 60000);
		const seconds = Math.floor((duration % 60000) / 1000);

		if (minutes > 0) {
			return `${minutes}m ${seconds}s`;
		}

		return `${seconds}s`;
	}, [status.startTime, status.endTime]);

	// Velocidad de procesamiento
	const getProcessingSpeed = useCallback(() => {
		if (!status.extendedStats?.processingSpeed) {
			return "";
		}

		const speed = status.extendedStats.processingSpeed;
		if (speed < 0.1) {
			return "<0.1 archivos/s";
		}
		return `${speed.toFixed(1)} archivos/s`;
	}, [status.extendedStats?.processingSpeed]);

	return (
		<div className={cn("space-y-2 animate-in fade-in", className)}>
			{/* Barra de progreso con animación */}
			<div className="space-y-1">
				<div className="flex items-center justify-between mb-1">
					<div className="flex items-center gap-1.5">
						{getPhaseIcon()}
						<span className="text-xs font-medium">
							{status.status || "Procesando..."}
						</span>

						{isStale && (
							<Badge
								variant="outline"
								className="text-[9px] h-3.5 px-1 py-0 text-yellow-500 border-yellow-200 bg-yellow-50"
							>
								Esperando actualizaciones...
							</Badge>
						)}
					</div>

					<div className="text-xs text-muted-foreground">
						{getProcessingTime()}
						{status.extendedStats?.processingSpeed
							? ` ⋅ ${getProcessingSpeed()}`
							: ""}
					</div>
				</div>

				<Progress value={progress} className="h-1.5" />

				{/* Información detallada del progreso */}
				<div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
					{showFileCounter && (
						<div className="text-[10px] text-muted-foreground">
							<span className="font-medium">{status.filesProcessed}</span>
							<span> / </span>
							<span>{status.totalFiles}</span>
							<span> archivos</span>
						</div>
					)}

					{status.currentFile && (
						<div className="text-[10px] text-muted-foreground truncate max-w-[200px]">
							<span>Archivo: </span>
							<span className="font-mono">
								{status.currentFile.split("/").pop()}
							</span>
						</div>
					)}

					{status.extendedStats?.averageSize && (
						<div className="text-[10px] text-muted-foreground">
							<span>Tamaño promedio: </span>
							<span>{formatBytes(status.extendedStats.averageSize)}</span>
						</div>
					)}

					{status.estimatedTimeRemaining && (
						<div className="text-[10px] text-muted-foreground">
							<span>Tiempo restante: ~</span>
							<span>
								{status.estimatedTimeRemaining > 60
									? `${Math.floor(status.estimatedTimeRemaining / 60)}m ${status.estimatedTimeRemaining % 60}s`
									: `${status.estimatedTimeRemaining}s`}
							</span>
						</div>
					)}
				</div>
			</div>

			{/* Detalles adicionales */}
			<AnimatePresence>
				{status.errors && status.errors.length > 0 && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: "auto" }}
						exit={{ opacity: 0, height: 0 }}
						className="text-[10px] text-destructive border border-destructive/20 rounded p-1 bg-destructive/5 mt-1"
					>
						<div className="font-medium">Errores encontrados:</div>
						{status.errors.slice(0, 3).map((error, index) => (
							<div key={`error-${index}-${error.file}`} className="truncate">
								• {error.file.split("/").pop()}: {error.error}
							</div>
						))}
						{status.errors.length > 3 && (
							<div>Y {status.errors.length - 3} más...</div>
						)}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
