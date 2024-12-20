'use client';

import { useCallback, useEffect, useState } from 'react';
import { ViewProps } from '../types';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useInfiniteQuery } from '@tanstack/react-query';
import { FileItem } from '@/types/file-item';
import { ImageCard } from '../shared/image-card';
import { LoadingSpinner } from '@/components/ui/spinner';

const PAGE_SIZE = 100;

async function fetchImagePage(pageIndex: number) {
  const response = await fetch(`/api/images?page=${pageIndex}&pageSize=${PAGE_SIZE}`);
  if (!response.ok) throw new Error('Network response was not ok');
  return response.json();
}

export function AllImagesView({ isResizing }: ViewProps) {
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (node !== null) {
      setParentRef(node);
    }
  }, []);

  const [parentRef, setParentRef] = useState<HTMLDivElement | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['images'],
    queryFn: ({ pageParam = 0 }) => fetchImagePage(pageParam),
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === PAGE_SIZE ? allPages.length : undefined;
    },
    initialPageParam: 0,
  });

  const allRows = data ? data.pages.flat() : [];

  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? allRows.length + 1 : allRows.length,
    getScrollElement: () => parentRef,
    estimateSize: () => 200,
    overscan: 5,
  });

  useEffect(() => {
    const [lastItem] = [...rowVirtualizer.getVirtualItems()].reverse();

    if (!lastItem) {
      return;
    }

    if (
      lastItem.index >= allRows.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [
    hasNextPage,
    fetchNextPage,
    allRows.length,
    isFetchingNextPage,
    rowVirtualizer.getVirtualItems(),
  ]);

  const handleImageSelect = useCallback((image: FileItem) => {
    // TODO: Implementar selección de imagen
    console.log('Selected image:', image);
  }, []);

  if (isFetching && !isFetchingNextPage) {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-full overflow-auto"
      style={{
        contain: 'strict',
      }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 p-4">
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const isLoaderRow = virtualRow.index > allRows.length - 1;
            const image = allRows[virtualRow.index];

            return (
              <div
                key={virtualRow.index}
                data-index={virtualRow.index}
                ref={rowVirtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {isLoaderRow ? (
                  hasNextPage ? (
                    <LoadingSpinner />
                  ) : null
                ) : (
                  <ImageCard
                    image={image}
                    onSelect={handleImageSelect}
                    isResizing={isResizing}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
