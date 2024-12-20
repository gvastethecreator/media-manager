'use client';

import { useEffect, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { VirtualizedView } from '@/components/features/file-management/file-browser/components/virtualized-view';
import { FileItem } from '@/types/file-item';
import { useImageViewer } from '@/store/image-viewer';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/spinner';

interface FolderViewProps {
  path: string;
  isResizing?: boolean;
}

const PAGE_SIZE = 50;

export function FolderView({ path, isResizing }: FolderViewProps) {
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
  } = useInfiniteQuery({
    queryKey: ['folder-files', path],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await fetch(`/api/files/folder?path=${encodeURIComponent(path)}&page=${pageParam}&pageSize=${PAGE_SIZE}`);
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === PAGE_SIZE ? allPages.length : undefined;
    },
    initialPageParam: 0,
  });

  const allFiles = data?.pages.flat() || [];

  const handleItemClick = (item: FileItem) => {
    setSelectedItem(item);
    setSelectedIds([item.id]);
  };

  const handleItemDoubleClick = (item: FileItem) => {
    if (item.type === 'directory') {
      router.push(`/folder/${encodeURIComponent(item.path)}`);
    } else if (item.type === 'image') {
      openViewer(item);
    }
  };

  // Configuramos un observer para el scroll infinito
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const sentinel = document.querySelector('#scroll-sentinel');
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isFetching && !data?.pages.length) {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="p-6">
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
      </div>
      
      {/* Sentinel para scroll infinito */}
      <div
        id="scroll-sentinel"
        className="h-10 flex items-center justify-center"
      >
        {isFetchingNextPage && <LoadingSpinner />}
      </div>
    </div>
  );
}
