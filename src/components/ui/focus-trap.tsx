/**
 * @file FocusTrap Component
 * @module components/ui/focus-trap
 * @description Componente para capturar el foco dentro de un modal/dialog
 * A11y: WCAG 2.4.3 - Focus Order, WCAG 2.4.7 - Focus Visible
 */

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface FocusTrapProps {
	/** Si el trap está activo */
	active?: boolean;
	/** Contenido a encapsular */
	children: React.ReactNode;
	/** Clases adicionales */
	className?: string;
	/** Elemento a enfocar inicialmente (auto = primer elemento focusable) */
	initialFocus?: 'auto' | 'first' | 'last' | string;
	/** Callback cuando se presiona Escape */
	onEscape?: () => void;
	/** Restaurar foco al desactivar */
	restoreFocus?: boolean;
}

const FOCUSABLE_SELECTORS = [
	'button:not([disabled])',
	'[href]',
	'input:not([disabled])',
	'select:not([disabled])',
	'textarea:not([disabled])',
	'[tabindex]:not([tabindex="-1"])',
	'[contenteditable="true"]',
	'audio[controls]',
	'video[controls]',
	'details summary',
].join(', ');

export function FocusTrap({
	children,
	active = true,
	onEscape,
	initialFocus = 'auto',
	restoreFocus = true,
	className,
}: FocusTrapProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const previousFocusRef = useRef<HTMLElement | null>(null);

	// Guardar el elemento enfocado anteriormente
	useEffect(() => {
		if (active && restoreFocus) {
			previousFocusRef.current = document.activeElement as HTMLElement;
		}

		return () => {
			if (restoreFocus && previousFocusRef.current) {
				// Pequeño delay para asegurar que el modal se cerró
				setTimeout(() => {
					previousFocusRef.current?.focus();
				}, 0);
			}
		};
	}, [active, restoreFocus]);

	// Manejar foco inicial
	useEffect(() => {
		if (!(active && containerRef.current)) return;

		const container = containerRef.current;
		let targetElement: HTMLElement | null = null;

		switch (initialFocus) {
			case 'first':
				targetElement = container.querySelector(FOCUSABLE_SELECTORS);
				break;
			case 'last': {
				const elements = Array.from(container.querySelectorAll(FOCUSABLE_SELECTORS)) as HTMLElement[];
				targetElement = elements[elements.length - 1] || null;
				break;
			}
			case 'auto':
				// Buscar elemento con data-autofocus o el primero
				targetElement = container.querySelector('[data-autofocus]') || container.querySelector(FOCUSABLE_SELECTORS);
				break;
			default:
				// Asume que es un selector
				targetElement = container.querySelector(initialFocus);
		}

		// Delay para asegurar que el modal está visible
		const timer = setTimeout(() => {
			targetElement?.focus();
		}, 50);

		return () => clearTimeout(timer);
	}, [active, initialFocus]);

	// Manejar ciclo de tab y escape
	useEffect(() => {
		if (!active) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (!containerRef.current) return;

			// Manejar Escape
			if (e.key === 'Escape' && onEscape) {
				e.preventDefault();
				onEscape();
				return;
			}

			// Manejar Tab para ciclo de foco
			if (e.key !== 'Tab') return;

			const focusableElements = Array.from(containerRef.current.querySelectorAll(FOCUSABLE_SELECTORS)) as HTMLElement[];

			if (focusableElements.length === 0) return;

			const firstElement = focusableElements[0];
			const lastElement = focusableElements[focusableElements.length - 1];
			const activeElement = document.activeElement;

			// Shift + Tab en primer elemento -> va al último
			if (e.shiftKey) {
				if (activeElement === firstElement || !containerRef.current.contains(activeElement)) {
					e.preventDefault();
					lastElement?.focus();
				}
			} else {
				// Tab en último elemento -> va al primero
				if (activeElement === lastElement) {
					e.preventDefault();
					firstElement?.focus();
				}
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [active, onEscape]);

	return (
		<div
			className={cn('outline-none', className)}
			onClick={(e) => {
				// Prevenir que clicks fuera de elementos focusables rompan el trap
				e.stopPropagation();
			}}
			ref={containerRef}
			tabIndex={-1}
		>
			{children}
		</div>
	);
}

export default FocusTrap;
