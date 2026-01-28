/**
 * @file Hook de fuente de datos para File Browser
 * @module file-browser-new/hooks/use-data-source
 */

import { useCallback, useMemo, useRef } from 'react';
import { useFolder, useFolders } from '@/lib/api/folders';
import { clientLogger } from '@/lib/logger/client-logger';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';
import { DEFAULT_PAGE_SIZE } from '../core/constants';
import type { BrowserItem } from '../types';
import { createParentNavItem, toBrowserItem } from '../types';
import { useFolderFilesPaginated } from './use-folder-files-paginated';

const logger = clientLogger.withContext('UseDataSource');

export interface UseDataSourceOptions {
	/** ID de carpeta a cargar */
	folderId: string | null;
	/** Items directos (alternativa a folder) */
	directItems?: BrowserItem[];
	/** Tamaño de página */
	pageSize?: number;
	/** Incluir subcarpetas */
	includeSubfolders?: boolean;
	/** Habilitado */
	enabled?: boolean;
}

export interface UseDataSourceResult {
	/** Items cargados */
	items: BrowserItem[];
	/** Si está cargando inicialmente */
	isLoading: boolean;
	/** Si está cargando más items */
	isLoadingMore: boolean;
	/** Error si existe */
	error: string | null;
	/** Total de items disponibles */
	totalCount: number;
	/** Items cargados hasta ahora */
	loadedCount: number;
	/** Si hay más items por cargar */
	hasMore: boolean;
	/** Cargar más items */
	loadMore: () => void;
	/** Recargar datos */
	refresh: () => Promise<void>;
	/** Invalidar cache */
	invalidate: () => void;
	/** Ref del contenedor de scroll */
	scrollContainerRef: React.RefObject<HTMLDivElement | null>;
	/** ID de la carpeta padre */
	parentFolderId: string | null;
}

/**
 * Hook unificado de fuente de datos
 * Abstrae la obtención de datos de carpeta o items directos
 */
export function useDataSource({
	folderId,
	directItems,
	pageSize = DEFAULT_PAGE_SIZE,
	includeSubfolders: includeSubfoldersOverride,
	enabled = true,
}: UseDataSourceOptions): UseDataSourceResult {
	// Configuración global
	const includeSubfoldersGlobal = useViewOptionsStore((s) => s.includeSubfolders);
	const includeSubfolders = includeSubfoldersOverride ?? includeSubfoldersGlobal;

	// Ref para scroll container
	const scrollContainerRef = useRef<HTMLDivElement | null>(null);

	// Datos de la carpeta actual
	const { data: currentFolder } = useFolder(folderId || '');
	const {
		data: childFoldersResponse,
		isLoading: isFoldersLoading,
		error: childFoldersError,
	} = useFolders(folderId ? { parentId: folderId, limit: 500 } : {}, { enabled: !!folderId && !directItems });

	// Hook de carga paginada
	const { files, isLoading, isLoadingMore, error, hasMore, loadMore, total, loadedCount, refetch, invalidate } =
		useFolderFilesPaginated({
			folderId,
			includeSubfolders,
			pageSize,
			enabled: enabled && !!folderId && !directItems,
		});

	const folderItems = useMemo(() => {
		if (!folderId || directItems) {
			return [] as BrowserItem[];
		}

		const folders = childFoldersResponse?.data ?? [];
		return folders
			.filter(Boolean)
			.map((folder) => toBrowserItem(folder as unknown as Record<string, unknown>))
			.filter((item) => Boolean(item?.id) && Boolean(item?.entityType));
	}, [childFoldersResponse?.data, directItems, folderId]);

	// Convertir a BrowserItems
	const items = useMemo(() => {
		// Si hay items directos, usarlos (filtrar nulos)
		if (directItems) {
			return directItems.filter(Boolean) as BrowserItem[];
		}

		logger.info('🔄 Converting files to items', { filesCount: files.length });

		// Convertir archivos cargados con guardas básicas
		const fileItems = files
			.filter(Boolean)
			.map((file) => toBrowserItem(file as Record<string, unknown>))
			.filter((item) => Boolean(item?.id) && Boolean(item?.entityType));
		return [...folderItems, ...fileItems];
	}, [directItems, files, folderItems]);

	// Items con navegación a padre
	const itemsWithParent = useMemo(() => {
		const parentId = currentFolder?.parentId;
		if (parentId && !directItems) {
			return [createParentNavItem(parentId), ...items];
		}
		return items;
	}, [items, currentFolder?.parentId, directItems]);

	// Refresh callback
	const refresh = useCallback(async () => {
		if (directItems) return;
		await refetch();
	}, [directItems, refetch]);

	// Resultado para items directos
	if (directItems) {
		return {
			items: itemsWithParent,
			isLoading: false,
			isLoadingMore: false,
			error: null,
			totalCount: directItems.length,
			loadedCount: directItems.length,
			hasMore: false,
			loadMore: () => {},
			refresh: async () => {},
			invalidate: () => {},
			scrollContainerRef,
			parentFolderId: null,
		};
	}

	return {
		items: itemsWithParent,
		isLoading: isLoading || isFoldersLoading,
		isLoadingMore,
		error: error?.message ?? childFoldersError?.message ?? null,
		totalCount: total + folderItems.length,
		loadedCount: loadedCount + folderItems.length,
		hasMore,
		loadMore,
		refresh,
		invalidate,
		scrollContainerRef,
		parentFolderId: currentFolder?.parentId ?? null,
	};
}
