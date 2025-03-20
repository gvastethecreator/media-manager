'use client';

import type { LayerImplementation } from '../types';
import { ImageLayerComponent } from './image-layer-implementation';

/**
 * 🎨 Implementación de la capa de imagen para entidades
 * Proporciona la funcionalidad básica para mostrar imágenes en tarjetas
 */
export const imageLayerImplementation: LayerImplementation = {
  type: 'image',
  name: 'Imagen',
  description: 'Muestra la imagen principal de la entidad con efectos y optimizaciones',
  category: 'core',
  compatibleEntityTypes: ['all'],
  render: ImageLayerComponent,
  defaultConfig: {
    enabled: true,
    layerIndex: 10,
    objectFit: 'cover',
    aspectRatio: '3/4',
    borderRadius: 'md',
    blur: 0,
    grayscale: 0,
    brightness: 100,
    contrast: 100,
    saturate: 100,
    loading: 'lazy',
    placeholder: 'shimmer',
    accessibility: {
      alt: undefined,
      description: undefined,
    }
  },
  settings: {
    objectFit: {
      type: 'select',
      label: 'Ajuste de imagen',
      description: 'Cómo se ajustará la imagen al contenedor',
      options: [
        { label: 'Cubrir', value: 'cover', description: 'Cubre todo el espacio' },
        { label: 'Contener', value: 'contain', description: 'Mantiene proporciones' },
        { label: 'Llenar', value: 'fill', description: 'Estira para llenar' },
        { label: 'Ninguno', value: 'none', description: 'Sin ajuste' },
      ],
    },
    aspectRatio: {
      type: 'select',
      label: 'Relación de aspecto',
      description: 'Proporción entre ancho y alto',
      options: [
        { label: '1:1 (Cuadrado)', value: '1/1', description: 'Igual ancho y alto' },
        { label: '4:3 (Clásico)', value: '4/3', description: 'Formato clásico' },
        { label: '3:4 (Retrato)', value: '3/4', description: 'Formato vertical' },
        { label: '16:9 (Panorámico)', value: '16/9', description: 'Formato panorámico' },
        { label: 'Auto (Original)', value: 'auto', description: 'Mantiene proporción original' },
      ],
    },
    borderRadius: {
      type: 'select',
      label: 'Bordes redondeados',
      description: 'Radio de las esquinas',
      options: [
        { label: 'Ninguno', value: 'none', icon: 'square' },
        { label: 'Pequeño', value: 'sm', icon: 'roundedSm' },
        { label: 'Medio', value: 'md', icon: 'roundedMd' },
        { label: 'Grande', value: 'lg', icon: 'roundedLg' },
        { label: 'Completo', value: 'full', icon: 'circle' },
      ],
    },
    blur: {
      type: 'slider',
      label: 'Desenfoque',
      description: 'Nivel de desenfoque de la imagen',
      min: 0,
      max: 10,
      step: 1,
      unit: 'px',
    },
    grayscale: {
      type: 'slider',
      label: 'Escala de grises',
      description: 'Nivel de conversión a escala de grises',
      min: 0,
      max: 100,
      step: 10,
      unit: '%',
    },
    brightness: {
      type: 'slider',
      label: 'Brillo',
      description: 'Ajuste de brillo de la imagen',
      min: 50,
      max: 150,
      step: 5,
      unit: '%',
    },
    contrast: {
      type: 'slider',
      label: 'Contraste',
      description: 'Ajuste de contraste de la imagen',
      min: 50,
      max: 150,
      step: 5,
      unit: '%',
    },
    saturate: {
      type: 'slider',
      label: 'Saturación',
      description: 'Nivel de saturación de color',
      min: 0,
      max: 200,
      step: 10,
      unit: '%',
    },
    loading: {
      type: 'select',
      label: 'Estrategia de carga',
      description: 'Cómo se cargará la imagen',
      options: [
        { label: 'Lazy', value: 'lazy', description: 'Carga cuando es visible' },
        { label: 'Eager', value: 'eager', description: 'Carga inmediata' },
      ],
    },
    placeholder: {
      type: 'select',
      label: 'Placeholder',
      description: 'Qué mostrar mientras carga la imagen',
      options: [
        { label: 'Shimmer', value: 'shimmer', description: 'Efecto de carga brillante' },
        { label: 'Blur', value: 'blur', description: 'Versión borrosa' },
        { label: 'Empty', value: 'empty', description: 'Espacio vacío' },
      ],
    },
    accessibility: {
      type: 'group',
      label: 'Accesibilidad',
      description: 'Opciones para mejorar la accesibilidad',
      fields: {
        alt: {
          type: 'text',
          label: 'Texto alternativo',
          description: 'Descripción corta para lectores de pantalla',
        },
        description: {
          type: 'textarea',
          label: 'Descripción larga',
          description: 'Descripción detallada de la imagen',
        },
      },
    },
  },
  // Validación de configuración
  validateConfig: (config) => {
    const errors: string[] = [];

    if (config.blur < 0 || config.blur > 10) {
      errors.push('El desenfoque debe estar entre 0 y 10');
    }

    if (config.grayscale < 0 || config.grayscale > 100) {
      errors.push('La escala de grises debe estar entre 0 y 100');
    }

    if (config.brightness < 50 || config.brightness > 150) {
      errors.push('El brillo debe estar entre 50 y 150');
    }

    if (config.contrast < 50 || config.contrast > 150) {
      errors.push('El contraste debe estar entre 50 y 150');
    }

    if (config.saturate < 0 || config.saturate > 200) {
      errors.push('La saturación debe estar entre 0 y 200');
    }

    return errors;
  },
};

// Exportar tipos y componentes
export * from './image-layer-implementation';
