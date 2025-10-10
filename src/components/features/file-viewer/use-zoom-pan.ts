import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * 🔍 HOOK: useZoomPan
 *
 * Gestiona zoom y paneo (pan) de la imagen
 */
export function useZoomPan(isOpen: boolean, resetView: () => void) {
	const [scale, setScale] = useState(1);
	const [position, setPosition] = useState({ x: 0, y: 0 });
	const imageContainerRef = useRef<HTMLFieldSetElement>(null);

	// Reset state when opening viewer
	useEffect(() => {
		if (isOpen) {
			resetView();
		}
	}, [isOpen, resetView]);

	// Resetear posición y escala cuando cambia la imagen seleccionada
	useEffect(() => {
		resetView();
	}, [resetView]);

	// Manejar zoom con la rueda
	const handleWheel = useCallback(
		(e: React.WheelEvent) => {
			e.preventDefault();
			const zoomFactor = 0.1;
			const newScale = Math.min(Math.max(0.1, scale * (1 - Math.sign(e.deltaY) * zoomFactor)), 8);
			setScale(newScale);
		},
		[scale]
	);

	// Función memoizada para cambiar el zoom
	const handleZoom = useCallback((factor: number) => {
		setScale((prevScale) => {
			const newScale = Math.min(Math.max(0.1, prevScale + factor), 8);
			return newScale;
		});
	}, []);

	// Funciones memoizadas para los botones de la barra de herramientas
	const handleZoomIn = useCallback(() => handleZoom(0.2), [handleZoom]);
	const handleZoomOut = useCallback(() => handleZoom(-0.2), [handleZoom]);

	// Función para drag (paneo)
	const onMainDrag = useCallback((_e: any, info: { delta: { x: number; y: number } }) => {
		setPosition((prev) => {
			const next = { x: prev.x + info.delta.x, y: prev.y + info.delta.y };
			const container = imageContainerRef.current?.getBoundingClientRect();
			if (container) {
				const maxX = container.width / 2;
				const maxY = container.height / 2;
				next.x = Math.max(-maxX, Math.min(maxX, next.x));
				next.y = Math.max(-maxY, Math.min(maxY, next.y));
			}
			return next;
		});
	}, []);

	const resetViewImpl = useCallback(() => {
		setScale(1);
		setPosition({ x: 0, y: 0 });
	}, []);

	return {
		scale,
		position,
		imageContainerRef,
		handleWheel,
		handleZoom,
		handleZoomIn,
		handleZoomOut,
		onMainDrag,
		resetView: resetViewImpl,
	};
}
