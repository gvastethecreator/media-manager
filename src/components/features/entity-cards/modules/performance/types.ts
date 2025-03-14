/**
 * Interfaz para el módulo de rendimiento
 * @typedef {Object} PerformanceOptions
 */
export interface PerformanceOptions {
  // Configuración general
  performanceMode?: string;
  enableCache?: boolean;
  loadingStrategy?: string;
  enablePreloading?: boolean;
  enableHardwareAcceleration?: boolean;

  // Optimización de renderizado
  useRAF?: boolean;
  batchUpdates?: boolean;
  throttleMs?: number;
  lazyLoad?: boolean;
  prefetch?: boolean;
  virtualizeList?: boolean;

  // Optimización de imágenes
  imageOptimization?: boolean;
  prefetchOnHover?: boolean;

  // Tiempos y retardos
  debounceTime?: number;
  transitionDelay?: number;

  // Estrategias avanzadas
  cacheStrategy?: string;
  useWASM?: boolean;

  // Animaciones
  reducedMotion?: boolean;
  animationDuration?: number;
  animationMaxFPS?: number;
}

// Valores predeterminados para el módulo de rendimiento
export const DEFAULT_PERFORMANCE_OPTIONS: PerformanceOptions = {
  performanceMode: 'balanced',
  enableCache: true,
  loadingStrategy: 'progressive',
  enablePreloading: true,
  enableHardwareAcceleration: true,

  useRAF: true,
  batchUpdates: true,
  throttleMs: 150,
  lazyLoad: true,
  prefetch: true,
  virtualizeList: true,

  imageOptimization: true,
  prefetchOnHover: true,

  debounceTime: 300,
  transitionDelay: 0,

  cacheStrategy: 'memory',
  useWASM: false,

  reducedMotion: false,
  animationDuration: 300,
  animationMaxFPS: 60,
};

// Opciones para los modos de rendimiento
export const performanceModeOptions = [
  { value: 'quality', label: 'Calidad' },
  { value: 'balanced', label: 'Equilibrado' },
  { value: 'performance', label: 'Rendimiento' },
  { value: 'custom', label: 'Personalizado' },
];

// Opciones para estrategias de carga
export const loadingStrategyOptions = [
  { value: 'eager', label: 'Inmediata' },
  { value: 'progressive', label: 'Progresiva' },
  { value: 'lazy', label: 'Perezosa' },
];

// Opciones para estrategias de caché
export const cacheStrategyOptions = [
  { value: 'none', label: 'Ninguna' },
  { value: 'memory', label: 'Memoria' },
  { value: 'session', label: 'Sesión' },
  { value: 'persistent', label: 'Persistente' },
];

// Interfaz para las props del módulo de rendimiento
export interface PerformanceModuleProps {
  initialOptions?: Partial<PerformanceOptions>;
  onChange?: (options: PerformanceOptions) => void;
  disabled?: boolean;
  className?: string;
}