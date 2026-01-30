/**
 * @file Exportaciones de componentes de transiciones
 * @module components/transitions
 * @description Componentes React para transiciones fluidas
 */

// Contenedores FLIP
export { FlipContainer } from './FlipContainer';

// Grupos de transición
export { 
  TransitionGroup, 
  TransitionItem, 
  AnimatePresence,
  useTransitionGroup 
} from './TransitionGroup';

// Morphing
export { MorphContainer, MorphPath, LiquidContainer } from './MorphContainer';

// Re-exportar tipos
export type {
  FlipOptions,
  MorphConfig,
  EnterConfig,
  ExitConfig,
  TransitionDirection,
} from '@/lib/transitions';
