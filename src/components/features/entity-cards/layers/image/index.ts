'use client';

import type { LayerImplementation } from '../types';
import { ImageLayerComponent } from './image-layer-implementation';

/**
 * Implementación de la capa de imagen para entidades
 * Proporciona la funcionalidad básica para mostrar imágenes en tarjetas
 */
export const imageLayerImplementation: LayerImplementation = {
  type: 'image',
  name: 'Imagen',
  description: 'Muestra la imagen principal de la entidad',
  component: ImageLayerComponent,
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
  },
  settings: {
    objectFit: {
      type: 'select',
      label: 'Ajuste de imagen',
      options: [
        { label: 'Cubrir', value: 'cover' },
        { label: 'Contener', value: 'contain' },
        { label: 'Llenar', value: 'fill' },
        { label: 'Ninguno', value: 'none' },
      ],
    },
    aspectRatio: {
      type: 'select',
      label: 'Relación de aspecto',
      options: [
        { label: '1:1 (Cuadrado)', value: '1/1' },
        { label: '4:3 (Clásico)', value: '4/3' },
        { label: '3:4 (Retrato)', value: '3/4' },
        { label: '16:9 (Panorámico)', value: '16/9' },
        { label: 'Auto (Original)', value: 'auto' },
      ],
    },
    borderRadius: {
      type: 'select',
      label: 'Bordes redondeados',
      options: [
        { label: 'Ninguno', value: 'none' },
        { label: 'Pequeño', value: 'sm' },
        { label: 'Medio', value: 'md' },
        { label: 'Grande', value: 'lg' },
        { label: 'Completo', value: 'full' },
      ],
    },
    blur: {
      type: 'slider',
      label: 'Desenfoque',
      min: 0,
      max: 10,
      step: 1,
    },
    grayscale: {
      type: 'slider',
      label: 'Escala de grises',
      min: 0,
      max: 100,
      step: 10,
    },
    brightness: {
      type: 'slider',
      label: 'Brillo',
      min: 50,
      max: 150,
      step: 5,
    },
    contrast: {
      type: 'slider',
      label: 'Contraste',
      min: 50,
      max: 150,
      step: 5,
    },
    saturate: {
      type: 'slider',
      label: 'Saturación',
      min: 0,
      max: 200,
      step: 10,
    },
  },
};

export * from './image-layer-implementation';
