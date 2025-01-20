import { create } from "zustand";
import { Attribute } from "@prisma/client";
import { getAttributes, createAttribute as createAttributeAction, updateAttribute as updateAttributeAction, deleteAttribute as deleteAttributeAction, type AttributeCreate, type AttributeUpdate } from "@/app/actions/attribute.actions";
import { logger } from "@/lib/logger";

const attributeLogger = logger.withContext("AttributeStore");

interface LocalAttributeWithStats extends Attribute {
  totalSize: number;
  lastUpdated: Date;
}

const mapToAttributeWithStats = (attribute: Awaited<ReturnType<typeof getAttributes>>[0]): LocalAttributeWithStats => ({
  ...attribute,
  totalSize: 0,
  lastUpdated: new Date()
});

interface AttributeStore {
  attributes: LocalAttributeWithStats[];
  isLoading: boolean;
  error: string | null;
  loadAttributes: () => Promise<void>;
  createAttribute: (attribute: AttributeCreate) => Promise<void>;
  updateAttribute: (id: string, attribute: AttributeUpdate) => Promise<void>;
  deleteAttribute: (id: string) => Promise<void>;
}

export const useAttributeStore = create<AttributeStore>((set, get) => ({
  attributes: [],
  isLoading: false,
  error: null,
  loadAttributes: async () => {
    try {
      set({ isLoading: true, error: null });
      attributeLogger.info("Cargando atributos");
      const rawAttributes = await getAttributes();
      const attributes = rawAttributes.map(mapToAttributeWithStats);
      set({ attributes, isLoading: false });
      attributeLogger.info("✅ Atributos cargados");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al cargar atributos";
      attributeLogger.error("❌ Error al cargar atributos:", error);
      set({ error: message, isLoading: false });
    }
  },
  createAttribute: async (attribute) => {
    try {
      set({ isLoading: true, error: null });
      attributeLogger.info("✨ Creando atributo:", attribute);
      await createAttributeAction(attribute);
      const rawAttributes = await getAttributes();
      const attributes = rawAttributes.map(mapToAttributeWithStats);
      set({ attributes, isLoading: false });
      attributeLogger.info("✅ Atributo creado");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al crear atributo";
      attributeLogger.error("❌ Error al crear atributo:", error);
      set({ error: message, isLoading: false });
    }
  },
  updateAttribute: async (id, attribute) => {
    try {
      set({ isLoading: true, error: null });
      attributeLogger.info("💾 Actualizando atributo:", attribute);
      await updateAttributeAction(id, { ...attribute, id });
      const rawAttributes = await getAttributes();
      const attributes = rawAttributes.map(mapToAttributeWithStats);
      set({ attributes, isLoading: false });
      attributeLogger.info("✅ Atributo actualizado");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al actualizar atributo";
      attributeLogger.error("❌ Error al actualizar atributo:", error);
      set({ error: message, isLoading: false });
    }
  },
  deleteAttribute: async (id) => {
    try {
      set({ isLoading: true, error: null });
      attributeLogger.info("🗑️ Eliminando atributo:", id);
      await deleteAttributeAction(id);
      const rawAttributes = await getAttributes();
      const attributes = rawAttributes.map(mapToAttributeWithStats);
      set({ attributes, isLoading: false });
      attributeLogger.info("✅ Atributo eliminado");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al eliminar atributo";
      attributeLogger.error("❌ Error al eliminar atributo:", error);
      set({ error: message, isLoading: false });
    }
  }
}));