/**
 * 🪄 Módulo de Efectos Avanzados
 *
 * Este módulo proporciona componentes y hooks para añadir y configurar
 * efectos visuales avanzados en las tarjetas de entidad.
 */

// Exportar componente principal
export { AdvancedEffectsPanel } from './advanced-effects-panel';

// Exportar hook
export { useAdvancedEffects } from './hooks/use-advanced-effects';

// Exportar tipos
export type { AdvancedEffectsOptions, AdvancedEffectsProps } from './types';
export { DEFAULT_ADVANCED_EFFECTS } from './types';

// Exportar componentes de sección
export {
  ScanEffectsSection,
  TextureEffectsSection,
  BorderEffectsSection,
  HolographicEffectsSection,
  DistortionEffectsSection
} from './components/sections';