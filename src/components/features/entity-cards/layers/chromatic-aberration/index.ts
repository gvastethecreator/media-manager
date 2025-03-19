'use client';

/**
 * 🌈 Implementación de capa de aberración cromática
 *
 * Este archivo proporciona exportaciones para el sistema de capas.
 * La implementación principal ahora se encuentra en index.tsx.
 */

// Exportar la implementación principal desde el archivo index.tsx
export { chromaticAberrationLayerImplementation, chromaticAberrationLayerImplementation as default } from './index.tsx';

// Exportar componentes individuales para uso directo si es necesario
export { default as ChromaticAberrationEffectLayer } from './chromatic-aberration-effect-layer';
export { ChromaticAberrationSettings } from './chromatic-aberration-settings';

// Exportar configuración y tipos
export type { ChromaticAberrationConfig } from './chromatic-aberration-effect-layer';

// Exportar acciones para uso directo
export * from './actions';
