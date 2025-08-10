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

// Regex precompiladas a nivel superior
const RE_BACKSLASH = /\\/g;
const RE_MULTI_SLASH = /\/+/g;

const operationsLogger = clientLogger.withContext('FoldersOperations');

// Normalización pura (estable a nivel de módulo)
const normalizeInput = (p: string): { input: FolderCreateInput; name: string } => {
	const normalizedPath = p.trim().replace(RE_BACKSLASH, '/').replace(RE_MULTI_SLASH, '/');
	const folderName = normalizedPath.split('/').filter(Boolean).pop() || normalizedPath;
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
	return { input, name: folderName };
};

// Mapeo de error para alta de carpeta (puro)
const mapAddFolderError = (folderPath: string, error: unknown): string => {
	if (error instanceof Error) {
		const msg = error.message || 'Error desconocido';
		if (msg.includes('409') || msg.includes('Ya existe una carpeta')) {
			return `Ya existe una carpeta con la ruta: ${folderPath.trim()}`;
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

const mapNetworkTimeoutError = (error: unknown, ctx: 'reindex' | 'reindexAll'): string => {
	const fallback = 'Error desconocido';
	if (!(error instanceof Error)) {
		return fallback;
	}
	const msg = error.message;
	if (msg.includes('Failed to fetch') || msg.includes('ERR_EMPTY_RESPONSE')) {
		return ctx === 'reindex'
			? 'Error de conexión durante el reindexado. El proceso puede continuar en segundo plano.'
			: 'Error de conexión durante la reindexación global. El proceso puede continuar en segundo plano.';
	}
	if (msg.includes('Timeout')) {
		return ctx === 'reindex'
			? 'El reindexado está tomando más tiempo del esperado. Puede continuar en segundo plano.'
			: 'La reindexación global está tomando más tiempo del esperado. Puede continuar en segundo plano.';
	}
	return msg || fallback;
};

// Stub de cache (cliente)
const clearMetadataCache = () => {
	clientLogger.withContext('MetadataCache').info('🧹 Cache metadata: operación delegada al servidor');
};

interface UseOperationsOptions {
	onStartProcessing: (folderId: string) => void;
	onLoadData: () => Promise<void>;
	onError: (error: Error | string) => void;
	onReindexAllStart: () => void;
}

export function useFoldersOperations({
	onStartProcessing,
	onLoadData,
	onError,
	onReindexAllStart: _onReindexAllStart,
}: UseOperationsOptions) {
	// Hooks de API
	const createFolderMutation = useCreateFolder();
	const reindexFolderMutation = useReindexFolder();
	const deleteFolderMutation = useDeleteFolder();
	const updateFolderMutation = useUpdateFolder();
	const reindexAllFoldersMutation = useReindexAllFolders();

	// Helpers locales (estables)
	const ensureNonEmptyPath = useCallback(
		(p: string): boolean => {
			if (!p?.trim()) {
				const msg = 'La ruta de la carpeta no puede estar vacía';
				operationsLogger.error('❌ Ruta de carpeta vacía');
				onError(msg);
				toastService.error(msg);
				return false;
			}
			return true;
		},
		[onError]
	);

	const ensureNotExists = useCallback(
		async (p: string): Promise<boolean> => {
			operationsLogger.info('🔍 Validando si la carpeta ya existe:', { path: p });
			const exists = await validateFolderExists(p.trim());
			if (exists) {
				const msg = `Ya existe una carpeta con la ruta: ${p.trim()}`;
				operationsLogger.warn('⚠️ Carpeta duplicada detectada:', { path: p.trim() });
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
				await reindexFolderMutation.mutateAsync(folderId);
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
		async (folderPath: string): Promise<null | { input: FolderCreateInput; name: string }> => {
			if (!ensureNonEmptyPath(folderPath)) {
				return null;
			}
			if (!(await ensureNotExists(folderPath))) {
				return null;
			}
			return normalizeInput(folderPath);
		},
		[ensureNonEmptyPath, ensureNotExists]
	);

	const handleAddFolder = useCallback(
		async (folderPath: string) => {
			try {
				operationsLogger.info('➕ Agregando carpeta:', { path: folderPath });
				const inputData = await getAddFolderInput(folderPath);
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
				const errorMessage = mapAddFolderError(folderPath, error);
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
				await withTimeout(reindexFolderMutation.mutateAsync(folderId), 120_000, 'Timeout en reindexación');
				await onLoadData();
				operationsLogger.info('✅ Reindexación completada');
				toastService.success('Carpeta reindexada correctamente');
			} catch (error) {
				operationsLogger.error('❌ Error al reindexar carpeta:', error);
				const errorMessage = mapNetworkTimeoutError(error, 'reindex');
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
	const handleAutoReindexToggle = useCallback(
		async (folderId: string, value: boolean) => {
			if (!folderId || folderId === 'undefined') {
				operationsLogger.error('❌ Error: Invalid folderId for toggle auto-reindex:', folderId);
				toastService.error('Error: ID de carpeta inválido');
				return;
			}
			try {
				operationsLogger.info('🔄 Actualizando auto-reindexado:', { folderId, value });
				await updateFolderMutation.mutateAsync({ id: folderId, data: { autoReindex: value } });
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

	// Reindexar todo
	const handleReindexAll = useCallback(async () => {
		try {
			operationsLogger.info('🔄 Iniciando reindexación global directa');
			toastService.info('🔄 Iniciando reindexado global', {
				description: 'Reindexando todas las carpetas...',
				duration: 5000,
			});
			await withTimeout(reindexAllFoldersMutation.mutateAsync(), 300_000, 'Timeout en reindexación global');
			await onLoadData();
			operationsLogger.info('✅ Reindexación global completada');
			toastService.success('Reindexación global completada');
		} catch (error) {
			operationsLogger.error('❌ Error al iniciar reindexación global:', error);
			const errorMessage = mapNetworkTimeoutError(error, 'reindexAll');
			onError(errorMessage);
			toastService.error(errorMessage);
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
		handleAutoReindexToggle,
		handleReindexAll,
		handleClearCache,
	};
}
