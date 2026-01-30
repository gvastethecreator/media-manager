import type React from 'react';
import { useEffect, useRef } from 'react';

/**
 * 🎯 HOOK: useFocusManagement
 *
 * Gestiona el foco del teclado y focus trap en el dialog
 */
export function useFocusManagement(
	isOpen: boolean,
	closeButtonRef: React.RefObject<HTMLButtonElement | null>,
	dialogRef: React.RefObject<HTMLDialogElement | null>,
	triggerRef?: React.RefObject<HTMLElement>
) {
	const previouslyFocusedElement = useRef<HTMLElement | null>(null);

	// Focus management - store and restore focus
	useEffect(() => {
		if (isOpen) {
			// Store the currently focused element
			previouslyFocusedElement.current = document.activeElement as HTMLElement;

			// Focus the close button when opening
			setTimeout(() => {
				closeButtonRef.current?.focus();
			}, 50);
		} else if (previouslyFocusedElement.current || triggerRef?.current) {
			// When closing, restore focus to the element that was focused before opening
			// or to the trigger element if provided
			const elementToFocus = triggerRef?.current || previouslyFocusedElement.current;

			// Short delay to ensure DOM is ready
			setTimeout(() => {
				elementToFocus?.focus();
			}, 50);
		}
	}, [isOpen, closeButtonRef, triggerRef]);

	// Focus trap básico dentro del dialog
	useEffect(() => {
		if (!isOpen) return;
		const dialogEl = dialogRef.current;
		if (!dialogEl) return;
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key !== 'Tab') return;
			const focusableNodeList = dialogEl.querySelectorAll<HTMLElement>(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
			);
			const focusable = Array.from(focusableNodeList);
			if (focusable.length === 0) return;
			const first = focusable[0];
			const last = focusable.at(-1) as HTMLElement;
			const active = document.activeElement as HTMLElement | null;
			if (!active) return;
			if (e.shiftKey && active === first) {
				e.preventDefault();
				last.focus();
			} else if (!e.shiftKey && active === last) {
				e.preventDefault();
				first.focus();
			}
		};
		dialogEl.addEventListener('keydown', handleKeyDown);
		return () => dialogEl.removeEventListener('keydown', handleKeyDown);
	}, [isOpen, dialogRef]);

	return { previouslyFocusedElement };
}
