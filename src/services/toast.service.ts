import { toast } from '@/components/ui/use-toast'

const TOAST_TYPES = {
  collection: {
    add: "💼 Colección creada",
    delete: "🗑️ Colección eliminada",
    update: "📝 Colección actualizada",
    addImage: "🖼️ Imagen agregada a la colección",
    removeImage: "🚫 Imagen eliminada de la colección",
  },
  tag: {
    add: "🏷️ Etiqueta creada",
    delete: "🗑️ Etiqueta eliminada",
    update: "📝 Etiqueta actualizada",
    addImage: "🏷️ Etiqueta agregada a la imagen",
    removeImage: "🚫 Etiqueta eliminada de la imagen",
  },
  favorite: {
    add: "⭐ Imagen agregada a favoritos",
    remove: "💔 Imagen eliminada de favoritos",
    update: "⭐ Favoritos actualizados",
  },
  folder: {
    update: "📁 Carpeta actualizada",
    scan: "🔍 Escaneando carpeta",
    error: "❌ Error en la carpeta",
  },
  system: {
    error: "❌ Error del sistema",
    warning: "⚠️ Advertencia del sistema",
    info: "ℹ️ Información del sistema",
    success: "✅ Operación exitosa",
  },
};

export const toastService = {
  collection: {
    created: (name?: string) =>
      toast({
        title: TOAST_TYPES.collection.add,
        description: name ? `Colección "${name}" creada` : "Nueva colección creada",
        variant: "default",
      }),
    deleted: (name?: string) =>
      toast({
        title: TOAST_TYPES.collection.delete,
        description: name ? `Colección "${name}" eliminada` : "Colección eliminada",
        variant: "destructive",
      }),
    updated: (name?: string) =>
      toast({
        title: TOAST_TYPES.collection.update,
        description: name ? `Colección "${name}" actualizada` : "Colección actualizada",
        variant: "default",
      }),
    imageAdded: (name?: string) =>
      toast({
        title: TOAST_TYPES.collection.addImage,
        description: name ? `Imagen agregada a "${name}"` : "Imagen agregada a la colección",
        variant: "default",
      }),
    imageRemoved: (name?: string) =>
      toast({
        title: TOAST_TYPES.collection.removeImage,
        description: name ? `Imagen eliminada de "${name}"` : "Imagen eliminada de la colección",
        variant: "default",
      }),
  },
  tag: {
    created: (name?: string) =>
      toast({
        title: TOAST_TYPES.tag.add,
        description: name ? `Etiqueta "${name}" creada` : "Nueva etiqueta creada",
        variant: "default",
      }),
    deleted: (name?: string) =>
      toast({
        title: TOAST_TYPES.tag.delete,
        description: name ? `Etiqueta "${name}" eliminada` : "Etiqueta eliminada",
        variant: "destructive",
      }),
    updated: (name?: string) =>
      toast({
        title: TOAST_TYPES.tag.update,
        description: name ? `Etiqueta "${name}" actualizada` : "Etiqueta actualizada",
        variant: "default",
      }),
    imageAdded: (name?: string) =>
      toast({
        title: TOAST_TYPES.tag.addImage,
        description: name ? `Etiqueta "${name}" agregada` : "Etiqueta agregada a la imagen",
        variant: "default",
      }),
    imageRemoved: (name?: string) =>
      toast({
        title: TOAST_TYPES.tag.removeImage,
        description: name ? `Etiqueta "${name}" eliminada` : "Etiqueta eliminada de la imagen",
        variant: "default",
      }),
  },
  favorite: {
    added: () =>
      toast({
        title: TOAST_TYPES.favorite.add,
        description: "Imagen agregada a favoritos",
        variant: "default",
      }),
    removed: () =>
      toast({
        title: TOAST_TYPES.favorite.remove,
        description: "Imagen eliminada de favoritos",
        variant: "default",
      }),
    updated: () =>
      toast({
        title: TOAST_TYPES.favorite.update,
        description: "Lista de favoritos actualizada",
        variant: "default",
      }),
  },
  folder: {
    updated: (name?: string) =>
      toast({
        title: TOAST_TYPES.folder.update,
        description: name ? `Carpeta "${name}" actualizada` : "Carpeta actualizada",
        variant: "default",
      }),
    scanning: (name?: string) =>
      toast({
        title: TOAST_TYPES.folder.scan,
        description: name ? `Escaneando carpeta "${name}"` : "Escaneando carpeta",
        variant: "default",
      }),
    error: (message: string) =>
      toast({
        title: TOAST_TYPES.folder.error,
        description: message,
        variant: "destructive",
      }),
  },
  system: {
    error: (message: string) =>
      toast({
        title: TOAST_TYPES.system.error,
        description: message,
        variant: "destructive",
      }),
    warning: (message: string) =>
      toast({
        title: TOAST_TYPES.system.warning,
        description: message,
        variant: "default",
      }),
    info: (message: string) =>
      toast({
        title: TOAST_TYPES.system.info,
        description: message,
        variant: "default",
      }),
    success: (message: string) =>
      toast({
        title: TOAST_TYPES.system.success,
        description: message,
        variant: "default",
      }),
  },
};