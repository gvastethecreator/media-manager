import { create } from "zustand";
import { placeService } from "@/services/place.service";
import type { PlaceCreate, PlaceUpdate } from "@/services/place.service";
import { logger } from "@/lib/logger";
import type { FileItem } from "@/types/file-item";
import { Place } from "@prisma/client";

const placesLogger = logger.withContext("PlacesStore");

interface PlacesState {
  places: Place[];
  currentPlace: Place | null;
  currentItems: FileItem[];
  isLoading: boolean;
  error: string | null;
  // Acciones
  loadPlaces: () => Promise<void>;
  createPlace: (data: PlaceCreate) => Promise<void>;
  updatePlace: (id: string, data: PlaceUpdate) => Promise<void>;
  deletePlace: (id: string) => Promise<void>;
  addImageToPlace: (placeId: string, imageId: string) => Promise<void>;
  removeImageFromPlace: (placeId: string, imageId: string) => Promise<void>;
  loadPlaceContent: (id: string) => Promise<void>;
}

export const usePlacesStore = create<PlacesState>((set, get) => ({
  places: [],
  currentPlace: null,
  currentItems: [],
  isLoading: false,
  error: null,

  loadPlaces: async () => {
    try {
      set({ isLoading: true, error: null });
      const places = await placeService.getPlaces();
      set({ places, isLoading: false });
      placesLogger.info("📥 Lugares cargados:", { count: places.length });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      set({ error: errorMessage, isLoading: false });
      placesLogger.error("❌ Error al cargar lugares:", { error });
    }
  },

  createPlace: async (data: PlaceCreate) => {
    try {
      set({ isLoading: true, error: null });
      const place = await placeService.createPlace(data);
      set((state) => ({
        places: [...state.places, place],
        isLoading: false,
      }));
      placesLogger.info("✨ Lugar creado:", { place });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      set({ error: errorMessage, isLoading: false });
      placesLogger.error("❌ Error al crear lugar:", { error });
    }
  },

  updatePlace: async (id: string, data: PlaceUpdate) => {
    try {
      set({ isLoading: true, error: null });
      const updatedPlace = await placeService.updatePlace(id, data);
      set((state) => ({
        places: state.places.map((p) =>
          p.id === id ? updatedPlace : p
        ),
        currentPlace: state.currentPlace?.id === id ? updatedPlace : state.currentPlace,
        isLoading: false,
      }));
      placesLogger.info("📝 Lugar actualizado:", { id, data });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      set({ error: errorMessage, isLoading: false });
      placesLogger.error("❌ Error al actualizar lugar:", { id, error });
    }
  },

  deletePlace: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      await placeService.deletePlace(id);
      set((state) => ({
        places: state.places.filter((p) => p.id !== id),
        currentPlace: state.currentPlace?.id === id ? null : state.currentPlace,
        currentItems: state.currentPlace?.id === id ? [] : state.currentItems,
        isLoading: false,
      }));
      placesLogger.info("🗑️ Lugar eliminado:", { id });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      set({ error: errorMessage, isLoading: false });
      placesLogger.error("❌ Error al eliminar lugar:", { id, error });
    }
  },

  addImageToPlace: async (placeId: string, imageId: string) => {
    try {
      await placeService.addImageToPlace(placeId, imageId);
      placesLogger.info("📸 Imagen agregada a lugar:", { placeId, imageId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      set({ error: errorMessage });
      placesLogger.error("❌ Error al agregar imagen a lugar:", { placeId, imageId, error });
    }
  },

  removeImageFromPlace: async (placeId: string, imageId: string) => {
    try {
      await placeService.removeImageFromPlace(placeId, imageId);
      set((state) => ({
        currentItems: state.currentItems.filter((item) => item.id !== imageId),
      }));
      placesLogger.info("🗑️ Imagen eliminada de lugar:", { placeId, imageId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      set({ error: errorMessage });
      placesLogger.error("❌ Error al eliminar imagen de lugar:", { placeId, imageId, error });
    }
  },

  loadPlaceContent: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      const place = await placeService.getPlace(id);
      if (!place) {
        throw new Error("Lugar no encontrado");
      }
      const images = await placeService.getPlaceImages(id);
      set({
        currentPlace: place,
        currentItems: images,
        isLoading: false,
      });
      placesLogger.info("📂 Contenido de lugar cargado:", { id });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      set({ error: errorMessage, isLoading: false });
      placesLogger.error("❌ Error al cargar contenido de lugar:", { id, error });
    }
  },
}));