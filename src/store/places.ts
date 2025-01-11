import { create } from "zustand";
import { placeService } from "@/services/place.service";
import type { PlaceCreate, PlaceUpdate, PlaceWithStats } from "@/services/place.service";
import { logger } from "@/lib/logger";
import type { FileItem } from "@/types/file-item";

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
        places: state.places.map((place) =>
          place.id === id ? updatedPlace : place
        ),
        currentPlace:
          state.currentPlace?.id === id
            ? updatedPlace
            : state.currentPlace,
        isLoading: false,
      }));
      placesLogger.info("📝 Lugar actualizado:", { id, data });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      set({ error: errorMessage, isLoading: false });
      placesLogger.error("❌ Error al actualizar lugar:", { error });
    }
  },

  deletePlace: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      await placeService.deletePlace(id);
      set((state) => ({
        places: state.places.filter((place) => place.id !== id),
        currentPlace:
          state.currentPlace?.id === id ? null : state.currentPlace,
        isLoading: false,
      }));
      placesLogger.info("🗑️ Lugar eliminado:", { id });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      set({ error: errorMessage, isLoading: false });
      placesLogger.error("❌ Error al eliminar lugar:", { error });
    }
  },

  addImageToPlace: async (placeId: string, imageId: string) => {
    try {
      set({ isLoading: true, error: null });
      await placeService.addImageToPlace(placeId, imageId);
      const places = await placeService.getPlaces();
      set({ places, isLoading: false });
      placesLogger.info("📸 Imagen agregada a lugar:", { placeId, imageId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      set({ error: errorMessage, isLoading: false });
      placesLogger.error("❌ Error al agregar imagen a lugar:", { error });
    }
  },

  removeImageFromPlace: async (placeId: string, imageId: string) => {
    try {
      set({ isLoading: true, error: null });
      await placeService.removeImageFromPlace(placeId, imageId);
      const places = await placeService.getPlaces();
      set({ places, isLoading: false });
      placesLogger.info("🗑️ Imagen eliminada de lugar:", { placeId, imageId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      set({ error: errorMessage, isLoading: false });
      placesLogger.error("❌ Error al eliminar imagen de lugar:", { error });
    }
  },

  loadPlaceContent: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      const place = await placeService.getPlace(id);
      if (!place) {
        throw new Error("Lugar no encontrado");
      }
      const items = await placeService.getPlaceImages(id);
      set({
        currentPlace: place,
        currentItems: items,
        isLoading: false,
      });
      placesLogger.info("📥 Contenido de lugar cargado:", { id });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      set({ error: errorMessage, isLoading: false });
      placesLogger.error("❌ Error al cargar contenido de lugar:", { error });
    }
  },
}));