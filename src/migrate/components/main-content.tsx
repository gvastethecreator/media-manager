"use client"

import * as React from "react"
import { useFiles } from "@/lib/contexts/file-context"
import { MainToolbar } from "@/components/main-toolbar/main-toolbar"
import { FileView } from "@/components/file-view"
import { useFileDrop } from "@/lib/hooks/use-file-drop"
import { cn } from "@/lib/utils"

export function MainContent() {
  const {
    files,
    viewMode,
    thumbnailSize,
    selectedFiles,
    selectFiles,
    deselectFiles,
    clearSelection,
  } = useFiles()

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
    <div
      className={cn(
        "flex h-full flex-col",
        isDragging && "bg-muted/50 backdrop-blur-sm"
      )}
      {...dropProps}
    >
      <MainToolbar />
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
          files={files}
          selectedItem={selectedItem}
          onSelectItem={handleSelectItem}
        />
      </div>
    </div>
  )
}

