"use client"

import { useEffect, useState } from "react"
import { Separator } from "@/components/ui/separator"
import { useFiles } from "@/lib/contexts/file-context"
import { SearchBar } from "./search-bar"
import { ViewToggle } from "./view-toggle"
import { ThumbnailSizeToggle } from "./thumbnail-size-toggle"
import { ActionButtons } from "./action-buttons"
import { CompactMenu } from "./compact-menu"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ArrowDownAZ, ArrowDownWideNarrow, ArrowUpAZ, ArrowUpWideNarrow, Calendar, SortAsc } from "lucide-react"

interface MainToolbarProps {
  onSearch: (term: string) => void
  onSort: (by: "name" | "date" | "size") => void
  onFilterTags: (tags: string[]) => void
  onFilterCollections: (collections: string[]) => void
  onClearFilters: () => void
}

export function MainToolbar({
  onSearch,
  onSort,
  onFilterTags,
  onFilterCollections,
  onClearFilters,
}: MainToolbarProps) {
  const {
    viewMode,
    thumbnailSize,
    sortBy,
    sortOrder,
    setViewMode: updateViewMode,
    setThumbnailSize: updateThumbnailSize,
    setSortBy,
    setSortOrder,
  } = useFiles()

  const [isCompact, setIsCompact] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsCompact(window.innerWidth < 768)
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const handleSort = (by: "name" | "date" | "size") => {
    if (sortBy === by) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(by)
      setSortOrder("asc")
    }
    onSort(by)
  }

  const getSortIcon = (by: "name" | "date" | "size") => {
    if (sortBy !== by) return <SortAsc className="h-4 w-4" />

    switch (by) {
      case "name":
        return sortOrder === "asc" ? (
          <ArrowDownAZ className="h-4 w-4" />
        ) : (
          <ArrowUpAZ className="h-4 w-4" />
        )
      case "size":
        return sortOrder === "asc" ? (
          <ArrowDownWideNarrow className="h-4 w-4" />
        ) : (
          <ArrowUpWideNarrow className="h-4 w-4" />
        )
      case "date":
        return <Calendar className="h-4 w-4" />
    }
  }

  return (
    <div className="flex h-14 items-center justify-between border-b px-4">
      <div className="flex items-center gap-4">
        <SearchBar onSearch={onSearch} />
        {!isCompact && (
          <>
            <Separator orientation="vertical" className="h-6" />
            <ViewToggle view={viewMode} onViewChange={updateViewMode} />
            <ThumbnailSizeToggle size={thumbnailSize} onSizeChange={updateThumbnailSize} />
            <Separator orientation="vertical" className="h-6" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  {getSortIcon(sortBy)}
                  <span className="sr-only">Sort by</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => handleSort("name")}>
                  <ArrowDownAZ className="mr-2 h-4 w-4" />
                  Sort by name
                  {sortBy === "name" && ` (${sortOrder})`}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort("date")}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Sort by date
                  {sortBy === "date" && ` (${sortOrder})`}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort("size")}>
                  <ArrowDownWideNarrow className="mr-2 h-4 w-4" />
                  Sort by size
                  {sortBy === "size" && ` (${sortOrder})`}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        {!isCompact && <ActionButtons />}
        {isCompact && (
          <CompactMenu
            view={viewMode}
            onViewChange={updateViewMode}
            thumbnailSize={thumbnailSize}
            onThumbnailSizeChange={updateThumbnailSize}
          />
        )}
      </div>
    </div>
  )
}