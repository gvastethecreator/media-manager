import { create } from "zustand";
import { objectService, type ObjectCreate, type ObjectUpdate, type ObjectWithStats } from "@/services/object.service";
import { logger } from "@/lib/logger";
import type { FileItem } from "@/types/file-item";

const objectsLogger = logger.withContext("ObjectsStore");

interface ObjectsState {
  objects: ObjectWithStats[];
  currentObject: ObjectWithStats | null;
  currentItems: FileItem[];
  isLoading: boolean;
  error: string | null;
  // Acciones
  loadObjects: () => Promise<void>;
  createObject: (data: ObjectCreate) => Promise<void>;
  updateObject: (id: string, data: ObjectUpdate) => Promise<void>;
  deleteObject: (id: string) => Promise<void>;
  addImageToObject: (objectId: string, imageId: string) => Promise<void>;
  removeImageFromObject: (objectId: string, imageId: string) => Promise<void>;
  loadObjectContent: (id: string) => Promise<void>;
}

export const useObjectsStore = create<ObjectsState>((set, get) => ({
  objects: [],
  currentObject: null,
  currentItems: [],
  isLoading: false,
  error: null,

  loadObjects: async () => {
    try {
      set({ isLoading: true, error: null });
      const objects = await objectService.getObjects();
      set({ objects, isLoading: false });
      objectsLogger.info("📥 Objetos cargados:", { count: objects.length });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      set({ error: errorMessage, isLoading: false });
      objectsLogger.error("❌ Error al cargar objetos:", { error });
    }
  },

  createObject: async (data: ObjectCreate) => {
    try {
      set({ isLoading: true, error: null });
      const object = await objectService.createObject(data);
      const objectWithStats = await objectService.getObject(object.id);
      if (!objectWithStats) throw new Error("Error al obtener estadísticas del objeto");
      set((state) => ({
        objects: [...state.objects, objectWithStats],
        isLoading: false,
      }));
      objectsLogger.info("✨ Objeto creado:", { object });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      set({ error: errorMessage, isLoading: false });
      objectsLogger.error("❌ Error al crear objeto:", { error });
    }
  },

  updateObject: async (id: string, data: ObjectUpdate) => {
    try {
      set({ isLoading: true, error: null });
      await objectService.updateObject(id, data);
      const updatedObject = await objectService.getObject(id);
      if (!updatedObject) throw new Error("Error al obtener objeto actualizado");
      set((state) => ({
        objects: state.objects.map((o) =>
          o.id === id ? updatedObject : o
        ),
        currentObject: state.currentObject?.id === id ? updatedObject : state.currentObject,
        isLoading: false,
      }));
      objectsLogger.info("📝 Objeto actualizado:", { id, data });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      set({ error: errorMessage, isLoading: false });
      objectsLogger.error("❌ Error al actualizar objeto:", { id, error });
    }
  },

  deleteObject: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      await objectService.deleteObject(id);
      set((state) => ({
        objects: state.objects.filter((o) => o.id !== id),
        currentObject: state.currentObject?.id === id ? null : state.currentObject,
        currentItems: state.currentObject?.id === id ? [] : state.currentItems,
        isLoading: false,
      }));
      objectsLogger.info("🗑️ Objeto eliminado:", { id });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      set({ error: errorMessage, isLoading: false });
      objectsLogger.error("❌ Error al eliminar objeto:", { id, error });
    }
  },

  addImageToObject: async (objectId: string, imageId: string) => {
    try {
      await objectService.addImageToObject(objectId, imageId);
      objectsLogger.info("📸 Imagen agregada a objeto:", { objectId, imageId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      set({ error: errorMessage });
      objectsLogger.error("❌ Error al agregar imagen a objeto:", { objectId, imageId, error });
    }
  },

  removeImageFromObject: async (objectId: string, imageId: string) => {
    try {
      await objectService.removeImageFromObject(objectId, imageId);
      set((state) => ({
        currentItems: state.currentItems.filter((item) => item.id !== imageId),
      }));
      objectsLogger.info("🗑️ Imagen eliminada de objeto:", { objectId, imageId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      set({ error: errorMessage });
      objectsLogger.error("❌ Error al eliminar imagen de objeto:", { objectId, imageId, error });
    }
  },

  loadObjectContent: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      const object = await objectService.getObject(id);
      if (!object) {
        throw new Error("Objeto no encontrado");
      }
      const images = await objectService.getObjectImages(id);
      set({
        currentObject: object,
        currentItems: images,
        isLoading: false,
      });
      objectsLogger.info("📂 Contenido de objeto cargado:", { id });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      set({ error: errorMessage, isLoading: false });
      objectsLogger.error("❌ Error al cargar contenido de objeto:", { id, error });
    }
  },
}));