import React from 'react'
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, LayoutGrid } from 'lucide-react'

interface ThumbnailSizeToggleProps {
  thumbnailSize: 'small' | 'medium' | 'large'
  setThumbnailSize: (size: 'small' | 'medium' | 'large') => void
}

export function ThumbnailSizeToggle({ thumbnailSize, setThumbnailSize }: ThumbnailSizeToggleProps) {
  return (
    <div className="hidden lg:flex items-center gap-1">
      <Button 
        variant={thumbnailSize === 'small' ? 'secondary' : 'ghost'} 
        size="icon" 
        onClick={() => setThumbnailSize('small')}
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Button 
        variant={thumbnailSize === 'medium' ? 'secondary' : 'ghost'} 
        size="icon" 
        onClick={() => setThumbnailSize('medium')}
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
      <Button 
        variant={thumbnailSize === 'large' ? 'secondary' : 'ghost'} 
        size="icon" 
        onClick={() => setThumbnailSize('large')}
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
    </div>
  )
}

