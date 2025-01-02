'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useInfiniteQuery } from '@tanstack/react-query';

interface CardGridItem {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  itemCount: number;
}

interface CardGridViewProps {
  queryKey: string[];
  fetchFn: (pageParam: number) => Promise<CardGridItem[]>;
  onItemClick: (item: CardGridItem) => void;
  isResizing?: boolean;
}

const PAGE_SIZE = 50;

export function CardGridView({
  queryKey,
  fetchFn,
  onItemClick,
  isResizing
}: CardGridViewProps) {
  const [parentRef, setParentRef] = useState<HTMLDivElement | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = 0 }) => fetchFn(pageParam),
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === PAGE_SIZE ? allPages.length : undefined;
    },
    initialPageParam: 0,
  });

  const allItems = data ? data.pages.flat() : [];

  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? allItems.length + 1 : allItems.length,
    getScrollElement: () => parentRef,
    estimateSize: () => 300,
    overscan: 5,
  });

  useEffect(() => {
    const [lastItem] = [...rowVirtualizer.getVirtualItems()].reverse();

    if (!lastItem) return;

    if (
      lastItem.index >= allItems.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [
    hasNextPage,
    fetchNextPage,
    allItems.length,
    isFetchingNextPage,
    rowVirtualizer.getVirtualItems(),
  ]);

  return (
    <div
      ref={setParentRef}
      className="h-full overflow-auto p-6"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const isLoaderRow = virtualRow.index > allItems.length - 1;
            const item = allItems[virtualRow.index];

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
                    <CardSkeleton />
                  ) : null
                ) : (
                  <Card
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => onItemClick(item)}
                  >
                    <CardHeader>
                      <div className="aspect-video bg-muted rounded-md overflow-hidden">
                        {item.thumbnailUrl ? (
                          <img
                            src={item.thumbnailUrl}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            No thumbnail
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <h3 className="font-medium">{item.title}</h3>
                      {item.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </CardContent>
                    <CardFooter>
                      <p className="text-sm text-muted-foreground">
                        {item.itemCount} items
                      </p>
                    </CardFooter>
                  </Card>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="aspect-video w-full" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </CardContent>
      <CardFooter>
        <Skeleton className="h-4 w-[100px]" />
      </CardFooter>
    </Card>
  );
}
