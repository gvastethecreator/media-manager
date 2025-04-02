'use client';

import type { ProcessStatus } from '@/app/actions/folders/folder-types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { folderService } from '@/services/folder';
import { useEffect, useState } from 'react';

interface ReindexCardProps {
	folderId: string;
	folderName: string;
	folderPath: string;
}

export default function FolderReindexExample({ folderId, folderName, folderPath }: ReindexCardProps) {
	// Estado para progreso y errores
	const [isReindexing, setIsReindexing] = useState(false);
	const [progress, setProgress] = useState<ProcessStatus | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [result, setResult] = useState<any | null>(null);

	// Limpiar callbacks al desmontar
	useEffect(() => {
		return () => {
			folderService.offAll();
		};
	}, []);

	// Iniciar reindexación
	const startReindex = async () => {
		setIsReindexing(true);
		setProgress(null);
		setError(null);
		setResult(null);

		try {
			// Crear callbacks para monitoreo
			const callbacks = {
				onProgress: (status: ProcessStatus) => {
					setProgress(status);
				},
				onError: (error: any) => {
					setError(error.message || 'Error desconocido');
					setIsReindexing(false);
				},
				onComplete: (data: any) => {
					setResult(data);
					setIsReindexing(false);
				},
				onCancel: () => {
					setIsReindexing(false);
					setProgress(prev => prev ? { ...prev, status: 'Operación cancelada' } : null);
				}
			};

			// Opciones avanzadas para la reindexación
			const options = {
				deleteOrphans: true,  // Eliminar archivos que ya no existen
				maxConcurrent: 3,     // Máximo 3 procesos concurrentes
				batchSize: 50,        // Procesar en lotes de 50 archivos
			};

			// Llamar al servicio
			await folderService.reindexFolder(folderId, callbacks);
		} catch (error: any) {
			setError(error.message || 'Error al iniciar reindexación');
			setIsReindexing(false);
		}
	};

	// Cancelar reindexación
	const cancelReindex = () => {
		// El servicio debe exponer un método para cancelar
		folderService.emit('folder:cancel', {});
	};

	// Calcular tiempo transcurrido
	const getElapsedTime = () => {
		if (!progress?.startTime) return '0s';
		const elapsed = (progress.endTime || Date.now()) - progress.startTime;
		return `${Math.round(elapsed / 1000)}s`;
	};

	// Obtener fase actual en español
	const getPhaseLabel = (phase?: string) => {
		const phases: Record<string, string> = {
			'prepare': 'Preparando',
			'scan': 'Escaneando',
			'index': 'Indexando',
			'cleanup': 'Limpiando',
			'complete': 'Completado',
			'cancelled': 'Cancelado',
			'error': 'Error'
		};
		return phases[phase || ''] || 'Procesando';
	};

	return (
		<Card className="w-full max-w-md">
			<CardHeader>
				<CardTitle className="flex items-center justify-between">
					<span>{folderName}</span>
					{progress?.phase && (
						<Badge variant={progress.phase === 'complete' ? 'default' : 'secondary'}>
							{getPhaseLabel(progress.phase)}
						</Badge>
					)}
				</CardTitle>
				<div className="text-sm text-muted-foreground truncate" title={folderPath}>
					{folderPath}
				</div>
			</CardHeader>

			<CardContent className="space-y-4">
				{/* Mostrar progreso */}
				{isReindexing && (
					<div className="space-y-2">
						<div className="flex justify-between text-sm">
							<span>{progress?.status || 'Iniciando...'}</span>
							<span>{progress?.progress ? `${Math.round(progress.progress)}%` : '0%'}</span>
						</div>
						<Progress value={progress?.progress || 0} className="h-2" />

						<div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mt-2">
							<div>Tiempo: {getElapsedTime()}</div>
							<div>Archivos: {progress?.filesProcessed || 0}/{progress?.totalFiles || '?'}</div>
							{progress?.processingSpeed && (
								<div>Velocidad: {Math.round(progress.processingSpeed)} archivos/s</div>
							)}
							{progress?.estimatedTimeRemaining && (
								<div>Restante: ~{Math.round(progress.estimatedTimeRemaining)}s</div>
							)}
						</div>
					</div>
				)}

				{/* Mostrar resultado */}
				{result && !isReindexing && (
					<div className="text-sm">
						<p className="font-medium">Reindexación completada</p>
						<div className="mt-1 grid grid-cols-2 gap-1 text-xs">
							<div>Archivos totales:</div>
							<div>{result.totalFiles || result.stats?.total || 0}</div>

							<div>Archivos procesados:</div>
							<div>{result.stats?.processed || 0}</div>

							<div>Tamaño total:</div>
							<div>{formatBytes(result.totalSize || result.stats?.totalSize || 0)}</div>
						</div>
					</div>
				)}

				{/* Mostrar error */}
				{error && (
					<Alert variant="destructive" className="mt-2">
						<AlertTitle>Error</AlertTitle>
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}
			</CardContent>

			<CardFooter className="flex justify-end gap-2">
				{isReindexing ? (
					<Button variant="outline" onClick={cancelReindex} disabled={!progress?.canCancel}>
						Cancelar
					</Button>
				) : (
					<Button onClick={startReindex}>
						Reindexar
					</Button>
				)}
			</CardFooter>
		</Card>
	);
}

// Función auxiliar para formatear bytes
function formatBytes(bytes: number): string {
	if (bytes === 0) return '0 Bytes';

	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${Number.parseFloat((bytes / (k ** i)).toFixed(2))} ${sizes[i]}`;
}