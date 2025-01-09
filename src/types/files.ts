export interface FileItem {
  id: string
  name: string
  path: string
  type: 'image'
  size: number
  width: number
  height: number
  mimeType?: string
  metadata?: any
  thumbnail?: string
  thumbnailSize?: number
  thumbnailWidth?: number
  thumbnailHeight?: number
  src: string
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
  isPublic: boolean
  isFavorite: boolean
  createdAt: Date
  updatedAt: Date
  stats?: {
    views: number
    downloads: number
    lastViewed: Date
  }
}