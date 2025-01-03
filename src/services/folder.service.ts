import { ThumbnailQuality } from "./thumbnail.service"

export interface IndexStats {
  current: number
  total: number
  currentFile: string
  status: string
  progress?: number
}

export interface IndexOptions {
  id: string
  onProgress?: (stats: IndexStats) => void
  onError?: (error: Error) => void
  onComplete?: () => void
}

export interface FolderWithStats {
  id: string
  name: string
  path: string
  totalSize: number
  lastIndexed: Date | null
  updatedAt: Date
  _count: {
    images: number
  }
}

export const folderService = {
  async getFolders() {
    try {
      const response = await fetch('/api/folders')
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al obtener carpetas')
      }
      return await response.json()
    } catch (error) {
      console.error('Error en getFolders:', error)
      throw error
    }
  },

  async addFolder(path: string, options?: {
    thumbnailQuality?: ThumbnailQuality
    generateThumbnails?: boolean
    onProgress?: (stats: IndexStats) => void
    onError?: (error: Error) => void
    onComplete?: (data: any) => void
  }) {
    try {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        },
        body: JSON.stringify({
          path,
          thumbnailQuality: options?.thumbnailQuality || 'mid',
          generateThumbnails: options?.generateThumbnails ?? true
        })
      })

      if (!response.ok || !response.body) {
        const error = await response.json().catch(() => ({ message: 'Error al agregar carpeta' }))
        throw new Error(error.message || 'Error al agregar carpeta')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      try {
        while (true) {
          const { done, value } = await reader.read()

          if (done) {
            console.log('Stream completado')
            break
          }

          buffer += decoder.decode(value, { stream: true })

          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.trim() === '') continue
            if (!line.startsWith('data: ')) continue

            try {
              const eventData = line.slice(6)
              const event = JSON.parse(eventData)
              console.log('Evento SSE recibido:', event)

              switch (event.type) {
                case 'progress':
                  options?.onProgress?.(event.data)
                  break
                case 'error':
                  let errorMessage = event.data.error || 'Error desconocido'
                  if (event.data.code === 'FOLDER_EXISTS') {
                    errorMessage = 'La carpeta ya existe. ¿Deseas reindexarla?'
                  }
                  const error = new Error(errorMessage)
                  error.name = event.data.code || 'UNKNOWN_ERROR'
                  console.error('Error en el proceso:', error)
                  options?.onError?.(error)
                  break
                case 'complete':
                  options?.onComplete?.(event.data)
                  break
                default:
                  console.warn('Tipo de evento desconocido:', event.type)
              }
            } catch (parseError) {
              console.error('Error parseando evento SSE:', parseError)
              options?.onError?.(new Error('Error procesando evento del servidor'))
            }
          }
        }
      } catch (streamError) {
        console.error('Error en el stream:', streamError)
        options?.onError?.(new Error('Error en la comunicación con el servidor'))
      } finally {
        reader.releaseLock()
      }

      return true
    } catch (error) {
      console.error('Error en addFolder:', error)
      options?.onError?.(error instanceof Error ? error : new Error('Error desconocido'))
      throw error
    }
  },

  async reindexFolder({ id, onProgress, onError, onComplete }: IndexOptions) {
    try {
      const response = await fetch(`/api/folders/reindex/${id}`, {
        method: 'POST',
        headers: {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache'
        }
      })

      if (!response.ok || !response.body) {
        throw new Error('Error al reindexar carpeta')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      try {
        while (true) {
          const { done, value } = await reader.read()

          if (done) {
            console.log('Stream completado')
            break
          }

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const eventData = line.slice(6)
                const event = JSON.parse(eventData)
                console.log('Evento SSE recibido:', event)

                switch (event.type) {
                  case 'progress':
                    onProgress?.(event.data)
                    break
                  case 'error':
                    onError?.(new Error(event.data.error))
                    break
                  case 'complete':
                    onComplete?.()
                    break
                }
              } catch (parseError) {
                console.error('Error parseando evento SSE:', parseError)
              }
            }
          }
        }
      } finally {
        reader.releaseLock()
      }
    } catch (error) {
      console.error('Error en reindexFolder:', error)
      onError?.(error instanceof Error ? error : new Error('Error desconocido'))
      throw error
    }
  },

  async deleteFolder(id: string) {
    try {
      const response = await fetch(`/api/folders?id=${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al eliminar carpeta')
      }

      return await response.json()
    } catch (error) {
      console.error('Error en deleteFolder:', error)
      throw error
    }
  }
}

// También exportamos las funciones individuales para compatibilidad
export const {
  getFolders,
  addFolder,
  reindexFolder,
  deleteFolder
} = folderService
