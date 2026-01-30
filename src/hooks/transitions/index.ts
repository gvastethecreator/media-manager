/**
 * @file Exportaciones de hooks de transiciones
 * @module hooks/transitions
 * @description Hooks React para el sistema de transiciones avanzadas
 */

// Re-exportar tipos
export type {
	EnterConfig,
	EnterExitConfig,
	ExitConfig,
	FlipOptions,
	MorphConfig,
	TransitionDirection,
	TransitionGroupConfig,
} from '@/lib/transitions/types';
// Hooks Enter/Exit
export { useEnterExit, useEnterExitGroup } from './use-enter-exit';
// Hooks de tarjetas de entidades
export {
	useEntityCardGroupTransition,
	useEntityCardTransition,
} from './use-entity-card-transition';
// Hooks FLIP
export { useFlip, useFlipGroup } from './use-flip';
// Hooks Morphing
export { useMorph, useMorphLoop } from './use-morph';
