/**
 * 🎨 Módulo de diseño para Entity Cards
 * @module
 */

'use client';

// Exportar tipos
export * from './types';

// Exportar componentes principales
export * from './design-module';
export * from './design-panel';
export * from './design-preview';

// Exportar hooks
export * from './presets';
export * from './use-design-system';

// Exportar adaptadores
export * from './adapters';

// Exportar el hook por defecto para facilitar su uso
export { useDesignSystem } from './use-design-system';
