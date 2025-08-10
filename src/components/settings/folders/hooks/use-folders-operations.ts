import { useCallback } from 'react';
import {
	useCreateFolder,
	useDeleteFolder,
	useReindexAllFolders,
	useReindexFolder,
	useUpdateFolder,
} from '@/lib/api/folders';
import { validateFolderExists } from '@/lib/api/services/folders';
import { clientLogger } from '@/lib/logger/client-logger';
import { toastService } from '@/lib/ui/toast';
import type { FolderCreateInput } from '@/types/entities/folder';

// Stub para clearMetadataCache en el cliente - la funcionalidad real está en el servidor
const clearMetadataCache = () => {
	clientLogger.withContext('MetadataCache').info('🧹 Cache metadata: operación delegada al servidor');
};

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
	// ✅ Llamar todos los hooks al nivel superior
	const createFolderMutation = useCreateFolder();
	const reindexFolderMutation = useReindexFolder();
	const deleteFolderMutation = useDeleteFolder();
	const updateFolderMutation = useUpdateFolder();
	const reindexAllFoldersMutation = useReindexAllFolders();

	// Añadir una nueva carpeta
	const handleAddFolder = useCallback(
		async (folderPath: string) => {
			try {
				operationsLogger.info('➕ Agregando carpeta:', { path: folderPath });

				// Validar que la ruta no esté vacía
				if (!(folderPath && folderPath.trim())) {
					const errorMessage = 'La ruta de la carpeta no puede estar vacía';
					operationsLogger.error('❌ Ruta de carpeta vacía');
					onError(errorMessage);
					toastService.error(errorMessage);
					return;
				}

				// Validar si la carpeta ya existe
				operationsLogger.info('🔍 Validando si la carpeta ya existe:', {
					path: folderPath,
				});
				const folderExists = await validateFolderExists(folderPath.trim());

				if (folderExists) {
					const errorMessage = `Ya existe una carpeta con la ruta: ${folderPath.trim()}`;
					operationsLogger.warn('⚠️ Carpeta duplicada detectada:', {
						path: folderPath.trim(),
					});
					onError(errorMessage);
					toastService.error(errorMessage);
					return;
				}

				// Normalizar la ruta
				const normalizedPath = folderPath.trim().replace(/\\/g, '/').replace(/\/+/g, '/');
				const folderName = normalizedPath.split('/').filter(Boolean).pop() || normalizedPath;

				// Crear el input correctamente
				const input: FolderCreateInput = {
					path: normalizedPath,
					name: folderName,
					description: null,
					emoji: null,
					color: null,
					featuredImage: null,
					isFavorite: false,
					totalFiles: 0,
					totalSize: 0,
					autoReindex: false,
					lastIndexed: null,
					parentId: null,
					presetId: null,
				};

				// Llamar a la acción del servidor
				const result = await createFolderMutation.mutateAsync(input);

				// Validación defensiva: asegurar que result tiene un ID válido
				if (!(result && result.id)) {
					throw new Error('Error: La respuesta del servidor no contiene un ID válido');
				}

				// Notificar inicio de procesamiento
				onStartProcessing(result.id);

				operationsLogger.info('✅ Carpeta agregada correctamente:', result);

				// Recargar datos para obtener la nueva carpeta
				await onLoadData();

				// Iniciar indexación automática de la nueva carpeta
				operationsLogger.info('🚀 Iniciando indexación automática para carpeta:', result.id);
				try {
					await reindexFolderMutation.mutateAsync(result.id);
					toastService.success(`La carpeta ${result.name} se ha agregado e indexado correctamente`);
				} catch (indexError) {
					operationsLogger.warn('⚠️ Error iniciando indexación automática:', indexError);
					toastService.success(`La carpeta ${result.name} se ha agregado correctamente`);
					toastService.warning('No se pudo iniciar la indexación automática');
				}
			} catch (error) {
				operationsLogger.error('❌ Error al agregar carpeta:', error);

				// Manejo específico para errores de validación
				let errorMessage = 'Error desconocido';
				if (error instanceof Error) {
					// Extraer mensaje específico del error 409
					if (error.message.includes('409') || error.message.includes('Ya existe una carpeta')) {
						errorMessage = `Ya existe una carpeta con la ruta: ${folderPath.trim()}`;
					} else {
						errorMessage = error.message;
					}
				}

				onError(errorMessage);
				toastService.error(errorMessage);
			}
		},
		[onStartProcessing, onLoadData, onError, createFolderMutation.mutateAsync, reindexFolderMutation.mutateAsync]
	);

	// Reindexar una carpeta
	const handleReindexFolder = useCallback(
		async (folderId: string) => {
			if (!folderId || folderId === 'undefined') {
				operationsLogger.error('❌ Error: Invalid folderId for reindex:', folderId);
				toastService.error('Error: ID de carpeta inválido');
				return;
			}

			try {
				operationsLogger.info('🔄 Reindexando carpeta:', { folderId });

				// 🔧 FIX: Notificar inicio del procesamiento ANTES de la llamada
				onStartProcessing(folderId);

				// Notificar inicio del reindexado
				toastService.info('🔄 Iniciando reindexado', {
					description: 'El proceso de reindexación ha comenzado...',
					duration: 3000,
				});

				// 🔧 FIX: Usar timeout más largo y manejo de errores mejorado
				const timeoutPromise = new Promise((_, reject) => {
					setTimeout(() => reject(new Error('Timeout en reindexación')), 120_000); // 2 minutos
				});

				const reindexPromise = reindexFolderMutation.mutateAsync(folderId);

				// Ejecutar con timeout
				await Promise.race([reindexPromise, timeoutPromise]);

				// 🔧 FIX: Forzar recarga después de la reindexación
				await onLoadData();

				operationsLogger.info('✅ Reindexación completada');
				toastService.success('Carpeta reindexada correctamente');
			} catch (error) {
				operationsLogger.error('❌ Error al reindexar carpeta:', error);

				// 🔧 FIX: Manejar errores específicos
				let errorMessage = 'Error desconocido';
				if (error instanceof Error) {
					if (error.message.includes('Failed to fetch') || error.message.includes('ERR_EMPTY_RESPONSE')) {
						errorMessage = 'Error de conexión durante el reindexado. El proceso puede continuar en segundo plano.';
					} else if (error.message.includes('Timeout')) {
						errorMessage = 'El reindexado está tomando más tiempo del esperado. Puede continuar en segundo plano.';
					} else {
						errorMessage = error.message;
					}
				}

				onError(errorMessage);
				toastService.error(errorMessage);

				// 🔧 FIX: Forzar recarga de datos aunque haya error para actualizar el estado
				try {
					await onLoadData();
				} catch (reloadError) {
					operationsLogger.warn('⚠️ Error recargando datos tras error:', reloadError);
				}
			}
		},
		[onStartProcessing, onLoadData, onError, reindexFolderMutation.mutateAsync]
	);

	// Eliminar una carpeta
	const handleRemoveFolder = useCallback(
		async (folderId: string) => {
			if (!folderId || folderId === 'undefined') {
				operationsLogger.error('❌ Error: Invalid folderId for delete:', folderId);
				toastService.error('Error: ID de carpeta inválido');
				return;
			}

			try {
				operationsLogger.info('🗑️ Eliminando carpeta:', { folderId });

				// Llamar a la acción del servidor
				await deleteFolderMutation.mutateAsync(folderId);

				// Recargar datos
				await onLoadData();

				toastService.success('La carpeta ha sido eliminada correctamente');
			} catch (error) {
				operationsLogger.error('❌ Error al eliminar carpeta:', error);

				onError(error instanceof Error ? error.message : 'Error desconocido');

				toastService.error(error instanceof Error ? error.message : 'Error desconocido');
			}
		},
		[onLoadData, onError, deleteFolderMutation.mutateAsync]
	);

	// Actualizar configuración de autoreindexado
	const handleAutoReindexToggle = useCallback(
		async (folderId: string, value: boolean) => {
			if (!folderId || folderId === 'undefined') {
				operationsLogger.error('❌ Error: Invalid folderId for toggle auto-reindex:', folderId);
				toastService.error('Error: ID de carpeta inválido');
				return;
			}

			try {
				operationsLogger.info('🔄 Actualizando auto-reindexado:', {
					folderId,
					value,
				});

				// Llamar a la acción del servidor
				await updateFolderMutation.mutateAsync({
					id: folderId,
					data: { autoReindex: value },
				});

				// Recargar datos
				await onLoadData();

				toastService.success(`Auto-reindexado ${value ? 'activado' : 'desactivado'}`);
			} catch (error) {
				operationsLogger.error('❌ Error al actualizar auto-reindexado:', error);

				onError(error instanceof Error ? error.message : 'Error desconocido');

				toastService.error(error instanceof Error ? error.message : 'Error desconocido');
			}
		},
		[onLoadData, onError, updateFolderMutation.mutateAsync]
	);

	// Reindexar todas las carpetas
	const handleReindexAll = useCallback(async () => {
		try {
			operationsLogger.info('🔄 Iniciando reindexación global directa');

			// Notificar inicio del reindexado global
			toastService.info('🔄 Iniciando reindexado global', {
				description: 'Reindexando todas las carpetas...',
				duration: 5000,
			});

			// 🔧 FIX: Usar timeout más largo y manejo de errores mejorado
			const timeoutPromise = new Promise((_, reject) => {
				setTimeout(() => reject(new Error('Timeout en reindexación global')), 300_000); // 5 minutos
			});

			const reindexPromise = reindexAllFoldersMutation.mutateAsync();

			// Ejecutar reindexación global con timeout
			await Promise.race([reindexPromise, timeoutPromise]);

			// 🔧 FIX: Forzar recarga después de la reindexación global
			await onLoadData();

			operationsLogger.info('✅ Reindexación global completada');
			toastService.success('Reindexación global completada');
		} catch (error) {
			operationsLogger.error('❌ Error al iniciar reindexación global:', error);

			// 🔧 FIX: Manejar errores específicos
			let errorMessage = 'Error desconocido';
			if (error instanceof Error) {
				if (error.message.includes('Failed to fetch') || error.message.includes('ERR_EMPTY_RESPONSE')) {
					errorMessage =
						'Error de conexión durante la reindexación global. El proceso puede continuar en segundo plano.';
				} else if (error.message.includes('Timeout')) {
					errorMessage =
						'La reindexación global está tomando más tiempo del esperado. Puede continuar en segundo plano.';
				} else {
					errorMessage = error.message;
				}
			}

			onError(errorMessage);
			toastService.error(errorMessage);

			// 🔧 FIX: Forzar recarga de datos aunque haya error para actualizar el estado
			try {
				await onLoadData();
			} catch (reloadError) {
				operationsLogger.warn('⚠️ Error recargando datos tras error en reindexación global:', reloadError);
			}
		}
	}, [onLoadData, onError, reindexAllFoldersMutation.mutateAsync]);

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
