import { createContext, useContext, useEffect, useState } from "react"
import { Collection, Tag } from "@prisma/client"
import { collectionService, CollectionCreate, CollectionUpdate } from "@/services/collection.service"
import { tagService, TagCreate, TagUpdate } from "@/services/tag.service"
import { useToast } from "@/components/ui/use-toast"

interface CollectionWithStats extends Collection {
  count: number
  size: string
}

interface TagWithStats extends Tag {
  count: number
  size: string
}

interface SettingsContextType {
  settings: {
    collections: CollectionWithStats[]
    tags: TagWithStats[]
  }
  updateCollection: (id: string | null, data: CollectionCreate | CollectionUpdate) => Promise<void>
  updateTag: (id: string, data: TagCreate | TagUpdate) => Promise<void>
  deleteCollection: (id: string) => Promise<void>
  deleteTag: (id: string) => Promise<void>
}

const SettingsContext = createContext<SettingsContextType>({
  settings: {
    collections: [],
    tags: []
  },
  updateCollection: async () => {},
  updateTag: async () => {},
  deleteCollection: async () => {},
  deleteTag: async () => {}
})

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SettingsContextType["settings"]>({
    collections: [],
    tags: []
  })
  const { toast } = useToast()

  const loadCollections = async () => {
    try {
      const collections = await collectionService.getCollections()
      setSettings(prev => ({ ...prev, collections }))
    } catch (error) {
      console.error('Error loading collections:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las colecciones",
        variant: "destructive"
      })
    }
  }

  const loadTags = async () => {
    try {
      const tags = await tagService.getTags()
      setSettings(prev => ({ ...prev, tags }))
    } catch (error) {
      console.error('Error loading tags:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las etiquetas",
        variant: "destructive"
      })
    }
  }

  useEffect(() => {
    loadCollections()
    loadTags()
  }, [])

  const updateCollection = async (id: string | null, data: CollectionCreate | CollectionUpdate) => {
    try {
      if (!id) {
        // Crear nueva colección
        await collectionService.createCollection(data as CollectionCreate)
      } else {
        // Actualizar colección existente
        await collectionService.updateCollection(id, data as CollectionUpdate)
      }
      
      await loadCollections()
      toast({
        title: "Éxito",
        description: id ? "Colección actualizada correctamente" : "Colección creada correctamente"
      })
    } catch (error) {
      console.error('Error updating collection:', error)
      toast({
        title: "Error",
        description: id ? "No se pudo actualizar la colección" : "No se pudo crear la colección",
        variant: "destructive"
      })
    }
  }

  const updateTag = async (id: string, data: TagCreate | TagUpdate) => {
    try {
      await tagService.updateTag(id, data)
      await loadTags()
      toast({
        title: "Éxito",
        description: "Etiqueta actualizada correctamente"
      })
    } catch (error) {
      console.error('Error updating tag:', error)
      toast({
        title: "Error",
        description: "No se pudo actualizar la etiqueta",
        variant: "destructive"
      })
    }
  }

  const deleteCollection = async (id: string) => {
    try {
      await collectionService.deleteCollection(id)
      await loadCollections()
      toast({
        title: "Éxito",
        description: "Colección eliminada correctamente"
      })
    } catch (error) {
      console.error('Error deleting collection:', error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la colección",
        variant: "destructive"
      })
    }
  }

  const deleteTag = async (id: string) => {
    try {
      await tagService.deleteTag(id)
      await loadTags()
      toast({
        title: "Éxito",
        description: "Etiqueta eliminada correctamente"
      })
    } catch (error) {
      console.error('Error deleting tag:', error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la etiqueta",
        variant: "destructive"
      })
    }
  }

  return (
    <SettingsContext.Provider value={{
      settings,
      updateCollection,
      updateTag,
      deleteCollection,
      deleteTag
    }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettingsContext() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettingsContext must be used within a SettingsProvider')
  }
  return context
}

// Alias para mantener compatibilidad
export const useCollectionTagContext = useSettingsContext