import type * as React from 'react';
import { useCallback, useEffect, useRef } from 'react';

/**
 * Hook optimizado para manejar el efecto de brillo en las tarjetas
 * @param elementRef Referencia al elemento que tendrá el efecto
 */
export function useGlowEffect(elementRef: React.RefObject<HTMLElement>) {
	const rafIdRef = useRef<number | null>(null);
	const lastUpdateRef = useRef<number>(0);

	const handleMouseMove = useCallback(
		(e: MouseEvent) => {
			if (!elementRef.current) {
				return;
			}

			// Throttle to max 60fps
			const now = performance.now();
			if (now - lastUpdateRef.current < 16) {
				return;
			}

			const rect = elementRef.current.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const y = e.clientY - rect.top;

			// Cancel previous RAF if still pending
			if (rafIdRef.current) {
				cancelAnimationFrame(rafIdRef.current);
			}

			rafIdRef.current = requestAnimationFrame(() => {
				if (elementRef.current) {
					elementRef.current.style.setProperty('--mouse-x', `${x}px`);
					elementRef.current.style.setProperty('--mouse-y', `${y}px`);
					lastUpdateRef.current = now;
				}
				rafIdRef.current = null;
			});
		},
		[elementRef]
	);

	useEffect(() => {
		const element = elementRef.current;
		if (!element) {
			return;
		}

		element.addEventListener('mousemove', handleMouseMove, { passive: true });

		return () => {
			element.removeEventListener('mousemove', handleMouseMove);
			if (rafIdRef.current) {
				cancelAnimationFrame(rafIdRef.current);
			}
		};
	}, [elementRef, handleMouseMove]);
}
