"use client"

import { useFiles } from "@/lib/contexts/file-context"
import { MainToolbar } from "./main-toolbar/main-toolbar"
import { FileView } from "./file-view"
import { useEffect, useState } from "react"

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

  const [selectedItem, setSelectedItem] = useState<any>(null)

  useEffect(() => {
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