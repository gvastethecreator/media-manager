/**
 * @file Componente TransitionGroup
 * @module components/transitions/TransitionGroup
 * @description Grupo de elementos con transiciones coordinadas de entrada/salida
 */

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { EnterConfig, ExitConfig } from '@/lib/transitions';
import { getEnterExitCoordinator } from '@/lib/transitions';
import { cn } from '@/lib/utils';

// ============================================================================
// Contexto para elementos hijos
// ============================================================================

interface TransitionGroupContextValue {
	groupId: string;
	registerElement: (id: string, index: number) => (element: HTMLElement | null) => void;
	unregisterElement: (id: string) => void;
	isAnimating: boolean;
}

const TransitionGroupContext = React.createContext<TransitionGroupContextValue | null>(null);

export function useTransitionGroup(): TransitionGroupContextValue | null {
	return React.useContext(TransitionGroupContext);
}

// ============================================================================
// Props
// ============================================================================

interface TransitionGroupProps {
	/** ID del grupo (opcional, se genera automáticamente) */
	id?: string;
	/** Elementos hijos */
	children: React.ReactNode;
	/** Clases CSS */
	className?: string;
	/** Si está visible */
	isVisible?: boolean;
	/** Configuración de entrada */
	enterConfig?: EnterConfig;
	/** Configuración de salida */
	exitConfig?: ExitConfig;
	/** Delay de stagger entre elementos (ms) */
	staggerDelay?: number;
	/** Delay máximo de stagger */
	maxStaggerDelay?: number;
	/** Dirección del stagger */
	staggerDirection?: 'forward' | 'reverse' | 'random';
	/** Si debe animar en mount */
	animateOnMount?: boolean;
	/** Callbacks */
	onEnterStart?: () => void;
	onEnterComplete?: () => void;
	onExitStart?: () => void;
	onExitComplete?: () => void;
}

// ============================================================================
// Componente Principal
// ============================================================================

/**
 * Grupo de elementos con transiciones coordinadas
 *
 * @example
 * ```tsx
 * <TransitionGroup
 *   isVisible={showItems}
 *   staggerDelay={50}
 *   enterConfig={{ type: 'slide', direction: 'bottom' }}
 * >
 *   <TransitionItem>
 *     <div>Item 1</div>
 *   </TransitionItem>
 *   <TransitionItem>
 *     <div>Item 2</div>
 *   </TransitionItem>
 * </TransitionGroup>
 * ```
 */
export const TransitionGroup = React.memo(function TransitionGroup({
	id: propId,
	children,
	className,
	isVisible = true,
	enterConfig,
	exitConfig,
	staggerDelay = 50,
	maxStaggerDelay = 500,
	staggerDirection = 'forward',
	animateOnMount = false,
	onEnterStart,
	onEnterComplete,
	onExitStart,
	onExitComplete,
}: TransitionGroupProps) {
	const generatedId = useId();
	const groupId = propId || `transition-group-${generatedId}`;
	const coordinator = useRef(getEnterExitCoordinator());
	const [isAnimating, setIsAnimating] = useState(false);
	const [internalVisible, setInternalVisible] = useState(isVisible);
	const registeredElements = useRef<Map<string, { index: number; element: HTMLElement }>>(new Map());
	const isFirstRender = useRef(true);
	const performEnterRef = useRef<(() => Promise<void>) | null>(null);
	const performExitRef = useRef<(() => Promise<void>) | null>(null);

	// Registrar grupo
	useEffect(() => {
		coordinator.current.registerGroup({
			id: groupId,
			staggerDelay,
			maxStaggerDelay,
			staggerDirection,
		});

		return () => {
			coordinator.current.unregisterGroup(groupId);
		};
	}, [groupId, staggerDelay, maxStaggerDelay, staggerDirection]);

	// Animar cambios de visibilidad
	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false;
			if (animateOnMount && isVisible) {
				performEnterRef.current?.();
			}
			return;
		}

		if (isVisible && !internalVisible) {
			performEnterRef.current?.();
		} else if (!isVisible && internalVisible) {
			performExitRef.current?.();
		}
	}, [isVisible, animateOnMount, internalVisible]);

	const performEnter = useCallback(async () => {
		setIsAnimating(true);
		onEnterStart?.();

		const elements = Array.from(registeredElements.current.entries())
			.filter(([, data]) => data.element)
			.map(([id, data]) => ({
				id,
				element: data.element,
				index: data.index,
				group: groupId,
			}));

		await coordinator.current.coordinateEnter(elements, enterConfig);

		setInternalVisible(true);
		setIsAnimating(false);
		onEnterComplete?.();
	}, [groupId, enterConfig, onEnterStart, onEnterComplete]);

	const performExit = useCallback(async () => {
		setIsAnimating(true);
		onExitStart?.();

		const elements = Array.from(registeredElements.current.entries())
			.filter(([, data]) => data.element)
			.map(([id, data]) => ({
				id,
				element: data.element,
				index: data.index,
				group: groupId,
			}));

		await coordinator.current.coordinateExit(elements, exitConfig);

		setInternalVisible(false);
		setIsAnimating(false);
		onExitComplete?.();
	}, [groupId, exitConfig, onExitStart, onExitComplete]);

	// Actualizar refs cuando las funciones cambian
	useEffect(() => {
		performEnterRef.current = performEnter;
		performExitRef.current = performExit;
	}, [performEnter, performExit]);

	const registerElement = useCallback((id: string, index: number) => {
		return (element: HTMLElement | null) => {
			if (element) {
				registeredElements.current.set(id, { index, element });
			} else {
				registeredElements.current.delete(id);
			}
		};
	}, []);

	const unregisterElement = useCallback((id: string) => {
		registeredElements.current.delete(id);
	}, []);

	const contextValue: TransitionGroupContextValue = {
		groupId,
		registerElement,
		unregisterElement,
		isAnimating,
	};

	return (
		<TransitionGroupContext.Provider value={contextValue}>
			<div
				className={cn('transition-group', isAnimating && 'transition-group-animating', className)}
				data-group-id={groupId}
				data-visible={internalVisible}
			>
				{children}
			</div>
		</TransitionGroupContext.Provider>
	);
});

// ============================================================================
// Componente TransitionItem
// ============================================================================

interface TransitionItemProps {
	children: React.ReactNode;
	/** ID del elemento (opcional) */
	id?: string;
	/** Índice para orden de animación */
	index?: number;
}

/**
 * Elemento individual dentro de un TransitionGroup
 */
export const TransitionItem = React.memo(function TransitionItem({
	children,
	id: propId,
	index: propIndex,
}: TransitionItemProps) {
	const generatedId = useId();
	const id = propId || `transition-item-${generatedId}`;
	const context = useTransitionGroup();
	const itemRef = useRef<HTMLElement>(null);
	const indexRef = useRef(propIndex ?? 0);

	// Actualizar índice si cambia
	useEffect(() => {
		if (propIndex !== undefined) {
			indexRef.current = propIndex;
		}
	}, [propIndex]);

	// Registrar en el grupo
	useEffect(() => {
		if (!context) {
			console.warn('TransitionItem debe usarse dentro de TransitionGroup');
			return;
		}

		const registerFn = context.registerElement(id, indexRef.current);
		const element = itemRef.current;
		if (element) {
			registerFn(element);
		}

		return () => {
			context.unregisterElement(id);
		};
	}, [id, context]);

	// Clonar hijo con ref - solo si es un elemento válido de React
	if (!React.isValidElement(children)) {
		return <>{children}</>;
	}

	const child = children as React.ReactElement & { ref?: React.Ref<HTMLElement> };

	return React.cloneElement(child, {
		ref: (node: HTMLElement | null) => {
			itemRef.current = node;
			// Preservar ref original del hijo si existe
			const originalRef = child.ref;
			if (typeof originalRef === 'function') {
				originalRef(node);
			} else if (originalRef && 'current' in originalRef) {
				(originalRef as React.MutableRefObject<HTMLElement | null>).current = node;
			}
		},
		'data-transition-item': id,
	} as unknown as React.Attributes);
});

// ============================================================================
// Componente AnimatePresence (similar a Framer Motion)
// ============================================================================

interface AnimatePresenceProps {
	children: React.ReactNode;
	/** Si el elemento está presente */
	present: boolean;
	/** Configuración de entrada */
	enter?: EnterConfig;
	/** Configuración de salida */
	exit?: ExitConfig;
	/** Clases CSS */
	className?: string;
}

/**
 * Componente para animar la presencia/ausencia de elementos
 */
export function AnimatePresence({
	children,
	present,
	enter = { type: 'slide', direction: 'bottom' },
	exit = { type: 'slide', direction: 'top' },
	className,
}: AnimatePresenceProps) {
	const [shouldRender, setShouldRender] = useState(present);
	const [isExiting, setIsExiting] = useState(false);
	const elementRef = useRef<HTMLDivElement>(null);
	const coordinator = useRef(getEnterExitCoordinator());

	useEffect(() => {
		if (present && !shouldRender) {
			// Entrando
			setShouldRender(true);
			setIsExiting(false);

			requestAnimationFrame(() => {
				if (elementRef.current) {
					coordinator.current.coordinateEnter(
						[
							{
								id: 'animate-presence',
								element: elementRef.current,
								index: 0,
							},
						],
						enter
					);
				}
			});
		} else if (!present && shouldRender) {
			// Saliendo
			setIsExiting(true);

			if (elementRef.current) {
				coordinator.current
					.coordinateExit(
						[
							{
								id: 'animate-presence',
								element: elementRef.current,
								index: 0,
							},
						],
						exit
					)
					.then(() => {
						setShouldRender(false);
					});
			}
		}
	}, [present, shouldRender, enter, exit]);

	if (!shouldRender) return null;

	return (
		<div className={cn('animate-presence', isExiting && 'animate-presence-exiting', className)} ref={elementRef}>
			{children}
		</div>
	);
}
