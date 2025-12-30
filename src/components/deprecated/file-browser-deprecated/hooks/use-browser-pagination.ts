import { useEffect, useMemo, useState } from 'react';

export interface UseBrowserPaginationOptions {
	totalCount: number;
	pageSize: number;
	isPaginatedView: boolean;
	filterId?: string | null;
	searchQuery?: string;
	sortVersion?: number;
}

export interface BrowserPaginationResult {
	page: number;
	setPage: (page: number | ((prev: number) => number)) => void;
	totalPages: number;
	maxPageIndex: number;
	shownCount: number;
}

/**
 * Hook para manejar la paginación del explorador de archivos.
 * Incluye lógica de clamping y reset automático en cambios de filtro.
 */
export function useBrowserPagination({
	totalCount,
	pageSize,
	isPaginatedView,
	filterId,
	searchQuery,
	sortVersion,
}: UseBrowserPaginationOptions): BrowserPaginationResult {
	const [page, setPage] = useState(0);

	// Calcular totales de paginación
	const totalPages = useMemo(() => {
		if (!isPaginatedView) return 1;
		return Math.max(1, Math.ceil(totalCount / pageSize));
	}, [isPaginatedView, totalCount, pageSize]);

	const maxPageIndex = useMemo(() => {
		return Math.max(0, totalPages - 1);
	}, [totalPages]);

	const shownCount = useMemo(() => {
		if (!isPaginatedView) return totalCount;
		const start = page * pageSize;
		const end = Math.min(start + pageSize, totalCount);
		return end - start;
	}, [isPaginatedView, page, pageSize, totalCount]);

	// Efecto: Clampear página si el dataset cambia de tamaño
	useEffect(() => {
		const total = Math.max(0, totalCount);
		const count = Math.max(1, Math.ceil(total / pageSize));
		setPage((p) => (p >= count ? Math.max(0, count - 1) : p));
	}, [totalCount, pageSize]);

	// Efecto: Resetear página cuando cambia el filtro, búsqueda o sort
	useEffect(() => {
		setPage(0);
	}, []);

	return {
		page,
		setPage,
		totalPages,
		maxPageIndex,
		shownCount,
	};
}
