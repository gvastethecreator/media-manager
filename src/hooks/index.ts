/**
 * @file Barrel exports for hooks
 * @module hooks
 */

// Accesibilidad
export { useReducedMotion, useAnimationConfig, useTransitionStyles } from './use-reduced-motion';
export { useKeyboardNavigation, useListNavigation, useFocusManager } from './use-keyboard-navigation';
export { useUndo } from './use-undo';

// UI
export { useConfirm } from '@/components/ui/confirm-dialog';
export { useFeedback } from '@/components/ui/feedback-provider';
export { useToast } from '@/components/ui/toast';

// Otros hooks existentes
export { useSeamlessNavigation } from './use-seamless-navigation';
export { useIsMobile } from './use-mobile';
export { useDebounce } from './use-debounce';
export { useDebouncedViewMode } from './use-debounced-view-mode';
