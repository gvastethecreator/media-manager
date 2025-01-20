import { create } from "zustand";
import { type Concept } from "@/types/entities";
import { logger } from "@/lib/logger";

const conceptLogger = logger.withContext("ConceptStore");

export interface ConceptFormData {
  name: string;
  description?: string;
  content: string;
  type?: string;
  tags: string[];
}

interface ConceptStore {
  concepts: Concept[];
  isLoading: boolean;
  error: string | null;
  loadItems: () => Promise<void>;
  createConcept: (data: ConceptFormData) => Promise<void>;
  updateConcept: (id: string, data: Partial<ConceptFormData>) => Promise<void>;
  deleteConcept: (id: string) => Promise<void>;
}

export const useConceptStore = create<ConceptStore>((set) => ({
  concepts: [],
  isLoading: false,
  error: null,

  loadItems: async () => {
    set({ isLoading: true, error: null });
    try {
      conceptLogger.info("🔄 Cargando conceptos...");
      // TODO: Implementar carga desde API
      const concepts: Concept[] = [];
      set({ concepts, isLoading: false });
    } catch (error) {
      conceptLogger.error("❌ Error al cargar conceptos:", error);
      set({ error: "No se pudieron cargar los conceptos", isLoading: false });
    }
  },

  createConcept: async (data) => {
    set({ isLoading: true, error: null });
    try {
      conceptLogger.info("✨ Creando concepto:", data);
      // TODO: Implementar creación en API
      const concept: Concept = {
        id: crypto.randomUUID(),
        name: data.name,
        description: data.description || null,
        content: data.content,
        type: data.type || "default",
        tags: data.tags,
        featuredImage: null,
        isFavorite: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      set((state) => ({
        concepts: [...state.concepts, concept],
        isLoading: false,
      }));
    } catch (error) {
      conceptLogger.error("❌ Error al crear concepto:", error);
      set({ error: "No se pudo crear el concepto", isLoading: false });
    }
  },

  updateConcept: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      conceptLogger.info("💾 Actualizando concepto:", { id, data });
      // TODO: Implementar actualización en API
      set((state) => ({
        concepts: state.concepts.map((concept) =>
          concept.id === id
            ? {
              ...concept,
              ...data,
              updatedAt: new Date(),
            }
            : concept
        ),
        isLoading: false,
      }));
    } catch (error) {
      conceptLogger.error("❌ Error al actualizar concepto:", error);
      set({ error: "No se pudo actualizar el concepto", isLoading: false });
    }
  },

  deleteConcept: async (id) => {
    set({ isLoading: true, error: null });
    try {
      conceptLogger.info("🗑️ Eliminando concepto:", { id });
      // TODO: Implementar eliminación en API
      set((state) => ({
        concepts: state.concepts.filter((concept) => concept.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      conceptLogger.error("❌ Error al eliminar concepto:", error);
      set({ error: "No se pudo eliminar el concepto", isLoading: false });
    }
  },
}));