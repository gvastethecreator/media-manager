import { create } from 'zustand';

// Tipos de shaders disponibles
export type ShaderType = 'distortion' | 'hologram' | 'wave' | 'particle';

// Configuración base para todos los shaders
interface BaseShaderConfig {
  enabled: boolean;
  type: ShaderType;
  opacity: number;
  blendMode: string;
}

// Configuraciones específicas por tipo de shader
interface DistortionConfig extends BaseShaderConfig {
  type: 'distortion';
  intensity: number;
}

interface HologramConfig extends BaseShaderConfig {
  type: 'hologram';
  color: [number, number, number];
  scanlineIntensity: number;
}

interface WaveConfig extends BaseShaderConfig {
  type: 'wave';
  amplitude: number;
  frequency: number;
}

interface ParticleConfig extends BaseShaderConfig {
  type: 'particle';
  particleSize: number;
  particleDensity: number;
}

// Tipo unión para todas las configuraciones posibles
export type ShaderConfig = DistortionConfig | HologramConfig | WaveConfig | ParticleConfig;

// Estado inicial por tipo de shader
const initialConfigs: Record<ShaderType, Omit<ShaderConfig, 'type'>> = {
  distortion: {
    enabled: false,
    opacity: 1,
    blendMode: 'normal',
    intensity: 0.1,
  },
  hologram: {
    enabled: false,
    opacity: 1,
    blendMode: 'screen',
    color: [0, 1, 1],
    scanlineIntensity: 0.1,
  },
  wave: {
    enabled: false,
    opacity: 1,
    blendMode: 'normal',
    amplitude: 0.1,
    frequency: 10.0,
  },
  particle: {
    enabled: false,
    opacity: 1,
    blendMode: 'screen',
    particleSize: 0.5,
    particleDensity: 0.5,
  },
};

// Interface del store
interface ShaderStore {
  configs: Record<ShaderType, ShaderConfig>;
  activeType: ShaderType | null;
  setActiveType: (type: ShaderType | null) => void;
  updateConfig: <T extends ShaderType>(type: T, config: Partial<ShaderConfig>) => void;
  resetConfig: (type: ShaderType) => void;
}

// Crear store con Zustand
export const useShaderStore = create<ShaderStore>((set) => ({
  // Estado inicial
  configs: Object.fromEntries(
    Object.entries(initialConfigs).map(([type, config]) => [
      type,
      { ...config, type: type as ShaderType },
    ])
  ) as Record<ShaderType, ShaderConfig>,
  activeType: null,

  // Acciones
  setActiveType: (type) => set({ activeType: type }),

  updateConfig: (type, config) =>
    set((state) => ({
      configs: {
        ...state.configs,
        [type]: { ...state.configs[type], ...config },
      },
    })),

  resetConfig: (type) =>
    set((state) => ({
      configs: {
        ...state.configs,
        [type]: { ...initialConfigs[type], type },
      },
    })),
}));