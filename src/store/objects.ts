import { create } from "zustand";
import type { ObjectCreate, ObjectUpdate, ObjectWithStats } from "@/services/object.service";
import { logger } from "@/lib/logger";
import type { FileItem } from "@/types/file-item";
import * as ObjectActions from "@/app/actions/objects";

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
      const objects = await ObjectActions.getObjects();
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
      objectsLogger.info("✨ Creando objeto...", data);
      await ObjectActions.createObject(data);
      await get().loadObjects();
    } catch (error) {
      objectsLogger.error("❌ Error al crear objeto:", error);
      throw error;
    }
  },

  updateObject: async (id: string, data: ObjectUpdate) => {
    try {
      objectsLogger.info("📝 Actualizando objeto...", { id, data });
      await ObjectActions.updateObject(id, data);
      await get().loadObjects();
    } catch (error) {
      objectsLogger.error("❌ Error al actualizar objeto:", error);
      throw error;
    }
  },

  deleteObject: async (id: string) => {
    try {
      objectsLogger.info("🗑️ Eliminando objeto...", id);
      await ObjectActions.deleteObject(id);
      await get().loadObjects();
    } catch (error) {
      objectsLogger.error("❌ Error al eliminar objeto:", error);
      throw error;
    }
  },

  addImageToObject: async (objectId: string, imageId: string) => {
    try {
      objectsLogger.info("➕ Agregando imagen a objeto:", { objectId, imageId });
      await ObjectActions.addImageToObject(objectId, imageId);
      await get().loadObjects();
    } catch (error) {
      objectsLogger.error("❌ Error al agregar imagen a objeto:", error);
      throw error;
    }
  },

  removeImageFromObject: async (objectId: string, imageId: string) => {
    try {
      objectsLogger.info("🗑️ Eliminando imagen de objeto:", { objectId, imageId });
      await ObjectActions.removeImageFromObject(objectId, imageId);
      await get().loadObjects();
    } catch (error) {
      objectsLogger.error("❌ Error al eliminar imagen de objeto:", error);
      throw error;
    }
  },

  loadObjectContent: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      const object = await ObjectActions.getObject(id);
      if (!object) throw new Error("Objeto no encontrado");
      const images = await ObjectActions.getObjectImages(id);
      set({
        currentObject: object,
        currentItems: images,
        isLoading: false,
      });
      objectsLogger.info("📥 Contenido del objeto cargado:", {
        objectId: id,
        imageCount: images.length,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      set({ error: errorMessage, isLoading: false });
      objectsLogger.error("❌ Error al cargar contenido del objeto:", { error });
    }
  },
}));