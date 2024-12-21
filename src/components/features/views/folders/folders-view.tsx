'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { FolderIcon, ImageIcon, TrashIcon } from 'lucide-react';
import { formatBytes, formatDate } from '@/lib/format';
import { type FolderWithStats } from '@/services/folder.service';

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-[200px] rounded-lg" />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-8">
      <FolderIcon className="w-16 h-16 text-muted-foreground mb-4" />
      <h3 className="text-2xl font-bold mb-2">No hay carpetas</h3>
      <p className="text-muted-foreground max-w-[500px] mb-8">
        No hay carpetas indexadas. Agrega una carpeta para comenzar a gestionar tus imágenes.
      </p>
    </div>
  );
}

function FolderCard({ folder, onDelete }: { folder: FolderWithStats; onDelete: (folder: FolderWithStats) => void }) {
  const router = useRouter();

  const handleClick = useCallback(() => {
    router.push(`/folders/${folder.id}/view`);
  }, [router, folder.id]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onDelete(folder);
  }, [folder, onDelete]);

  return (
    <Card
      className="relative overflow-hidden hover:border-primary transition-colors cursor-pointer group"
      onClick={handleClick}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="truncate">{folder.name}</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleDelete}
          >
            <TrashIcon className="w-4 h-4" />
          </Button>
        </div>
        <CardDescription className="truncate">{folder.path}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <Badge variant="secondary" className="gap-1">
            <ImageIcon className="w-3 h-3" />
            {folder._count.images} imágenes
          </Badge>
          <Badge variant="secondary">
            {formatBytes(Number(folder.totalSize || 0))}
          </Badge>
        </div>
      </CardContent>

      <CardFooter className="text-sm text-muted-foreground">
        Última actualización: {formatDate(folder.updatedAt)}
      </CardFooter>
    </Card>
  );
}

export function FoldersView() {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: folders, isLoading, error, refetch } = useQuery<FolderWithStats[]>({
    queryKey: ['folders'],
    queryFn: async () => {
      const response = await fetch('/api/folders');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(errorData.error || 'Error al cargar las carpetas');
      }
      return response.json();
    }
  });

  const handleDelete = useCallback(async (folder: FolderWithStats) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta carpeta?')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/folders?id=${folder.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(errorData.error || 'Error al eliminar la carpeta');
      }

      toast.success('Carpeta eliminada correctamente');
      refetch();
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast.error(error instanceof Error ? error.message : 'Error al eliminar la carpeta');
    } finally {
      setIsDeleting(false);
    }
  }, [refetch]);

  useEffect(() => {
    if (error) {
      toast.error('Error al cargar las carpetas', {
        description: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }, [error]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!folders?.length) {
    return <EmptyState />;
  }

  return (
    <div className="h-full overflow-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {folders.map((folder) => (
          <FolderCard
            key={folder.id}
            folder={folder}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}
