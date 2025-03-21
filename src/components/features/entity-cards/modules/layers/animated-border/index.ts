export * from './actions/animated-border-config.action';
import type { LayerImplementation } from '../types';

/**
 * 🎭 Implementación de la capa de borde animado
 */
export const animatedBorderImplementation: LayerImplementation = {
  type: 'animated-border',
  name: 'Borde Animado',
  description: 'Añade un borde con animaciones a la tarjeta',
  defaultConfig: {
    enabled: true,
    layerIndex: 3,
    width: 3,
    color: '#0099ff',
    style: 'dashed',
    opacity: 1,
    radius: 10,
    animation: 'pulse',
    speed: 1,
    glow: true,
    glowIntensity: 0.5,
  },
  render: () => null, // Stub implementation
  settings: () => null, // Stub implementation
  icon: 'badgeAlert',
};

export * from './components/animated-border-layer';
export * from './components/animated-border-settings';
export * from './hooks/use-animated-border';
