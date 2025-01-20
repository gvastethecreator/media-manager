import { create } from "zustand";
import { type Prompt } from "@/types/entities";
import { type BaseStore } from "@/types/store.types";
import { type BaseFormData } from "@/types/form.types";
import { logger } from "@/lib/logger";

const promptLogger = logger.withContext("PromptStore");

export interface PromptFormData extends BaseFormData {
  content: string;
  type?: string;
  tags?: string[];
}

export interface PromptStore extends BaseStore<Prompt> {
  prompts: Prompt[];
  createPrompt: (data: PromptFormData) => Promise<void>;
  updatePrompt: (id: string, data: Partial<PromptFormData>) => Promise<void>;
  deletePrompt: (id: string) => Promise<void>;
}

export const usePromptStore = create<PromptStore>((set) => ({
  items: [],
  prompts: [],
  isLoading: false,
  error: null,

  loadItems: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await fetch("/api/prompts");
      if (!response.ok) throw new Error("Error loading prompts");
      const prompts = await response.json();
      set({ prompts, items: prompts, isLoading: false });
    } catch (error) {
      promptLogger.error("Error loading prompts:", error);
      set({ error: error as Error, isLoading: false });
    }
  },

  createItem: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const response = await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          tags: data.tags?.join(",") || "",
        }),
      });
      if (!response.ok) throw new Error("Error creating prompt");
      const prompt = await response.json();
      set((state) => ({
        prompts: [...state.prompts, prompt],
        items: [...state.items, prompt],
        isLoading: false,
      }));
      return prompt;
    } catch (error) {
      promptLogger.error("Error creating prompt:", error);
      set({ error: error as Error, isLoading: false });
      throw error;
    }
  },

  updateItem: async (id, data) => {
    try {
      set({ isLoading: true, error: null });
      const response = await fetch(`/api/prompts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          tags: data.tags?.join(",") || "",
        }),
      });
      if (!response.ok) throw new Error("Error updating prompt");
      const updatedPrompt = await response.json();
      set((state) => ({
        prompts: state.prompts.map((p) =>
          p.id === id ? updatedPrompt : p
        ),
        items: state.items.map((p) =>
          p.id === id ? updatedPrompt : p
        ),
        isLoading: false,
      }));
      return updatedPrompt;
    } catch (error) {
      promptLogger.error("Error updating prompt:", error);
      set({ error: error as Error, isLoading: false });
      throw error;
    }
  },

  deleteItem: async (id) => {
    try {
      set({ isLoading: true, error: null });
      const response = await fetch(`/api/prompts/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Error deleting prompt");
      set((state) => ({
        prompts: state.prompts.filter((p) => p.id !== id),
        items: state.items.filter((p) => p.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      promptLogger.error("Error deleting prompt:", error);
      set({ error: error as Error, isLoading: false });
      throw error;
    }
  },

  createPrompt: async (data) => {
    await usePromptStore.getState().createItem(data);
  },

  updatePrompt: async (id, data) => {
    await usePromptStore.getState().updateItem(id, data);
  },

  deletePrompt: async (id) => {
    await usePromptStore.getState().deleteItem(id);
  },
}));