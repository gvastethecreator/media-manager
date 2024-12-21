'use client';

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import { FileImage } from "lucide-react"
import { VirtualizedView } from "@/components/features/file-management/file-browser/components/virtualized-view"
import { FileItem } from "@/types/file-item"
import { useToast } from "@/components/ui/use-toast"
import { useImageViewer } from "@/store/image-viewer"

const PAGE_SIZE = 50

export function FolderView() {
  const params = useParams()
  const { toast } = useToast()
  const { openViewer } = useImageViewer()
  const [loading, setLoading] = useState(true)
  const [images, setImages] = useState<FileItem[]>([])
  const [selectedItem, setSelectedItem] = useState<FileItem | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)

  const loadImages = async (pageNum: number, append = false) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/folders/${params.id}/images?page=${pageNum}&limit=${PAGE_SIZE}`)
      if (!response.ok) {
        throw new Error('Error al cargar las imágenes')
      }
      const data = await response.json()

      // Convertir las imágenes al formato FileItem
      const fileItems: FileItem[] = data.images.map((image: any) => ({
        id: image.id,
        name: image.name,
        type: 'image',
        size: image.size,
        path: image.path,
        url: `/api/files/${image.id}`,
        thumbnailUrl: `/api/thumbnails/${image.id}`,
        metadata: {
          dimensions: {
            width: image.width,
            height: image.height
          },
          orientation: image.width > image.height ? 'landscape' : 'portrait',
          created: image.createdAt,
          modified: image.updatedAt,
          tags: image.tags?.map((tag: any) => ({
            id: tag.id,
            name: tag.name,
            color: tag.color
          })) || []
        },
        gridInfo: {
          rowSpan: image.height > image.width * 1.5 ? 2 : 1,
          colSpan: image.width > image.height * 1.5 ? 2 : 1,
          priority: (image.width * image.height) / 1000000
        }
      }))

      setImages(prev => append ? [...prev, ...fileItems] : fileItems)
      setHasMore(data.hasMore)
      setPage(pageNum)
    } catch (error) {
      console.error('Error cargando imágenes:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las imágenes",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadImages(1)
  }, [params.id])

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadImages(page + 1, true)
    }
  }, [loading, hasMore, page])

  const handleItemClick = useCallback((item: FileItem) => {
    setSelectedItem(item)
    setSelectedIds([item.id])
  }, [])

  const handleItemDoubleClick = useCallback((item: FileItem) => {
    if (item.type === 'image') {
      openViewer(item, images)
    }
  }, [openViewer, images])

  if (!loading && images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <FileImage className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">No hay imágenes</h2>
        <p className="text-muted-foreground">
          Esta carpeta no contiene imágenes
        </p>
      </div>
    )
  }

  return (
    <div className="h-full w-full">
      <VirtualizedView
        items={images}
        viewMode="grid"
        thumbnailSize="medium"
        selectedItem={selectedItem}
        selectedIds={selectedIds}
        onItemClick={handleItemClick}
        onItemDoubleClick={handleItemDoubleClick}
        hasMore={hasMore}
        isLoading={loading}
        onLoadMore={handleLoadMore}
      />
    </div>
  )
}
