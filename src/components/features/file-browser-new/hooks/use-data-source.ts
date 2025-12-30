/**
 * @file Hook de fuente de datos para File Browser
 * @module file-browser-new/hooks/use-data-source
 */

import { useCallback, useMemo, useRef } from 'react';
import type { BrowserItem } from '../types';
import { toBrowserItem, createParentNavItem } from '../types';
import { useFolderFilesPaginated } from './use-folder-files-paginated';
import { useFolder } from '@/lib/api/folders';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';
import { DEFAULT_PAGE_SIZE } from '../core/constants';

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

	// Hook de carga paginada
	const { files, isLoading, isLoadingMore, error, hasMore, loadMore, total, loadedCount, refetch, invalidate } =
		useFolderFilesPaginated({
			folderId,
			includeSubfolders,
			pageSize,
			enabled: enabled && !!folderId && !directItems,
		});

	// Convertir a BrowserItems
	const items = useMemo(() => {
		// Si hay items directos, usarlos
		if (directItems) {
			return directItems;
		}

		// Convertir archivos cargados
		return files.map((file) => toBrowserItem(file as Record<string, unknown>));
	}, [directItems, files]);

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
		isLoading,
		isLoadingMore,
		error: error?.message ?? null,
		totalCount: total,
		loadedCount,
		hasMore,
		loadMore,
		refresh,
		invalidate,
		scrollContainerRef,
		parentFolderId: currentFolder?.parentId ?? null,
	};
}
