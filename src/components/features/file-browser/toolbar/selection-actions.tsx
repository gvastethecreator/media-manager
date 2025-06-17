'use client';

import { Button } from '@/components/ui/button';
import { useSelectionStore } from '@/store/ui/selection.slice';
import { FileItem } from '@/types/file-item';
import { CheckIcon, CopyIcon, DownloadIcon, StarIcon, TrashIcon } from 'lucide-react';
import { memo, useCallback } from 'react';

interface SelectionActionsProps {
  items: FileItem[];
  onDelete?: (ids: string[]) => void;
  onFavorite?: (ids: string[]) => void;
  onDownload?: (ids: string[]) => void;
  onCopy?: (ids: string[]) => void;
}

/**
 * Componente para acciones de selección en el navegador de archivos
 * Muestra botones para realizar acciones sobre los elementos seleccionados
 */
export const SelectionActions = memo<SelectionActionsProps>(function SelectionActions({
  items,
  onDelete,
  onFavorite,
  onDownload,
  onCopy
}) {
  const { selectedIds, clearSelection } = useSelectionStore();

  // Obtener elementos seleccionados
  const selectedItems = items.filter(item => selectedIds.includes(item.id));

  // Manejadores de acciones
  const handleDelete = useCallback(() => {
    if (onDelete && selectedIds.length > 0) {
      onDelete(selectedIds);
    }
  }, [onDelete, selectedIds]);

  const handleFavorite = useCallback(() => {
    if (onFavorite && selectedIds.length > 0) {
      onFavorite(selectedIds);
    }
  }, [onFavorite, selectedIds]);

  const handleDownload = useCallback(() => {
    if (onDownload && selectedIds.length > 0) {
      onDownload(selectedIds);
    }
  }, [onDownload, selectedIds]);

  const handleCopy = useCallback(() => {
    if (onCopy && selectedIds.length > 0) {
      onCopy(selectedIds);
    }
  }, [onCopy, selectedIds]);

  // Si no hay elementos seleccionados, no mostrar nada
  if (selectedIds.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-muted-foreground mr-2">
        {selectedIds.length} seleccionados
      </span>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={clearSelection}
        title="Limpiar selección"
      >
        <CheckIcon className="h-4 w-4" />
      </Button>

      {onFavorite && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleFavorite}
          title="Marcar como favorito"
        >
          <StarIcon className="h-4 w-4" />
        </Button>
      )}

      {onDownload && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleDownload}
          title="Descargar seleccionados"
        >
          <DownloadIcon className="h-4 w-4" />
        </Button>
      )}

      {onCopy && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleCopy}
          title="Copiar seleccionados"
        >
          <CopyIcon className="h-4 w-4" />
        </Button>
      )}

      {onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:bg-destructive/10"
          onClick={handleDelete}
          title="Eliminar seleccionados"
        >
          <TrashIcon className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
});