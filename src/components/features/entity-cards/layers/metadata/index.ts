'use client';

import type { LayerImplementation } from '../types';
import { MetadataLayerComponent } from './metadata-layer-implementation';

/**
 * Implementación de la capa de metadatos para entidades
 * Proporciona la funcionalidad para mostrar metadatos en tarjetas
 */
export const metadataLayerImplementation: LayerImplementation = {
  type: 'metadata',
  name: 'Metadatos',
  description: 'Muestra metadatos relevantes de la entidad',
  component: MetadataLayerComponent,
  defaultConfig: {
    enabled: true,
    layerIndex: 30,
    showRarity: true,
    showType: true,
    showLevel: true,
    showClass: true,
    showAlignment: true,
    showRace: true,
    showCustomFields: true,
    fontSize: 'sm',
    position: 'bottom',
    layout: 'grid',
    opacity: 90,
  },
  settings: {
    showRarity: {
      type: 'toggle',
      label: 'Mostrar rareza',
    },
    showType: {
      type: 'toggle',
      label: 'Mostrar tipo',
    },
    showLevel: {
      type: 'toggle',
      label: 'Mostrar nivel',
    },
    showClass: {
      type: 'toggle',
      label: 'Mostrar clase',
    },
    showAlignment: {
      type: 'toggle',
      label: 'Mostrar alineamiento',
    },
    showRace: {
      type: 'toggle',
      label: 'Mostrar raza',
    },
    showCustomFields: {
      type: 'toggle',
      label: 'Mostrar campos personalizados',
    },
    fontSize: {
      type: 'select',
      label: 'Tamaño de texto',
      options: [
        { label: 'Pequeño', value: 'xs' },
        { label: 'Normal', value: 'sm' },
        { label: 'Mediano', value: 'base' },
        { label: 'Grande', value: 'lg' },
      ],
    },
    position: {
      type: 'select',
      label: 'Posición',
      options: [
        { label: 'Superior', value: 'top' },
        { label: 'Inferior', value: 'bottom' },
        { label: 'Izquierda', value: 'left' },
        { label: 'Derecha', value: 'right' },
      ],
    },
    layout: {
      type: 'select',
      label: 'Disposición',
      options: [
        { label: 'Grid', value: 'grid' },
        { label: 'Lista', value: 'list' },
        { label: 'Inline', value: 'inline' },
      ],
    },
    opacity: {
      type: 'slider',
      label: 'Opacidad',
      min: 20,
      max: 100,
      step: 5,
    },
  },
};

export * from './metadata-layer-implementation';
