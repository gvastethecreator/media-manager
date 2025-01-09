export interface ImageMetadata {
  dimensions?: {
    width: number
    height: number
  }
  fileSystem?: {
    created: string
    modified: string
    size: number
  }
  mimeType?: string
  [key: string]: any
}