// Exportar componentes
export { AnimationPanel } from './animation-panel';
export { AnimationModule } from './animation-module';

// Exportar hooks
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

// Exportar adaptadores para compatibilidad con el sistema antiguo
export { legacyToAnimationSystem, animationSystemToLegacy } from './animation-adapter';

// Exportar estilos
export * from './animations.css';

// Nota: El archivo animations.css debe importarse en un archivo CSS principal o en el layout
