import { memo } from 'react'
import Image from 'next/image'
import { FileItem } from '@/types/files'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatBytes } from '@/lib/utils'

interface ImageCardProps {
  image: FileItem
  onSelect: (image: FileItem) => void
}

export const ImageCard = memo(function ImageCard({ image, onSelect }: ImageCardProps) {
  const handleClick = () => {
    onSelect(image)
  }

  return (
    <Card
      className="group relative overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
      onClick={handleClick}
    >
      <CardContent className="p-0">
        <div className="relative aspect-square">
          <Image
            src={`/api/thumbnails/${image.id}`}
            alt={image.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
            <h3 className="text-sm font-medium text-white truncate">
              {image.name}
            </h3>
            <div className="flex flex-wrap gap-1">
              <Badge variant="secondary" className="text-[10px]">
                {formatBytes(image.size)}
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                {image.width}x{image.height}
              </Badge>
              {image.tags?.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="text-[10px]"
                  style={{ backgroundColor: tag.color || undefined }}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})