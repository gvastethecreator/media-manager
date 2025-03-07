'use client';

import {
	type FolderCreate,
	createFolder,
	deleteFolder,
	reindexFolder,
	updateFolderAutoReindex,
} from '@/app/actions/folder.actions';
import { FolderIndexStatusBadge, type IndexStatus } from '@/components/settings/folder-index-status-badge';
import { ReindexConfirmationDialog } from '@/components/settings/reindex-confirmation-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import { logger } from '@/lib/logger';
import { cn, formatBytes } from '@/lib/utils';
import {
	type ErrorResponse,
	FOLDER_EVENTS,
	type FolderResponse,
	folderService,
	getFolders,
} from '@/services/folder.service';
import type { FolderStats, Folder as FolderType } from '@/types/folders';
import type {
	ExtendedProcessStatus,
	ProcessPhase,
	ProcessStatus,
	ReindexAllCompleteData,
	ReindexAllProgressData,
	ReindexProgress,
} from '@/types/process';
import { AlertCircle, Folder, FolderIcon, FolderPlus, RefreshCw, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import * as React from 'react';
import { useEffect, useState } from 'react';

const folderLogger = logger.withContext('FoldersSection');

const initialStats: FolderStats = {
	totalFolders: 0,
	totalFiles: 0,
	totalSize: 0,
	lastIndexed: null,
	createdAt: new Date(),
	updatedAt: new Date(),
};

// Extender la interfaz Folder para incluir las propiedades adicionales
interface ExtendedFolder extends Omit<FolderResponse, 'lastIndexed' | 'createdAt' | 'updatedAt'> {
	lastIndexed: Date | null;
	createdAt: Date;
	updatedAt: Date;
	_count?: {
		images: number;
	};
	autoReindex: boolean;
}

export function FoldersSection() {
	const { toast } = useToast();
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [processProgress, setProcessProgress] = useState(0);
	const [stats, setStats] = useState<FolderStats>(initialStats);
	const [folderPath, setFolderPath] = useState('');
	const [folders, setFolders] = useState<FolderType[]>([]);
	const [processStatus, setProcessStatus] = useState<ExtendedProcessStatus>({});
	const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
	const [globalReindexStatus, setGlobalReindexStatus] = useState<{
		isProcessing: boolean;
		progress: number;
		processedFolders: number;
		totalFolders: number;
		errors: Array<{ folderId: string; error: string }>;
		currentFolder?: string;
		phase?: string;
		status?: string;
		startTime?: number;
		endTime?: number;
		duration?: number;
		lastUpdate?: number;
	}>({
		isProcessing: false,
		progress: 0,
		processedFolders: 0,
		totalFolders: 0,
		errors: [],
	});
	const [globalProcessingState, setGlobalProcessingState] = useState<{
		isProcessing: boolean;
		currentFolder: string | null;
		currentFile: string | null;
		fileProgress: {
			processed: number;
			total: number;
			current: string;
		};
	}>({
		isProcessing: false,
		currentFolder: null,
		currentFile: null,
		fileProgress: {
			processed: 0,
			total: 0,
			current: '',
		},
	});
	const [_extendedStats, _setExtendedStats] = useState<ProcessStatus['extendedStats']>({
		fileTypes: {},
		averageSize: 0,
		processingSpeed: 0,
		errorsByType: {},
		healthScore: 100,
	});
	const [showReindexDialog, setShowReindexDialog] = useState(false);

	// Suscribirse a eventos del FolderService
	useEffect(() => {
		const handleProgress = (status: ProcessStatus) => {
			if (!status) {
				return;
			}

			folderLogger.info('📊 Progreso del proceso:', status);

			// Actualizar estado global de procesamiento
			if (status.currentFile) {
				setGlobalProcessingState((prev) => ({
					...prev,
					isProcessing: true,
					currentFolder: status.folderId
						? folders.find((f) => f.id === status.folderId)?.name || prev.currentFolder
						: prev.currentFolder,
					currentFile: status.currentFile || null,
					fileProgress: {
						processed: status.filesProcessed || 0,
						total: status.totalFiles || 0,
						current: status.currentFile || '',
					},
				}));
			}

			// Actualizar progreso general
			setProcessProgress(status.progress || 0);

			// Actualizar estado del proceso
			setProcessStatus((prevStatus) => ({
				...prevStatus,
				...status,
				status: status.status || 'Procesando...',
				phase: status.phase || prevStatus.phase,
				filesProcessed: status.filesProcessed || prevStatus.filesProcessed,
				totalFiles: status.totalFiles || prevStatus.totalFiles,
				fileDetails: status.fileDetails || prevStatus.fileDetails,
				extendedStats: status.extendedStats
					? {
							...prevStatus.extendedStats,
							...status.extendedStats,
							fileTypes: {
								...prevStatus.extendedStats?.fileTypes,
								...status.extendedStats.fileTypes,
							},
							errorsByType: {
								...prevStatus.extendedStats?.errorsByType,
								...status.extendedStats.errorsByType,
							},
						}
					: prevStatus.extendedStats,
				errors: status.errors
					? [
							...(prevStatus.errors || []),
							...status.errors.filter(
								(error) => !prevStatus.errors?.some((e) => e.file === error.file && e.error === error.error)
							),
						]
					: prevStatus.errors,
				globalProgress: status.globalProgress || prevStatus.globalProgress,
			}));

			// Si hay progreso global, actualizar el estado global
			if (status.globalProgress?.progress !== undefined) {
				setGlobalReindexStatus((prev) => ({
					...prev,
					progress: status.globalProgress?.progress || 0,
					processedFolders: status.globalProgress?.current || 0,
					totalFolders: status.globalProgress?.total || 0,
				}));
			}
		};

		const handleError = (error: ErrorResponse) => {
			folderLogger.error('❌ Error en el proceso:', error);
			let errorMessage = 'Error desconocido al procesar la carpeta';

			if (error instanceof Error) {
				errorMessage = error.message;
			} else if (typeof error === 'object' && error !== null) {
				errorMessage = error.message || error.details || JSON.stringify(error);
			}

			toast({
				title: 'Error',
				description: errorMessage,
				variant: 'destructive',
			});
		};

		const handleReindexAllStart = (data: { totalFolders: number }) => {
			folderLogger.info(`🚀 Iniciando reindexación de ${data.totalFolders} carpetas`);

			// Reiniciar el estado global de reindexación
			setGlobalReindexStatus((prev) => ({
				...prev,
				isProcessing: true,
				progress: 0,
				processedFolders: 0,
				totalFolders: data.totalFolders,
				errors: [],
				startTime: Date.now(),
				currentFolder: '',
			}));

			// Resetear el estado de proceso individual
			setProcessStatus({});
			setProcessProgress(0);

			// Notificar al usuario
			toast({
				title: 'Reindexación iniciada',
				description: `Comenzando a reindexar ${data.totalFolders} carpetas. Este proceso puede tomar varios minutos.`,
			});
		};

		const handleReindexAllProgress = (data: ReindexAllProgressData) => {
			folderLogger.debug(`📊 Progreso de reindexación: ${data.progress.toFixed(2)}%`, data);

			// Actualizar el estado global
			setGlobalReindexStatus((prev) => ({
				...prev,
				progress: data.progress,
				currentFolder: data.currentFolder,
				processedFolders: data.current,
				status: data.status || `Procesando carpeta ${data.current + 1} de ${data.total}`,
				phase: data.phase || 'processing',
				lastUpdate: Date.now(),
			}));

			// Actualizar también el estado de proceso individual si hay información de fase
			if (data.phase) {
				setProcessStatus((prev) => ({
					...prev,
					phase: data.phase,
					status: data.status,
					progress: data.progress,
				}));

				// Actualizar la barra de progreso
				setProcessProgress(data.progress);
			}
		};

		const handleReindexAllComplete = (data: ReindexAllCompleteData) => {
			folderLogger.info(
				`✅ Reindexación completada: ${data.processedFolders}/${data.totalFolders} carpetas procesadas`
			);

			const endTime = Date.now();
			const startTime = globalReindexStatus.startTime || endTime;
			const duration = Math.round((endTime - startTime) / 1000);

			// Actualizar el estado global
			setGlobalReindexStatus((prev) => ({
				...prev,
				isProcessing: false,
				processedFolders: data.processedFolders,
				progress: data.progress || 100,
				errors: data.errors,
				endTime,
				duration,
				status: 'completed',
			}));

			// Limpiar el estado de proceso individual
			setProcessStatus({});
			setProcessProgress(0);

			// Refrescar la lista de carpetas y estadísticas
			_loadFolders();
			loadStats();

			// Notificar al usuario del resultado
			if (data.errors.length > 0) {
				toast({
					title: 'Reindexación completada con errores',
					description: `${data.processedFolders} de ${data.totalFolders} carpetas procesadas en ${duration}s. ${data.errors.length} errores encontrados.`,
					variant: 'destructive',
				});
			} else {
				toast({
					title: 'Reindexación completada',
					description: `${data.processedFolders} carpetas procesadas exitosamente en ${duration}s.`,
					variant: 'default',
				});
			}
		};

		const handleComplete = (data: FolderResponse) => {
			if (!data?.folder) {
				return;
			}

			folderLogger.info('✅ Proceso completado:', {
				folderId: data.folder.id,
				stats: data.stats,
			});

			// Resetear estado global de procesamiento
			setGlobalProcessingState({
				isProcessing: false,
				currentFolder: null,
				currentFile: null,
				fileProgress: {
					processed: 0,
					total: 0,
					current: '',
				},
			});

			setFolders((prevFolders) =>
				prevFolders.map((folder) =>
					folder.id === data.folder.id
						? {
								...folder,
								...data.folder,
								_count: {
									images: data.stats?.total || folder._count?.images || 0,
								},
								totalSize: data.stats?.totalSize || folder.totalSize,
								lastIndexed: new Date(),
								createdAt: data.folder.createdAt ? new Date(data.folder.createdAt) : new Date(),
								updatedAt: data.folder.updatedAt ? new Date(data.folder.updatedAt) : new Date(),
							}
						: {
								...folder,
								lastIndexed: folder.lastIndexed ? new Date(folder.lastIndexed) : null,
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

		const handleStats = (stats: FolderStats) => {
			folderLogger.info('📊 Estadísticas actualizadas:', stats);
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

		folderService.on(FOLDER_EVENTS.REINDEX_ALL_START, handleReindexAllStart);
		folderService.on(FOLDER_EVENTS.REINDEX_ALL_PROGRESS, handleReindexAllProgress);
		folderService.on(FOLDER_EVENTS.REINDEX_ALL_COMPLETE, handleReindexAllComplete);

		// Cleanup
		return () => {
			folderLogger.info('🧹 Limpiando suscripciones de eventos');
			// Cancelar suscripciones específicas
			folderService.offProgress(handleProgress);
			folderService.offError(handleError);
			folderService.offComplete(handleComplete);
			folderService.offStats(handleStats);

			// Cancelar suscripciones genéricas
			folderService.off(FOLDER_EVENTS.REINDEX_ALL_START, handleReindexAllStart);
			folderService.off(FOLDER_EVENTS.REINDEX_ALL_PROGRESS, handleReindexAllProgress);
			folderService.off(FOLDER_EVENTS.REINDEX_ALL_COMPLETE, handleReindexAllComplete);
		};
	}, [folders, toast, globalReindexStatus.startTime]);

	useEffect(() => {
		const loadInitialData = async () => {
			folderLogger.info('🚀 Cargando datos iniciales');
			await loadStats();
			folderLogger.info('✅ Datos iniciales cargados');
		};

		loadInitialData().catch((error) => {
			folderLogger.error('❌ Error cargando datos iniciales:', error);
			setError(error instanceof Error ? error.message : 'Error cargando datos iniciales');
		});
	}, []);

	const _loadFolders = async () => {
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
				autoReindex: folder.autoReindex || false,
			}));

			folderLogger.info('✅ Carpetas cargadas:', {
				count: transformedFolders.length,
			});
			setFolders(transformedFolders);
		} catch (error) {
			folderLogger.error('❌ Error cargando carpetas:', error);
			setError(error instanceof Error ? error.message : 'No se pudieron cargar las carpetas');
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
				totalFiles: folders.reduce((acc, folder) => acc + (folder._count?.images || 0), 0),
				totalSize: folders.reduce((acc, folder) => acc + Number(folder.totalSize || 0), 0),
				lastIndexed: folders.reduce((acc: Date | null, folder) => {
					if (!folder.lastIndexed) {
						return acc;
					}
					const date = new Date(folder.lastIndexed);
					return !acc || date > acc ? date : acc;
				}, null),
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			folderLogger.info('✅ Estadísticas calculadas:', indexStats);
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
			folderLogger.error('❌ Error cargando estadísticas:', error);
			setError(error instanceof Error ? error.message : 'No se pudieron cargar las estadísticas');
			setStats(initialStats);
		} finally {
			setIsLoading(false);
		}
	};

	const handleAddFolder = async () => {
		if (!folderPath.trim()) {
			return;
		}

		try {
			setError(null);
			setIsProcessing(true);
			setProcessProgress(0);
			setProcessStatus({
				status: 'Iniciando proceso...',
				currentFile: '',
				current: 0,
				total: 0,
				progress: 0,
			});

			folderLogger.info('🔄 Agregando carpeta:', { path: folderPath });
			await createFolder(folderPath);

			folderLogger.info('✅ Carpeta agregada correctamente');
			setFolderPath('');

			// Recargar datos
			await loadStats();

			toast({
				title: 'Carpeta agregada',
				description: 'La carpeta se ha agregado correctamente',
			});
		} catch (error) {
			folderLogger.error('❌ Error agregando carpeta:', error);
			toast({
				title: 'Error',
				description: error instanceof Error ? error.message : 'Error al agregar la carpeta',
				variant: 'destructive',
			});
		} finally {
			await new Promise((resolve) => setTimeout(resolve, 500));
			setIsProcessing(false);
			setProcessProgress(0);
			setProcessStatus({});
		}
	};

	const handleReindexFolder = async (folderId: string) => {
		if (isProcessing) {
			return;
		}

		try {
			setError(null);
			setIsProcessing(true);
			setProcessProgress(0);
			setProcessStatus({
				folderId,
				status: 'Iniciando reindexación...',
				current: 0,
				total: 0,
				progress: 0,
			});

			folderLogger.info('🔄 Reindexando carpeta:', { folderId });
			await reindexFolder(folderId);

			folderLogger.info('✅ Carpeta reindexada correctamente');

			// Recargar datos
			await loadStats();

			toast({
				title: 'Carpeta reindexada',
				description: 'La carpeta se ha reindexado correctamente',
			});
		} catch (error) {
			folderLogger.error('❌ Error reindexando carpeta:', error);
			toast({
				title: 'Error',
				description: error instanceof Error ? error.message : 'Error al reindexar la carpeta',
				variant: 'destructive',
			});
		} finally {
			await new Promise((resolve) => setTimeout(resolve, 500));
			setIsProcessing(false);
			setProcessProgress(0);
			setProcessStatus({});
		}
	};

	const _handleRemoveFolder = async (folderId: string) => {
		try {
			setError(null);
			folderLogger.info('🔄 Eliminando carpeta:', { folderId });

			await deleteFolder(folderId);

			folderLogger.info('✅ Carpeta eliminada correctamente');

			// Recargar datos
			await loadStats();

			toast({
				title: 'Carpeta eliminada',
				description: 'La carpeta se ha eliminado correctamente',
			});
		} catch (error) {
			folderLogger.error('❌ Error eliminando carpeta:', error);
			toast({
				title: 'Error',
				description: error instanceof Error ? error.message : 'Error al eliminar la carpeta',
				variant: 'destructive',
			});
		}
	};

	const handleFolderClick = async (folderId: string) => {
		if (selectedFolder === folderId) {
			try {
				folderLogger.info('🗑️ Eliminando carpeta por doble click:', {
					folderId,
				});
				await deleteFolder(folderId);

				folderLogger.info('✅ Carpeta eliminada correctamente');
				toast({
					title: 'Carpeta eliminada',
					description: 'La carpeta se eliminó correctamente',
				});

				await loadStats();
				setSelectedFolder(null);
			} catch (error) {
				folderLogger.error('❌ Error eliminando carpeta:', error);
				toast({
					title: 'Error',
					description: 'No se pudo eliminar la carpeta',
					variant: 'destructive',
				});
			}
		} else {
			setSelectedFolder(folderId);
		}
	};

	const handleReindexAll = async () => {
		try {
			// Verificar si ya hay un proceso de reindexación en curso
			if (globalReindexStatus.isProcessing) {
				toast({
					title: 'Proceso en curso',
					description: 'Ya hay un proceso de reindexación en ejecución',
					variant: 'warning',
				});
				return;
			}

			// Mostrar diálogo de confirmación
			setShowReindexDialog(true);
		} catch (error) {
			folderLogger.error('❌ Error al iniciar reindexación:', error);
			toast({
				title: 'Error',
				description: 'No se pudo iniciar el proceso de reindexación',
				variant: 'destructive',
			});
		}
	};

	const handleConfirmReindexAll = async () => {
		try {
			folderLogger.info('🔄 Iniciando reindexación de todas las carpetas');
			setError(null);

			// Iniciar proceso antes del evento para dar feedback inmediato
			setGlobalReindexStatus((prev) => ({
				...prev,
				isProcessing: true,
				progress: 0,
				processedFolders: 0,
				errors: [],
				startTime: Date.now(),
				status: 'Iniciando...',
			}));

			// Iniciar el proceso de reindexación
			await folderService.reindexAll();

			folderLogger.info('✅ Solicitud de reindexación iniciada correctamente');
		} catch (error) {
			setGlobalReindexStatus((prev) => ({
				...prev,
				isProcessing: false,
				errors: [
					...(prev.errors || []),
					{
						message: error instanceof Error ? error.message : 'Error desconocido',
						timestamp: Date.now(),
					},
				],
			}));

			folderLogger.error('❌ Error al iniciar reindexación:', error);
			toast({
				title: 'Error',
				description: 'No se pudo iniciar el proceso de reindexación',
				variant: 'destructive',
			});

			// Cerramos el diálogo en caso de error
			setShowReindexDialog(false);
		}
	};

	// Función para actualizar el autoReindex de una carpeta
	const handleAutoReindexToggle = async (folderId: string, value: boolean) => {
		try {
			folderLogger.info(`${value ? '✅' : '❌'} Configurando auto-reindexado para la carpeta ${folderId}: ${value}`);

			// Llamar a la acción del servidor para actualizar la configuración
			await updateFolderAutoReindex(folderId, value);

			// Actualizar el estado local
			setFolders((prev) => prev.map((folder) => (folder.id === folderId ? { ...folder, autoReindex: value } : folder)));

			toast({
				title: 'Configuración actualizada',
				description: `Auto-reindexado ${value ? 'activado' : 'desactivado'} para esta carpeta`,
				variant: 'default',
			});
		} catch (error) {
			folderLogger.error('❌ Error actualizando configuración de auto-reindexado:', error);
			toast({
				title: 'Error',
				description: 'No se pudo actualizar la configuración',
				variant: 'destructive',
			});
		}
	};

	// Determinar el estado de indexación de una carpeta
	const getFolderIndexStatus = (folder: ExtendedFolder): IndexStatus => {
		if (!folder.lastIndexed) {
			return 'pending';
		}

		const now = new Date();
		const lastIndexed = new Date(folder.lastIndexed);
		const diffDays = Math.floor((now.getTime() - lastIndexed.getTime()) / (1000 * 60 * 60 * 24));

		if (diffDays > 7) {
			return 'outdated';
		}

		return 'indexed';
	};

	const renderProgressDetails = (status: ExtendedProcessStatus) => {
		if (!status.phase) {
			return null;
		}

		return (
			<div className="space-y-1.5 text-xs text-muted-foreground">
				<div className="flex justify-between items-center">
					<span>Fase actual:</span>
					<Badge variant="secondary" className="text-[10px]">
						{status.phase === 'scanning'
							? 'Escaneando'
							: status.phase === 'indexing'
								? 'Indexando'
								: status.phase === 'thumbnails'
									? 'Generando miniaturas'
									: status.phase === 'metadata'
										? 'Extrayendo metadata'
										: 'Procesando'}
					</Badge>
				</div>

				{status.currentFile && (
					<div className="flex justify-between items-center">
						<span>Archivo actual:</span>
						<span className="truncate max-w-[200px]">{status.currentFile}</span>
					</div>
				)}

				{status.fileDetails && (
					<div className="space-y-1">
						<div className="flex justify-between items-center">
							<span>Tamaño:</span>
							<span>{formatBytes(status.fileDetails.size)}</span>
						</div>
						{status.fileDetails.dimensions && (
							<div className="flex justify-between items-center">
								<span>Dimensiones:</span>
								<span>
									{status.fileDetails.dimensions.width}x{status.fileDetails.dimensions.height}
								</span>
							</div>
						)}
						<div className="flex justify-between items-center">
							<span>Tipo:</span>
							<span>{status.fileDetails.type}</span>
						</div>
					</div>
				)}

				{status.filesProcessed !== undefined && status.totalFiles !== undefined && (
					<div className="flex justify-between items-center">
						<span>Archivos procesados:</span>
						<span>
							{status.filesProcessed} / {status.totalFiles}
						</span>
					</div>
				)}

				{status.extendedStats && (
					<div className="space-y-1 mt-2 pt-2 border-t border-border/30">
						<div className="text-[11px] font-medium mb-1">Estadísticas extendidas:</div>

						{status.extendedStats.processingSpeed > 0 && (
							<div className="flex justify-between items-center">
								<span>Velocidad:</span>
								<span>{status.extendedStats.processingSpeed.toFixed(2)} archivos/s</span>
							</div>
						)}

						{status.extendedStats.averageSize > 0 && (
							<div className="flex justify-between items-center">
								<span>Tamaño promedio:</span>
								<span>{formatBytes(status.extendedStats.averageSize)}</span>
							</div>
						)}

						{Object.keys(status.extendedStats.fileTypes).length > 0 && (
							<div className="space-y-1">
								<div className="text-[10px] text-muted-foreground/80">Tipos de archivo:</div>
								<div className="grid grid-cols-2 gap-1">
									{Object.entries(status.extendedStats.fileTypes).map(([type, count]) => (
										<div key={type} className="flex justify-between items-center text-[10px]">
											<span>{type}:</span>
											<span>{count}</span>
										</div>
									))}
								</div>
							</div>
						)}

						{Object.keys(status.extendedStats.errorsByType).length > 0 && (
							<div className="space-y-1 mt-1">
								<div className="text-[10px] text-destructive/80">Errores por tipo:</div>
								<div className="grid grid-cols-2 gap-1">
									{Object.entries(status.extendedStats.errorsByType).map(([type, count]) => (
										<div key={type} className="flex justify-between items-center text-[10px] text-destructive/90">
											<span>{type}:</span>
											<span>{count}</span>
										</div>
									))}
								</div>
							</div>
						)}

						<div className="flex justify-between items-center">
							<span>Estado de salud:</span>
							<div className="flex items-center gap-1">
								<span
									className={cn(
										status.extendedStats.healthScore > 80
											? 'text-green-500'
											: status.extendedStats.healthScore > 60
												? 'text-yellow-500'
												: 'text-destructive'
									)}
								>
									{status.extendedStats.healthScore}%
								</span>
							</div>
						</div>
					</div>
				)}

				{status.errors && status.errors.length > 0 && (
					<div className="mt-2 pt-2 border-t border-border/30">
						<p className="text-destructive text-[11px] font-medium">Errores encontrados: {status.errors.length}</p>
						<div className="max-h-20 overflow-y-auto mt-1">
							{status.errors.map((error) => (
								<p
									key={`error-${error.file}-${error.error.substring(0, 10)}`}
									className="text-[10px] text-destructive/90 truncate"
								>
									{error.file}: {error.error}
								</p>
							))}
						</div>
					</div>
				)}
			</div>
		);
	};

	const isGloballyProcessing = globalProcessingState.isProcessing || globalReindexStatus.isProcessing;

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
							onClick={handleReindexAll}
							className="h-7 text-xs"
							disabled={isLoading || isGloballyProcessing}
						>
							<RefreshCw
								className={cn('h-3.5 w-3.5', (isLoading || globalReindexStatus.isProcessing) && 'animate-spin')}
							/>
							{globalReindexStatus.isProcessing
								? `Reindexando (${Math.round(globalReindexStatus.progress)}%)`
								: 'Reindexar todo'}
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
										<span>Procesando...</span>
									</>
								) : (
									<>
										<FolderPlus className="h-3.5 w-3.5 mr-1.5" />
										<span>Agregar</span>
									</>
								)}
							</Button>
						</div>

						<div className="grid grid-cols-1 gap-2">
							{folders.map((folder, index) => (
								<motion.div
									key={folder.id}
									animate={{
										opacity: [0, 1],
										y: [20, 0],
									}}
									transition={{ delay: index * 0.1 }}
									className={cn('bg-muted/30 group rounded-sm', selectedFolder === folder.id && 'ring-1 ring-primary')}
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
															status={getFolderIndexStatus(folder as ExtendedFolder)}
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
																	size="sm"
																	checked={(folder as ExtendedFolder).autoReindex}
																	onCheckedChange={(checked) => handleAutoReindexToggle(folder.id, checked)}
																	disabled={isGloballyProcessing}
																	className="scale-75"
																/>
																<span className="text-[10px] text-muted-foreground mr-1">Auto</span>
															</div>
														</TooltipTrigger>
														<TooltipContent className="text-xs">
															{(folder as ExtendedFolder).autoReindex
																? 'Desactivar reindexado automático'
																: 'Activar reindexado automático'}
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
																onClick={() => handleReindexFolder(folder.id)}
																disabled={isGloballyProcessing}
															>
																<RefreshCw
																	className={cn(
																		'h-3.5 w-3.5',
																		isProcessing && processStatus.folderId === folder.id && 'animate-spin'
																	)}
																/>
															</Button>
														</TooltipTrigger>
														<TooltipContent className="text-xs">Reindexar carpeta</TooltipContent>
													</Tooltip>
												</TooltipProvider>

												<TooltipProvider>
													<Tooltip>
														<TooltipTrigger asChild>
															<Button
																size="icon"
																variant="ghost"
																className={cn(
																	'h-6 w-6',
																	selectedFolder === folder.id && 'bg-destructive hover:bg-destructive/90'
																)}
																onClick={() => handleFolderClick(folder.id)}
																disabled={isGloballyProcessing}
															>
																<Trash2
																	className={cn(
																		'h-3.5 w-3.5',
																		selectedFolder === folder.id ? 'text-background' : 'text-muted-foreground'
																	)}
																/>
															</Button>
														</TooltipTrigger>
														<TooltipContent className="text-xs">
															{selectedFolder === folder.id ? 'Confirmar eliminar' : 'Eliminar carpeta'}
														</TooltipContent>
													</Tooltip>
												</TooltipProvider>
											</div>
										</div>

										{isProcessing && processStatus.folderId === folder.id && (
											<motion.div
												initial={{ opacity: 0, height: 0 }}
												animate={{ opacity: 1, height: 'auto' }}
												exit={{ opacity: 0, height: 0 }}
												className="mt-3 space-y-1.5"
											>
												<div className="flex justify-between text-xs text-muted-foreground">
													<span>{processStatus.status || 'Procesando...'}</span>
													<span>{Math.round(processProgress)}%</span>
												</div>
												<Progress value={processProgress} className="h-1.5" />
												{renderProgressDetails(processStatus)}
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
									<p className="text-xs text-muted-foreground">No hay carpetas indexadas</p>
									<p className="text-[10px] mt-1 text-muted-foreground/75">
										Agrega una carpeta para comenzar a indexar imágenes
									</p>
								</motion.div>
							)}
						</div>
					</div>

					<Separator className="my-2" />
					<div className="grid grid-cols-2 gap-3">
						<motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-1.5">
							<div className="flex items-center justify-between bg-muted/50 p-2 rounded-lg">
								<span className="text-sm font-medium">{stats.totalFolders}</span>
								<Badge variant="secondary" className="text-xs">
									Carpetas
								</Badge>
							</div>
						</motion.div>

						<motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-1.5">
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
			<ReindexConfirmationDialog
				open={showReindexDialog}
				onOpenChange={setShowReindexDialog}
				onConfirm={handleConfirmReindexAll}
				isProcessing={globalReindexStatus.isProcessing}
				progress={globalReindexStatus.progress}
			/>
		</Card>
	);
}
