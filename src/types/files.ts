export interface FileItem {
  id: string
  name: string
  path: string
  size: number
  type: string
  modified: string
  created: string
  width?: number
  height?: number
  duration?: number
  metadata?: Record<string, any>
}