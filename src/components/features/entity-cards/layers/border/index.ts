'use client';

/**
 * 🔲 Implementación de capa de borde
 *
 * Este archivo proporciona exportaciones para el sistema de capas.
 * La implementación principal ahora se encuentra en border-layer-implementation.tsx.
 */

// Exportar la implementación principal desde el archivo border-layer-implementation.tsx
export { borderLayerImplementation, borderLayerImplementation as default } from './border-layer-implementation';

// Exportar componentes individuales para uso directo si es necesario
export { BorderEffectLayer } from './border-effect-layer';
export { BorderSettings } from './border-settings';

// Exportar configuración y tipos
export type { BorderConfig } from './border-effect-layer';

// Exportar acciones para uso directo
export * from './actions';
