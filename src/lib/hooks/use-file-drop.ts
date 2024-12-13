import { useCallback, useState } from "react"
import { useFiles } from "@/lib/contexts/file-context"

export function useFileDrop() {
  const { uploadFiles } = useFiles()
  const [isDragging, setIsDragging] = useState(false)

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const { files } = e.dataTransfer
      if (files.length === 0) return

      const imageFiles = Array.from(files).filter((file) =>
        file.type.startsWith("image/")
      )

      if (imageFiles.length === 0) return
      await uploadFiles(imageFiles)
    },
    [uploadFiles]
  )

  const dropProps = {
    onDragEnter: handleDragEnter,
    onDragLeave: handleDragLeave,
    onDragOver: handleDragOver,
    onDrop: handleDrop,
  }

  return {
    isDragging,
    dropProps,
  }
}