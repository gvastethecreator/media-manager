export interface FileItem {
  id: string
  name: string
  type: 'file' | 'directory' | 'image'
  size?: number
  modified?: Date
  path: string
  thumbnailUrl?: string
  metadata?: {
    dimensions?: {
      width: number
      height: number
    }
    aspectRatio?: number
    orientation?: 'landscape' | 'portrait' | 'square'
    fileType?: string
    colorProfile?: string
    created?: Date
  }
  gridInfo?: {
    rowSpan?: number
    colSpan?: number
    priority?: number // Para ordenar items importantes
    displayMode?: 'normal' | 'featured' | 'compact'
  }
}
