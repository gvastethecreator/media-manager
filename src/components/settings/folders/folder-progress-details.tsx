'use client';

import { Code, File, FileWarning, Folder, HelpCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { clientLogger } from '@/lib/logger/client-logger';
import { cn } from '@/lib/utils';
import { formatBytes } from '@/lib/utils/format.utils';
import type { ExtendedProcessStatus, ProcessPhase } from '@/types/process';

// Crear una instancia de logger para este componente
const componentLogger = clientLogger.withContext('FolderProgressDetails');

interface FolderProgressDetailsProps {
	status: ExtendedProcessStatus;
	isProcessing: boolean;
	className?: string;
}

export function FolderProgressDetails({ status, isProcessing, className }: FolderProgressDetailsProps) {
	const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());
	const [isStale, setIsStale] = useState<boolean>(false);
	const [isComplete, setIsComplete] = useState<boolean>(false);
	const staleTimerRef = useRef<NodeJS.Timeout | null>(null);
	const initialLoadRef = useRef<boolean>(true);

	// Verificar si el estado está estancado (sin actualizaciones por más de 15 segundos)
	useEffect(() => {
		// Si es la carga inicial o hay un cambio en isProcessing, resetear el estado
		if (initialLoadRef.current || status.timestamp) {
			initialLoadRef.current = false;
			setLastUpdateTime(status.timestamp || Date.now());
			setIsStale(false);

			// Limpiar cualquier temporizador existente
			if (staleTimerRef.current) {
				clearTimeout(staleTimerRef.current);
				staleTimerRef.current = null;
			}
		}

		// Si cambia la fase a 'complete', marcar como completado
		if (status.phase === 'complete') {
			componentLogger.info('Proceso completado detectado', status);
			setIsComplete(true);
			setIsStale(false);

			// Limpiar cualquier temporizador existente
			if (staleTimerRef.current) {
				clearTimeout(staleTimerRef.current);
				staleTimerRef.current = null;
			}
			return;
		}

		// Si el proceso está en curso pero no está completo, iniciar temporizador para detectar estancamiento
		if (isProcessing && !isComplete) {
			// Usar un temporizador único con un tiempo más largo (15 segundos)
			if (!staleTimerRef.current) {
				staleTimerRef.current = setTimeout(() => {
					const now = Date.now();
					const timeSinceLastUpdate = now - lastUpdateTime;

					// Solo marcar como estancado si han pasado más de 15 segundos
					if (timeSinceLastUpdate > 15000) {
						setIsStale(true);
						componentLogger.warn('Estado del proceso estancado:', {
							lastUpdate: new Date(lastUpdateTime).toISOString(),
							currentTime: new Date(now).toISOString(),
							timeSinceLastUpdate: `${Math.round(timeSinceLastUpdate / 1000)}s`,
							status: status.status,
							phase: status.phase,
						});
					}

					// Limpiar la referencia del temporizador
					staleTimerRef.current = null;
				}, 15000);
			}
		} else {
			// Si no está procesando, asegurarse de que no esté marcado como estancado
			setIsStale(false);

			// Limpiar cualquier temporizador existente
			if (staleTimerRef.current) {
				clearTimeout(staleTimerRef.current);
				staleTimerRef.current = null;
			}
		}

		// Limpiar temporizador al desmontar
		return () => {
			if (staleTimerRef.current) {
				clearTimeout(staleTimerRef.current);
				staleTimerRef.current = null;
			}
		};
	}, [isProcessing, status, lastUpdateTime, isComplete]);

	// Función para renderizar el icono según la fase actual
	const getPhaseIcon = useCallback(() => {
		const phase = status.phase as ProcessPhase;
		switch (phase) {
			case 'scanning':
				return <Folder className="h-3.5 w-3.5 text-blue-500" />;
			case 'indexing':
				return <File className="h-3.5 w-3.5 text-green-500" />;
			case 'thumbnails':
				return <File className="h-3.5 w-3.5 text-purple-500" />;
			case 'metadata':
				return <Code className="h-3.5 w-3.5 text-yellow-500" />;
			case 'error':
				return <FileWarning className="h-3.5 w-3.5 text-red-500" />;
			case 'complete':
				return <File className="h-3.5 w-3.5 text-emerald-500" />;
			default:
				return <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />;
		}
	}, [status.phase]);

	// Determinar el mensaje de estado a mostrar
	const getStatusMessage = useCallback(() => {
		if (isComplete) {
			return 'Proceso completado';
		}

		return status.status || 'Procesando...';
	}, [isComplete, status.status]);

	// Obtener el progreso actual
	const progress = status.progress || 0;

	// Averiguar si se debe mostrar el contador de archivos
	const showFileCounter =
		(isProcessing || isComplete) && typeof status.filesProcessed === 'number' && typeof status.totalFiles === 'number';

	// Formatear el tiempo de procesamiento
	const getProcessingTime = useCallback(() => {
		if (!status.startTime) {
			return '';
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
			return '';
		}

		const speed = status.extendedStats.processingSpeed;
		if (speed < 0.1) {
			return '<0.1 archivos/s';
		}
		return `${speed.toFixed(1)} archivos/s`;
	}, [status.extendedStats?.processingSpeed]);

	return (
		<div className={cn('space-y-2 animate-in fade-in', className)}>
			{/* Barra de progreso con animación */}
			<div className="space-y-1">
				<div className="flex items-center justify-between mb-1">
					<div className="flex items-center gap-1.5">
						{getPhaseIcon()}
						<span className="text-xs font-medium">{getStatusMessage()}</span>

						{isStale && !isComplete && (
							<Badge
								variant="outline"
								className="text-[9px] h-3.5 px-1 py-0 text-yellow-500 border-yellow-200 bg-yellow-50"
							>
								Actualizando...
							</Badge>
						)}

						{isComplete && (
							<Badge
								variant="outline"
								className="text-[9px] h-3.5 px-1 py-0 text-emerald-500 border-emerald-200 bg-emerald-50"
							>
								Completado
							</Badge>
						)}
					</div>

					<div className="text-xs text-muted-foreground">
						{getProcessingTime()}
						{status.extendedStats?.processingSpeed && !isComplete ? ` ⋅ ${getProcessingSpeed()}` : ''}
					</div>
				</div>

				<Progress value={isComplete ? 100 : progress} className="h-1.5" />

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

					{status.currentFile && !isComplete && (
						<div className="text-[10px] text-muted-foreground truncate max-w-[200px]">
							<span>Archivo: </span>
							<span className="font-mono">{status.currentFile.split('/').pop()}</span>
						</div>
					)}

					{status.extendedStats?.averageSize && (
						<div className="text-[10px] text-muted-foreground">
							<span>Tamaño promedio: </span>
							<span>{formatBytes(status.extendedStats.averageSize)}</span>
						</div>
					)}

					{status.estimatedTimeRemaining && !isComplete && (
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
						animate={{ opacity: 1, height: 'auto' }}
						exit={{ opacity: 0, height: 0 }}
						className="text-[10px] text-destructive border border-destructive/20 rounded p-1 bg-destructive/5 mt-1"
					>
						<div className="font-medium">Errores encontrados:</div>
						{status.errors.slice(0, 3).map((error, index) => (
							<div key={`error-${index}-${error.file}`} className="truncate">
								• {error.file.split('/').pop()}: {error.error}
							</div>
						))}
						{status.errors.length > 3 && <div>Y {status.errors.length - 3} más...</div>}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
