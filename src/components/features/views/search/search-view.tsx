'use client';

import { useState } from 'react';
import { ViewProps } from '../types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileItem } from '@/types/file-item';
import { ImageCard } from '../shared/image-card';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useInfiniteQuery } from '@tanstack/react-query';
import { LoadingSpinner } from '@/components/ui/spinner';

interface SearchFilters {
  query: string;
  type: 'name' | 'content' | 'metadata' | 'all';
  dateFrom?: Date;
  dateTo?: Date;
  tags?: string[];
  collections?: string[];
  folders?: string[];
}

const PAGE_SIZE = 100;

export function SearchView({ isResizing }: ViewProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    type: 'all'
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['search', filters],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...filters,
          page: pageParam,
          pageSize: PAGE_SIZE,
        }),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === PAGE_SIZE ? allPages.length : undefined;
    },
    enabled: filters.query.length > 0,
    initialPageParam: 0,
  });

  const allResults = data ? data.pages.flat() : [];

  const handleImageSelect = (image: FileItem) => {
    // TODO: Implementar selección de imagen
    console.log('Selected image:', image);
  };

  return (
    <div className="h-full flex flex-col">
      <Card className="m-6">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex gap-4">
              <Input
                placeholder="Buscar imágenes..."
                value={filters.query}
                onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
              />
              <Button>Buscar</Button>
            </div>

            <Tabs defaultValue="basic" className="w-full">
              <TabsList>
                <TabsTrigger value="basic">Básica</TabsTrigger>
                <TabsTrigger value="advanced">Avanzada</TabsTrigger>
              </TabsList>
              <TabsContent value="basic">
                {/* TODO: Implementar filtros básicos */}
              </TabsContent>
              <TabsContent value="advanced">
                {/* TODO: Implementar filtros avanzados */}
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      <div className="flex-1 overflow-auto p-6">
        {isFetching && !isFetchingNextPage ? (
          <div className="h-full flex items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : allResults.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {allResults.map((result: FileItem) => (
              <ImageCard
                key={result.id}
                image={result}
                onSelect={handleImageSelect}
                isResizing={isResizing}
              />
            ))}
          </div>
        ) : filters.query ? (
          <div className="text-center text-muted-foreground">
            No se encontraron resultados
          </div>
        ) : null}
      </div>
    </div>
  );
}
