import { create } from "zustand";
import { Prompt } from "@prisma/client";
import { getPrompts, createPrompt as createPromptAction, updatePrompt as updatePromptAction, deletePrompt as deletePromptAction, type PromptWithStats, type PromptCreate, type PromptUpdate } from "@/app/actions/prompt.actions";
import { logger } from "@/lib/logger";

const promptLogger = logger.withContext("PromptStore");

const mapToPromptWithStats = (prompt: Awaited<ReturnType<typeof getPrompts>>[0]): PromptWithStats => ({
  ...prompt,
  totalSize: 0,
  lastUpdated: new Date(),
  recentImages: [],
  _count: {
    ...prompt._count,
    images: 0
  }
});

interface PromptStore {
  prompts: PromptWithStats[];
  isLoading: boolean;
  error: string | null;
  loadPrompts: () => Promise<void>;
  createPrompt: (prompt: PromptCreate) => Promise<void>;
  updatePrompt: (id: string, prompt: PromptUpdate) => Promise<void>;
  deletePrompt: (id: string) => Promise<void>;
}

export const usePromptStore = create<PromptStore>((set, get) => ({
  prompts: [],
  isLoading: false,
  error: null,
  loadPrompts: async () => {
    try {
      set({ isLoading: true, error: null });
      promptLogger.info("Cargando prompts");
      const rawPrompts = await getPrompts();
      const prompts = rawPrompts.map(mapToPromptWithStats);
      set({ prompts, isLoading: false });
      promptLogger.info("✅ Prompts cargados");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al cargar prompts";
      promptLogger.error("❌ Error al cargar prompts:", error);
      set({ error: message, isLoading: false });
    }
  },
  createPrompt: async (prompt) => {
    try {
      set({ isLoading: true, error: null });
      promptLogger.info("✨ Creando prompt:", prompt);
      await createPromptAction(prompt);
      const rawPrompts = await getPrompts();
      const prompts = rawPrompts.map(mapToPromptWithStats);
      set({ prompts, isLoading: false });
      promptLogger.info("✅ Prompt creado");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al crear prompt";
      promptLogger.error("❌ Error al crear prompt:", error);
      set({ error: message, isLoading: false });
    }
  },
  updatePrompt: async (id, prompt) => {
    try {
      set({ isLoading: true, error: null });
      promptLogger.info("💾 Actualizando prompt:", prompt);
      await updatePromptAction(id, { ...prompt, id });
      const rawPrompts = await getPrompts();
      const prompts = rawPrompts.map(mapToPromptWithStats);
      set({ prompts, isLoading: false });
      promptLogger.info("✅ Prompt actualizado");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al actualizar prompt";
      promptLogger.error("❌ Error al actualizar prompt:", error);
      set({ error: message, isLoading: false });
    }
  },
  deletePrompt: async (id) => {
    try {
      set({ isLoading: true, error: null });
      promptLogger.info("🗑️ Eliminando prompt:", id);
      await deletePromptAction(id);
      const rawPrompts = await getPrompts();
      const prompts = rawPrompts.map(mapToPromptWithStats);
      set({ prompts, isLoading: false });
      promptLogger.info("✅ Prompt eliminado");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al eliminar prompt";
      promptLogger.error("❌ Error al eliminar prompt:", error);
      set({ error: message, isLoading: false });
    }
  }
}));