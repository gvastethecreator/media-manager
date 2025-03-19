'use client';

/**
 * 🌈 Implementación de capa de filtros
 *
 * Este archivo proporciona exportaciones para el sistema de capas.
 * La implementación principal ahora se encuentra en filter-layer-implementation.tsx.
 */

// Exportar la implementación principal
export { filterLayerImplementation as default, filterLayerImplementation } from './filter-layer-implementation';

// Exportar componentes individuales para uso directo
export { BaseFilter } from './base-filter';
export { DistortionFilter } from './distortion-filter';
export { FilterEffectLayer } from './filter-effect-layer';
export { FilterSettings } from './filter-settings';
export { GlowFilter } from './glow-filter';
export { ShadowFilter } from './shadow-filter';

// Exportar utilidades de presets
export { applyFilterPreset, filterPresets, getAvailablePresets } from './filter-presets';
export type { FilterPreset } from './filter-presets';

// Exportar acciones y tipos relacionados
export { deleteFilterConfig, getFilterConfig, updateFilterConfig } from './actions/filter-config.action';
export type { FilterConfig } from './actions/filter-config.action';

