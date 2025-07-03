import { useMemo } from 'react';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';
import type { FileItem } from '@/types/files';

/**
 * Hook personalizado para filtrar y ordenar datos según las opciones de vista globales
 *
 * @param data Los datos a filtrar y ordenar
 * @param searchFields Los campos en los que buscar (si no se especifica, se busca en todos)
 * @returns Los datos filtrados y ordenados
 */
export function useFilteredData<T extends FileItem[]>(
	data: T,
	searchFields: string[] = ['name', 'description', 'tags']
): T {
	// Obtenemos las opciones de filtrado y ordenación del store global
	const filterOptions = useViewOptionsStore((state) => state.filterOptions);
	const sortOptions = useViewOptionsStore((state) => state.sortOptions);
	const searchQuery = useViewOptionsStore((state) => state.searchQuery);

	return useMemo(() => {
		if (!data || data.length === 0) {
			return [] as unknown as T;
		}

		let filteredData = [...data];

		// Aplicar filtros
		if (filterOptions.length > 0) {
			filteredData = filteredData.filter((item) => {
				return filterOptions.every((filter) => {
					const value = item[filter.field as keyof FileItem];
					if (value === undefined) return false;

					// Si filter.value es null, hacer comparaciones especiales
					if (filter.value === null) {
						switch (filter.operator) {
							case 'eq':
								return value === null;
							case 'neq':
								return value !== null;
							default:
								return false;
						}
					}

					switch (filter.operator) {
						case 'eq':
							return value === filter.value;
						case 'neq':
							return value !== filter.value;
						case 'gt':
							return filter.value !== null && filter.value !== undefined && value > filter.value;
						case 'lt':
							return filter.value !== null && filter.value !== undefined && value < filter.value;
						case 'contains':
							return typeof value === 'string' && value.toLowerCase().includes(String(filter.value).toLowerCase());
						case 'startsWith':
							return typeof value === 'string' && value.toLowerCase().startsWith(String(filter.value).toLowerCase());
						case 'endsWith':
							return typeof value === 'string' && value.toLowerCase().endsWith(String(filter.value).toLowerCase());
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
				// Buscar en los campos especificados
				return searchFields.some((field) => {
					const value = item[field as keyof FileItem];
					return value !== undefined && String(value).toLowerCase().includes(query);
				});
			});
		}

		// Aplicar ordenación
		if (sortOptions.length > 0) {
			filteredData.sort((a, b) => {
				for (const sort of sortOptions) {
					const aValue = a[sort.field as keyof FileItem];
					const bValue = b[sort.field as keyof FileItem];

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
