/**
 * @file Hook de fuente de datos para File Browser
 * @module file-browser-new/hooks/use-data-source
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFolder, useFolders } from '@/lib/api/folders';
import { clientLogger } from '@/lib/logger/client-logger';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../core/constants';
import type { BrowserItem } from '../types/item.types';
import { createParentNavItem, toBrowserItem } from '../types/item.types';
import { useFolderFilesPaginated } from './use-folder-files-paginated';

const logger = clientLogger.withContext('UseDataSource');

export interface UseDataSourceOptions {
	/** Items directos (alternativa a folder) */
	directItems?: BrowserItem[];
	/** Habilitado */
	enabled?: boolean;
	/** ID de carpeta a cargar */
	folderId: string | null;
	/** Incluir subcarpetas */
	includeSubfolders?: boolean;
	/** Tamaño de página */
	pageSize?: number;
	/** Modo de paginación */
	paginationMode?: 'pagination' | 'infinite';
}

export interface UseDataSourceResult {
	/** Error si existe */
	error: string | null;
	/** Si hay más items por cargar */
	hasMore: boolean;
	/** Invalidar cache */
	invalidate: () => void;
	/** Si está cargando inicialmente */
	isLoading: boolean;
	/** Si está cargando más items */
	isLoadingMore: boolean;
	/** Items cargados */
	items: BrowserItem[];
	/** Items cargados hasta ahora */
	loadedCount: number;
	/** Cargar más items */
	loadMore: () => void;
	/** ID de la carpeta padre */
	parentFolderId: string | null;
	/** Recargar datos */
	refresh: () => Promise<void>;
	/** Ref del contenedor de scroll */
	scrollContainerRef: React.RefObject<HTMLDivElement | null>;
	/** Total de items disponibles */
	totalCount: number;
}

/**
 * Hook unificado de fuente de datos
 * Abstrae la obtención de datos de carpeta o items directos
 */
export function useDataSource({
	folderId,
	directItems,
	pageSize = DEFAULT_PAGE_SIZE,
	paginationMode = 'infinite',
	includeSubfolders: includeSubfoldersOverride,
	enabled = true,
}: UseDataSourceOptions): UseDataSourceResult {
	const safePageSize = Math.min(pageSize, MAX_PAGE_SIZE);

	const [directLoadedCount, setDirectLoadedCount] = useState(() =>
		directItems ? Math.min(directItems.length, safePageSize) : 0
	);

	useEffect(() => {
		if (!directItems) return;
		setDirectLoadedCount(
			paginationMode === 'pagination' ? directItems.length : Math.min(directItems.length, safePageSize)
		);
	}, [directItems, paginationMode, safePageSize]);

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
	const {
		files,
		flatFiles,
		isLoading,
		isLoadingMore,
		error,
		hasMore,
		loadMore,
		total,
		loadedCount,
		refetch,
		invalidate,
	} = useFolderFilesPaginated({
		folderId,
		includeSubfolders,
		pageSize: safePageSize,
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
			const filtered = directItems.filter(Boolean) as BrowserItem[];
			if (paginationMode === 'pagination') {
				return filtered;
			}
			return filtered.slice(0, directLoadedCount);
		}

		logger.info('🔄 Converting files to items', { filesCount: flatFiles.length });

		// Convertir archivos cargados con guardas básicas (usar flatFiles con metadata completo)
		const fileItems = flatFiles
			.filter(Boolean)
			.map((file) => toBrowserItem(file as unknown as Record<string, unknown>))
			.filter((item) => Boolean(item?.id) && Boolean(item?.entityType));
		return [...folderItems, ...fileItems];
	}, [directItems, directLoadedCount, paginationMode, flatFiles, folderItems]);

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
		const totalCount = directItems.length;
		const hasMoreDirect = paginationMode === 'pagination' ? false : totalCount > directLoadedCount;
		const loadMoreDirect = () => {
			if (paginationMode === 'pagination') return;
			setDirectLoadedCount((count) => Math.min(count + safePageSize, totalCount));
		};
		const refreshDirect = async () => {
			setDirectLoadedCount(paginationMode === 'pagination' ? totalCount : Math.min(totalCount, safePageSize));
		};
		return {
			items: itemsWithParent,
			isLoading: false,
			isLoadingMore: false,
			error: null,
			totalCount,
			loadedCount: paginationMode === 'pagination' ? totalCount : directLoadedCount,
			hasMore: hasMoreDirect,
			loadMore: loadMoreDirect,
			refresh: refreshDirect,
			invalidate: refreshDirect,
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
