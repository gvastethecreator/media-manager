/**
 * @file Barrel exports for hooks
 * @module hooks
 */

// UI
export { useConfirm } from '@/components/ui/confirm-dialog';
export { useFeedback } from '@/components/ui/feedback-provider';
export { useToast } from '@/components/ui/toast';
export { useDebounce } from './use-debounce';
export { useDebouncedViewMode } from './use-debounced-view-mode';
// Otros hooks existentes
export { useFavorite } from './use-favorite';
export { useFocusManager, useKeyboardNavigation, useListNavigation } from './use-keyboard-navigation';
export { useIsMobile } from './use-mobile';
export { useMove } from './use-move';
export { useOpenInExplorer } from './use-open-in-explorer';
// Accesibilidad
export { useAnimationConfig, useReducedMotion, useTransitionStyles } from './use-reduced-motion';
export { useSeamlessNavigation } from './use-seamless-navigation';
export { useShare, useShareFile } from './use-share';
export { useHoverScale, useTilt3D } from './use-tilt-3d';
