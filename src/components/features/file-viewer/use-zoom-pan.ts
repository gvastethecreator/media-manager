import { useCallback, useEffect, useRef } from 'react';

interface ZoomPanState {
	scale: number;
	x: number;
	y: number;
}

/**
 * 🔍 HOOK: useZoomPan (Optimizado - sin re-renders durante interacción)
 *
 * Gestiona zoom y paneo (pan) usando refs y DOM directo
 * para evitar re-renders de React durante la interacción
 */
export function useZoomPan(isOpen: boolean) {
	const imageContainerRef = useRef<HTMLDivElement>(null);
	const contentRef = useRef<HTMLDivElement>(null);
	const stateRef = useRef<ZoomPanState>({ scale: 1, x: 0, y: 0 });
	const isDraggingRef = useRef(false);
	const startPosRef = useRef({ x: 0, y: 0 });
	const rafRef = useRef<number | null>(null);

	// Aplicar transformación al DOM sin causar render
	const applyTransform = useCallback(() => {
		if (!contentRef.current) return;
		const { scale, x, y } = stateRef.current;
		contentRef.current.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
	}, []);

	// Resetear vista
	const resetView = useCallback(() => {
		stateRef.current = { scale: 1, x: 0, y: 0 };
		applyTransform();
	}, [applyTransform]);

	// Reset cuando se abre
	useEffect(() => {
		if (isOpen) {
			resetView();
		}
	}, [isOpen, resetView]);

	// Manejar zoom con la rueda - usando RAF para suavidad
	const handleWheel = useCallback(
		(e: WheelEvent) => {
			// No hacer zoom si el cursor está sobre un elemento con data-no-drag
			const target = e.target as HTMLElement;
			if (target.closest('[data-no-drag]')) return;

			e.preventDefault();
			e.stopPropagation();

			if (rafRef.current) {
				cancelAnimationFrame(rafRef.current);
			}

			rafRef.current = requestAnimationFrame(() => {
				const zoomFactor = 0.1;
				const delta = e.deltaY > 0 ? -zoomFactor : zoomFactor;
				const prevScale = stateRef.current.scale;
				const newScale = Math.min(Math.max(0.1, prevScale + prevScale * delta), 8);

				stateRef.current.scale = newScale;
				applyTransform();
			});
		},
		[applyTransform]
	);

	// Cambiar zoom programáticamente
	const handleZoom = useCallback(
		(factor: number) => {
			const prevScale = stateRef.current.scale;
			const newScale = Math.min(Math.max(0.1, prevScale + factor), 8);
			stateRef.current.scale = newScale;
			applyTransform();
		},
		[applyTransform]
	);

	const handleZoomIn = useCallback(() => handleZoom(0.2), [handleZoom]);
	const handleZoomOut = useCallback(() => handleZoom(-0.2), [handleZoom]);

	// Manejar drag - usando refs, NO state
	const handleMouseDown = useCallback((e: React.MouseEvent) => {
		if (e.button === 0 || e.button === 1) {
			e.preventDefault();
			isDraggingRef.current = true;
			startPosRef.current = { x: e.clientX, y: e.clientY };
		}
	}, []);

	const handleMouseMove = useCallback(
		(e: React.MouseEvent) => {
			if (!isDraggingRef.current) return;
			e.preventDefault();

			const dx = e.clientX - startPosRef.current.x;
			const dy = e.clientY - startPosRef.current.y;

			stateRef.current.x += dx;
			stateRef.current.y += dy;
			startPosRef.current = { x: e.clientX, y: e.clientY };

			// Aplicar directamente sin render de React
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
			rafRef.current = requestAnimationFrame(applyTransform);
		},
		[applyTransform]
	);

	const handleMouseUp = useCallback(() => {
		isDraggingRef.current = false;
	}, []);

	// Registrar wheel event
	useEffect(() => {
		const container = imageContainerRef.current;
		if (!(container && isOpen)) return;

		container.addEventListener('wheel', handleWheel, { passive: false });
		return () => {
			container.removeEventListener('wheel', handleWheel);
		};
	}, [isOpen, handleWheel]);

	// Cleanup RAF
	useEffect(() => {
		return () => {
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
		};
	}, []);

	return {
		scale: stateRef.current.scale,
		position: { x: stateRef.current.x, y: stateRef.current.y },
		imageContainerRef,
		contentRef,
		handleZoom,
		handleZoomIn,
		handleZoomOut,
		resetView,
		handleMouseDown,
		handleMouseMove,
		handleMouseUp,
		applyTransform,
	};
}
