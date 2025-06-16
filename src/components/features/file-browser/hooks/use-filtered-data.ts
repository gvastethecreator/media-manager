import { useMemo } from 'react';
import type { FileItem } from '@/types/file-item';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';

/**
 * Filtra y ordena la lista de items basándose en las
 * opciones almacenadas en `view-options`.
 */
export function useFilteredData(items: FileItem[]): FileItem[] {
  const sort = useViewOptionsStore(state => state.sort);
  const filters = useViewOptionsStore(state => state.filters);

  return useMemo(() => {
    let processed = [...items];

    // Filtrado simple por término de búsqueda
    if (filters.searchQuery) {
      const term = filters.searchQuery.toLowerCase();
      processed = processed.filter(it =>
        it.name.toLowerCase().includes(term)
      );
    }

    // Ordenación básica
    processed.sort((a, b) => {
      let aVal: string | number = '';
      let bVal: string | number = '';
      switch (sort.field) {
        case 'size':
          aVal = a.size;
          bVal = b.size;
          break;
        case 'createdAt':
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
          break;
        default:
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
      }
      if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
      if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
      return 0;
    });

    return processed;
  }, [items, sort, filters]);
}
