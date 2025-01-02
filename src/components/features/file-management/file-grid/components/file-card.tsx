'use client';

import { useState } from 'react'
import Image from 'next/image'
import { FileItem } from '@/types/files'
import { Card, CardContent } from '@/components/ui/card'
import { useImageViewer } from '@/store/image-viewer'

interface FileCardProps {
  file: FileItem
}

export function FileCard({ file }: FileCardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const { openViewer } = useImageViewer()

  const handleDoubleClick = () => {
    openViewer([file], 0)
  }

  return (
    <Card
      className="group relative overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
      onDoubleClick={handleDoubleClick}
    >
      <CardContent className="p-0">
        <div className="relative aspect-square">
          <Image
            src={file.thumbnailUrl}
            alt={file.name}
            fill
            className={`
              object-cover transition-opacity duration-200
              ${isLoading ? 'opacity-0' : 'opacity-100'}
            `}
            onLoadingComplete={() => setIsLoading(false)}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      </CardContent>
    </Card>
  )
}