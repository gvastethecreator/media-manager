import { ThumbnailQuality } from "./thumbnail.service"

export interface IndexStats {
  current: number
  total: number
  currentFile: string
  status: string
}

export interface IndexOptions {
  id: string
  onProgress?: (stats: IndexStats) => void
  onError?: (error: Error) => void
  onComplete?: () => void
}

export async function getFolders() {
  try {
    const response = await fetch('/api/folders')
    if (!response.ok) {
      throw new Error('Error al obtener carpetas')
    }
    return await response.json()
  } catch (error) {
    console.error('Error en getFolders:', error)
    throw error
  }
}

export async function addFolder(path: string, options?: {
  thumbnailQuality?: ThumbnailQuality
  generateThumbnails?: boolean
}) {
  try {
    const response = await fetch('/api/folders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        path,
        ...options
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al agregar carpeta')
    }

    return await response.json()
  } catch (error) {
    console.error('Error en addFolder:', error)
    throw error
  }
}

export async function reindexFolder({ id, onProgress, onError, onComplete }: IndexOptions) {
  try {
    const response = await fetch(`/api/folders/reindex/${id}`, {
      method: 'POST'
    })

    if (!response.ok) {
      throw new Error('Error al reindexar carpeta')
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No se pudo obtener el reader')
    }

    const decoder = new TextDecoder()

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const events = chunk
          .split('\n')
          .filter(Boolean)
          .map(line => {
            try {
              return JSON.parse(line)
            } catch {
              return null
            }
          })
          .filter(event => event !== null)

        for (const event of events) {
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
}

export async function deleteFolder(id: string) {
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
