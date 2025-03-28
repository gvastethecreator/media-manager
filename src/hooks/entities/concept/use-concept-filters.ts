import { useConceptStore } from '@/store/entities/concept';
import type { ConceptSortOption, ConceptViewMode } from '@/types/entities/concept/enums';
import type { ConceptFilters } from '@/types/entities/concept/extended';
import { useCallback } from 'react';

/**
 * Hook que proporciona funcionalidades para gestionar filtros de conceptos
 */
export function useConceptFilters() {
	// Obtener estado y acciones del store relacionadas con filtros
	const {
		filters,
		sortBy,
		page,
		pageSize,
		viewMode,
		setFilters,
		setSortBy,
		setPage,
		setPageSize,
		clearFilters,
		setViewMode,
	} = useConceptStore();

	// Actualizar filtros de búsqueda
	const updateFilters = useCallback(
		(newFilters: Partial<ConceptFilters>) => {
			// Al cambiar filtros, resetear a la primera página
			setPage(1);
			setFilters(newFilters);
		},
		[setFilters, setPage]
	);

	// Actualizar opción de ordenamiento
	const updateSortBy = useCallback(
		(option: ConceptSortOption) => {
			setSortBy(option);
		},
		[setSortBy]
	);

	// Cambiar de página
	const updatePage = useCallback(
		(newPage: number) => {
			setPage(newPage);
		},
		[setPage]
	);

	// Cambiar tamaño de página
	const updatePageSize = useCallback(
		(newSize: number) => {
			setPageSize(newSize);
			// Al cambiar tamaño de página, resetear a la primera página
			setPage(1);
		},
		[setPageSize, setPage]
	);

	// Limpiar todos los filtros
	const resetFilters = useCallback(() => {
		clearFilters();
		setPage(1);
	}, [clearFilters, setPage]);

	// Cambiar modo de vista
	const updateViewMode = useCallback(
		(mode: ConceptViewMode) => {
			setViewMode(mode);
		},
		[setViewMode]
	);

	return {
		// Estado actual
		filters,
		sortBy,
		page,
		pageSize,
		viewMode,

		// Acciones
		updateFilters,
		updateSortBy,
		updatePage,
		updatePageSize,
		resetFilters,
		updateViewMode,
	};
}
