import { serverLogger } from '@/lib/logger/server-logger';
import type { VisualPresetExtended } from '@/types/entities/visual-preset';
import type { StateCreator } from 'zustand';
import type { VisualPresetCoreActions, VisualPresetCoreState, VisualPresetStore } from '../types';

// Mock de API para pruebas - Reemplazar con llamadas reales a server actions
const mockPresets: VisualPresetExtended[] = [
  {
    id: '1',
    name: 'Preset Predeterminado',
    description: 'Preset visual por defecto del sistema',
    category: 'general',
    isDefault: true,
    isPublic: true,
    version: '1.0.0',
    author: 'Sistema',
    tags: 'empty_array',
    parsedTags: [],
    createdAt: new Date(),
    updatedAt: new Date()
  } as VisualPresetExtended,
  {
    id: '2',
    name: 'Preset Moderno',
    description: 'Estilo moderno con efectos holográficos',
    category: 'cards',
    isDefault: false,
    isPublic: true,
    version: '1.0.0',
    author: 'Diseñador',
    tags: 'empty_array',
    parsedTags: ['moderno', 'minimalista'],
    createdAt: new Date(),
    updatedAt: new Date()
  } as VisualPresetExtended
];

const coreLogger = serverLogger.withContext('VisualPresetStore:Core');

const simulateApiCall = async <T>(data: T, delay = 500): Promise<T> => {
  await new Promise(resolve => setTimeout(resolve, delay));
  return data;
};

export const createCoreSlice: StateCreator<
  VisualPresetStore,
  [],
  [],
  VisualPresetCoreState & VisualPresetCoreActions
> = (set, get) => ({
  // Estado inicial
  presets: [],
  currentPresetId: null,
  currentPreset: null,
  loading: false,
  error: null,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,

  // Acciones
  fetchPresets: async () => {
    try {
      set({ loading: true, error: null });
      coreLogger.info('🔄 Obteniendo presets visuales');

      // Simular llamada API - Reemplazar con server actions
      const data = await simulateApiCall(mockPresets);

      set({ presets: data, loading: false });
      coreLogger.info(`✅ ${data.length} presets visuales obtenidos`);

      return;
    } catch (error) {
      coreLogger.error('❌ Error obteniendo presets visuales:', error);
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Error obteniendo presets visuales'
      });
    }
  },

  fetchPresetById: async (id) => {
    try {
      set({ loading: true, error: null });
      coreLogger.info(`🔄 Obteniendo preset visual con ID: ${id}`);

      // Simular llamada API - Reemplazar con server actions
      const preset = mockPresets.find(p => p.id === id) || null;
      const data = await simulateApiCall(preset);

      if (data) {
        set({ currentPreset: data, currentPresetId: id, loading: false });
        coreLogger.info('✅ Preset visual obtenido');
      } else {
        coreLogger.warn(`⚠️ No se encontró el preset visual con ID: ${id}`);
        set({ loading: false, error: 'Preset visual no encontrado' });
      }

      return data;
    } catch (error) {
      coreLogger.error(`❌ Error obteniendo preset visual con ID ${id}:`, error);
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Error obteniendo preset visual'
      });
      return null;
    }
  },

  createPreset: async (data) => {
    try {
      set({ isCreating: true, error: null });
      coreLogger.info('🔄 Creando nuevo preset visual');

      // Simular llamada API - Reemplazar con server actions
      const newPreset = {
        id: `new-${Date.now()}`,
        ...data,
        parsedTags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      } as VisualPresetExtended;

      const createdPreset = await simulateApiCall(newPreset);

      // Actualizar estado
      set(state => ({
        presets: [...state.presets, createdPreset],
        isCreating: false
      }));

      coreLogger.info('✅ Preset visual creado con éxito');
      return createdPreset;
    } catch (error) {
      coreLogger.error('❌ Error creando preset visual:', error);
      set({
        isCreating: false,
        error: error instanceof Error ? error.message : 'Error creando preset visual'
      });
      return null;
    }
  },

  updatePreset: async (id, data) => {
    try {
      set({ isUpdating: true, error: null });
      coreLogger.info(`🔄 Actualizando preset visual con ID: ${id}`);

      // Simular llamada API - Reemplazar con server actions
      const { presets } = get();
      const presetIndex = presets.findIndex(p => p.id === id);

      if (presetIndex === -1) {
        throw new Error('Preset visual no encontrado');
      }

      const updatedPreset = {
        ...presets[presetIndex],
        ...data,
        updatedAt: new Date()
      } as VisualPresetExtended;

      const result = await simulateApiCall(updatedPreset);

      // Actualizar estado
      set(state => {
        const newPresets = [...state.presets];
        newPresets[presetIndex] = result;

        return {
          presets: newPresets,
          isUpdating: false,
          currentPreset: state.currentPresetId === id ? result : state.currentPreset
        };
      });

      coreLogger.info('✅ Preset visual actualizado con éxito');
      return result;
    } catch (error) {
      coreLogger.error(`❌ Error actualizando preset visual con ID ${id}:`, error);
      set({
        isUpdating: false,
        error: error instanceof Error ? error.message : 'Error actualizando preset visual'
      });
      return null;
    }
  },

  deletePreset: async (id) => {
    try {
      set({ isDeleting: true, error: null });
      coreLogger.info(`🔄 Eliminando preset visual con ID: ${id}`);

      // Simular llamada API - Reemplazar con server actions
      await simulateApiCall(true);

      // Actualizar estado
      set(state => ({
        presets: state.presets.filter(p => p.id !== id),
        currentPreset: state.currentPresetId === id ? null : state.currentPreset,
        currentPresetId: state.currentPresetId === id ? null : state.currentPresetId,
        isDeleting: false
      }));

      coreLogger.info('✅ Preset visual eliminado con éxito');
      return true;
    } catch (error) {
      coreLogger.error(`❌ Error eliminando preset visual con ID ${id}:`, error);
      set({
        isDeleting: false,
        error: error instanceof Error ? error.message : 'Error eliminando preset visual'
      });
      return false;
    }
  },

  setCurrentPresetId: (id) => {
    set({ currentPresetId: id });

    // Si tenemos el preset en el estado, lo establecemos como actual
    if (id) {
      const { presets } = get();
      const preset = presets.find(p => p.id === id) || null;
      set({ currentPreset: preset });
    } else {
      set({ currentPreset: null });
    }
  },

  setCurrentPreset: (preset) => {
    set({
      currentPreset: preset,
      currentPresetId: preset ? preset.id : null
    });
  },

  resetError: () => {
    set({ error: null });
  }
});