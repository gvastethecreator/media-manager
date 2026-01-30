/**
 * @file useKeyboardNavigation Hook
 * @module hooks/use-keyboard-navigation
 * @description Utilidades para navegación por teclado
 * A11y: WCAG 2.1 - Keyboard Accessible
 */

import { useCallback, useEffect, useRef } from 'react';

interface KeyboardShortcut {
	/** Tecla o combinación (ej: 'Escape', 'Control+k', 'ArrowDown') */
	key: string;
	/** Callback cuando se activa */
	action: () => void;
	/** Prevenir default del navegador */
	preventDefault?: boolean;
	/** Solo activar cuando el elemento está enfocado */
	onlyWhenFocused?: boolean;
	/** Elemento target (default: document) */
	target?: HTMLElement | Window | null;
}

/**
 * Hook para registrar atajos de teclado globales
 *
 * @example
 * useKeyboardNavigation([
 *   { key: 'Escape', action: closeModal },
 *   { key: 'Control+k', action: openSearch, preventDefault: true },
 *   { key: 'ArrowDown', action: nextItem, onlyWhenFocused: true },
 * ]);
 */
export function useKeyboardNavigation(shortcuts: KeyboardShortcut[]) {
	const shortcutsRef = useRef(shortcuts);
	shortcutsRef.current = shortcuts;

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const keyCombo = [e.ctrlKey && 'Control', e.metaKey && 'Meta', e.altKey && 'Alt', e.shiftKey && 'Shift', e.key]
				.filter(Boolean)
				.join('+');

			const simpleKey = e.key;

			for (const shortcut of shortcutsRef.current) {
				const matchesKey = shortcut.key === keyCombo || shortcut.key === simpleKey;

				if (!matchesKey) continue;

				// Verificar si solo debe activarse cuando está enfocado
				if (shortcut.onlyWhenFocused) {
					const target = shortcut.target;
					if (target instanceof HTMLElement) {
						if (document.activeElement !== target && !target.contains(document.activeElement)) {
							continue;
						}
					}
				}

				if (shortcut.preventDefault) {
					e.preventDefault();
				}

				shortcut.action();
				break;
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, []);
}

/**
 * Hook para navegación con flechas en listas
 *
 * @example
 * const { focusedIndex, handleKeyDown } = useListNavigation({
 *   itemCount: items.length,
 *   onSelect: (index) => selectItem(index)
 * });
 */
export function useListNavigation({
	itemCount,
	onSelect,
	onFocus,
	loop = true,
	enabled = true,
}: {
	itemCount: number;
	onSelect?: (index: number) => void;
	onFocus?: (index: number) => void;
	loop?: boolean;
	enabled?: boolean;
}) {
	const [focusedIndex, setFocusedIndex] = useState(-1);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (!enabled || itemCount === 0) return;

			switch (e.key) {
				case 'ArrowDown':
					e.preventDefault();
					setFocusedIndex((prev) => {
						const next = prev + 1;
						if (next >= itemCount) {
							return loop ? 0 : prev;
						}
						return next;
					});
					break;

				case 'ArrowUp':
					e.preventDefault();
					setFocusedIndex((prev) => {
						const next = prev - 1;
						if (next < 0) {
							return loop ? itemCount - 1 : prev;
						}
						return next;
					});
					break;

				case 'Home':
					e.preventDefault();
					setFocusedIndex(0);
					break;

				case 'End':
					e.preventDefault();
					setFocusedIndex(itemCount - 1);
					break;

				case 'Enter':
				case ' ':
					if (focusedIndex >= 0) {
						e.preventDefault();
						onSelect?.(focusedIndex);
					}
					break;
			}
		},
		[itemCount, loop, enabled, focusedIndex, onSelect]
	);

	useEffect(() => {
		if (focusedIndex >= 0) {
			onFocus?.(focusedIndex);
		}
	}, [focusedIndex, onFocus]);

	return {
		focusedIndex,
		setFocusedIndex,
		handleKeyDown,
		isFocused: (index: number) => index === focusedIndex,
	};
}

/**
 * Hook para focus management
 */
export function useFocusManager() {
	const containerRef = useRef<HTMLElement>(null);

	const focusFirst = useCallback(() => {
		const container = containerRef.current;
		if (!container) return;

		const focusable = container.querySelector(
			'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
		) as HTMLElement;
		focusable?.focus();
	}, []);

	const focusLast = useCallback(() => {
		const container = containerRef.current;
		if (!container) return;

		const focusable = container.querySelectorAll(
			'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
		);
		const last = focusable[focusable.length - 1] as HTMLElement;
		last?.focus();
	}, []);

	const focusNext = useCallback(() => {
		const container = containerRef.current;
		if (!container) return;

		const focusable = Array.from(
			container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
		) as HTMLElement[];

		const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);
		const next = focusable[currentIndex + 1];
		next?.focus();
	}, []);

	const focusPrevious = useCallback(() => {
		const container = containerRef.current;
		if (!container) return;

		const focusable = Array.from(
			container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
		) as HTMLElement[];

		const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);
		const prev = focusable[currentIndex - 1];
		prev?.focus();
	}, []);

	return {
		containerRef,
		focusFirst,
		focusLast,
		focusNext,
		focusPrevious,
	};
}

// Importar useState ya que se usa en useListNavigation
import { useState } from 'react';

export default useKeyboardNavigation;
