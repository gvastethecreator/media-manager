'use client';

import { useEffect, useState } from 'react';
import { ViewProps } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { cn, formatBytes } from '@/lib/utils';
import { Folder, ImageIcon, RefreshCw, Settings2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getFolders } from '@/services/folder.service';
import { toast } from 'sonner';

interface FolderCardProps {
  folder: any;
  onReindex: (id: string) => void;
  onDelete: (id: string) => void;
  isProcessing: boolean;
  processStatus: any;
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="w-[300px] h-[300px] relative mb-8">
        <Folder className="w-full h-full text-muted-foreground/20" />
      </div>
      <h3 className="text-2xl font-bold mb-2">No hay carpetas indexadas</h3>
      <p className="text-muted-foreground max-w-[500px]">
        Agrega carpetas desde el panel de configuración para comenzar a indexar tus imágenes.
      </p>
    </div>
  );
}

function FolderCard({ folder, onReindex, onDelete, isProcessing, processStatus }: FolderCardProps) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const handleDelete = () => {
    if (isConfirmingDelete) {
      onDelete(folder.id);
      setIsConfirmingDelete(false);
    } else {
      setIsConfirmingDelete(true);
      setTimeout(() => setIsConfirmingDelete(false), 3000);
    }
  };

  const isProcessingThis = isProcessing && processStatus.folderId === folder.id;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="h-full"
    >
      <Card className="w-full h-full overflow-hidden group transition-all duration-200 hover:shadow-lg">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-md bg-muted">
                <Folder className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-xl">{folder.name}</CardTitle>
                <CardDescription className="line-clamp-1">{folder.path}</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onReindex(folder.id)}
                disabled={isProcessing}
              >
                <RefreshCw className={cn(
                  "h-4 w-4",
                  isProcessingThis && "animate-spin"
                )} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8",
                  isConfirmingDelete && "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                )}
                onClick={handleDelete}
                disabled={isProcessing}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-2">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="p-2 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Archivos</p>
              <p className="text-sm font-medium">{folder._count?.images || 0}</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Tamaño</p>
              <p className="text-sm font-medium">{formatBytes(Number(folder.totalSize || 0))}</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Última indexación</p>
              <p className="text-sm font-medium">
                {folder.lastIndexed ? new Date(folder.lastIndexed).toLocaleDateString() : 'Nunca'}
              </p>
            </div>
          </div>

          {/* Progress bar if processing */}
          {isProcessingThis && (
            <div className="space-y-2">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-200"
                  style={{ width: `${processStatus.progress || 0}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{processStatus.status || 'Procesando...'}</span>
                <span>{processStatus.current}/{processStatus.total}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
      {Array(4).fill(0).map((_, i) => (
        <Skeleton key={i} className="w-full h-[200px]" />
      ))}
    </div>
  );
}

export function FoldersView({ isResizing }: ViewProps) {
  const [folders, setFolders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState({});

  // ... resto de la implementación similar a folders-section ...

  const handleReindex = async (folderId: string) => {
    // Implementar lógica de reindexación
    toast.promise(
      // Aquí iría la llamada real
      Promise.resolve(),
      {
        loading: 'Reindexando carpeta...',
        success: 'Carpeta reindexada correctamente',
        error: 'Error al reindexar la carpeta'
      }
    );
  };

  const handleDelete = async (folderId: string) => {
    // Implementar lógica de eliminación
    toast.promise(
      // Aquí iría la llamada real
      Promise.resolve(),
      {
        loading: 'Eliminando carpeta...',
        success: 'Carpeta eliminada correctamente',
        error: 'Error al eliminar la carpeta'
      }
    );
  };

  useEffect(() => {
    const loadFolders = async () => {
      try {
        setIsLoading(true);
        const data = await getFolders();
        setFolders(data);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    };

    loadFolders();
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-destructive">Error: {error}</p>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (folders.length === 0) {
    return <EmptyState />;
  }

  return (
    <ScrollArea className="h-full w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        {folders.map((folder) => (
          <FolderCard
            key={folder.id}
            folder={folder}
            onReindex={handleReindex}
            onDelete={handleDelete}
            isProcessing={isProcessing}
            processStatus={processStatus}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
