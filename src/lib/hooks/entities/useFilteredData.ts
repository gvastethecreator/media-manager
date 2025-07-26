import { useMemo } from 'react';
import { FilterOption, SortOption } from '@/store/ui/view-options.slice';

type FilterableData = Record<string, any>[];

/**
 * Hook personalizado para filtrar y ordenar datos según las opciones de vista
 *
 * @param data Los datos a filtrar y ordenar
 * @param filterOptions Las opciones de filtrado
 * @param sortOptions Las opciones de ordenación
 * @param searchQuery La consulta de búsqueda
 * @param searchFields Los campos en los que buscar (si no se especifica, se busca en todos)
 * @returns Los datos filtrados y ordenados
 */
export function useFilteredData<T extends FilterableData>(
	data: T,
	filterOptions: FilterOption[],
	sortOptions: SortOption[],
	searchQuery: string,
	searchFields?: string[]
): T {
	return useMemo(() => {
		if (!data || data.length === 0) {
			return [] as unknown as T;
		}

		let filteredData = [...data];

		// Aplicar filtros
		if (filterOptions.length > 0) {
			filteredData = filteredData.filter((item) => {
				return filterOptions.every((filter) => {
					const value = item[filter.field];
					if (value === undefined) return false;

					switch (filter.operator) {
						case 'eq':
							return value === filter.value;
						case 'neq':
							return value !== filter.value;
						case 'gt':
							return filter.value !== null && value > filter.value;
						case 'lt':
							return filter.value !== null && value < filter.value;
						case 'contains':
							return (
								typeof value === 'string' &&
								filter.value !== null &&
								value.toLowerCase().includes(String(filter.value).toLowerCase())
							);
						case 'startsWith':
							return (
								typeof value === 'string' &&
								filter.value !== null &&
								value.toLowerCase().startsWith(String(filter.value).toLowerCase())
							);
						case 'endsWith':
							return (
								typeof value === 'string' &&
								filter.value !== null &&
								value.toLowerCase().endsWith(String(filter.value).toLowerCase())
							);
						default:
							return true;
					}
				});
			});
		}

		// Aplicar búsqueda
		if (searchQuery && searchQuery.trim() !== '') {
			const query = searchQuery.toLowerCase().trim();

			filteredData = filteredData.filter((item) => {
				// Si se especifican campos de búsqueda, buscar solo en esos campos
				if (searchFields && searchFields.length > 0) {
					return searchFields.some((field) => {
						const value = item[field];
						return value !== undefined && String(value).toLowerCase().includes(query);
					});
				}

				// Si no se especifican campos, buscar en todos los campos de tipo string
				return Object.entries(item).some(([_, value]) => {
					return value !== undefined && typeof value === 'string' && value.toLowerCase().includes(query);
				});
			});
		}

		// Aplicar ordenación
		if (sortOptions.length > 0) {
			filteredData.sort((a, b) => {
				for (const sort of sortOptions) {
					const aValue = a[sort.field];
					const bValue = b[sort.field];

					if (aValue === bValue) continue;

					if (aValue === undefined) return 1;
					if (bValue === undefined) return -1;

					const direction = sort.direction === 'asc' ? 1 : -1;

					if (typeof aValue === 'string' && typeof bValue === 'string') {
						return aValue.localeCompare(bValue) * direction;
					}

					return (aValue > bValue ? 1 : -1) * direction;
				}

				return 0;
			});
		}

		return filteredData as T;
	}, [data, filterOptions, sortOptions, searchQuery, searchFields]);
}
