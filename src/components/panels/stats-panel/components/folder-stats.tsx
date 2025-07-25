/**
 * Componente para mostrar estadísticas específicas de una carpeta
 */

import { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FolderIcon, ImageIcon, Clock, Calendar } from 'lucide-react';
import { useImageStore } from '@/store/entities/image';

interface FolderStatsProps {
  folderId?: string;
  folderName?: string;
}

export const FolderStats = memo(function FolderStats({ folderId, folderName }: FolderStatsProps) {
  const getImagesByFolder = useImageStore((state: any) => state.getImagesByFolder);

  // Obtener las imágenes de la carpeta actual
  const folderImages = useMemo(() => {
    if (!folderId) return [];
    return getImagesByFolder(folderId);
  }, [folderId, getImagesByFolder]);

  // Calcular estadísticas de la carpeta
  const folderStats = useMemo(() => {
    if (folderImages.length === 0) {
      return {
        totalImages: 0,
        lastModified: null,
        firstAdded: null,
      };
    }

    const sortedByUpdated = [...folderImages].sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    const sortedByCreated = [...folderImages].sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return {
      totalImages: folderImages.length,
      lastModified: sortedByUpdated[0]?.updatedAt,
      firstAdded: sortedByCreated[0]?.createdAt,
    };
  }, [folderImages]);

  const folderDisplayName = folderName || folderId || 'Carpeta desconocida';

  // Formatear fechas
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Desconocido';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Hoy';
    if (diffDays === 2) return 'Ayer';
    if (diffDays <= 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="p-4 space-y-4">
      {/* Título de la carpeta */}
      <div className="flex items-center gap-2 mb-4">
        <FolderIcon className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium truncate">
          {folderDisplayName}
        </h3>
      </div>

      {/* Estadísticas principales */}
      <Card className="border-0 shadow-none bg-muted/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs text-muted-foreground">
            Contenido de la carpeta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-3 w-3 text-blue-500" />
              <span className="text-xs">Total de imágenes</span>
            </div>
            <span className="text-xs font-medium">{folderStats.totalImages}</span>
          </div>

          <Separator className="my-2" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-green-500" />
              <span className="text-xs">Última modificación</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {formatDate(folderStats.lastModified)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3 text-purple-500" />
              <span className="text-xs">Primera imagen</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {formatDate(folderStats.firstAdded)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Información adicional */}
      <Card className="border-0 shadow-none bg-muted/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs text-muted-foreground">
            Información adicional
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-xs text-muted-foreground">
            Carpeta: <span className="font-medium text-foreground">{folderDisplayName}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Tipo: <span className="font-medium text-foreground">Imágenes</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Estado: <span className="font-medium text-green-600">
              {folderStats.totalImages > 0 ? 'Con contenido' : 'Vacía'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
