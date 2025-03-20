'use client';

/**
 * 🔲 Implementación de capa de borde
 *
 * Este archivo proporciona exportaciones para el sistema de capas.
 * La implementación principal ahora se encuentra en border-layer-implementation.tsx.
 */

import { BorderIcon } from '@/components/icons/layers';
import { LayerImplementation } from '../types';
import { BorderEffectLayer } from './border-effect-layer';

export const borderLayerImplementation: LayerImplementation = {
  type: 'border',
  name: 'Borde',
  description: 'Añade un borde personalizable a la tarjeta con efectos visuales',
  category: 'base',
  defaultConfig: {
    enabled: true,
    layerIndex: 2,
    width: 2,
    style: 'solid',
    color: '#ffffff',
    radius: 8,
    animated: false,
    animationType: 'none',
    animationSpeed: 1,
    glowAmount: 0,
    opacity: 1,
    cornerStyle: 'round',
  },
  icon: BorderIcon,
  compatibleEntityTypes: ['image', 'video', 'document'],
  render: BorderEffectLayer,
};

export type { BorderConfig } from './border-effect-layer';
export { BorderEffectLayer };
export default borderLayerImplementation;

// Exportar componentes individuales para uso directo si es necesario
export { BorderSettings } from './border-settings';

// Exportar acciones para uso directo
export * from './actions';
