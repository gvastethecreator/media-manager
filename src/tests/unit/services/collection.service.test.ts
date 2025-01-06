import { collectionService } from '@/services/collection.service'
import { Collection } from '@prisma/client'

// Mock fetch global
global.fetch = jest.fn()

describe('Collection Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getCollections', () => {
    it('debería obtener todas las colecciones exitosamente', async () => {
      const mockCollections = [
        { id: '1', name: 'Test Collection', count: 5, size: '1.2 MB' }
      ]

        ; (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockCollections)
        })

      const result = await collectionService.getCollections()

      expect(fetch).toHaveBeenCalledWith('/api/collections')
      expect(result).toEqual(mockCollections)
    })

    it('debería manejar errores al obtener colecciones', async () => {
      ; (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false
      })

      await expect(collectionService.getCollections()).rejects.toThrow('Failed to fetch collections')
    })
  })

  describe('getCollection', () => {
    it('debería obtener una colección específica exitosamente', async () => {
      const mockCollection = {
        id: '1',
        name: 'Test Collection',
        count: 5,
        size: '1.2 MB'
      }

        ; (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockCollection)
        })

      const result = await collectionService.getCollection('1')

      expect(fetch).toHaveBeenCalledWith('/api/collections/1')
      expect(result).toEqual(mockCollection)
    })

    it('debería retornar null cuando la colección no existe', async () => {
      ; (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404
      })

      const result = await collectionService.getCollection('999')
      expect(result).toBeNull()
    })
  })

  describe('createCollection', () => {
    it('debería crear una colección exitosamente', async () => {
      const newCollection = {
        name: 'New Collection',
        emoji: '📸',
        color: '#FF0000'
      }

      const mockResponse = { ...newCollection, id: '1' }

        ; (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })

      const result = await collectionService.createCollection(newCollection)

      expect(fetch).toHaveBeenCalledWith('/api/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCollection)
      })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('updateCollection', () => {
    it('debería actualizar una colección exitosamente', async () => {
      const updateData = {
        id: '1',
        name: 'Updated Collection'
      }

      const mockResponse = { ...updateData }

        ; (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })

      const result = await collectionService.updateCollection('1', updateData)

      expect(fetch).toHaveBeenCalledWith('/api/collections/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('deleteCollection', () => {
    it('debería eliminar una colección exitosamente', async () => {
      ; (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true
      })

      await collectionService.deleteCollection('1')

      expect(fetch).toHaveBeenCalledWith('/api/collections/1', {
        method: 'DELETE'
      })
    })
  })

  describe('addImageToCollection', () => {
    it('debería agregar una imagen a la colección exitosamente', async () => {
      ; (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true
      })

      await collectionService.addImageToCollection('1', 'img1')

      expect(fetch).toHaveBeenCalledWith('/api/collections/1/images/img1', {
        method: 'POST'
      })
    })
  })

  describe('removeImageFromCollection', () => {
    it('debería remover una imagen de la colección exitosamente', async () => {
      ; (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true
      })

      await collectionService.removeImageFromCollection('1', 'img1')

      expect(fetch).toHaveBeenCalledWith('/api/collections/1/images/img1', {
        method: 'DELETE'
      })
    })
  })
})