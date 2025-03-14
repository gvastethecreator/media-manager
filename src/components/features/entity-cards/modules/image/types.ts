/**
 * 🖼️ Tipos para el módulo de imagen
 */

/**
 * Opciones de configuración de imagen
 */
export interface ImageOptions {
  // Diseño
  enable3DEffect: boolean;
  designSystem?: {
    cornerStyle?: string;
    elevation?: number;
  };

  // Efectos Básicos
  enableHolographicEffect: boolean;
  enableGlowEffect: boolean;
  enableAnimatedBorder: boolean;
  enableLightHalo: boolean;

  // Efectos de Profundidad
  effects?: {
    shadow?: {
      enabled?: boolean;
      color?: string;
      blur?: number;
      spread?: number;
    };
    reflection?: {
      enabled?: boolean;
      opacity?: number;
      blur?: number;
    };
    parallax?: {
      enabled?: boolean;
      intensity?: number;
      perspective?: number;
    };
  };

  // Rendimiento
  performance?: {
    enableHardwareAcceleration?: boolean;
    useRAF?: boolean;
    batchUpdates?: boolean;
    throttleMs?: number;
  };
}

/**
 * Valores predeterminados para opciones de imagen
 */
export const DEFAULT_IMAGE_OPTIONS: ImageOptions = {
  // Diseño
  enable3DEffect: false,
  designSystem: {
    cornerStyle: 'sharp',
    elevation: 1
  },

  // Efectos Básicos
  enableHolographicEffect: false,
  enableGlowEffect: false,
  enableAnimatedBorder: false,
  enableLightHalo: false,

  // Efectos de Profundidad
  effects: {
    shadow: {
      enabled: false,
      color: 'rgba(0,0,0,0.5)',
      blur: 10,
      spread: 5
    },
    reflection: {
      enabled: false,
      opacity: 0.3,
      blur: 5
    },
    parallax: {
      enabled: false,
      intensity: 0.1,
      perspective: 1000
    }
  },

  // Rendimiento
  performance: {
    enableHardwareAcceleration: true,
    useRAF: true,
    batchUpdates: true,
    throttleMs: 150
  }
};

/**
 * Props para el componente de configuración de imagen
 */
export interface ImagePanelProps {
  initialOptions?: Partial<ImageOptions>;
  onChange?: (options: ImageOptions) => void;
  disabled?: boolean;
  className?: string;
}