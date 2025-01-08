export interface FileItem {
  id: string
  name: string
  path: string
  type: 'image'
  size: number
  width: number
  height: number
  mimeType?: string
  thumbnail?: string
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
  isFavorite: boolean
  createdAt: Date
  updatedAt: Date
  stats?: {
    views: number
    downloads: number
    lastViewed: Date
  }
}