import { create } from "zustand";
import type { ObjectCreate, ObjectUpdate, ObjectWithStats } from "@/services/object.service";
import { logger } from "@/lib/logger";

const objectLogger = logger.withContext("ObjectsStore");

interface ObjectsState {
  objects: ObjectWithStats[];
  isLoading: boolean;
  error: Error | null;
  loadObjects: () => Promise<void>;
  createObject: (data: ObjectCreate) => Promise<void>;
  updateObject: (id: string, data: ObjectUpdate) => Promise<void>;
  deleteObject: (id: string) => Promise<void>;
}

export const useObjectsStore = create<ObjectsState>((set, get) => ({
  objects: [],
  isLoading: false,
  error: null,

  loadObjects: async () => {
    try {
      set({ isLoading: true, error: null });
      objectLogger.info("🔄 Cargando objetos...");
      const response = await fetch("/api/objects");
      if (!response.ok) throw new Error("Error al cargar objetos");
      const objects = await response.json();
      set({ objects, isLoading: false });
      objectLogger.info("✅ Objetos cargados:", { count: objects.length });
    } catch (error) {
      objectLogger.error("❌ Error al cargar objetos:", error);
      set({ error: error as Error, isLoading: false });
    }
  },

  createObject: async (data: ObjectCreate) => {
    try {
      objectLogger.info("✨ Creando objeto...", data);
      const response = await fetch("/api/objects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("Error al crear objeto");
      const object = await response.json();
      set(state => ({
        objects: [object, ...state.objects]
      }));
      objectLogger.info("✅ Objeto creado:", object);
    } catch (error) {
      objectLogger.error("❌ Error al crear objeto:", error);
      throw error;
    }
  },

  updateObject: async (id: string, data: ObjectUpdate) => {
    try {
      objectLogger.info("📝 Actualizando objeto...", { id, data });
      const response = await fetch(`/api/objects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("Error al actualizar objeto");
      const updatedObject = await response.json();
      set(state => ({
        objects: state.objects.map(obj =>
          obj.id === id ? updatedObject : obj
        )
      }));
      objectLogger.info("✅ Objeto actualizado:", updatedObject);
    } catch (error) {
      objectLogger.error("❌ Error al actualizar objeto:", error);
      throw error;
    }
  },

  deleteObject: async (id: string) => {
    try {
      objectLogger.info("🗑️ Eliminando objeto...", id);
      const response = await fetch(`/api/objects/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error("Error al eliminar objeto");
      set(state => ({
        objects: state.objects.filter(obj => obj.id !== id)
      }));
      objectLogger.info("✅ Objeto eliminado:", id);
    } catch (error) {
      objectLogger.error("❌ Error al eliminar objeto:", error);
      throw error;
    }
  }
}));