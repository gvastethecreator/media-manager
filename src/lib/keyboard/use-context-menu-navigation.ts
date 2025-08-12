/**
 * @file Context Menu Keyboard Navigation Hook
 * @description Hook para navegación por teclado en menús contextuales
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useContextMenuShortcuts } from './use-keyboard-shortcuts';

export interface ContextMenuNavigationOptions {
	/** Si está habilitada la navegación */
	enabled?: boolean;
	/** Callback cuando se ejecuta una acción */
	onExecute?: (index: number) => void;
	/** Callback cuando se cierra el menú */
	onClose?: () => void;
	/** Callback cuando se navega a un item */
	onNavigate?: (index: number) => void;
}

export interface ContextMenuNavigationReturn {
	/** Índice del item actualmente seleccionado */
	selectedIndex: number;
	/** Establecer el índice seleccionado */
	setSelectedIndex: (index: number) => void;
	/** Navegar hacia arriba */
	navigateUp: () => void;
	/** Navegar hacia abajo */
	navigateDown: () => void;
	/** Ejecutar acción del item seleccionado */
	executeSelected: () => void;
	/** Cerrar menú */
	closeMenu: () => void;
	/** Props para aplicar a los items del menú */
	getItemProps: (index: number) => {
		'data-selected': boolean;
		onMouseEnter: () => void;
		onClick: () => void;
	};
}

/**
 * Hook para navegación por teclado en menús contextuales
 */
export const useContextMenuNavigation = (
	itemCount: number,
	options: ContextMenuNavigationOptions = {}
): ContextMenuNavigationReturn => {
	const { enabled = true, onExecute, onClose, onNavigate } = options;

	const [selectedIndex, setSelectedIndex] = useState(0);
	const { register, setContext } = useContextMenuShortcuts();

	// Ref para evitar stale closures
	const selectedIndexRef = useRef(selectedIndex);
	selectedIndexRef.current = selectedIndex;

	// Navegación hacia arriba
	const navigateUp = useCallback(() => {
		const newIndex = selectedIndexRef.current > 0 ? selectedIndexRef.current - 1 : itemCount - 1;
		setSelectedIndex(newIndex);
		onNavigate?.(newIndex);
	}, [itemCount, onNavigate]);

	// Navegación hacia abajo
	const navigateDown = useCallback(() => {
		const newIndex = selectedIndexRef.current < itemCount - 1 ? selectedIndexRef.current + 1 : 0;
		setSelectedIndex(newIndex);
		onNavigate?.(newIndex);
	}, [itemCount, onNavigate]);

	// Ejecutar acción seleccionada
	const executeSelected = useCallback(() => {
		onExecute?.(selectedIndexRef.current);
	}, [onExecute]);

	// Cerrar menú
	const closeMenu = useCallback(() => {
		onClose?.();
	}, [onClose]);

	// Configurar shortcuts cuando el menú está habilitado
	useEffect(() => {
		if (!enabled) {
			return;
		}

		setContext('context-menu');

		// Registrar handlers para navegación
		register(
			{
				key: 'arrowup',
				modifiers: [],
				context: 'context-menu',
				description: 'Navegar arriba',
				action: 'context-menu-up',
			},
			navigateUp
		);

		register(
			{
				key: 'arrowdown',
				modifiers: [],
				context: 'context-menu',
				description: 'Navegar abajo',
				action: 'context-menu-down',
			},
			navigateDown
		);

		register(
			{
				key: 'enter',
				modifiers: [],
				context: 'context-menu',
				description: 'Ejecutar acción',
				action: 'context-menu-execute',
			},
			executeSelected
		);

		register(
			{
				key: 'escape',
				modifiers: [],
				context: 'context-menu',
				description: 'Cerrar menú',
				action: 'context-menu-close',
			},
			closeMenu
		);
	}, [enabled, register, setContext, navigateUp, navigateDown, executeSelected, closeMenu]);

	// Resetear índice cuando cambia el número de items
	useEffect(() => {
		if (selectedIndex >= itemCount) {
			setSelectedIndex(Math.max(0, itemCount - 1));
		}
	}, [itemCount, selectedIndex]);

	// Función para obtener props de los items
	const getItemProps = useCallback(
		(index: number) => ({
			'data-selected': index === selectedIndex,
			onMouseEnter: () => setSelectedIndex(index),
			onClick: () => onExecute?.(index),
		}),
		[selectedIndex, onExecute]
	);

	return {
		selectedIndex,
		setSelectedIndex,
		navigateUp,
		navigateDown,
		executeSelected,
		closeMenu,
		getItemProps,
	};
};
