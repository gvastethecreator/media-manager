import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * 🔍 HOOK: useZoomPan
 *
 * Gestiona zoom y paneo (pan) de la imagen
 */
export function useZoomPan(isOpen: boolean) {
	const [scale, setScale] = useState(1);
	const [position, setPosition] = useState({ x: 0, y: 0 });
	const imageContainerRef = useRef<HTMLDivElement>(null);
	const isDraggingRef = useRef(false);
	const startPosRef = useRef({ x: 0, y: 0 });

	// Resetear estado cuando se abre el visor
	const resetView = useCallback(() => {
		setScale(1);
		setPosition({ x: 0, y: 0 });
	}, []);

	// Reset cuando se abre
	useEffect(() => {
		if (isOpen) {
			resetView();
		}
	}, [isOpen, resetView]);

	// Manejar zoom con la rueda - usando WheelEvent nativo
	const handleWheel = useCallback((e: WheelEvent) => {
		e.preventDefault();
		e.stopPropagation();
		const zoomFactor = 0.1;
		setScale((prevScale) => {
			const delta = e.deltaY > 0 ? -zoomFactor : zoomFactor;
			return Math.min(Math.max(0.1, prevScale + prevScale * delta), 8);
		});
	}, []);

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

	// Manejar drag con click central o izquierdo
	const handleMouseDown = useCallback((e: React.MouseEvent) => {
		// Click izquierdo (0) o central (1)
		if (e.button === 0 || e.button === 1) {
			e.preventDefault();
			isDraggingRef.current = true;
			startPosRef.current = { x: e.clientX, y: e.clientY };
		}
	}, []);

	const handleMouseMove = useCallback((e: React.MouseEvent) => {
		if (!isDraggingRef.current) return;
		e.preventDefault();
		const dx = e.clientX - startPosRef.current.x;
		const dy = e.clientY - startPosRef.current.y;
		setPosition((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
		startPosRef.current = { x: e.clientX, y: e.clientY };
	}, []);

	const handleMouseUp = useCallback(() => {
		isDraggingRef.current = false;
	}, []);

	// Registrar wheel event nativo (passive: false para poder preventDefault)
	useEffect(() => {
		const container = imageContainerRef.current;
		if (!(container && isOpen)) return;

		container.addEventListener('wheel', handleWheel, { passive: false });
		return () => {
			container.removeEventListener('wheel', handleWheel);
		};
	}, [isOpen, handleWheel]);

	return {
		scale,
		position,
		imageContainerRef,
		handleZoom,
		handleZoomIn,
		handleZoomOut,
		resetView,
		// Mouse handlers para drag
		handleMouseDown,
		handleMouseMove,
		handleMouseUp,
	};
}
