'use client';

import { ContentIcon } from '@/components/icons/layers';
import type { LayerImplementation } from '../types';
import { ContentLayerComponent } from './content-layer-implementation';
import { ContentSettings } from './content-settings';

/**
 * 🎨 Implementación de la capa de contenido para entidades
 * Proporciona la funcionalidad básica para mostrar contenido en tarjetas
 */
export const contentLayerImplementation: LayerImplementation = {
  type: 'content',
  name: 'Contenido',
  description: 'Muestra el contenido principal de la entidad con diferentes layouts y opciones de personalización',
  category: 'core',
  compatibleEntityTypes: ['all'],
  render: ContentLayerComponent,
  defaultConfig: {
    enabled: true,
    layerIndex: 20,
    padding: 16,
    layout: 'standard',
    spacing: 12,
    alignment: 'center',
    columns: 2,
    maxHeight: undefined,
    accessibility: {
      ariaLabel: undefined,
      ariaDescription: undefined,
    }
  },
  icon: ContentIcon,
  Settings: ContentSettings,
  settings: {
    layout: {
      type: 'select',
      label: 'Disposición',
      description: 'Tipo de layout para organizar el contenido',
      options: [
        { label: 'Estándar', value: 'standard', description: 'Layout vertical simple' },
        { label: 'Grid', value: 'grid', description: 'Disposición en cuadrícula' },
        { label: 'Masonry', value: 'masonry', description: 'Columnas de altura variable' },
        { label: 'Carousel', value: 'carousel', description: 'Scroll horizontal' },
      ],
    },
    padding: {
      type: 'slider',
      label: 'Padding',
      description: 'Espaciado interno del contenido',
      min: 0,
      max: 24,
      step: 2,
      unit: 'px',
    },
    spacing: {
      type: 'slider',
      label: 'Espaciado',
      description: 'Espacio entre elementos',
      min: 0,
      max: 20,
      step: 1,
      unit: 'px',
    },
    alignment: {
      type: 'select',
      label: 'Alineación',
      description: 'Alineación del contenido',
      options: [
        { label: 'Izquierda', value: 'left', icon: 'alignLeft' },
        { label: 'Centro', value: 'center', icon: 'alignCenter' },
        { label: 'Derecha', value: 'right', icon: 'alignRight' },
      ],
    },
    columns: {
      type: 'number',
      label: 'Columnas',
      description: 'Número de columnas para grid y masonry',
      min: 1,
      max: 6,
      step: 1,
      showWhen: (config) => ['grid', 'masonry'].includes(config.layout),
    },
    maxHeight: {
      type: 'number',
      label: 'Altura Máxima',
      description: 'Altura máxima para carousel (en píxeles)',
      min: 100,
      max: 1000,
      step: 10,
      unit: 'px',
      showWhen: (config) => config.layout === 'carousel',
    },
    accessibility: {
      type: 'group',
      label: 'Accesibilidad',
      description: 'Opciones de accesibilidad',
      fields: {
        ariaLabel: {
          type: 'text',
          label: 'Etiqueta ARIA',
          description: 'Texto alternativo para lectores de pantalla',
        },
        ariaDescription: {
          type: 'textarea',
          label: 'Descripción ARIA',
          description: 'Descripción extendida del contenido',
        },
      },
    },
  },
  // Acciones del servidor (si son necesarias)
  serverActions: {},
  // Validación de configuración
  validateConfig: (config) => {
    const errors: string[] = [];

    if (config.columns && (config.columns < 1 || config.columns > 6)) {
      errors.push('El número de columnas debe estar entre 1 y 6');
    }

    if (config.maxHeight && (config.maxHeight < 100 || config.maxHeight > 1000)) {
      errors.push('La altura máxima debe estar entre 100 y 1000 píxeles');
    }

    return errors;
  },
};

// Exportar tipos y componentes
export type { ContentLayerConfig } from './content-layer-implementation';
export { ContentLayerComponent };
export default contentLayerImplementation;
