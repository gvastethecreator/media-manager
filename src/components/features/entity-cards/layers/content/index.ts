'use client';

import type { LayerImplementation } from '../types';
import { ContentLayerComponent } from './content-layer-implementation';

/**
 * Implementación de la capa de contenido para entidades
 * Proporciona la funcionalidad básica para mostrar contenido en tarjetas
 */
export const contentLayerImplementation: LayerImplementation = {
  type: 'content',
  name: 'Contenido',
  description: 'Muestra el contenido principal de la entidad',
  render: (props) => ContentLayerComponent(props),
  defaultConfig: {
    enabled: true,
    layerIndex: 20,
    padding: 16,
    layout: 'standard',
    spacing: 12,
    alignment: 'center',
  },
  settings: {
    layout: {
      type: 'select',
      label: 'Disposición',
      options: [
        { label: 'Estándar', value: 'standard' },
        { label: 'Grid', value: 'grid' },
        { label: 'Masonry', value: 'masonry' },
        { label: 'Carousel', value: 'carousel' },
      ],
    },
    padding: {
      type: 'slider',
      label: 'Padding',
      min: 0,
      max: 24,
      step: 2,
    },
    spacing: {
      type: 'slider',
      label: 'Espaciado',
      min: 0,
      max: 20,
      step: 1,
    },
    alignment: {
      type: 'select',
      label: 'Alineación',
      options: [
        { label: 'Izquierda', value: 'left' },
        { label: 'Centro', value: 'center' },
        { label: 'Derecha', value: 'right' },
      ],
    },
  },
};

export * from './content-layer-implementation';
