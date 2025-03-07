import {
	type PlaceCreate,
	type PlaceUpdate,
	type PlaceWithStats,
	addImageToPlace,
	createPlace,
	deletePlace,
	getPlaces,
	updatePlace,
} from '@/app/actions/place.actions';
import { logger } from '@/lib/logger';
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
	error: Error | null;
	loadPlaces: () => Promise<void>;
	createPlace: (data: PlaceCreate) => Promise<void>;
	updatePlace: (data: PlaceUpdate) => Promise<void>;
	deletePlace: (id: string) => Promise<void>;
	addImageToPlace: (placeId: string, imageId: string) => Promise<void>;
}

const placesLogger = logger.withContext('PlacesStore');

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
			set({ error: error as Error, isLoading: false });
		}
	},

	createPlace: async (data) => {
		try {
			set({ isLoading: true, error: null });
			placesLogger.info('📝 Creando lugar:', data.name);
			await createPlace(data);
			const rawPlaces = await getPlaces();
			const places = rawPlaces.map(mapToPlaceWithStats);
			set({ places, isLoading: false });
			placesLogger.info('✅ Lugar creado');
		} catch (error) {
			placesLogger.error('❌ Error al crear lugar:', error);
			set({ error: error as Error, isLoading: false });
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
			set({ error: error as Error, isLoading: false });
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
			set({ error: error as Error, isLoading: false });
		}
	},

	addImageToPlace: async (placeId, imageId) => {
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
			set({ error: error as Error, isLoading: false });
		}
	},
}));
