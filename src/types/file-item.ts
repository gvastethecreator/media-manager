export interface FileItem {
  id: string
  name: string
  path: string
  type: 'image' | 'video' | 'directory'
  size: number
  created: string
  modified: string
  width?: number
  height?: number
  mimeType?: string
  favorite: boolean
  isFavorite?: boolean
  tags?: string[]
  collections?: string[]
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
  | 'dashboard'
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
