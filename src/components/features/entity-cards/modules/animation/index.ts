// Exportar componentes principales
export { AnimationModule } from './animation-module';
export { AnimationPanel } from './animation-panel';

// Exportar hooks
export { useAnimationSystem } from './use-animation-system';

// Exportar tipos
export type { AnimationModuleProps, AnimationPanelProps, AnimationSystem, AnimationSystemPreset } from './types';

// Exportar adaptadores
export { animationSystemToLegacy, legacyToAnimationSystem } from './animation-adapter';

// Exportar constantes
export { DEFAULT_ANIMATION_SYSTEM } from './animation-module';

// Exportar utilidades de CSS
export { generateAnimationClasses, generateAnimationStyles, generateAnimationVariables } from './css-generator';

// Exportar estilos
export * from './animations.css';

// Nota: El archivo animations.css debe importarse en un archivo CSS principal o en el layout
