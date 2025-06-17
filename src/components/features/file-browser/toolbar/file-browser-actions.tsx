'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { MoreHorizontalIcon, RefreshIcon, UploadIcon } from 'lucide-react';
import { memo, useCallback } from 'react';

interface FileBrowserActionsProps {
  onRefresh?: () => void;
  onUpload?: () => void;
  onCreateFolder?: () => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  isLoading?: boolean;
}

/**
 * Componente para acciones generales del navegador de archivos
 * Muestra botones para realizar acciones como refrescar, subir archivos, etc.
 */
export const FileBrowserActions = memo<FileBrowserActionsProps>(function FileBrowserActions({
  onRefresh,
  onUpload,
  onCreateFolder,
  onSelectAll,
  onDeselectAll,
  isLoading = false
}) {
  // Manejadores de acciones
  const handleRefresh = useCallback(() => {
    if (onRefresh) {
      onRefresh();
    }
  }, [onRefresh]);

  const handleUpload = useCallback(() => {
    if (onUpload) {
      onUpload();
    }
  }, [onUpload]);

  const handleCreateFolder = useCallback(() => {
    if (onCreateFolder) {
      onCreateFolder();
    }
  }, [onCreateFolder]);

  const handleSelectAll = useCallback(() => {
    if (onSelectAll) {
      onSelectAll();
    }
  }, [onSelectAll]);

  const handleDeselectAll = useCallback(() => {
    if (onDeselectAll) {
      onDeselectAll();
    }
  }, [onDeselectAll]);

  return (
    <div className="flex items-center gap-1">
      {onRefresh && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleRefresh}
          disabled={isLoading}
          title="Refrescar"
        >
          <RefreshIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      )}

      {onUpload && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleUpload}
          disabled={isLoading}
          title="Subir archivos"
        >
          <UploadIcon className="h-4 w-4" />
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={isLoading}
          >
            <MoreHorizontalIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {onCreateFolder && (
            <DropdownMenuItem onClick={handleCreateFolder}>
              Nueva carpeta
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {onSelectAll && (
            <DropdownMenuItem onClick={handleSelectAll}>
              Seleccionar todo
            </DropdownMenuItem>
          )}

          {onDeselectAll && (
            <DropdownMenuItem onClick={handleDeselectAll}>
              Deseleccionar todo
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
});