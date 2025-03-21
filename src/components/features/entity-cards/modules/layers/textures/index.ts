export * from './actions/texture-config.action';
export * from './components/texture-layer';
export * from './components/texture-settings';
export * from './hooks/use-texture';
import type { LayerImplementation } from '../types';

/**
 * 🧱 Implementación de la capa de texturas
 */
export const textureImplementation: LayerImplementation = {
  type: 'texture',
  name: 'Textura',
  description: 'Añade una textura decorativa a la tarjeta',
  defaultConfig: {
    enabled: true,
    layerIndex: 1,
    textureType: 'paper',
    scale: 1,
    opacity: 0.3,
    blendMode: 'overlay',
    color: '#000000',
  },
  render: () => null, // Stub implementation
  settings: () => null, // Stub implementation
  icon: 'boxes',
};
