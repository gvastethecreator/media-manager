'use client';

/**
 * 🎨 Módulo de filtros
 *
 * Este módulo proporciona una capa de filtros visuales para las tarjetas de entidad.
 * Incluye efectos básicos, resplandor, sombra y distorsión.
 */

export { FilterLayer } from './components/filter-layer';
export { FilterSettings } from './components/filter-settings';
export { filterImplementation as default } from './filter-implementation';
export type { FilterConfig, FilterType } from './filter-schema';

// Exportar componentes individuales para uso directo
export { BaseFilter } from './base-filter';
export { DistortionFilter } from './distortion-filter';
export { FilterEffectLayer } from './filter-effect-layer';
export { GlowFilter } from './glow-filter';
export { ShadowFilter } from './shadow-filter';

// Exportar utilidades de presets
export { applyFilterPreset, filterPresets, getAvailablePresets } from './filter-presets';
export type { FilterPreset } from './filter-presets';

// Exportar acciones y tipos relacionados
export { deleteFilterConfig, getFilterConfig, updateFilterConfig } from './actions/filter-config.action';
export type { FilterConfig } from './actions/filter-config.action';
