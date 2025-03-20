'use client';

/**
 * 🌈 Implementación de capa de distorsión
 *
 * Este archivo proporciona exportaciones para el sistema de capas.
 * La implementación principal ahora se encuentra en distortion-layer-implementation.tsx.
 */

// Exportar la implementación principal
export { distortionLayerImplementation as default, distortionLayerImplementation } from './distortion-layer-implementation';

// Exportar componentes individuales para uso directo
export * from './distortion-effects-module';
export * from './distortion-effects-panel';
export * from './types';
export * from './use-distortion-effects';

export { useDistortionStore } from './actions/distortion-config.action';
export { DistortionConfig } from './components/distortion-config';
export { DistortionLayer } from './components/distortion-layer';

