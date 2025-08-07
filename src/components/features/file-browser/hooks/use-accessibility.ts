/**
 * @file Hook para gestión de accesibilidad en el navegador de archivos
 * @module hooks/use-accessibility
 * @description Proporciona funcionalidades de accesibilidad mejoradas
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSettings } from '@/hooks/use-settings';
import type { AccessibilityConfig } from '@/transformers/settings/schema';

interface UseAccessibilityOptions {
	/** Elemento contenedor para el foco */
	containerRef?: React.RefObject<HTMLElement>;
	/** Callback cuando se anuncia algo al lector de pantalla */
	onAnnouncement?: (message: string) => void;
}

interface AccessibilityState {
	/** Configuración de accesibilidad actual */
	config: AccessibilityConfig;
	/** Si el modo de alto contraste está activo */
	isHighContrast: boolean;
	/** Si las animaciones están reducidas */
	isReducedMotion: boolean;
	/** Si la navegación por teclado está habilitada */
	isKeyboardNavigation: boolean;
}

interface AccessibilityActions {
	/** Anuncia un mensaje al lector de pantalla */
	announce: (message: string, priority?: 'polite' | 'assertive') => void;
	/** Enfoca un elemento específico */
	focusElement: (selector: string) => void;
	/** Enfoca el primer elemento seleccionable */
	focusFirst: () => void;
	/** Enfoca el último elemento seleccionable */
	focusLast: () => void;
	/** Maneja la navegación por teclado */
	handleKeyNavigation: (event: KeyboardEvent) => boolean;
	/** Actualiza la configuración de accesibilidad */
	updateConfig: (updates: Partial<AccessibilityConfig>) => Promise<void>;
}

export function useAccessibility(options: UseAccessibilityOptions = {}) {
	const { containerRef, onAnnouncement } = options;
	const { settings, updateSettings } = useSettings();
	const [announcements, setAnnouncements] = useState<string[]>([]);
	const announcementRef = useRef<HTMLDivElement>(null);

	// Configuración de accesibilidad actual
	const config = settings?.fileBrowser?.accessibility || {
		keyboardNavigation: true,
		screenReaderAnnouncements: true,
		highContrast: false,
		reduceMotion: false,
		largeFonts: false,
		focus: {
			showIndicators: true,
			indicatorColor: '#3b82f6',
			indicatorWidth: 2,
		},
	};

	// Estado de accesibilidad
	const state: AccessibilityState = {
		config,
		isHighContrast: config.highContrast,
		isReducedMotion: config.reduceMotion,
		isKeyboardNavigation: config.keyboardNavigation,
	};

	// Función para anunciar mensajes al lector de pantalla
	const announce = useCallback(
		(message: string, priority: 'polite' | 'assertive' = 'polite') => {
			if (!config.screenReaderAnnouncements) return;

			// Agregar el anuncio a la lista
			setAnnouncements((prev) => [...prev, message]);

			// Crear elemento de anuncio temporal
			const announcement = document.createElement('div');
			announcement.setAttribute('aria-live', priority);
			announcement.setAttribute('aria-atomic', 'true');
			announcement.className = 'sr-only';
			announcement.textContent = message;

			document.body.appendChild(announcement);

			// Remover después de un tiempo
			setTimeout(() => {
				if (document.body.contains(announcement)) {
					document.body.removeChild(announcement);
				}
				setAnnouncements((prev) => prev.filter((a) => a !== message));
			}, 1000);

			// Callback opcional
			onAnnouncement?.(message);
		},
		[config.screenReaderAnnouncements, onAnnouncement]
	);

	// Función para enfocar un elemento específico
	const focusElement = useCallback(
		(selector: string) => {
			if (!config.keyboardNavigation) return;

			const container = containerRef?.current || document;
			const element = container.querySelector(selector) as HTMLElement;

			if (element && typeof element.focus === 'function') {
				element.focus();
				announce(`Enfocado: ${element.getAttribute('aria-label') || element.textContent || 'elemento'}`);
			}
		},
		[config.keyboardNavigation, containerRef, announce]
	);

	// Función para enfocar el primer elemento seleccionable
	const focusFirst = useCallback(() => {
		const selectors = [
			'[data-item-id]:first-child',
			'.entity-card:first-child',
			'button:first-child',
			'[tabindex="0"]:first-child',
		];

		for (const selector of selectors) {
			const container = containerRef?.current || document;
			const element = container.querySelector(selector) as HTMLElement;
			if (element) {
				element.focus();
				announce('Primer elemento enfocado');
				return;
			}
		}
	}, [containerRef, announce]);

	// Función para enfocar el último elemento seleccionable
	const focusLast = useCallback(() => {
		const selectors = [
			'[data-item-id]:last-child',
			'.entity-card:last-child',
			'button:last-child',
			'[tabindex="0"]:last-child',
		];

		for (const selector of selectors) {
			const container = containerRef?.current || document;
			const element = container.querySelector(selector) as HTMLElement;
			if (element) {
				element.focus();
				announce('Último elemento enfocado');
				return;
			}
		}
	}, [containerRef, announce]);

	// Función para manejar navegación por teclado
	const handleKeyNavigation = useCallback(
		(event: KeyboardEvent): boolean => {
			if (!config.keyboardNavigation) return false;

			const { key, ctrlKey, shiftKey, altKey } = event;
			const container = containerRef?.current;

			if (!container) return false;

			// Navegación con flechas
			if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
				event.preventDefault();

				const focusedElement = document.activeElement as HTMLElement;
				const items = Array.from(container.querySelectorAll('[data-item-id]')) as HTMLElement[];
				const currentIndex = items.indexOf(focusedElement.closest('[data-item-id]') as HTMLElement);

				let nextIndex = currentIndex;

				switch (key) {
					case 'ArrowUp':
						nextIndex = Math.max(0, currentIndex - 1);
						break;
					case 'ArrowDown':
						nextIndex = Math.min(items.length - 1, currentIndex + 1);
						break;
					case 'ArrowLeft':
						nextIndex = Math.max(0, currentIndex - 1);
						break;
					case 'ArrowRight':
						nextIndex = Math.min(items.length - 1, currentIndex + 1);
						break;
				}

				if (nextIndex !== currentIndex && items[nextIndex]) {
					items[nextIndex].focus();
					announce(`Elemento ${nextIndex + 1} de ${items.length}`);
				}

				return true;
			}

			// Atajos de teclado
			if (key === 'Home' && ctrlKey) {
				event.preventDefault();
				focusFirst();
				return true;
			}

			if (key === 'End' && ctrlKey) {
				event.preventDefault();
				focusLast();
				return true;
			}

			return false;
		},
		[config.keyboardNavigation, containerRef, announce, focusFirst, focusLast]
	);

	// Función para actualizar configuración
	const updateConfig = useCallback(
		async (updates: Partial<AccessibilityConfig>) => {
			await updateSettings({
				fileBrowser: {
					...settings?.fileBrowser,
					accessibility: {
						...config,
						...updates,
					},
				},
			});
		},
		[updateSettings, settings?.fileBrowser, config]
	);

	// Aplicar estilos de accesibilidad
	useEffect(() => {
		const root = document.documentElement;

		// Alto contraste
		if (config.highContrast) {
			root.classList.add('high-contrast');
		} else {
			root.classList.remove('high-contrast');
		}

		// Movimiento reducido
		if (config.reduceMotion) {
			root.classList.add('reduce-motion');
		} else {
			root.classList.remove('reduce-motion');
		}

		// Fuentes grandes
		if (config.largeFonts) {
			root.classList.add('large-fonts');
		} else {
			root.classList.remove('large-fonts');
		}

		// Indicadores de foco
		if (config.focus.showIndicators) {
			root.style.setProperty('--focus-indicator-color', config.focus.indicatorColor);
			root.style.setProperty('--focus-indicator-width', `${config.focus.indicatorWidth}px`);
		}
	}, [config]);

	// Configurar listener de teclado
	useEffect(() => {
		if (!(config.keyboardNavigation && containerRef?.current)) return;

		const container = containerRef.current;

		const handleKeyDown = (event: KeyboardEvent) => {
			handleKeyNavigation(event);
		};

		container.addEventListener('keydown', handleKeyDown);

		return () => {
			container.removeEventListener('keydown', handleKeyDown);
		};
	}, [config.keyboardNavigation, containerRef, handleKeyNavigation]);

	const actions: AccessibilityActions = {
		announce,
		focusElement,
		focusFirst,
		focusLast,
		handleKeyNavigation,
		updateConfig,
	};

	return {
		...state,
		...actions,
		announcements,
	};
}

export type { AccessibilityState, AccessibilityActions, UseAccessibilityOptions };
