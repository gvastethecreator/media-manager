// Exportar componentes principales
export { AnimationModule, DEFAULT_ANIMATION_SYSTEM } from './animation-module';
export { AnimationPanel } from './animation-panel';
export { useAnimationSystem } from './use-animation-system';

// Exportar tipos
export type {
	AnimationSystem,
	AnimationSystemPreset,
	AnimationPanelProps,
	AnimationModuleProps,
	AnimationClassesGenerator,
	UseAnimationSystemHook,
} from './types';

// Nota: El archivo animations.css debe importarse en un archivo CSS principal o en el layout
