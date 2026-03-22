/**
 * @file Componente wrapper para ViewTransition
 * @module components/transitions/ViewTransition
 * @description Componente que envuelve elementos para aplicar ViewTransition
 */

import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { clientLogger } from '@/lib/logger/client-logger';
import { cn } from '@/lib/utils';
import { useViewTransition } from '@/providers/ViewTransitionProvider';

/**
 * Props para el componente ViewTransition
 */
export interface ViewTransitionProps {
	/** Elemento HTML a renderizar */
	as?: keyof React.JSX.IntrinsicElements;
	/** Si debe aplicar el nombre automáticamente */
	autoName?: boolean;
	/** Contenido a animar */
	children: React.ReactNode;
	/** Clase CSS adicional */
	className?: string;
	/** Configuración específica para esta transición */
	config?: {
		duration?: number;
		easing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
	};
	/** Nombre único para transiciones compartidas */
	name?: string;
	/** Callback cuando la transición termina */
	onTransitionEnd?: () => void;
	/** Callback cuando la transición comienza */
	onTransitionStart?: () => void;
	/** Tipo de transición */
	type?: 'navigation' | 'modal' | 'drawer' | 'list' | 'shared';
	/** Props adicionales para el elemento */
	[key: string]: any;
}

/**
 * Ref para controlar ViewTransition imperatively
 */
export interface ViewTransitionRef {
	/** Elemento DOM */
	element: HTMLElement | null;
	/** Ejecutar transición manual */
	transition: (callback: () => void) => Promise<void>;
}

/**
 * Componente ViewTransition
 */
export const ViewTransition = forwardRef<ViewTransitionRef, ViewTransitionProps>(
	(
		{
			children,
			name,
			type = 'shared',
			config = {},
			className,
			as: Component = 'div',
			onTransitionStart,
			onTransitionEnd,
			autoName = true,
			...props
		},
		ref
	) => {
		const elementRef = useRef<HTMLElement>(null);
		const { startTransition, isSupported } = useViewTransition();

		// Generar nombre automático si no se proporciona
		const transitionName = name || (autoName ? `vt-${type}-${Math.random().toString(36).substr(2, 9)}` : undefined);

		// Aplicar nombre de transición al elemento
		useEffect(() => {
			if (elementRef.current && transitionName && isSupported) {
				elementRef.current.style.viewTransitionName = transitionName;

				return () => {
					if (elementRef.current) {
						elementRef.current.style.viewTransitionName = '';
					}
				};
			}
		}, [transitionName, isSupported]);

		// Exponer API imperativa
		useImperativeHandle(
			ref,
			() => ({
				transition: async (callback: () => void) => {
					onTransitionStart?.();
					try {
						await startTransition(callback, {
							...config,
							className: transitionName ? `vt-name-${transitionName}` : undefined,
						});
						onTransitionEnd?.();
					} catch (error) {
						clientLogger.warn('ViewTransition failed:', error);
						callback(); // Ejecutar callback como fallback
						onTransitionEnd?.();
					}
				},
				element: elementRef.current,
			}),
			[startTransition, config, transitionName, onTransitionStart, onTransitionEnd]
		);

		return React.createElement(
			Component,
			{
				ref: elementRef,
				className: cn('view-transition-element', transitionName && `vt-name-${type}`, className),
				...props,
			},
			children
		);
	}
);

ViewTransition.displayName = 'ViewTransition';

/**
 * Componente específico para navegación
 */
export function NavigationTransition({ children, className, ...props }: Omit<ViewTransitionProps, 'type'>) {
	return (
		<ViewTransition className={cn('vt-name-navigation', className)} type="navigation" {...props}>
			{children}
		</ViewTransition>
	);
}

/**
 * Componente específico para modales
 */
export function ModalTransition({ children, className, ...props }: Omit<ViewTransitionProps, 'type'>) {
	return (
		<ViewTransition className={cn('vt-name-modal', className)} type="modal" {...props}>
			{children}
		</ViewTransition>
	);
}

/**
 * Componente específico para listas
 */
export function ListTransition({ children, className, ...props }: Omit<ViewTransitionProps, 'type'>) {
	return (
		<ViewTransition className={cn('vt-name-list', className)} type="list" {...props}>
			{children}
		</ViewTransition>
	);
}

/**
 * Componente específico para elementos compartidos
 */
export function SharedTransition({
	children,
	name,
	className,
	...props
}: Omit<ViewTransitionProps, 'type'> & { name: string }) {
	return (
		<ViewTransition className={cn('vt-name-shared', className)} name={name} type="shared" {...props}>
			{children}
		</ViewTransition>
	);
}

/**
 * HOC para agregar ViewTransition a cualquier componente
 */
export function withViewTransitionWrapper<P extends object>(
	WrappedComponent: React.ComponentType<P>,
	transitionProps?: Partial<ViewTransitionProps>
) {
	return function ViewTransitionWrappedComponent(props: P) {
		return (
			<ViewTransition {...transitionProps}>
				<WrappedComponent {...props} />
			</ViewTransition>
		);
	};
}

/**
 * Hook para crear referencias de ViewTransition
 */
export function useViewTransitionRef() {
	return useRef<ViewTransitionRef>(null);
}

/**
 * Componente para transiciones de grupo (múltiples elementos)
 */
export interface ViewTransitionGroupProps {
	as?: keyof React.JSX.IntrinsicElements;
	children: React.ReactNode;
	className?: string;
	name: string;
}

export function ViewTransitionGroup({
	children,
	name,
	className,
	as: Component = 'div',
	...props
}: ViewTransitionGroupProps) {
	const ref = useRef<HTMLElement>(null);
	const { isSupported } = useViewTransition();

	useEffect(() => {
		if (ref.current && name && isSupported) {
			ref.current.style.viewTransitionName = name;

			return () => {
				if (ref.current) {
					ref.current.style.viewTransitionName = '';
				}
			};
		}
	}, [name, isSupported]);

	return React.createElement(
		Component,
		{
			ref,
			className: cn('view-transition-group', className),
			...props,
		},
		children
	);
}
