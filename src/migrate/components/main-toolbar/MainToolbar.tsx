import React from 'react'
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Home, ArrowLeft, ArrowRight, RefreshCw, PanelLeftClose } from 'lucide-react'
import { ViewToggle } from './ViewToggle'
import { ThumbnailSizeToggle } from './ThumbnailSizeToggle'
import { SidebarTrigger } from "@/components/ui/sidebar"

interface MainToolbarProps {
  view: 'grid' | 'list' | 'details'
  setView: (view: 'grid' | 'list' | 'details') => void
  thumbnailSize: 'small' | 'medium' | 'large'
  setThumbnailSize: (size: 'small' | 'medium' | 'large') => void
  isCompact: boolean
}

export function MainToolbar({ view, setView, thumbnailSize, setThumbnailSize, isCompact }: MainToolbarProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto">
      <SidebarTrigger className="lg:flex">
        <PanelLeftClose className="h-4 w-4" />
      </SidebarTrigger>
      <Separator orientation="vertical" className="h-6" />
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="flex items-center">
          <Home className="h-4 w-4" />
          <span className="sr-only lg:not-sr-only lg:ml-2">Home</span>
        </Button>
        <Button variant="ghost" size="icon">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon">
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      {!isCompact && (
        <>
          <Separator orientation="vertical" className="h-6" />
          <ViewToggle view={view} setView={setView} />
          <Separator orientation="vertical" className="h-6" />
          <ThumbnailSizeToggle thumbnailSize={thumbnailSize} setThumbnailSize={setThumbnailSize} />
        </>
      )}
    </div>
  )
}

