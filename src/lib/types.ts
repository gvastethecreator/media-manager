export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  totalImages: number
  createdAt: Date
  updatedAt: Date
}

export interface Collection {
  id: string
  title: string
  emoji: string
  description?: string
  itemCount: number
  createdAt: Date
  updatedAt: Date
}

export interface Folder {
  id: string
  title: string
  path: string
  itemCount: number
  children?: Folder[]
  createdAt: Date
  updatedAt: Date
}

export interface Tag {
  id: string
  title: string
  color: string
  itemCount: number
  createdAt: Date
  updatedAt: Date
}

export interface Settings {
  theme: "light" | "dark" | "system"
  language: "es" | "en"
  notifications: boolean
  thumbnailQuality: "compressed" | "low" | "mid" | "high"
  autoBackup: boolean
  compressUploads: boolean
  defaultView: "grid" | "list"
  defaultSort: "name" | "date" | "size"
  defaultSortOrder: "asc" | "desc"
  defaultThumbnailSize: "small" | "medium" | "large"
}

export interface ImageMetadata {
  width: number
  height: number
  format: string
  size: number
  colorSpace?: string
  hasAlpha?: boolean
  orientation?: number
  exif?: {
    make?: string
    model?: string
    dateTime?: string
    exposureTime?: string
    fNumber?: number
    iso?: number
    focalLength?: number
    gps?: {
      latitude: number
      longitude: number
      altitude?: number
    }
  }
}

export interface FileOperationError {
  code: string
  message: string
  details?: any
}

export interface FileOperationResult {
  success: boolean
  error?: FileOperationError
  data?: any
}

export interface FileUploadProgress {
  fileId: string
  progress: number
  status: "pending" | "uploading" | "processing" | "complete" | "error"
  error?: FileOperationError
}

export interface FileSelectionState {
  selectedIds: string[]
  lastSelected?: string
  selectionMode: "none" | "single" | "multiple"
}

export interface ViewState {
  currentView: "grid" | "list"
  thumbnailSize: "small" | "medium" | "large"
  sortBy: "name" | "date" | "size"
  sortOrder: "asc" | "desc"
  filterTags: string[]
  filterCollections: string[]
  searchTerm: string
}

export interface DragState {
  isDragging: boolean
  draggedIds: string[]
  dragOverId?: string
  dropTarget?: "collection" | "folder" | "tag"
  dropTargetId?: string
}

export interface ContextMenuState {
  isOpen: boolean
  x: number
  y: number
  targetId?: string
  targetType?: "file" | "collection" | "folder" | "tag"
}

export interface ModalState {
  isOpen: boolean
  type: "create" | "edit" | "delete" | "move" | "copy"
  targetId?: string
  targetType?: "file" | "collection" | "folder" | "tag"
}

export interface ToastState {
  id: string
  type: "success" | "error" | "info" | "warning"
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}