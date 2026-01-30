/**
 * @file Hook de paginación para File Browser
 * @module file-browser-new/hooks/use-pagination
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { InfiniteScrollOptions, PaginationState } from '../types/view.types';

export interface UsePaginationOptions {
	/** Total de items */
	totalItems: number;
	/** Tamaño de página */
	pageSize: number;
	/** Página inicial */
	initialPage?: number;
	/** Callback cuando cambia la página */
	onPageChange?: (page: number) => void;
	/** Opciones de scroll infinito */
	infiniteScroll?: InfiniteScrollOptions;
	/** Si hay más items disponibles */
	hasMoreItems?: boolean;
	/** Callback para cargar más */
	onLoadMore?: () => void;
	/** Si está cargando más */
	isLoadingMore?: boolean;
}

export interface UsePaginationResult {
	/** Estado de paginación */
	state: PaginationState;
	/** Ir a página específica */
	goToPage: (page: number) => void;
	/** Ir a página anterior */
	prevPage: () => void;
	/** Ir a página siguiente */
	nextPage: () => void;
	/** Ir a primera página */
	firstPage: () => void;
	/** Ir a última página */
	lastPage: () => void;
	/** Items de la página actual (para slicing) */
	pageRange: { start: number; end: number };
	/** Handler de scroll para infinite scroll */
	scrollHandler: (container: HTMLElement) => void;
	/** Si puede ir a página anterior */
	canPrev: boolean;
	/** Si puede ir a página siguiente */
	canNext: boolean;
	/** Items mostrados actualmente */
	shownCount: number;
}

/**
 * Hook de paginación con soporte para infinite scroll
 */
export function usePagination({
	totalItems,
	pageSize,
	initialPage = 0,
	onPageChange,
	infiniteScroll,
	hasMoreItems = false,
	onLoadMore,
	isLoadingMore = false,
}: UsePaginationOptions): UsePaginationResult {
	const [page, setPage] = useState(initialPage);

	// Anti-spam para infinite scroll
	const lastLoadTimeRef = useRef(0);
	const lastScrollHeightRef = useRef(0);

	// Calcular totales
	const totalPages = useMemo(() => {
		return Math.max(1, Math.ceil(totalItems / pageSize));
	}, [totalItems, pageSize]);

	// Rango de items para la página actual
	const pageRange = useMemo(() => {
		const start = page * pageSize;
		const end = Math.min(start + pageSize, totalItems);
		return { start, end };
	}, [page, pageSize, totalItems]);

	// Items mostrados actualmente
	const shownCount = useMemo(() => {
		return pageRange.end - pageRange.start;
	}, [pageRange]);

	// Estado de paginación
	const state: PaginationState = useMemo(
		() => ({
			page,
			pageSize,
			totalItems,
			totalPages,
			hasMore: hasMoreItems || page < totalPages - 1,
		}),
		[page, pageSize, totalItems, totalPages, hasMoreItems]
	);

	// Navegación
	const canPrev = page > 0;
	const canNext = page < totalPages - 1 || hasMoreItems;

	const goToPage = useCallback(
		(newPage: number) => {
			const clampedPage = Math.max(0, Math.min(newPage, totalPages - 1));
			if (clampedPage !== page) {
				setPage(clampedPage);
				onPageChange?.(clampedPage);
			}
		},
		[page, totalPages, onPageChange]
	);

	const prevPage = useCallback(() => {
		if (canPrev) goToPage(page - 1);
	}, [canPrev, goToPage, page]);

	const nextPage = useCallback(() => {
		if (canNext) {
			if (page >= totalPages - 1 && hasMoreItems && onLoadMore) {
				// Cargar más items
				onLoadMore();
			} else {
				goToPage(page + 1);
			}
		}
	}, [canNext, page, totalPages, hasMoreItems, onLoadMore, goToPage]);

	const firstPage = useCallback(() => goToPage(0), [goToPage]);
	const lastPage = useCallback(() => goToPage(totalPages - 1), [goToPage, totalPages]);

	// Handler de scroll para infinite scroll
	const scrollHandler = useCallback(
		(container: HTMLElement) => {
			if (!(infiniteScroll?.enabled && hasMoreItems) || isLoadingMore || !onLoadMore) {
				return;
			}

			const { scrollTop, scrollHeight, clientHeight } = container;
			const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

			// Umbral dinámico
			const threshold = infiniteScroll.threshold;
			const viewportThreshold = clientHeight * 1.2;
			const dynamicThreshold = Math.max(threshold, viewportThreshold);

			if (distanceFromBottom <= dynamicThreshold) {
				const now = Date.now();
				const cooldown = infiniteScroll.cooldownMs ?? 300;

				// Anti-spam: verificar tiempo y que realmente se agregó contenido
				if (scrollHeight !== lastScrollHeightRef.current && now - lastLoadTimeRef.current >= cooldown) {
					lastScrollHeightRef.current = scrollHeight;
					lastLoadTimeRef.current = now;
					onLoadMore();
				}
			}
		},
		[infiniteScroll, hasMoreItems, isLoadingMore, onLoadMore]
	);

	// Reset página cuando cambia el total significativamente
	useEffect(() => {
		if (page >= totalPages && totalPages > 0) {
			setPage(totalPages - 1);
		}
	}, [totalPages, page]);

	return {
		state,
		goToPage,
		prevPage,
		nextPage,
		firstPage,
		lastPage,
		pageRange,
		scrollHandler,
		canPrev,
		canNext,
		shownCount,
	};
}
