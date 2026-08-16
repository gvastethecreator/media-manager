/**
 * @file Hook para navegación con ViewTransition
 * @module hooks/use-transition-navigation
 * @description Hook que integra ViewTransition con React Router para navegación suave
 */

import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useViewTransition } from '@/providers/ViewTransitionProvider';
import type { ViewTransitionOptions, ViewTransitionType } from '@/types/view-transition';

/**
 * Opciones para navegación con transición
 */
export interface NavigationTransitionOptions {
	/** Clase CSS personalizada para el elemento */
	className?: string;
	/** Duración personalizada */
	duration?: number;
	/** Función de easing personalizada */
	easing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
	/** Reemplazar en historial en lugar de push */
	replace?: boolean;
	/** Estado para pasar con la navegación */
	state?: any;
	/** Tipo de transición (por defecto: 'navigation') */
	type?: ViewTransitionType;
}

/**
 * Hook para navegación con ViewTransition
 */
export function useTransitionNavigation() {
	const navigate = useNavigate();
	const location = useLocation();
	const { transitionNavigation, isSupported } = useViewTransition();

	/**
	 * Navegar a una ruta con transición
	 */
	const navigateWithTransition = useCallback(
		async (to: string | number, options: NavigationTransitionOptions = {}) => {
			const {
				type = 'navigation',
				duration = 400,
				easing = 'ease-in-out',
				className,
				replace = false,
				state,
			} = options;

			// Configurar transición
			const transitionOptions: ViewTransitionOptions = {
				duration,
				easing,
				className: className || `vt-name-${type}`,
				type,
			};

			// Ejecutar navegación dentro de ViewTransition
			await transitionNavigation(() => {
				if (typeof to === 'number') {
					navigate(to);
				} else {
					navigate(to, { replace, state });
				}
			}, transitionOptions);
		},
		[navigate, transitionNavigation]
	);

	/**
	 * Navegar hacia atrás con transición
	 */
	const goBackWithTransition = useCallback(
		async (options: Omit<NavigationTransitionOptions, 'replace' | 'state'> = {}) => {
			await navigateWithTransition(-1, { ...options, type: 'back' });
		},
		[navigateWithTransition]
	);

	/**
	 * Navegar hacia adelante con transición
	 */
	const goForwardWithTransition = useCallback(
		async (options: Omit<NavigationTransitionOptions, 'replace' | 'state'> = {}) => {
			await navigateWithTransition(1, { ...options, type: 'forward' });
		},
		[navigateWithTransition]
	);

	/**
	 * Reemplazar ruta actual con transición
	 */
	const replaceWithTransition = useCallback(
		async (to: string, options: Omit<NavigationTransitionOptions, 'replace'> = {}) => {
			await navigateWithTransition(to, { ...options, replace: true });
		},
		[navigateWithTransition]
	);

	return {
		// Funciones principales
		navigateWithTransition,
		goBackWithTransition,
		goForwardWithTransition,
		replaceWithTransition,

		// Información de estado
		isSupported,
		currentLocation: location,

		// Navegación normal (fallback)
		navigate,
	};
}

/**
 * Hook para transiciones específicas de vistas
 */
export function useViewTransitions() {
	const { navigateWithTransition } = useTransitionNavigation();

	/**
	 * Transición para abrir modal
	 */
	const openModal = useCallback(
		async (modalRoute: string, options: Omit<NavigationTransitionOptions, 'type'> = {}) => {
			await navigateWithTransition(modalRoute, { ...options, type: 'modal' });
		},
		[navigateWithTransition]
	);

	/**
	 * Transición para abrir drawer/sidebar
	 */
	const openDrawer = useCallback(
		async (drawerRoute: string, options: Omit<NavigationTransitionOptions, 'type'> = {}) => {
			await navigateWithTransition(drawerRoute, { ...options, type: 'drawer' });
		},
		[navigateWithTransition]
	);

	/**
	 * Transición estándar de navegación
	 */
	const navigateToView = useCallback(
		async (viewRoute: string, options: Omit<NavigationTransitionOptions, 'type'> = {}) => {
			await navigateWithTransition(viewRoute, { ...options, type: 'navigation' });
		},
		[navigateWithTransition]
	);

	return {
		openModal,
		openDrawer,
		navigateToView,
	};
}

/**
 * Hook para transiciones de elementos dentro de la misma vista
 */
export function useElementTransitions() {
	const { startTransition } = useViewTransition();

	/**
	 * Transición para cambio de estado de elemento
	 */
	const transitionElementState = useCallback(
		async (updateFunction: () => void, options: { duration?: number; className?: string } = {}) => {
			const { duration = 250, className } = options;

			await startTransition(updateFunction, {
				duration,
				className,
			});
		},
		[startTransition]
	);

	/**
	 * Transición para reordenamiento de lista
	 */
	const transitionListReorder = useCallback(
		async (reorderFunction: () => void) => {
			await startTransition(reorderFunction, {
				duration: 300,
				className: 'vt-name-list',
			});
		},
		[startTransition]
	);

	/**
	 * Transición para cambio de selección
	 */
	const transitionSelection = useCallback(
		async (selectionFunction: () => void) => {
			await startTransition(selectionFunction, {
				duration: 150,
				className: 'vt-name-selection',
			});
		},
		[startTransition]
	);

	return {
		transitionElementState,
		transitionListReorder,
		transitionSelection,
	};
}

/**
 * Hook combinado que incluye todas las funcionalidades
 */
export function useAllTransitions() {
	const navigation = useTransitionNavigation();
	const views = useViewTransitions();
	const elements = useElementTransitions();

	return {
		navigation,
		views,
		elements,
	};
}
