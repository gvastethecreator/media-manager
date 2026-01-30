/**
 * @file Exportaciones de hooks de transiciones
 * @module hooks/transitions
 * @description Hooks React para el sistema de transiciones avanzadas
 */

// Hooks FLIP
export { useFlip, useFlipGroup } from './use-flip';

// Hooks Morphing
export { useMorph, useMorphLoop } from './use-morph';

// Hooks Enter/Exit
export { useEnterExit, useEnterExitGroup } from './use-enter-exit';

// Re-exportar tipos
export type {
  FlipOptions,
  MorphConfig,
  EnterConfig,
  ExitConfig,
  EnterExitConfig,
  TransitionDirection,
  TransitionGroupConfig,
} from '@/lib/transitions/types';
