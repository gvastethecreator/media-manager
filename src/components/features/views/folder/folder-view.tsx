'use client';

import { useEffect, useState, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { VirtualizedView } from '@/components/features/file-management/file-browser/components/virtualized-view';
import { FileItem } from '@/types/file-item';
import { useImageViewer } from '@/store/image-viewer';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/spinner';
import { Image } from '@prisma/client';
import { toast } from 'sonner';
import { ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FolderViewProps {
  id: string;
  isResizing?: boolean;
}

const PAGE_SIZE = 50;

function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-8">
      <ImageIcon className="w-16 h-16 text-muted-foreground mb-4" />
      <h3 className="text-2xl font-bold mb-2">No hay imágenes</h3>
      <p className="text-muted-foreground max-w-[500px] mb-8">
        Esta carpeta no contiene imágenes. Agrega algunas imágenes a la carpeta y refresca para verlas aquí.
      </p>
      <Button onClick={() => window.location.reload()}>
        Refrescar
      </Button>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <LoadingSpinner className="w-8 h-8 mb-4" />
      <p className="text-muted-foreground animate-pulse">
        Cargando imágenes...
      </p>
    </div>
  );
}

function mapImageToFileItem(image: Image & { tags?: any[]; stats?: any }): FileItem {
  return {
    id: image.id,
    name: image.name,
    type: 'image',
    size: Number(image.size || 0),
    modified: image.updatedAt,
    path: image.path,
    thumbnailUrl: `/api/thumbnails/${image.id}`,
    metadata: {
      dimensions: {
        width: image.width,
        height: image.height
      },
      aspectRatio: image.width / image.height,
      orientation: image.width > image.height ? 'landscape' : image.width < image.height ? 'portrait' : 'square',
      fileType: image.path.split('.').pop()?.toLowerCase(),
      created: image.createdAt,
      tags: image.tags?.map(tag => ({
        id: tag.id,
        name: tag.name,
        color: tag.color
      })) || [],
      stats: image.stats ? {
        views: image.stats.views || 0,
        downloads: image.stats.downloads || 0,
        lastViewed: image.stats.lastViewed
      } : undefined
    },
    gridInfo: {
      rowSpan: image.height > image.width * 1.5 ? 2 : 1,
      colSpan: image.width > image.height * 1.5 ? 2 : 1,
      priority: (image.width * image.height) / 1000000,
      displayMode: 'normal'
    }
  };
}

export function FolderView({ id, isResizing }: FolderViewProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<FileItem | null>(null);
  const { openViewer } = useImageViewer();
  const router = useRouter();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    error
  } = useInfiniteQuery({
    queryKey: ['folder-images', id],
    queryFn: async ({ pageParam = 0 }) => {
      try {
        console.log('Fetching images for folder:', id);
        const response = await fetch(
          `/api/folders/${id}/images?page=${pageParam}&pageSize=${PAGE_SIZE}`,
          {
            headers: {
              'Accept': 'application/json'
            }
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
          console.error('Error response:', errorData);
          throw new Error(errorData.error || 'Error al cargar las imágenes');
        }

        const images = await response.json();
        console.log(`Received ${images.length} images`);
        return images.map(mapImageToFileItem);
      } catch (error) {
        console.error('Error fetching images:', error);
        throw error;
      }
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === PAGE_SIZE ? allPages.length : undefined;
    },
    initialPageParam: 0,
  });

  const allFiles = data?.pages.flat() || [];

  const handleItemClick = useCallback((item: FileItem) => {
    setSelectedItem(item);
    setSelectedIds([item.id]);
  }, []);

  const handleItemDoubleClick = useCallback((item: FileItem) => {
    if (item.type === 'image') {
      openViewer(item, allFiles);
    }
  }, [openViewer, allFiles]);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting) {
          fetchNextPage();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '200px'
      }
    );

    const sentinel = document.querySelector('#scroll-sentinel');
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    if (error) {
      toast.error('Error al cargar las imágenes', {
        description: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }, [error]);

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8">
        <ImageIcon className="w-16 h-16 text-destructive mb-4" />
        <h3 className="text-2xl font-bold mb-2 text-destructive">Error</h3>
        <p className="text-muted-foreground text-center max-w-[500px] mb-8">
          {error instanceof Error ? error.message : 'Error desconocido'}
        </p>
        <Button onClick={() => window.location.reload()}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (isFetching && !data?.pages.length) {
    return <LoadingState />;
  }

  if (!allFiles.length && !isFetching) {
    return <EmptyState />;
  }

  return (
    <div className="h-full relative">
      <VirtualizedView
        items={allFiles}
        viewMode="grid"
        thumbnailSize="medium"
        selectedItem={selectedItem}
        selectedIds={selectedIds}
        onItemClick={handleItemClick}
        onItemDoubleClick={handleItemDoubleClick}
        isResizing={isResizing}
      />

      {hasNextPage && (
        <div
          id="scroll-sentinel"
          className="h-20 w-full absolute bottom-0 flex items-center justify-center"
        >
          {isFetchingNextPage && <LoadingSpinner />}
        </div>
      )}
    </div>
  );
}
