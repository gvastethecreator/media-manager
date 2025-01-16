import { create } from 'zustand';
import type { Object } from '@prisma/client';
import { logger } from '@/lib/logger';
import {
  getObjects,
  createObject as createObjectAction,
  updateObject as updateObjectAction,
  deleteObject as deleteObjectAction,
  addImageToObject as addImageToObjectAction,
  type ObjectCreate,
  type ObjectUpdate,
  type ObjectWithStats
} from '@/app/actions/object.actions';

const objectsLogger = logger.withContext('ObjectsStore');

interface ObjectsStore {
  objects: ObjectWithStats[];
  isLoading: boolean;
  error: string | null;
  loadObjects: () => Promise<void>;
  createObject: (object: ObjectCreate) => Promise<void>;
  updateObject: (id: string, object: ObjectUpdate) => Promise<void>;
  deleteObject: (id: string) => Promise<void>;
  addImageToObject: (objectId: string, imageId: string) => Promise<void>;
}

export const useObjectsStore = create<ObjectsStore>((set) => ({
  objects: [],
  isLoading: false,
  error: null,
  loadObjects: async () => {
    try {
      set({ isLoading: true, error: null });
      objectsLogger.info('🔄 Cargando objetos...');
      const objects = await getObjects();
      set({ objects, isLoading: false });
      objectsLogger.info(`✅ ${objects.length} objetos cargados`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al cargar objetos';
      objectsLogger.error('❌ Error al cargar objetos:', error);
      set({ error: message, isLoading: false });
    }
  },
  createObject: async (object) => {
    try {
      set({ isLoading: true, error: null });
      objectsLogger.info('✨ Creando objeto:', object);
      await createObjectAction(object);
      const objects = await getObjects();
      set({ objects, isLoading: false });
      objectsLogger.info('✅ Objeto creado');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear objeto';
      objectsLogger.error('❌ Error al crear objeto:', error);
      set({ error: message, isLoading: false });
    }
  },
  updateObject: async (id, object) => {
    try {
      set({ isLoading: true, error: null });
      objectsLogger.info('💾 Actualizando objeto:', object);
      await updateObjectAction(id, { ...object, id });
      const objects = await getObjects();
      set({ objects, isLoading: false });
      objectsLogger.info('✅ Objeto actualizado');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al actualizar objeto';
      objectsLogger.error('❌ Error al actualizar objeto:', error);
      set({ error: message, isLoading: false });
    }
  },
  deleteObject: async (id) => {
    try {
      set({ isLoading: true, error: null });
      objectsLogger.info('🗑️ Eliminando objeto:', id);
      await deleteObjectAction(id);
      const objects = await getObjects();
      set({ objects, isLoading: false });
      objectsLogger.info('✅ Objeto eliminado');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al eliminar objeto';
      objectsLogger.error('❌ Error al eliminar objeto:', error);
      set({ error: message, isLoading: false });
    }
  },
  addImageToObject: async (objectId, imageId) => {
    try {
      set({ isLoading: true, error: null });
      objectsLogger.info('➕ Agregando imagen a objeto:', { objectId, imageId });
      await addImageToObjectAction(objectId, imageId);
      const objects = await getObjects();
      set({ objects, isLoading: false });
      objectsLogger.info('✅ Imagen agregada al objeto');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al agregar imagen al objeto';
      objectsLogger.error('❌ Error al agregar imagen al objeto:', error);
      set({ error: message, isLoading: false });
    }
  }
}));