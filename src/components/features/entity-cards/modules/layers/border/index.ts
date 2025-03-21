'use client';

/**
 * 🔲 Módulo de capa de borde para tarjetas de entidades
 *
 * Este módulo proporciona efectos de borde personalizables para las tarjetas.
 */

import type { LayerImplementation } from '../types';

/**
 * 🔲 Implementación de la capa de borde
 */
export const borderImplementation: LayerImplementation = {
  type: 'border',
  name: 'Borde',
  description: 'Añade un borde personalizable a la tarjeta',
  defaultConfig: {
    enabled: true,
    layerIndex: 2,
    width: 2,
    color: '#000000',
    style: 'solid',
    opacity: 1,
    radius: 8,
  },
  render: () => null, // Stub implementation
  settings: () => null, // Stub implementation
  icon: 'square',
};

// Exportar el implementation por defecto
export default borderImplementation;