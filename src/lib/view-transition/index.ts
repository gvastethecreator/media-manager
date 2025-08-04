/**
 * @file Exportaciones principales de ViewTransition
 * @module lib/view-transition
 * @description Punto de entrada principal para todas las funcionalidades de ViewTransition
 */

// Componentes
export {
	ListTransition,
	ModalTransition,
	NavigationTransition,
	SharedTransition,
	useViewTransitionRef,
	ViewTransition,
	ViewTransitionGroup,
	type ViewTransitionGroupProps,
	type ViewTransitionProps,
	type ViewTransitionRef,
	withViewTransitionWrapper,
} from '@/components/transitions/ViewTransition';
// Hooks de navegación
// Re-exportar hooks específicos con nombres más simples
export {
	type NavigationTransitionOptions,
	useAllTransitions,
	useElementTransitions,
	useElementTransitions as useElements,
	useTransitionNavigation,
	useTransitionNavigation as useNavigation,
	useViewTransitions,
	useViewTransitions as useViews,
} from '@/hooks/use-transition-navigation';
// Utilidades
export {
	applyReducedMotionConfig,
	applyTransitionName,
	createTransitionName,
	createViewTransitionPolyfill,
	generateViewTransitionCSS,
	injectViewTransitionStyles,
	isViewTransitionSupported,
	removeTransitionName,
	shouldReduceMotion,
	withViewTransition,
} from '@/lib/view-transition/utils';
// Provider y contexto
export {
	useConditionalTransition,
	useSimpleTransition,
	useTransitionNavigation as useNavigationTransition,
	useViewTransition,
	useViewTransition as useTransition,
	ViewTransitionProvider,
} from '@/providers/ViewTransitionProvider';
// Tipos
export type {
	TransitionNavigationFunction,
	ViewTransitionConfig,
	ViewTransitionContextValue,
	ViewTransitionEasing,
	ViewTransitionHook,
	ViewTransitionOptions,
	ViewTransitionType,
} from '@/types/view-transition';
