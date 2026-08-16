/**
 * Hook personalizado para detectar cuando un elemento entra al viewport por primera vez
 * usando Intersection Observer API
 */
import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseInViewportOptions {
	/** Si debe disparar solo una vez o en cada entrada al viewport */
	once?: boolean;
	/** Callback cuando el elemento entra al viewport */
	onIntersect?: (entry: IntersectionObserverEntry) => void;
	/** Callback cuando el elemento sale del viewport */
	onLeave?: (entry: IntersectionObserverEntry) => void;
	/** Margen del root para disparar la detección antes/después del viewport */
	rootMargin?: string;
	/** Umbral de intersección (0-1) para considerar el elemento como visible */
	threshold?: number;
}

export interface UseInViewportReturn {
	/** Si el elemento ha entrado al viewport al menos una vez */
	hasBeenInViewport: boolean;
	/** Si el elemento está actualmente en viewport */
	inViewport: boolean;
	/** Ref para asignar al elemento que queremos observar */
	ref: React.RefObject<HTMLDivElement | null>;
}

/**
 * Hook que detecta cuando un elemento entra/sale del viewport
 */
export function useInViewport({
	rootMargin = '0px',
	threshold = 0.1,
	once = false,
	onIntersect,
	onLeave,
}: UseInViewportOptions = {}): UseInViewportReturn {
	const [inViewport, setInViewport] = useState(false);
	const [hasBeenInViewport, setHasBeenInViewport] = useState(false);
	const elementRef = useRef<HTMLDivElement | null>(null);
	const observerRef = useRef<IntersectionObserver | null>(null);

	const handleIntersection = useCallback(
		(entries: IntersectionObserverEntry[]) => {
			const entry = entries[0];
			const isIntersecting = entry.isIntersecting;

			setInViewport(isIntersecting);

			if (isIntersecting) {
				setHasBeenInViewport(true);
				onIntersect?.(entry);

				// Si es "once", desconectar después de la primera intersección
				if (once && observerRef.current) {
					observerRef.current.disconnect();
				}
			} else {
				onLeave?.(entry);
			}
		},
		[once, onIntersect, onLeave]
	);

	useEffect(() => {
		const element = elementRef.current;
		if (!element) return;

		// Verificar soporte de Intersection Observer
		if (!window.IntersectionObserver) {
			// Fallback: considerar siempre como en viewport
			setInViewport(true);
			setHasBeenInViewport(true);
			return;
		}

		// Crear observer
		observerRef.current = new IntersectionObserver(handleIntersection, {
			rootMargin,
			threshold,
		});

		// Comenzar a observar
		observerRef.current.observe(element);

		// Cleanup
		return () => {
			if (observerRef.current) {
				observerRef.current.disconnect();
			}
		};
	}, [handleIntersection, rootMargin, threshold]);

	// Cleanup al desmontar
	useEffect(() => {
		return () => {
			if (observerRef.current) {
				observerRef.current.disconnect();
			}
		};
	}, []);

	return {
		ref: elementRef,
		inViewport,
		hasBeenInViewport,
	};
}

/**
 * Hook especializado para videos que entran al viewport por primera vez
 * con optimizaciones de rendimiento
 */
export function useVideoViewport(onFirstView?: () => void): UseInViewportReturn {
	const [hasTriggeredOnce, setHasTriggeredOnce] = useState(false);

	const handleIntersect = useCallback(() => {
		if (!hasTriggeredOnce) {
			setHasTriggeredOnce(true);
			// Pequeño delay para evitar sobrecargar el sistema
			requestAnimationFrame(() => {
				onFirstView?.();
			});
		}
	}, [hasTriggeredOnce, onFirstView]);

	return useInViewport({
		rootMargin: '100px', // Disparar antes para preparar frames
		threshold: 0.1, // Solo necesita 10% visible
		once: true, // Solo una vez por performance
		onIntersect: handleIntersect,
	});
}
