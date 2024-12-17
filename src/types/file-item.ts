export interface FileItem {
  id: string
  name: string
  type: 'file' | 'directory' | 'image'
  size?: number
  modified?: Date
  path: string
  thumbnailUrl?: string
  metadata?: Record<string, any>
}
