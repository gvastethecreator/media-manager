import { create } from "zustand";
import type { PlaceCreate, PlaceUpdate, PlaceWithStats } from "@/services/place.service";
import { logger } from "@/lib/logger";
import type { FileItem } from "@/types/file-item";
import * as PlaceActions from "@/app/actions/places";

const placesLogger = logger.withContext("PlacesStore");

interface PlacesState {
  places: PlaceWithStats[];
  currentPlace: PlaceWithStats | null;
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
      const places = await PlaceActions.getPlaces();
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
      placesLogger.info("✨ Creando lugar...", data);
      await PlaceActions.createPlace(data);
      await get().loadPlaces();
    } catch (error) {
      placesLogger.error("❌ Error al crear lugar:", error);
      throw error;
    }
  },

  updatePlace: async (id: string, data: PlaceUpdate) => {
    try {
      placesLogger.info("📝 Actualizando lugar...", { id, data });
      await PlaceActions.updatePlace(id, data);
      await get().loadPlaces();
    } catch (error) {
      placesLogger.error("❌ Error al actualizar lugar:", error);
      throw error;
    }
  },

  deletePlace: async (id: string) => {
    try {
      placesLogger.info("🗑️ Eliminando lugar...", id);
      await PlaceActions.deletePlace(id);
      await get().loadPlaces();
    } catch (error) {
      placesLogger.error("❌ Error al eliminar lugar:", error);
      throw error;
    }
  },

  addImageToPlace: async (placeId: string, imageId: string) => {
    try {
      placesLogger.info("➕ Agregando imagen a lugar:", { placeId, imageId });
      await PlaceActions.addImageToPlace(placeId, imageId);
      await get().loadPlaces();
    } catch (error) {
      placesLogger.error("❌ Error al agregar imagen a lugar:", error);
      throw error;
    }
  },

  removeImageFromPlace: async (placeId: string, imageId: string) => {
    try {
      placesLogger.info("🗑️ Eliminando imagen de lugar:", { placeId, imageId });
      await PlaceActions.removeImageFromPlace(placeId, imageId);
      await get().loadPlaces();
    } catch (error) {
      placesLogger.error("❌ Error al eliminar imagen de lugar:", error);
      throw error;
    }
  },

  loadPlaceContent: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      const place = await PlaceActions.getPlace(id);
      if (!place) throw new Error("Lugar no encontrado");
      const images = await PlaceActions.getPlaceImages(id);
      set({
        currentPlace: place,
        currentItems: images,
        isLoading: false,
      });
      placesLogger.info("📥 Contenido del lugar cargado:", {
        placeId: id,
        imageCount: images.length,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      set({ error: errorMessage, isLoading: false });
      placesLogger.error("❌ Error al cargar contenido del lugar:", { error });
    }
  },
}));