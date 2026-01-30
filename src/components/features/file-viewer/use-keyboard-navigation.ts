import { useCallback, useEffect, useState } from 'react';
import type { ImageItem } from './file-viewer.types';

/**
 * ⌨️ HOOK: useKeyboardNavigation
 *
 * Gestiona navegación por teclado y anuncios de accesibilidad
 */
export function useKeyboardNavigation(
	isOpen: boolean,
	images: ImageItem[],
	currentIndex: number,
	onClose: () => void,
	nextItem: () => void,
	previousItem: () => void,
	resetView: () => void,
	handleZoom: (factor: number) => void
) {
	const [announceMessage, setAnnounceMessage] = useState('');

	// Anunciar cambio de imagen
	const announce = useCallback(
		(index: number) => {
			const item = images[index];
			if (item) {
				setAnnounceMessage(`Imagen ${index + 1} de ${images.length}: ${item.name}`);
			}
		},
		[images]
	);

	// Handlers
	const onEscape = useCallback(() => onClose(), [onClose]);
	const onArrowLeft = useCallback(() => {
		previousItem();
		announce(Math.max(0, currentIndex - 1));
	}, [previousItem, announce, currentIndex]);
	const onArrowRight = useCallback(() => {
		nextItem();
		announce(Math.min(images.length - 1, currentIndex + 1));
	}, [nextItem, announce, images.length, currentIndex]);
	const onReset = useCallback(() => {
		resetView();
		setAnnounceMessage('Vista restablecida');
	}, [resetView]);
	const onZoomInKey = useCallback(() => {
		handleZoom(0.2);
		setAnnounceMessage('Zoom aumentado');
	}, [handleZoom]);
	const onZoomOutKey = useCallback(() => {
		handleZoom(-0.2);
		setAnnounceMessage('Zoom reducido');
	}, [handleZoom]);

	// Mantener un único manejador en window para evitar duplicados en fieldset
	useEffect(() => {
		if (!isOpen) return;
		const keyMap: Record<string, () => void> = {
			Escape: onEscape,
			ArrowLeft: onArrowLeft,
			ArrowRight: onArrowRight,
			r: onReset,
			'+': onZoomInKey,
			'-': onZoomOutKey,
			'0': onReset,
		};
		const handleKeyDown = (e: KeyboardEvent) => {
			const fn = keyMap[e.key];
			if (fn) {
				e.preventDefault();
				fn();
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [isOpen, onEscape, onArrowLeft, onArrowRight, onReset, onZoomInKey, onZoomOutKey]);

	return { announceMessage };
}
