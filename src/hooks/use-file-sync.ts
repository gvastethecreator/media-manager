/**
 * @file Hook para sincronización automática de archivos
 * @module hooks/use-file-sync
 * @description Hook que maneja la sincronización automática de archivos con el sistema de archivos
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { clientLogger } from '@/lib/logger/client-logger';
import { toastService } from '@/lib/ui/toast';

const logger = clientLogger.withContext('FileSync');

export interface FileSyncStatus {
	/** Errores durante la sincronización */
	errors: string[];
	/** Si está ejecutándose una sincronización */
	isSyncing: boolean;
	/** Timestamp de la última sincronización */
	lastSync?: Date;
	/** Archivos nuevos detectados en la última sincronización */
	newFiles: Array<{
		path: string;
		name: string;
		extension: string;
	}>;
	/** Archivos eliminados en la última sincronización */
	removedFiles: Array<{
		id: string;
		path: string;
		name: string;
		type: 'image' | 'video' | 'audio' | 'document' | 'json' | 'file3d';
	}>;
	/** Estadísticas de la última sincronización */
	stats?: {
		totalChecked: number;
		filesRemoved: number;
		newFilesFound: number;
		duration: number;
	};
}

export interface UseFileSyncOptions {
	/** Si debe ejecutarse automáticamente al cargar */
	autoSync?: boolean;
	/** Callback cuando se completa la sincronización */
	onSyncComplete?: (status: FileSyncStatus) => void;
	/** Callback cuando hay errores */
	onSyncError?: (errors: string[]) => void;
	/** Si debe mostrar notificaciones automáticamente */
	showNotifications?: boolean;
	/** Intervalo en milisegundos para verificar cambios (por defecto 60 segundos) */
	syncInterval?: number;
}

/**
 * Función para llamar al endpoint de sincronización de archivos
 */
async function syncFolderFiles(
	folderId: string,
	dryRun = false
): Promise<
	FileSyncStatus['stats'] & {
		removedFiles: FileSyncStatus['removedFiles'];
		newFiles: FileSyncStatus['newFiles'];
		errors: string[];
	}
> {
	const response = await fetch(`/api/folders/${folderId}/sync-files`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ dryRun }),
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`Error sincronizando archivos: ${error}`);
	}

	return await response.json();
}

/**
 * Función para verificar el estado de sincronización sin hacer cambios
 */
async function checkSyncStatus(folderId: string): Promise<
	FileSyncStatus['stats'] & {
		removedFiles: FileSyncStatus['removedFiles'];
		newFiles: FileSyncStatus['newFiles'];
		errors: string[];
	}
> {
	return await syncFolderFiles(folderId, true);
}

/**
 * Hook para sincronización automática de archivos con el sistema de archivos
 */
export function useFileSync(folderId?: string, options: UseFileSyncOptions = {}) {
	const {
		autoSync = true,
		syncInterval = 60_000, // 60 segundos
		onSyncComplete,
		onSyncError,
		showNotifications = true,
	} = options;

	const [status, setStatus] = useState<FileSyncStatus>({
		isSyncing: false,
		removedFiles: [],
		newFiles: [],
		errors: [],
	});

	const queryClient = useQueryClient();

	// Mutation para sincronización completa
	const syncMutation = useMutation({
		mutationFn: ({ folderId: id, dryRun }: { folderId: string; dryRun?: boolean }) => syncFolderFiles(id, dryRun),
		onMutate: () => {
			setStatus((prev) => ({ ...prev, isSyncing: true, errors: [] }));
		},
		onSuccess: (data) => {
			const newStatus: FileSyncStatus = {
				isSyncing: false,
				removedFiles: data.removedFiles,
				newFiles: data.newFiles,
				errors: data.errors,
				stats: {
					totalChecked: data.totalChecked,
					filesRemoved: data.filesRemoved,
					newFilesFound: data.newFilesFound,
					duration: data.duration,
				},
				lastSync: new Date(),
			};

			setStatus(newStatus);

			// Invalidar queries relacionadas para actualizar la UI
			if (folderId) {
				queryClient.invalidateQueries({ queryKey: ['images', 'folder', folderId] });
				queryClient.invalidateQueries({ queryKey: ['videos', 'folder', folderId] });
				queryClient.invalidateQueries({ queryKey: ['audios', 'folder', folderId] });
				queryClient.invalidateQueries({ queryKey: ['documents', 'folder', folderId] });
				queryClient.invalidateQueries({ queryKey: ['json-files'] });
				queryClient.invalidateQueries({ queryKey: ['file3ds', 'folder', folderId] });
				queryClient.invalidateQueries({ queryKey: ['folders'] });
			}

			// Mostrar notificaciones
			if (showNotifications) {
				if (data.errors.length > 0) {
					toastService.warning(
						`Sincronización completada con ${data.errors.length} errores. ` +
							`${data.filesRemoved} archivos eliminados, ${data.newFilesFound} nuevos detectados.`
					);
				} else if (data.filesRemoved > 0 || data.newFilesFound > 0) {
					toastService.success(
						`Sincronización completada: ${data.filesRemoved} archivos eliminados, ${data.newFilesFound} nuevos detectados.`
					);
				} else {
					logger.debug('Sincronización completada sin cambios');
				}
			}

			onSyncComplete?.(newStatus);
		},
		onError: (error) => {
			const errorMessage = error instanceof Error ? error.message : String(error);
			const newStatus: FileSyncStatus = {
				isSyncing: false,
				removedFiles: [],
				newFiles: [],
				errors: [errorMessage],
				lastSync: new Date(),
			};

			setStatus(newStatus);

			if (showNotifications) {
				toastService.error(`Error en sincronización: ${errorMessage}`);
			}

			onSyncError?.([errorMessage]);
			logger.error('Error en sincronización de archivos:', error);
		},
	});

	// Query para verificar estado (dry run)
	const statusQuery = useQuery({
		queryKey: ['file-sync-status', folderId],
		queryFn: () => (folderId ? checkSyncStatus(folderId) : Promise.resolve(null)),
		enabled: !!folderId && !syncMutation.isPending,
		refetchInterval: syncInterval,
		refetchIntervalInBackground: false,
		staleTime: 30_000, // 30 segundos
	});

	/**
	 * Ejecuta sincronización manual
	 */
	const syncNow = useCallback(
		(targetFolderId?: string) => {
			const id = targetFolderId || folderId;
			if (!id) {
				logger.warn('No se puede sincronizar: folderId no definido');
				return;
			}

			logger.info('🔄 Iniciando sincronización manual de archivos:', { folderId: id });
			syncMutation.mutate({ folderId: id, dryRun: false });
		},
		[folderId, syncMutation]
	);

	/**
	 * Verifica el estado sin hacer cambios
	 */
	const checkStatus = useCallback(
		(targetFolderId?: string) => {
			const id = targetFolderId || folderId;
			if (!id) {
				logger.warn('No se puede verificar estado: folderId no definido');
				return;
			}

			logger.info('🔍 Verificando estado de sincronización:', { folderId: id });
			syncMutation.mutate({ folderId: id, dryRun: true });
		},
		[folderId, syncMutation]
	);

	/**
	 * Sincroniza automáticamente si detecta cambios
	 */
	const autoSyncIfNeeded = useCallback(() => {
		if (!folderId) {
			return;
		}

		if (!autoSync) {
			return;
		}

		if (syncMutation.isPending) {
			return;
		}

		// Si la query del status tiene datos y hay cambios pendientes, sincronizar
		if (statusQuery.data) {
			const { filesRemoved, newFilesFound } = statusQuery.data;
			if (filesRemoved > 0 || newFilesFound > 0) {
				logger.info('🔄 Auto-sincronización activada - cambios detectados:', {
					folderId,
					filesRemoved,
					newFilesFound,
				});
				syncNow();
			}
		}
	}, [folderId, autoSync, syncMutation.isPending, statusQuery.data, syncNow]);

	// Ejecutar auto-sincronización cuando detecta cambios
	useEffect(() => {
		if (autoSync) {
			autoSyncIfNeeded();
		}
	}, [autoSync, autoSyncIfNeeded]);

	// Sincronización inicial si está habilitada
	useEffect(() => {
		if (folderId && autoSync) {
			// Crear una función local para evitar dependencias circulares
			const performInitialSync = () => {
				logger.info('🔍 Verificando estado de sincronización:', { folderId });
				syncMutation.mutate({ folderId, dryRun: true });
			};

			// Esperar un poco antes de la sincronización inicial
			const timeout = setTimeout(performInitialSync, 2000);

			return () => clearTimeout(timeout);
		}
	}, [folderId, autoSync, syncMutation.mutate]); // Eliminar syncMutation de las dependencias

	return {
		status,
		isSyncing: syncMutation.isPending,
		syncNow,
		checkStatus,
		// Estado de la query para información adicional
		isCheckingStatus: statusQuery.isFetching,
		lastStatusCheck: statusQuery.dataUpdatedAt ? new Date(statusQuery.dataUpdatedAt) : undefined,
		// Utilidades
		hasChanges: (statusQuery.data?.filesRemoved || 0) > 0 || (statusQuery.data?.newFilesFound || 0) > 0,
		pendingChanges: statusQuery.data
			? {
					filesRemoved: statusQuery.data.filesRemoved,
					newFilesFound: statusQuery.data.newFilesFound,
				}
			: null,
	};
}

/**
 * Hook simplificado para sincronización de una carpeta específica
 */
export function useFolderFileSync(folderId: string, options?: UseFileSyncOptions) {
	return useFileSync(folderId, options);
}

/**
 * Hook para sincronización global (todas las carpetas)
 */
export function useGlobalFileSync(options?: UseFileSyncOptions) {
	const [status, setStatus] = useState<Record<string, FileSyncStatus>>({});
	const queryClient = useQueryClient();

	const syncAllMutation = useMutation({
		mutationFn: async () => {
			const response = await fetch('/api/folders/sync-all-files', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				const error = await response.text();
				throw new Error(`Error sincronizando todas las carpetas: ${error}`);
			}

			return await response.json();
		},
		onSuccess: (data) => {
			setStatus(data);

			// Invalidar todas las queries relacionadas
			queryClient.invalidateQueries({ queryKey: ['images'] });
			queryClient.invalidateQueries({ queryKey: ['videos'] });
			queryClient.invalidateQueries({ queryKey: ['audios'] });
			queryClient.invalidateQueries({ queryKey: ['documents'] });
			queryClient.invalidateQueries({ queryKey: ['json-files'] });
			queryClient.invalidateQueries({ queryKey: ['file3ds'] });
			queryClient.invalidateQueries({ queryKey: ['folders'] });

			if (options?.showNotifications !== false) {
				const totalRemoved = Object.values(data).reduce((sum: number, s: any) => sum + s.stats?.filesRemoved || 0, 0);
				const totalNew = Object.values(data).reduce((sum: number, s: any) => sum + s.stats?.newFilesFound || 0, 0);

				toastService.success(
					`Sincronización global completada: ${totalRemoved} archivos eliminados, ${totalNew} nuevos detectados.`
				);
			}

			const firstStatus = Object.values(data)[0] || {
				isSyncing: false,
				removedFiles: [],
				newFiles: [],
				errors: [],
			};
			options?.onSyncComplete?.(firstStatus as FileSyncStatus);
		},
		onError: (error) => {
			logger.error('Error en sincronización global:', error);
			if (options?.showNotifications !== false) {
				toastService.error(`Error en sincronización global: ${error instanceof Error ? error.message : String(error)}`);
			}
			options?.onSyncError?.([error instanceof Error ? error.message : String(error)]);
		},
	});

	const syncAll = useCallback(() => {
		logger.info('🔄 Iniciando sincronización global de archivos');
		syncAllMutation.mutate();
	}, [syncAllMutation]);

	return {
		status,
		isSyncing: syncAllMutation.isPending,
		syncAll,
	};
}

/**
 * 📝 Documentación del hook:
 *
 * ## Funcionalidades principales:
 *
 * 1. **Sincronización automática**: Detecta cambios automáticamente y sincroniza
 * 2. **Sincronización manual**: Permite sincronizar bajo demanda
 * 3. **Verificación de estado**: Verifica cambios sin aplicarlos (dry run)
 * 4. **Notificaciones**: Informa sobre cambios y errores
 * 5. **Invalidación de cache**: Actualiza automáticamente la UI
 *
 * ## Ejemplo de uso:
 *
 * ```tsx
 * // Para una carpeta específica
 * const { status, isSyncing, syncNow, hasChanges } = useFileSync(folderId, {
 *   autoSync: true,
 *   showNotifications: true,
 *   onSyncComplete: (status) => {
 *     console.log(`Sincronización completada: ${status.stats?.filesRemoved} eliminados`);
 *   }
 * });
 *
 * // Para uso global
 * const { syncAll, isSyncing } = useGlobalFileSync({
 *   onSyncComplete: () => console.log('Sincronización global completada')
 * });
 * ```
 */
