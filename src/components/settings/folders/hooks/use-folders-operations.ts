'use client';

import { createFolder, deleteFolder, updateFolder } from '@/app/actions/folders';
import { clearMetadataCache } from '@/app/actions/metadata';
import { clientLogger } from '@/lib/logger/client-logger';
import { toastService } from '@/services/toast';
import type { FolderCreateInput } from '@/types/entities/folder';
import { useCallback } from 'react';

const operationsLogger = clientLogger.withContext('FoldersOperations');

interface UseOperationsOptions {
	onStartProcessing: (folderId: string) => void;
	onLoadData: () => Promise<void>;
	onError: (error: Error | string) => void;
	onReindexAllStart: () => void;
}

/**
 * Hook para gestionar las operaciones CRUD de carpetas
 */
export function useFoldersOperations({
	onStartProcessing,
	onLoadData,
	onError,
	onReindexAllStart,
}: UseOperationsOptions) {
	// Añadir una nueva carpeta
	const handleAddFolder = useCallback(
		async (folderPath: string) => {
			try {
				operationsLogger.info('➕ Agregando carpeta:', { path: folderPath });

				// Crear el input correctamente
				const input: FolderCreateInput = {
					path: folderPath,
					name: folderPath.split('/').pop() || folderPath,
					autoReindex: false,
				};

				// Llamar a la acción del servidor
				const result = await createFolder(input);

				// Notificar inicio de procesamiento
				onStartProcessing(result.id);

				operationsLogger.info('✅ Carpeta agregada correctamente:', result);
				await onLoadData(); // Recargar datos

				toastService.success(`La carpeta ${result.name} se ha agregado correctamente`);
			} catch (error) {
				operationsLogger.error('❌ Error al agregar carpeta:', error);

				onError(error instanceof Error ? error.message : 'Error desconocido');

				toastService.error(error instanceof Error ? error.message : 'Error desconocido');
			}
		},
		[onStartProcessing, onLoadData, onError]
	);

	// Reindexar una carpeta
	const handleReindexFolder = useCallback(
		async (folderId: string) => {
			try {
				operationsLogger.info('🔄 Reindexando carpeta:', { folderId });

				// Notificar inicio de procesamiento
				onStartProcessing(folderId);

				// TODO: Implementar reindex cuando esté disponible
				// Por ahora solo actualizamos la fecha
				await updateFolder(folderId, { lastIndexed: new Date() });

				operationsLogger.info('✅ Reindexación iniciada');
			} catch (error) {
				operationsLogger.error('❌ Error al reindexar carpeta:', error);

				onError(error instanceof Error ? error.message : 'Error desconocido');

				toastService.error(error instanceof Error ? error.message : 'Error desconocido');
			}
		},
		[onStartProcessing, onError]
	);

	// Eliminar una carpeta
	const handleRemoveFolder = useCallback(
		async (folderId: string) => {
			try {
				operationsLogger.info('🗑️ Eliminando carpeta:', { folderId });

				// Llamar a la acción del servidor
				await deleteFolder(folderId);

				// Recargar datos
				await onLoadData();

				toastService.success('La carpeta ha sido eliminada correctamente');
			} catch (error) {
				operationsLogger.error('❌ Error al eliminar carpeta:', error);

				onError(error instanceof Error ? error.message : 'Error desconocido');

				toastService.error(error instanceof Error ? error.message : 'Error desconocido');
			}
		},
		[onLoadData, onError]
	);

	// Actualizar configuración de autoreindexado
	const handleAutoReindexToggle = useCallback(
		async (folderId: string, value: boolean) => {
			try {
				operationsLogger.info('🔄 Actualizando auto-reindexado:', { folderId, value });

				// Llamar a la acción del servidor
				await updateFolder(folderId, { autoReindex: value });

				// Recargar datos
				await onLoadData();

				toastService.success(`Auto-reindexado ${value ? 'activado' : 'desactivado'}`);
			} catch (error) {
				operationsLogger.error('❌ Error al actualizar auto-reindexado:', error);

				onError(error instanceof Error ? error.message : 'Error desconocido');

				toastService.error(error instanceof Error ? error.message : 'Error desconocido');
			}
		},
		[onLoadData, onError]
	);

	// Reindexar todas las carpetas
	const handleReindexAll = useCallback(async () => {
		try {
			operationsLogger.info('🔄 Iniciando reindexación global');

			// Notificar inicio del proceso global
			onReindexAllStart();

			// La acción real se ejecutará en handleConfirmReindexAll en useFolders
		} catch (error) {
			operationsLogger.error('❌ Error al iniciar reindexación global:', error);

			onError(error instanceof Error ? error.message : 'Error desconocido');

			toastService.error(error instanceof Error ? error.message : 'Error desconocido');
		}
	}, [onReindexAllStart, onError]);

	// Limpiar caché
	const handleClearCache = useCallback(async () => {
		try {
			operationsLogger.info('🧹 Limpiando caché de metadatos');

			// Llamar a la acción del servidor para limpiar la caché
			await clearMetadataCache();

			// Recargar datos después de limpiar la caché
			await onLoadData();

			toastService.success('El caché de metadatos ha sido limpiado correctamente');
		} catch (error) {
			operationsLogger.error('❌ Error al limpiar caché:', error);

			onError(error instanceof Error ? error.message : 'Error desconocido');

			toastService.error(error instanceof Error ? error.message : 'Error desconocido');
		}
	}, [onError, onLoadData]);

	return {
		handleAddFolder,
		handleReindexFolder,
		handleRemoveFolder,
		handleAutoReindexToggle,
		handleReindexAll,
		handleClearCache,
	};
}
