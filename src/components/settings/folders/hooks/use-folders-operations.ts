import { useCallback } from 'react';
import { useCreateFolder, useDeleteFolder, useReindexFolder, useUpdateFolder } from '@/lib/api/folders';
import type { AuthorizedPathReference } from '@/lib/api/authorized-roots';
import type { FolderCreateInput } from '@/lib/api/folders';
import { clientLogger } from '@/lib/logger/client-logger';
import { toastService } from '@/lib/ui/toast';

const operationsLogger = clientLogger.withContext('FoldersOperations');

// Normalización pura (estable a nivel de módulo)
const normalizeInput = (source: AuthorizedPathReference): { input: FolderCreateInput; name: string } => {
	const normalizedSource = { relativePath: source.relativePath.trim(), rootId: source.rootId };
	const folderName = normalizedSource.relativePath.split('/').filter(Boolean).pop() || normalizedSource.rootId;
	const input: FolderCreateInput = {
		name: folderName,
		description: null,
		emoji: null,
		color: null,
		featuredImage: null,
		parentId: null,
		presetId: null,
		source: normalizedSource,
	};
	return { input, name: folderName };
};

// Mapeo de error para alta de carpeta (puro)
const mapAddFolderError = (error: unknown): string => {
	if (error instanceof Error) {
		const msg = error.message || 'Error desconocido';
		if (msg.includes('409') || msg.includes('Ya existe una carpeta')) {
			return 'La carpeta seleccionada ya está registrada';
		}
		return msg;
	}
	return 'Error desconocido';
};

// Utilidades comunes
const withTimeout = async <T>(promise: Promise<T>, ms: number, message: string): Promise<T> => {
	let timer: ReturnType<typeof setTimeout> | null = null;
	try {
		const timeout = new Promise<never>((_, reject) => {
			timer = setTimeout(() => reject(new Error(message)), ms);
		});
		return await Promise.race([promise, timeout]);
	} finally {
		if (timer) {
			clearTimeout(timer);
		}
	}
};

const mapNetworkTimeoutError = (error: unknown): string => {
	const fallback = 'Error desconocido';
	if (!(error instanceof Error)) {
		return fallback;
	}
	const msg = error.message;
	if (msg.includes('Failed to fetch') || msg.includes('ERR_EMPTY_RESPONSE')) {
		return 'Error de conexión durante el reindexado. El proceso puede continuar en segundo plano.';
	}
	if (msg.includes('Timeout')) {
		return 'El reindexado está tomando más tiempo del esperado. Puede continuar en segundo plano.';
	}
	return msg || fallback;
};

// Stub de cache (cliente)
const clearMetadataCache = () => {
	clientLogger.withContext('MetadataCache').info('🧹 Cache metadata: operación delegada al servidor');
};

interface UseOperationsOptions {
	onError: (error: Error | string) => void;
	onLoadData: () => Promise<void>;
	onStartProcessing: (folderId: string) => void;
}

export function useFoldersOperations({ onStartProcessing, onLoadData, onError }: UseOperationsOptions) {
	// Hooks de API
	const createFolderMutation = useCreateFolder();
	const reindexFolderMutation = useReindexFolder();
	const deleteFolderMutation = useDeleteFolder();
	const updateFolderMutation = useUpdateFolder();

	// Helpers locales (estables)
	const ensureRootSelected = useCallback(
		(source: AuthorizedPathReference): boolean => {
			if (!source.rootId?.trim()) {
				const msg = 'Selecciona un media root autorizado';
				operationsLogger.error('❌ Media root no seleccionado');
				onError(msg);
				toastService.error(msg);
				return false;
			}
			return true;
		},
		[onError]
	);

	const startAutoIndexing = useCallback(
		async (folderId: string, folderName: string) => {
			try {
				await reindexFolderMutation.mutateAsync({ id: folderId });
				toastService.success(`La carpeta ${folderName} se ha agregado e indexado correctamente`);
			} catch (indexError) {
				operationsLogger.warn('⚠️ Error iniciando indexación automática:', indexError);
				toastService.success(`La carpeta ${folderName} se ha agregado correctamente`);
				toastService.warning('No se pudo iniciar la indexación automática');
			}
		},
		[reindexFolderMutation.mutateAsync]
	);

	// Añadir carpeta
	const getAddFolderInput = useCallback(
		(source: AuthorizedPathReference): null | { input: FolderCreateInput; name: string } => {
			if (!ensureRootSelected(source)) {
				return null;
			}
			return normalizeInput(source);
		},
		[ensureRootSelected]
	);

	const handleAddFolder = useCallback(
		async (source: AuthorizedPathReference) => {
			try {
				operationsLogger.info('➕ Agregando carpeta autorizada', { rootId: source.rootId });
				const inputData = getAddFolderInput(source);
				if (!inputData) {
					return;
				}
				const { input, name } = inputData;
				const result = await createFolderMutation.mutateAsync(input);
				if (!result?.id) {
					throw new Error('Error: La respuesta del servidor no contiene un ID válido');
				}

				onStartProcessing(result.id);
				operationsLogger.info('✅ Carpeta agregada correctamente:', result);
				await onLoadData();

				operationsLogger.info('🚀 Iniciando indexación automática para carpeta:', result.id);
				await startAutoIndexing(result.id, name);
			} catch (error) {
				operationsLogger.error('❌ Error al agregar carpeta:', error);
				const errorMessage = mapAddFolderError(error);
				onError(errorMessage);
				toastService.error(errorMessage);
			}
		},
		[onStartProcessing, onLoadData, onError, createFolderMutation.mutateAsync, getAddFolderInput, startAutoIndexing]
	);

	// Reindexar carpeta
	const handleReindexFolder = useCallback(
		async (folderId: string) => {
			if (!folderId || folderId === 'undefined') {
				operationsLogger.error('❌ Error: Invalid folderId for reindex:', folderId);
				toastService.error('Error: ID de carpeta inválido');
				return;
			}
			try {
				operationsLogger.info('🔄 Reindexando carpeta:', { folderId });
				onStartProcessing(folderId);
				toastService.info('🔄 Iniciando reindexado', {
					description: 'El proceso de reindexación ha comenzado...',
					duration: 3000,
				});
				await withTimeout(reindexFolderMutation.mutateAsync({ id: folderId }), 120_000, 'Timeout en reindexación');
				await onLoadData();
				operationsLogger.info('✅ Reindexación completada');
				toastService.success('Carpeta reindexada correctamente');
			} catch (error) {
				operationsLogger.error('❌ Error al reindexar carpeta:', error);
				const errorMessage = mapNetworkTimeoutError(error);
				onError(errorMessage);
				toastService.error(errorMessage);
				try {
					await onLoadData();
				} catch (reloadError) {
					operationsLogger.warn('⚠️ Error recargando datos tras error:', reloadError);
				}
			}
		},
		[onStartProcessing, onLoadData, onError, reindexFolderMutation.mutateAsync]
	);

	// Eliminar carpeta
	const handleRemoveFolder = useCallback(
		async (folderId: string) => {
			if (!folderId || folderId === 'undefined') {
				operationsLogger.error('❌ Error: Invalid folderId for delete:', folderId);
				toastService.error('Error: ID de carpeta inválido');
				return;
			}
			try {
				operationsLogger.info('🗑️ Eliminando carpeta:', { folderId });
				await deleteFolderMutation.mutateAsync(folderId);
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

	// Toggle autoReindex
	/* Eliminado: toggle de autoReindex ya no existe en el modelo */

	// Limpiar caché
	const handleClearCache = useCallback(async () => {
		try {
			operationsLogger.info('🧹 Limpiando caché de metadatos');
			await clearMetadataCache();
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
		handleClearCache,
	};
}
