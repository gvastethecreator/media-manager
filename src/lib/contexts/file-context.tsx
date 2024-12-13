"use client"

import { createContext, useContext, useState, ReactNode, useCallback } from "react"

export interface FileItem {
  id: string
  name: string
  path: string
  size: number
  type: string
  modified: Date
  metadata?: {
    width?: number
    height?: number
    format?: string
    [key: string]: any
  }
  tags?: string[]
  collections?: string[]
  favorite?: boolean
  thumbnail?: string
}

interface FileContextType {
  files: FileItem[]
  selectedFiles: string[]
  sortBy: "name" | "date" | "size"
  sortOrder: "asc" | "desc"
  viewMode: "grid" | "list"
  thumbnailSize: "small" | "medium" | "large"
  loading: boolean
  error: string | null

  // Actions
  setFiles: (files: FileItem[]) => void
  addFiles: (files: FileItem[]) => void
  removeFiles: (fileIds: string[]) => void
  selectFiles: (fileIds: string[]) => void
  deselectFiles: (fileIds: string[]) => void
  clearSelection: () => void
  setSortBy: (sortBy: "name" | "date" | "size") => void
  setSortOrder: (order: "asc" | "desc") => void
  setViewMode: (mode: "grid" | "list") => void
  setThumbnailSize: (size: "small" | "medium" | "large") => void
  toggleFavorite: (fileId: string) => void
  addToCollection: (fileIds: string[], collectionId: string) => void
  removeFromCollection: (fileIds: string[], collectionId: string) => void
  addTags: (fileIds: string[], tags: string[]) => void
  removeTags: (fileIds: string[], tags: string[]) => void
  moveFiles: (fileIds: string[], targetPath: string) => void
  copyFiles: (fileIds: string[], targetPath: string) => void
  renameFile: (fileId: string, newName: string) => void
  uploadFiles: (files: File[]) => Promise<void>
  downloadFiles: (fileIds: string[]) => Promise<void>
  getSortedFiles: () => FileItem[]
}

const FileContext = createContext<FileContextType | undefined>(undefined)

export function FileProvider({ children }: { children: ReactNode }) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<"name" | "date" | "size">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [thumbnailSize, setThumbnailSize] = useState<"small" | "medium" | "large">("medium")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addFiles = useCallback((newFiles: FileItem[]) => {
    setFiles((prev) => [...prev, ...newFiles])
  }, [])

  const removeFiles = useCallback((fileIds: string[]) => {
    setFiles((prev) => prev.filter((file) => !fileIds.includes(file.id)))
    setSelectedFiles((prev) => prev.filter((id) => !fileIds.includes(id)))
  }, [])

  const selectFiles = useCallback((fileIds: string[]) => {
    setSelectedFiles((prev) => [...new Set([...prev, ...fileIds])])
  }, [])

  const deselectFiles = useCallback((fileIds: string[]) => {
    setSelectedFiles((prev) => prev.filter((id) => !fileIds.includes(id)))
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedFiles([])
  }, [])

  const toggleFavorite = useCallback((fileId: string) => {
    setFiles((prev) =>
      prev.map((file) =>
        file.id === fileId
          ? { ...file, favorite: !file.favorite }
          : file
      )
    )
  }, [])

  const addToCollection = useCallback((fileIds: string[], collectionId: string) => {
    setFiles((prev) =>
      prev.map((file) =>
        fileIds.includes(file.id)
          ? {
              ...file,
              collections: [...(file.collections || []), collectionId],
            }
          : file
      )
    )
  }, [])

  const removeFromCollection = useCallback((fileIds: string[], collectionId: string) => {
    setFiles((prev) =>
      prev.map((file) =>
        fileIds.includes(file.id)
          ? {
              ...file,
              collections: file.collections?.filter((id) => id !== collectionId),
            }
          : file
      )
    )
  }, [])

  const addTags = useCallback((fileIds: string[], tags: string[]) => {
    setFiles((prev) =>
      prev.map((file) =>
        fileIds.includes(file.id)
          ? {
              ...file,
              tags: [...new Set([...(file.tags || []), ...tags])],
            }
          : file
      )
    )
  }, [])

  const removeTags = useCallback((fileIds: string[], tags: string[]) => {
    setFiles((prev) =>
      prev.map((file) =>
        fileIds.includes(file.id)
          ? {
              ...file,
              tags: file.tags?.filter((tag) => !tags.includes(tag)),
            }
          : file
      )
    )
  }, [])

  const moveFiles = useCallback(async (fileIds: string[], targetPath: string) => {
    try {
      setLoading(true)
      // Implementar lógica de movimiento de archivos
      setFiles((prev) =>
        prev.map((file) =>
          fileIds.includes(file.id)
            ? { ...file, path: `${targetPath}/${file.name}` }
            : file
        )
      )
    } catch (err) {
      setError("Error moving files")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  const copyFiles = useCallback(async (fileIds: string[], targetPath: string) => {
    try {
      setLoading(true)
      // Implementar lógica de copia de archivos
      const filesToCopy = files.filter((file) => fileIds.includes(file.id))
      const copiedFiles = filesToCopy.map((file) => ({
        ...file,
        id: crypto.randomUUID(),
        path: `${targetPath}/${file.name}`,
      }))
      setFiles((prev) => [...prev, ...copiedFiles])
    } catch (err) {
      setError("Error copying files")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [files])

  const renameFile = useCallback((fileId: string, newName: string) => {
    setFiles((prev) =>
      prev.map((file) =>
        file.id === fileId
          ? {
              ...file,
              name: newName,
              path: file.path.replace(/[^/]+$/, newName),
            }
          : file
      )
    )
  }, [])

  const uploadFiles = useCallback(async (files: File[]) => {
    try {
      setLoading(true)
      // Implementar lógica de carga de archivos
      const newFiles: FileItem[] = await Promise.all(
        files.map(async (file) => {
          const reader = new FileReader()
          const thumbnail = await new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string)
            reader.readAsDataURL(file)
          })

          return {
            id: crypto.randomUUID(),
            name: file.name,
            path: `/uploads/${file.name}`,
            size: file.size,
            type: file.type,
            modified: new Date(file.lastModified),
            thumbnail,
          }
        })
      )
      addFiles(newFiles)
    } catch (err) {
      setError("Error uploading files")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [addFiles])

  const downloadFiles = useCallback(async (fileIds: string[]) => {
    try {
      setLoading(true)
      const filesToDownload = files.filter((file) => fileIds.includes(file.id))
      // Implementar lógica de descarga de archivos
      for (const file of filesToDownload) {
        const link = document.createElement("a")
        link.href = file.thumbnail || ""
        link.download = file.name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (err) {
      setError("Error downloading files")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [files])

  const getSortedFiles = useCallback(() => {
    return [...files].sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name)
          break
        case "date":
          comparison = a.modified.getTime() - b.modified.getTime()
          break
        case "size":
          comparison = a.size - b.size
          break
      }
      return sortOrder === "asc" ? comparison : -comparison
    })
  }, [files, sortBy, sortOrder])

  const value = {
    files,
    selectedFiles,
    sortBy,
    sortOrder,
    viewMode,
    thumbnailSize,
    loading,
    error,
    setFiles,
    addFiles,
    removeFiles,
    selectFiles,
    deselectFiles,
    clearSelection,
    setSortBy,
    setSortOrder,
    setViewMode,
    setThumbnailSize,
    toggleFavorite,
    addToCollection,
    removeFromCollection,
    addTags,
    removeTags,
    moveFiles,
    copyFiles,
    renameFile,
    uploadFiles,
    downloadFiles,
    getSortedFiles,
  }

  return <FileContext.Provider value={value}>{children}</FileContext.Provider>
}

export function useFiles() {
  const context = useContext(FileContext)
  if (context === undefined) {
    throw new Error("useFiles must be used within a FileProvider")
  }
  return context
}