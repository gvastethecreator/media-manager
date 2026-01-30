/**
 * @file Hook para manejar el menú contextual personalizado
 * @module hooks/use-custom-context-menu
 */

import { useCallback, useEffect, useState } from 'react';

interface ContextMenuState {
	isOpen: boolean;
	position: { x: number; y: number };
}

export const useCustomContextMenu = () => {
	const [state, setState] = useState<ContextMenuState>({
		isOpen: false,
		position: { x: 0, y: 0 },
	});

	const openMenu = useCallback((x: number, y: number) => {
		setState({
			isOpen: true,
			position: { x, y },
		});
	}, []);

	const closeMenu = useCallback(() => {
		setState((prev) => ({
			...prev,
			isOpen: false,
		}));
	}, []);

	const handleContextMenu = useCallback(
		(event: React.MouseEvent) => {
			event.preventDefault();
			event.stopPropagation();

			const { clientX, clientY } = event;
			openMenu(clientX, clientY);
		},
		[openMenu]
	);

	// Cerrar con Escape
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape' && state.isOpen) {
				closeMenu();
			}
		};

		if (state.isOpen) {
			document.addEventListener('keydown', handleKeyDown);
			return () => document.removeEventListener('keydown', handleKeyDown);
		}
	}, [state.isOpen, closeMenu]);

	// Cerrar al hacer scroll
	useEffect(() => {
		const handleScroll = () => {
			if (state.isOpen) {
				closeMenu();
			}
		};

		if (state.isOpen) {
			document.addEventListener('scroll', handleScroll, true);
			return () => document.removeEventListener('scroll', handleScroll, true);
		}
	}, [state.isOpen, closeMenu]);

	return {
		isOpen: state.isOpen,
		position: state.position,
		openMenu,
		closeMenu,
		handleContextMenu,
	};
};
