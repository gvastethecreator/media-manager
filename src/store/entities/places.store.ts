import {
	type PlaceCreate,
	type PlaceUpdate,
	type PlaceWithStats,
	addImageToPlace,
	createPlace,
	deletePlace,
	getPlaces,
	updatePlace,
} from '@/app/actions/places/place.actions';
import { serverLogger } from '@/lib/logger/server-logger';
import type { Place } from '@prisma/client';
import { create } from 'zustand';

const mapToPlaceWithStats = (place: Awaited<ReturnType<typeof getPlaces>>[0]): PlaceWithStats => ({
	...place,
	totalSize: 0,
	lastUpdated: new Date(),
	recentImages: [],
});

interface PlacesStore {
	places: PlaceWithStats[];
	isLoading: boolean;
	error: string | null;
	loadPlaces: () => Promise<void>;
	createPlace: (data: PlaceCreate) => Promise<Place | null>;
	updatePlace: (data: PlaceUpdate) => Promise<void>;
	deletePlace: (id: string) => Promise<void>;
	addImageToPlace: (imageId: string, placeId: string) => Promise<void>;
}

const placesLogger = serverLogger.withContext('PlacesStore');

export const usePlacesStore = create<PlacesStore>((set, _get) => ({
	places: [],
	isLoading: false,
	error: null,

	loadPlaces: async () => {
		try {
			set({ isLoading: true, error: null });
			placesLogger.info('🔄 Cargando lugares');
			const rawPlaces = await getPlaces();
			const places = rawPlaces.map(mapToPlaceWithStats);
			set({ places, isLoading: false });
			placesLogger.info('✅ Lugares cargados');
		} catch (error) {
			placesLogger.error('❌ Error al cargar lugares:', error);
			const message = error instanceof Error ? error.message : 'Error al cargar lugares';
			set({ error: message, isLoading: false });
		}
	},

	createPlace: async (data) => {
		try {
			set({ isLoading: true, error: null });
			placesLogger.info('📝 Creando lugar:', data.name);
			const createdPlace = await createPlace(data);
			const rawPlaces = await getPlaces();
			const places = rawPlaces.map(mapToPlaceWithStats);
			set({ places, isLoading: false });
			placesLogger.info('✅ Lugar creado', createdPlace);
			return createdPlace;
		} catch (error) {
			placesLogger.error('❌ Error al crear lugar:', error);
			const message = error instanceof Error ? error.message : 'Error al crear lugar';
			set({ error: message, isLoading: false });
			return null;
		}
	},

	updatePlace: async (data) => {
		try {
			set({ isLoading: true, error: null });
			placesLogger.info('📝 Actualizando lugar:', data.id);
			await updatePlace(data.id, data);
			const rawPlaces = await getPlaces();
			const places = rawPlaces.map(mapToPlaceWithStats);
			set({ places, isLoading: false });
			placesLogger.info('✅ Lugar actualizado');
		} catch (error) {
			placesLogger.error('❌ Error al actualizar lugar:', error);
			const message = error instanceof Error ? error.message : 'Error al actualizar lugar';
			set({ error: message, isLoading: false });
		}
	},

	deletePlace: async (id) => {
		try {
			set({ isLoading: true, error: null });
			placesLogger.info('🗑️ Eliminando lugar:', id);
			await deletePlace(id);
			const rawPlaces = await getPlaces();
			const places = rawPlaces.map(mapToPlaceWithStats);
			set({ places, isLoading: false });
			placesLogger.info('✅ Lugar eliminado');
		} catch (error) {
			placesLogger.error('❌ Error al eliminar lugar:', error);
			const message = error instanceof Error ? error.message : 'Error al eliminar lugar';
			set({ error: message, isLoading: false });
		}
	},

	addImageToPlace: async (imageId, placeId) => {
		try {
			set({ isLoading: true, error: null });
			placesLogger.info('➕ Agregando imagen a lugar:', { placeId, imageId });
			await addImageToPlace(placeId, imageId);
			const rawPlaces = await getPlaces();
			const places = rawPlaces.map(mapToPlaceWithStats);
			set({ places, isLoading: false });
			placesLogger.info('✅ Imagen agregada al lugar');
		} catch (error) {
			placesLogger.error('❌ Error al agregar imagen al lugar:', error);
			const message = error instanceof Error ? error.message : 'Error al agregar imagen al lugar';
			set({ error: message, isLoading: false });
		}
	},
}));
