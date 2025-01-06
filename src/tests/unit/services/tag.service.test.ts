import { tagService } from '@/services/tag.service'
import { Tag } from '@prisma/client'

// Mock fetch global
global.fetch = jest.fn()

describe('Tag Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getTags', () => {
    it('debería obtener todos los tags exitosamente', async () => {
      const mockTags = [
        { id: '1', name: 'Test Tag', count: 5, size: '1.2 MB' }
      ]

        ; (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTags)
        })

      const result = await tagService.getTags()

      expect(fetch).toHaveBeenCalledWith('/api/tags')
      expect(result).toEqual(mockTags)
    })

    it('debería manejar errores al obtener tags', async () => {
      ; (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false
      })

      await expect(tagService.getTags()).rejects.toThrow('Failed to fetch tags')
    })
  })

  describe('getTag', () => {
    it('debería obtener un tag específico exitosamente', async () => {
      const mockTag = {
        id: '1',
        name: 'Test Tag',
        count: 5,
        size: '1.2 MB'
      }

        ; (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTag)
        })

      const result = await tagService.getTag('1')

      expect(fetch).toHaveBeenCalledWith('/api/tags/1')
      expect(result).toEqual(mockTag)
    })

    it('debería retornar null cuando el tag no existe', async () => {
      ; (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404
      })

      const result = await tagService.getTag('999')
      expect(result).toBeNull()
    })
  })

  describe('createTag', () => {
    it('debería crear un tag exitosamente', async () => {
      const newTag = {
        name: 'New Tag',
        color: '#FF0000',
        description: 'Test description'
      }

      const mockResponse = { ...newTag, id: '1' }

        ; (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })

      const result = await tagService.createTag(newTag)

      expect(fetch).toHaveBeenCalledWith('/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTag)
      })
      expect(result).toEqual(mockResponse)
    })

    it('debería manejar errores al crear un tag', async () => {
      const newTag = { name: 'New Tag' }

        ; (fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ message: 'Error creating tag' })
        })

      await expect(tagService.createTag(newTag)).rejects.toThrow('Error creating tag')
    })
  })

  describe('updateTag', () => {
    it('debería actualizar un tag exitosamente', async () => {
      const updateData = {
        id: '1',
        name: 'Updated Tag'
      }

      const mockResponse = { ...updateData }

        ; (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })

      const result = await tagService.updateTag('1', updateData)

      expect(fetch).toHaveBeenCalledWith('/api/tags/1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      })
      expect(result).toEqual(mockResponse)
    })

    it('debería manejar errores al actualizar un tag', async () => {
      const updateData = { id: '1', name: 'Updated Tag' }

        ; (fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ message: 'Error updating tag' })
        })

      await expect(tagService.updateTag('1', updateData)).rejects.toThrow('Error updating tag')
    })
  })

  describe('deleteTag', () => {
    it('debería eliminar un tag exitosamente', async () => {
      ; (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true
      })

      await tagService.deleteTag('1')

      expect(fetch).toHaveBeenCalledWith('/api/tags/1', {
        method: 'DELETE'
      })
    })

    it('debería manejar errores al eliminar un tag', async () => {
      ; (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'Error deleting tag' })
      })

      await expect(tagService.deleteTag('1')).rejects.toThrow('Error deleting tag')
    })
  })

  describe('addImageToTag', () => {
    it('debería agregar una imagen a un tag exitosamente', async () => {
      ; (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true
      })

      await tagService.addImageToTag('tag1', 'img1')

      expect(fetch).toHaveBeenCalledWith('/api/tags/tag1/images/img1', {
        method: 'POST'
      })
    })

    it('debería manejar errores al agregar una imagen a un tag', async () => {
      ; (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'Error adding image to tag' })
      })

      await expect(tagService.addImageToTag('tag1', 'img1')).rejects.toThrow('Error adding image to tag')
    })
  })

  describe('removeImageFromTag', () => {
    it('debería remover una imagen de un tag exitosamente', async () => {
      ; (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true
      })

      await tagService.removeImageFromTag('tag1', 'img1')

      expect(fetch).toHaveBeenCalledWith('/api/tags/tag1/images/img1', {
        method: 'DELETE'
      })
    })

    it('debería manejar errores al remover una imagen de un tag', async () => {
      ; (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'Error removing image from tag' })
      })

      await expect(tagService.removeImageFromTag('tag1', 'img1')).rejects.toThrow('Error removing image from tag')
    })
  })
})