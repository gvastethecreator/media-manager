'use client';

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';
import { CalendarIcon, FileIcon, SortAscIcon, SortDescIcon, StarIcon, TextIcon } from 'lucide-react';
import { useCallback } from 'react';

/**
 * Selector de tipo de ordenamiento para el navegador de archivos
 * Permite cambiar entre los diferentes criterios de ordenamiento: nombre, fecha, tamaño, etc.
 */
export function SortTypeSelector() {
  const { sortOptions, setSortOptions } = useViewOptionsStore();

  const handleSortChange = useCallback((field: string) => {
    setSortOptions({
      field,
      direction: sortOptions?.field === field && sortOptions?.direction === 'asc' ? 'desc' : 'asc',
    });
  }, [sortOptions, setSortOptions]);

  // Determinar qué icono mostrar según el ordenamiento actual
  const getCurrentIcon = useCallback(() => {
    if (!sortOptions) return <SortAscIcon className="h-4 w-4" />;

    const { direction } = sortOptions;
    return direction === 'asc' ? <SortAscIcon className="h-4 w-4" /> : <SortDescIcon className="h-4 w-4" />;
  }, [sortOptions]);

  // Determinar el texto a mostrar según el ordenamiento actual
  const getSortText = useCallback(() => {
    if (!sortOptions) return 'Ordenar';

    const { field } = sortOptions;
    switch (field) {
      case 'name': return 'Nombre';
      case 'createdAt': return 'Fecha';
      case 'size': return 'Tamaño';
      case 'type': return 'Tipo';
      default: return 'Ordenar';
    }
  }, [sortOptions]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1">
          {getCurrentIcon()}
          <span className="hidden sm:inline">{getSortText()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => handleSortChange('name')}>
          <TextIcon className="mr-2 h-4 w-4" />
          <span>Nombre</span>
          {sortOptions?.field === 'name' && (
            <span className="ml-auto">
              {sortOptions.direction === 'asc' ? <SortAscIcon className="h-4 w-4" /> : <SortDescIcon className="h-4 w-4" />}
            </span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSortChange('createdAt')}>
          <CalendarIcon className="mr-2 h-4 w-4" />
          <span>Fecha</span>
          {sortOptions?.field === 'createdAt' && (
            <span className="ml-auto">
              {sortOptions.direction === 'asc' ? <SortAscIcon className="h-4 w-4" /> : <SortDescIcon className="h-4 w-4" />}
            </span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSortChange('size')}>
          <FileIcon className="mr-2 h-4 w-4" />
          <span>Tamaño</span>
          {sortOptions?.field === 'size' && (
            <span className="ml-auto">
              {sortOptions.direction === 'asc' ? <SortAscIcon className="h-4 w-4" /> : <SortDescIcon className="h-4 w-4" />}
            </span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSortChange('isFavorite')}>
          <StarIcon className="mr-2 h-4 w-4" />
          <span>Favoritos</span>
          {sortOptions?.field === 'isFavorite' && (
            <span className="ml-auto">
              {sortOptions.direction === 'asc' ? <SortAscIcon className="h-4 w-4" /> : <SortDescIcon className="h-4 w-4" />}
            </span>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}