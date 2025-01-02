'use client';

import { useInfiniteQuery } from '@tanstack/react-query'
import { FileGrid } from '@/components/features/file-management/file-grid'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

const PAGE_SIZE = 100

async function fetchImagePage({ pageParam = 0 }) {
  const response = await fetch(`/api/images?page=${pageParam}&pageSize=${PAGE_SIZE}`)
  if (!response.ok) {
    throw new Error('Error al cargar las imágenes')
  }
  const data = await response.json()
  const total = parseInt(response.headers.get('x-total-count') || '0')
  const hasNextPage = (pageParam + 1) * PAGE_SIZE < total

  return {
    data,
    nextPage: hasNextPage ? pageParam + 1 : undefined,
    total
  }
}

export function AllImagesView() {
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status
  } = useInfiniteQuery({
    queryKey: ['images'],
    queryFn: fetchImagePage,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0
  })

  if (status === 'error') {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : 'Error al cargar las imágenes'}
        </AlertDescription>
      </Alert>
    )
  }

  const allImages = data?.pages.flatMap(page => page.data) || []
  const totalImages = data?.pages[0]?.total || 0

  return (
    <div className="relative min-h-screen">
      <FileGrid
        items={allImages}
        onLoadMore={fetchNextPage}
        hasMore={!!hasNextPage}
        isLoading={isFetching}
      />

      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <LoadingSpinner />
        </div>
      )}

      {!hasNextPage && allImages.length > 0 && (
        <div className="text-center py-4 text-sm text-muted-foreground">
          Mostrando {allImages.length} de {totalImages} imágenes
        </div>
      )}
    </div>
  )
}
