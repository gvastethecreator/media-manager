export interface FileItem {
  id: string
  name: string
  path: string
  type: 'image' | 'video' | 'directory'
  size: number
  width?: number
  height?: number
  mimeType?: string
  thumbnail?: string
  src?: string
  isFavorite: boolean
  createdAt: Date
  updatedAt: Date
  favorites?: Array<{
    id: string
    createdAt: Date
  }>
  tags: Array<{
    id: string
    name: string
    color: string
  }>
  collections: Array<{
    id: string
    name: string
    emoji: string
    color: string
  }>
  stats?: {
    views: number
    downloads: number
    lastViewed: Date
  }
  metadata?: {
    dimensions?: {
      width: number
      height: number
    }
    aspectRatio?: number
    orientation?: 'landscape' | 'portrait' | 'square'
    fileType?: string
    colorProfile?: string
    make?: string
    model?: string
    lens?: string
    focalLength?: string
    aperture?: string
    shutterSpeed?: string
    iso?: number
    location?: {
      latitude: number
      longitude: number
    }
    [key: string]: any
  }
  gridInfo?: {
    rowSpan?: number
    colSpan?: number
    priority?: number
    displayMode?: 'normal' | 'featured' | 'compact'
  }
}

export type ViewType =
  | 'development'
  | 'all-images'
  | 'collections'
  | 'collection-content'
  | 'folders'
  | 'folder-content'
  | 'tags'
  | 'tag-content'
  | 'search'
  | 'files'
  | 'settings'
  | 'favorites';

export interface ViewProps {
  isResizing?: boolean;
}

export interface ViewContainerProps {
  isResizing?: boolean;
}
