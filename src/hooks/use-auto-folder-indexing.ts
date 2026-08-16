/**
 * @file Hook para indexación automática de carpetas
 * @module hooks/use-auto-folder-indexing
 * @description Hook que detecta carpetas vacías o no indexadas y las indexa automáticamente
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useFolders, useReindexFolder } from '@/lib/api/folders';
import { clientLogger } from '@/lib/logger/client-logger';
import { autoIndexingLogger } from '@/lib/logger/reindex-file-logger';
import { getAutoIndexCircuitBreaker } from '@/lib/system/circuit-breaker';
import { toastService } from '@/lib/ui/toast';
import type { FolderWithStats } from '@/types/entities/folder';

const logger = clientLogger.withContext('AutoFolderIndexing');

export interface AutoIndexingStatus {
	currentFolder: string | null;
	errors: Array<{ folderId: string; message: string }>;
	indexedFolders: number;
	isIndexing: boolean;
	totalFolders: number;
}

export interface UseAutoFolderIndexingOptions {
	/** Si debe ejecutarse automáticamente al montar */
	autoStart?: boolean;
	/** Intervalo en milisegundos para verificar carpetas (por defecto 30 segundos) */
	checkInterval?: number;
	/** Límite máximo de carpetas a procesar en cada verificación */
	maxFoldersPerBatch?: number;
	/** Callback cuando se completa la indexación */
	onIndexingComplete?: (status: AutoIndexingStatus) => void;
	/** Callback cuando se inicia la indexación */
	onIndexingStart?: () => void;
	/** Callback cuando hay progreso */
	onProgress?: (status: AutoIndexingStatus) => void;
}

/**
 * Hook para indexación automática de carpetas vacías o no indexadas
 */
export function useAutoFolderIndexing(options: UseAutoFolderIndexingOptions = {}) {
	const {
		checkInterval = 30_000, // 30 segundos
		maxFoldersPerBatch = 5,
		autoStart = true,
		onIndexingStart,
		onIndexingComplete,
		onProgress,
	} = options;

	const [status, setStatus] = useState<AutoIndexingStatus>({
		isIndexing: false,
		indexedFolders: 0,
		totalFolders: 0,
		currentFolder: null,
		errors: [],
	});

	// Referencias para prevenir condiciones de carrera
	const isIndexingRef = useRef(false);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);
	const isUnmountedRef = useRef(false);
	const circuitBreaker = useRef(getAutoIndexCircuitBreaker());

	const { data: foldersResponse } = useFolders();
	const reindexFolderMutation = useReindexFolder();

	/**
	 * Detecta carpetas que necesitan indexación
	 */
	const detectFoldersNeedingIndexing = useCallback((folders: FolderWithStats[]): FolderWithStats[] => {
		const now = new Date();
		const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000); // 1 hora atrás

		return folders.filter((folder) => {
			// Carpeta nunca indexada
			if (!folder.lastIndexed) {
				logger.debug(`Carpeta nunca indexada: ${folder.name} (${folder.id})`);
				return true;
			}

			// Carpeta indexada hace más de 1 hora y está vacía
			const lastIndexed = new Date(folder.lastIndexed);
			const isOld = lastIndexed < oneHourAgo;
			const isEmpty = (folder._count?.images || 0) === 0 && (folder.totalFiles || 0) === 0;

			if (isOld && isEmpty) {
				logger.debug(`Carpeta vacía y desactualizada: ${folder.name} (${folder.id})`);
				return true;
			}

			// Criterios adicionales podrían agregarse aquí si se requieren

			return false;
		});
	}, []);

	/**
	 * Indexa una carpeta específica
	 */
	const indexFolder = useCallback(
		async (folder: FolderWithStats): Promise<{ success: boolean; error?: string }> => {
			// Verificar si podemos ejecutar la operación con circuit breaker
			if (!circuitBreaker.current.isAvailable()) {
				const state = circuitBreaker.current.getState();
				return {
					success: false,
					error: `Auto-indexing temporalmente deshabilitado (fallos: ${state.failureCount})`,
				};
			}

			try {
				logger.info(`🔄 Indexando carpeta: ${folder.name} (${folder.id})`);

				// Ejecutar con protección de circuit breaker
				await circuitBreaker.current.execute(`folder-${folder.id}`, async () => {
					await reindexFolderMutation.mutateAsync({ id: folder.id });
				});

				logger.info(`✅ Carpeta indexada correctamente: ${folder.name}`);
				return { success: true };
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
				logger.error(`❌ Error indexando carpeta ${folder.name}:`, error);

				// Log auto-indexing errors to file
				autoIndexingLogger.logError(`Error en auto-indexación de carpeta: ${folder.name}`, {
					folderId: folder.id,
					folderPath: folder.path,
					context: {
						folderName: folder.name,
						hasStats: folder.totalFiles != null,
						totalFiles: folder.totalFiles,
					},
					error: error instanceof Error ? error : new Error(String(error)),
				});

				return { success: false, error: errorMessage };
			}
		},
		[reindexFolderMutation]
	);

	/**
	 * Ejecuta el proceso de indexación automática
	 */
	const runAutoIndexing = useCallback(async () => {
		// Verificar referencias para evitar condiciones de carrera
		if (!foldersResponse?.data || isIndexingRef.current || isUnmountedRef.current) {
			return;
		}

		// Verificar circuit breaker
		if (!circuitBreaker.current.isAvailable()) {
			logger.debug('🔓 Circuit breaker abierto, saltando auto-indexing');
			return;
		}

		const folders = foldersResponse.data;
		const foldersNeedingIndexing = detectFoldersNeedingIndexing(folders);

		if (foldersNeedingIndexing.length === 0) {
			logger.debug('✅ No hay carpetas que necesiten indexación');
			return;
		}

		logger.info(`🔍 Detectadas ${foldersNeedingIndexing.length} carpetas que necesitan indexación`);

		// Marcar como en progreso
		isIndexingRef.current = true;

		// Limitar la cantidad de carpetas a procesar
		const foldersToProcess = foldersNeedingIndexing.slice(0, maxFoldersPerBatch);

		setStatus({
			isIndexing: true,
			indexedFolders: 0,
			totalFolders: foldersToProcess.length,
			currentFolder: null,
			errors: [],
		});

		onIndexingStart?.();

		const errors: Array<{ folderId: string; message: string }> = [];
		let indexedCount = 0;

		for (const folder of foldersToProcess) {
			// Verificar si el componente se desmontó durante el procesamiento
			if (isUnmountedRef.current) {
				logger.info('🛑 Componente desmontado, cancelando indexación');
				break;
			}

			setStatus((prev) => ({
				...prev,
				currentFolder: folder.name,
			}));

			const result = await indexFolder(folder);

			if (result.success) {
				indexedCount++;
			} else {
				errors.push({
					folderId: folder.id,
					message: result.error || 'Error desconocido',
				});
			}

			const currentStatus: AutoIndexingStatus = {
				isIndexing: true,
				indexedFolders: indexedCount,
				totalFolders: foldersToProcess.length,
				currentFolder: folder.name,
				errors,
			};

			setStatus(currentStatus);
			onProgress?.(currentStatus);

			// Pequeña pausa entre indexaciones para no sobrecargar
			if (!isUnmountedRef.current) {
				await new Promise((resolve) => setTimeout(resolve, 1000));
			}
		}

		const finalStatus: AutoIndexingStatus = {
			isIndexing: false,
			indexedFolders: indexedCount,
			totalFolders: foldersToProcess.length,
			currentFolder: null,
			errors,
		};

		// Finalizar solo si no se desmontó el componente
		if (!isUnmountedRef.current) {
			setStatus(finalStatus);
			onIndexingComplete?.(finalStatus);

			// Mostrar resultados
			if (errors.length === 0) {
				toastService.success(`✅ ${indexedCount} carpetas indexadas automáticamente`);
				logger.info(`✅ Indexación automática completada: ${indexedCount} carpetas procesadas`);
			} else {
				toastService.warning(
					`⚠️ Indexación completada con errores: ${indexedCount} exitosas, ${errors.length} errores`
				);
				logger.warn(`⚠️ Indexación con errores: ${indexedCount} exitosas, ${errors.length} errores`);

				// Log batch completion with errors
				autoIndexingLogger.logWarning(
					`Auto-indexación completada con errores: ${indexedCount} exitosas, ${errors.length} errores`,
					{
						context: {
							indexedCount,
							totalErrors: errors.length,
							foldersToProcess: foldersNeedingIndexing.length,
							batchSize: maxFoldersPerBatch,
							errors: errors.slice(0, 5), // Solo primeros 5 errores para evitar logs muy grandes
						},
					}
				);
			}
		}

		// Limpiar flag de en progreso
		isIndexingRef.current = false;
	}, [
		foldersResponse,
		detectFoldersNeedingIndexing,
		maxFoldersPerBatch,
		indexFolder,
		onIndexingStart,
		onProgress,
		onIndexingComplete,
	]);

	/**
	 * Inicia manualmente el proceso de indexación
	 */
	const startIndexing = useCallback(() => {
		logger.info('🚀 Iniciando indexación automática manual');
		runAutoIndexing();
	}, [runAutoIndexing]);

	/**
	 * Detiene el proceso de indexación (cancela el siguiente ciclo)
	 */
	const stopIndexing = useCallback(() => {
		logger.info('⏹️ Deteniendo indexación automática');

		// Marcar como desmontado para cancelar operaciones en curso
		isIndexingRef.current = false;

		// Limpiar interval si existe
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}

		setStatus((prev) => ({ ...prev, isIndexing: false }));
	}, []);

	// Configurar verificación automática por intervalo
	useEffect(() => {
		if (!autoStart) {
			return;
		}

		// Limpiar interval anterior si existe
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
		}

		intervalRef.current = setInterval(() => {
			logger.debug('🔍 Verificando carpetas para indexación automática...');
			runAutoIndexing();
		}, checkInterval);

		// Ejecutar una verificación inicial
		const initialTimeout = setTimeout(() => {
			if (!isUnmountedRef.current) {
				logger.info('🔍 Ejecutando verificación inicial de indexación');
				runAutoIndexing();
			}
		}, 5000); // 5 segundos después del montaje

		return () => {
			// Cleanup al desmontar
			isUnmountedRef.current = true;

			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
			clearTimeout(initialTimeout);
		};
	}, [autoStart, checkInterval, runAutoIndexing]);

	// Cleanup adicional al desmontar
	useEffect(() => {
		return () => {
			isUnmountedRef.current = true;
			isIndexingRef.current = false;
		};
	}, []);

	return {
		status,
		startIndexing,
		stopIndexing,
		isIndexing: status.isIndexing,
		progress: status.totalFolders > 0 ? status.indexedFolders / status.totalFolders : 0,
	};
}

/**
 * 📝 Documentación del hook:
 *
 * ## Funcionalidades principales:
 *
 * 1. **Detección automática**: Encuentra carpetas que necesitan indexación
 * 2. **Indexación por lotes**: Procesa múltiples carpetas de forma controlada
 * 3. **Progreso en tiempo real**: Reporta el estado de la indexación
 * 4. **Manejo de errores**: Captura y reporta errores durante la indexación
 * 5. **Control manual**: Permite iniciar/detener el proceso manualmente
 *
 * ## Criterios de detección:
 *
 * - Carpetas nunca indexadas (lastIndexed = null)
 * - Carpetas vacías indexadas hace más de 1 hora
 * - Criterios configurables a futuro (sin bandera autoReindex)
 *
 * ## Ejemplo de uso:
 *
 * ```tsx
 * const { status, startIndexing, isIndexing } = useAutoFolderIndexing({
 *   autoStart: true,
 *   maxFoldersPerBatch: 3,
 *   onIndexingComplete: (status) => {
 *     console.log(`Indexadas ${status.indexedFolders} carpetas`);
 *   }
 * });
 * ```
 */
