"use client"

import * as React from "react"
import { useFiles } from "@/lib/contexts/file-context"
import { MainToolbar } from "@/components/main-toolbar/main-toolbar"
import { FileView } from "@/components/file-view"
import { useFileDrop } from "@/lib/hooks/use-file-drop"
import { useFileList } from "@/lib/hooks/use-file-list"
import { cn } from "@/lib/utils"
import { TopBar } from "./top-bar"
import { StatusBar } from "./status-bar"

interface MainContentProps {
  onOpenSettings: () => void
}

export function MainContent({ onOpenSettings }: MainContentProps) {
  const {
    files,
    viewMode,
    thumbnailSize,
    selectedFiles,
    selectFiles,
    deselectFiles,
  } = useFiles()

  const {
    files: sortedFiles,
    handleSearch,
    handleSort,
    handleFilterTags,
    handleFilterCollections,
    clearFilters,
  } = useFileList()

  const [selectedItem, setSelectedItem] = React.useState<any>(null)
  const { isDragging, dropProps } = useFileDrop()

  React.useEffect(() => {
    if (selectedFiles.length === 0) {
      setSelectedItem(null)
    } else if (selectedFiles.length === 1) {
      const item = files.find((f) => f.id === selectedFiles[0])
      setSelectedItem(item || null)
    }
  }, [selectedFiles, files])

  const handleSelectItem = (item: any) => {
    if (selectedFiles.includes(item.id)) {
      deselectFiles([item.id])
    } else {
      selectFiles([item.id])
    }
  }

  return (
    <div className="flex h-full flex-col">
      <TopBar onOpenSettings={onOpenSettings} />
      <div
        className={cn(
          "flex flex-1 flex-col overflow-hidden",
          isDragging && "bg-muted/50 backdrop-blur-sm"
        )}
        {...dropProps}
      >
        <MainToolbar
          onSearch={handleSearch}
          onSort={handleSort}
          onFilterTags={handleFilterTags}
          onFilterCollections={handleFilterCollections}
          onClearFilters={clearFilters}
        />
        <div className="flex-1 overflow-auto">
          <FileView
            view={viewMode}
            thumbnailSize={
              thumbnailSize === "small"
                ? "small"
                : thumbnailSize === "large"
                ? "large"
                : "medium"
            }
            files={sortedFiles}
            selectedItem={selectedItem}
            onSelectItem={handleSelectItem}
          />
        </div>
        <StatusBar />
      </div>
    </div>
  )
}

