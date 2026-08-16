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
		const msg = error.message || 'Unknown error';
		if (msg.includes('409') || msg.includes('Ya existe una carpeta')) {
			return 'The selected folder is already registered';
		}
		return msg;
	}
	return 'Unknown error';
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
	const fallback = 'Unknown error';
	if (!(error instanceof Error)) {
		return fallback;
	}
	const msg = error.message;
	if (msg.includes('Failed to fetch') || msg.includes('ERR_EMPTY_RESPONSE')) {
		return 'The connection failed during reindexing. The process may continue in the background.';
	}
	if (msg.includes('Timeout')) {
		return 'Reindexing is taking longer than expected. It may continue in the background.';
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
				const msg = 'Select an authorized media root';
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
				toastService.success(`Folder ${folderName} was added and indexed successfully`);
			} catch (indexError) {
				operationsLogger.warn('⚠️ Error iniciando indexación automática:', indexError);
				toastService.success(`Folder ${folderName} was added successfully`);
				toastService.warning('Automatic indexing could not be started');
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
					throw new Error('Error: The server response does not contain a valid ID');
				}

				onStartProcessing(result.id);
				operationsLogger.info('✅ Carpeta agregada correctamente:', result);
				await onLoadData();

				operationsLogger.info('🚀 Iniciando indexación automática para carpeta:', result.id);
				await startAutoIndexing(result.id, name);
			} catch (error) {
				operationsLogger.error('❌ Could not add folder:', error);
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
				toastService.error('Error: Invalid folder ID');
				return;
			}
			try {
				operationsLogger.info('🔄 Reindexando carpeta:', { folderId });
				onStartProcessing(folderId);
				toastService.info('🔄 Starting reindex', {
					description: 'The reindexing process has started...',
					duration: 3000,
				});
				await withTimeout(reindexFolderMutation.mutateAsync({ id: folderId }), 120_000, 'Reindexing timed out');
				await onLoadData();
				operationsLogger.info('✅ Reindexación completada');
				toastService.success('Folder reindexed successfully');
			} catch (error) {
				operationsLogger.error('❌ Could not reindex folder:', error);
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
				toastService.error('Error: Invalid folder ID');
				return;
			}
			try {
				operationsLogger.info('🗑️ Eliminando carpeta:', { folderId });
				await deleteFolderMutation.mutateAsync(folderId);
				await onLoadData();
				toastService.success('The folder was deleted successfully');
			} catch (error) {
				operationsLogger.error('❌ Could not delete folder:', error);
				onError(error instanceof Error ? error.message : 'Unknown error');
				toastService.error(error instanceof Error ? error.message : 'Unknown error');
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
			toastService.success('The metadata cache was cleared successfully');
		} catch (error) {
			operationsLogger.error('❌ Could not clear cache:', error);
			onError(error instanceof Error ? error.message : 'Unknown error');
			toastService.error(error instanceof Error ? error.message : 'Unknown error');
		}
	}, [onError, onLoadData]);

	return {
		handleAddFolder,
		handleReindexFolder,
		handleRemoveFolder,
		handleClearCache,
	};
}
