"use client"

import { useFiles } from "@/lib/contexts/file-context"
import { formatBytes } from "@/lib/utils"

export function StatusBar() {
  const { files, selectedFiles } = useFiles()

  const totalSize = files.reduce((acc, file) => acc + file.size, 0)
  const selectedSize = files
    .filter(f => selectedFiles.includes(f.id))
    .reduce((acc, file) => acc + file.size, 0)

  return (
    <div className="flex h-8 shrink-0 items-center justify-between border-t bg-muted/50 px-4 text-[10px]">
      <div className="flex items-center gap-4">
        <span>
          {files.length} {files.length === 1 ? "item" : "items"}
          {selectedFiles.length > 0 && ` (${selectedFiles.length} selected)`}
        </span>
        <span>Total size: {formatBytes(totalSize)}</span>
        {selectedFiles.length > 0 && (
          <span>Selected size: {formatBytes(selectedSize)}</span>
        )}
      </div>
      <div className="flex items-center gap-4">
        <span>Status: Ready</span>
      </div>
    </div>
  )
}