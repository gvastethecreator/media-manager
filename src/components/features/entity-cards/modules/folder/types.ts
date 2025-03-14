/**
 * Interfaz para la configuración de carpetas
 * @typedef {Object} CoreFolderConfig
 */
export interface CoreFolderConfig {
  showIcon?: boolean;
  showStats?: boolean;
  showDate?: boolean;
  gridColumns?: number;
  sortBy?: string;
}

/**
 * Interfaz para el sistema de capas
 * @typedef {Object} CoreLayerSystemConfig
 */
export interface CoreLayerSystemConfig {
  layerBlending?: string;
  layerSpacing?: number;
  order?: string[];
}

/**
 * Interfaz para configuración de efectos
 * @typedef {Object} CoreEffectsConfig
 */
export interface CoreEffectsConfig {
  shadow?: {
    enabled?: boolean;
    intensity?: number;
  };
  reflection?: {
    enabled?: boolean;
    opacity?: number;
  };
  parallax?: {
    enabled?: boolean;
    intensity?: number;
  };
  glow?: {
    enabled?: boolean;
    intensity?: number;
    color?: string;
  };
  holographic?: {
    enabled?: boolean;
    intensity?: number;
  };
  border?: {
    enabled?: boolean;
    animated?: boolean;
  };
  halo?: {
    enabled?: boolean;
    intensity?: number;
    color?: string;
  };
}

/**
 * Interfaz para las opciones de carpeta
 * @typedef {Object} FolderOptions
 */
export interface FolderOptions {
  coreFolderConfig?: CoreFolderConfig;
  coreLayerSystem?: CoreLayerSystemConfig;
  corePerformance?: {
    enableCache?: boolean;
    useVirtualScroll?: boolean;
    lazyLoad?: boolean;
    loadingStrategy?: string;
    throttleMs?: number;
  };
  coreEffects?: CoreEffectsConfig;
  coreConfig?: {
    theme?: string;
    fontSize?: number;
    cornerRadius?: number;
    aspectRatio?: string;
  };
}

/**
 * Valores predeterminados para opciones de carpeta
 */
export const DEFAULT_FOLDER_OPTIONS: FolderOptions = {
  coreFolderConfig: {
    showIcon: true,
    showStats: true,
    showDate: true,
    gridColumns: 4,
    sortBy: 'name',
  },
  coreLayerSystem: {
    layerBlending: 'normal',
    layerSpacing: 2,
    order: ['base', 'decoration', 'content', 'effects'],
  },
  corePerformance: {
    enableCache: true,
    useVirtualScroll: true,
    lazyLoad: true,
    loadingStrategy: 'progressive',
    throttleMs: 100,
  },
  coreEffects: {
    shadow: {
      enabled: true,
      intensity: 50,
    },
    reflection: {
      enabled: false,
      opacity: 30,
    },
    parallax: {
      enabled: false,
      intensity: 20,
    },
    glow: {
      enabled: false,
      intensity: 30,
      color: 'rgba(255,255,255,0.8)',
    },
    holographic: {
      enabled: false,
      intensity: 50,
    },
    border: {
      enabled: false,
      animated: false,
    },
    halo: {
      enabled: false,
      intensity: 40,
      color: 'rgba(255,255,255,0.5)',
    },
  },
  coreConfig: {
    theme: 'auto',
    fontSize: 14,
    cornerRadius: 8,
    aspectRatio: '16/9',
  },
};

/**
 * Opciones para ordenamiento de elementos
 */
export const sortOptions = [
  { value: 'name', label: 'Nombre' },
  { value: 'date', label: 'Fecha' },
  { value: 'size', label: 'Tamaño' },
  { value: 'type', label: 'Tipo' },
  { value: 'custom', label: 'Personalizado' },
];

/**
 * Opciones para estrategias de carga
 */
export const loadingStrategyOptions = [
  { value: 'eager', label: 'Inmediata' },
  { value: 'progressive', label: 'Progresiva' },
  { value: 'lazy', label: 'Perezosa' },
];

/**
 * Opciones para el modo de fusión de capas
 */
export const blendingModeOptions = [
  { value: 'normal', label: 'Normal' },
  { value: 'multiply', label: 'Multiplicar' },
  { value: 'screen', label: 'Pantalla' },
  { value: 'overlay', label: 'Superponer' },
  { value: 'darken', label: 'Oscurecer' },
  { value: 'lighten', label: 'Aclarar' },
];

/**
 * Opciones para temas
 */
export const themeOptions = [
  { value: 'auto', label: 'Automático' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
  { value: 'custom', label: 'Personalizado' },
];

/**
 * Opciones para relación de aspecto
 */
export const aspectRatioOptions = [
  { value: '1/1', label: 'Cuadrado (1:1)' },
  { value: '4/3', label: 'Clásico (4:3)' },
  { value: '16/9', label: 'Panorámico (16:9)' },
  { value: '21/9', label: 'Ultra panorámico (21:9)' },
  { value: 'custom', label: 'Personalizado' },
];

/**
 * Props para el módulo de folder
 */
export interface FolderModuleProps {
  initialOptions?: Partial<FolderOptions>;
  onChange?: (options: FolderOptions) => void;
  disabled?: boolean;
  className?: string;
}