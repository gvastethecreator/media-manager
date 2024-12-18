export interface FileItem {
  id: string
  name: string
  path: string
  type: 'image' | 'video'
  size: number
  created: string
  modified: string
  width: number
  height: number
  tags: string[]
  favorite: boolean
  metadata?: {
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
  }
}