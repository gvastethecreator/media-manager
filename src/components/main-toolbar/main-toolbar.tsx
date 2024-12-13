"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Menu } from "lucide-react"
import { useState } from "react"
import { ActionButtons } from "./action-buttons"
import { CompactMenu } from "./compact-menu"
import { SearchBar } from "./search-bar"
import { ThumbnailSizeToggle } from "./thumbnail-size-toggle"
import { ViewToggle } from "./view-toggle"

export function MainToolbar() {
  const [view, setView] = useState<"grid" | "list">("grid")
  const [thumbnailSize, setThumbnailSize] = useState<"sm" | "md" | "lg">("md")

  return (
    <div className="flex h-14 items-center justify-between border-b px-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
        <SearchBar />
        <Separator orientation="vertical" className="h-6" />
        <ViewToggle view={view} onViewChange={setView} />
        <ThumbnailSizeToggle
          size={thumbnailSize}
          onSizeChange={setThumbnailSize}
        />
      </div>
      <div className="flex items-center gap-2">
        <div className="hidden md:flex">
          <ActionButtons />
        </div>
        <div className="md:hidden">
          <CompactMenu />
        </div>
      </div>
    </div>
  )
}