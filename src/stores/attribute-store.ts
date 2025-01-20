import { create } from "zustand";
import { Attribute } from "@/types/entities";

interface AttributeStore {
  attributes: Attribute[];
  selectedAttribute: Attribute | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setAttributes: (attributes: Attribute[]) => void;
  addAttribute: (attribute: Attribute) => void;
  updateAttribute: (id: string, attribute: Partial<Attribute>) => void;
  deleteAttribute: (id: string) => void;
  setSelectedAttribute: (attribute: Attribute | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAttributeStore = create<AttributeStore>((set) => ({
  attributes: [],
  selectedAttribute: null,
  isLoading: false,
  error: null,

  setAttributes: (attributes) => set({ attributes }),
  addAttribute: (attribute) =>
    set((state) => ({
      attributes: [...state.attributes, attribute],
    })),
  updateAttribute: (id, updatedAttribute) =>
    set((state) => ({
      attributes: state.attributes.map((attr) =>
        attr.id === id ? { ...attr, ...updatedAttribute } : attr
      ),
    })),
  deleteAttribute: (id) =>
    set((state) => ({
      attributes: state.attributes.filter((attr) => attr.id !== id),
    })),
  setSelectedAttribute: (attribute) => set({ selectedAttribute: attribute }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));