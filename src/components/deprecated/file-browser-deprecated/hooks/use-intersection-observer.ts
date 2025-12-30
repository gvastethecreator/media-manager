import { useCallback, useEffect, useRef } from 'react';

interface UseIntersectionObserverOptions {
	threshold?: number;
	rootMargin?: string;
	onIntersect?: (entries: IntersectionObserverEntry[]) => void;
}

interface UseIntersectionObserverReturn {
	observeElement: (element: Element | null) => void;
	unobserveElement: (element: Element | null) => void;
	disconnect: () => void;
}

/**
 * Hook para intersection observer optimizado para lazy loading
 * Útil para cargar thumbnails solo cuando son visibles
 */
export function useIntersectionObserver({
	threshold = 0.1,
	rootMargin = '50px',
	onIntersect,
}: UseIntersectionObserverOptions = {}): UseIntersectionObserverReturn {
	const observerRef = useRef<IntersectionObserver | null>(null);
	const observedElementsRef = useRef<Set<Element>>(new Set());

	// Crear el observer una sola vez
	useEffect(() => {
		if (!('IntersectionObserver' in window)) {
			// Fallback para navegadores sin soporte
			return;
		}

		observerRef.current = new IntersectionObserver(
			(entries) => {
				if (onIntersect) {
					onIntersect(entries);
				}
			},
			{
				threshold,
				rootMargin,
			}
		);

		return () => {
			if (observerRef.current) {
				observerRef.current.disconnect();
			}
		};
	}, [threshold, rootMargin, onIntersect]);

	const observeElement = useCallback((element: Element | null) => {
		if (!(element && observerRef.current)) return;

		if (!observedElementsRef.current.has(element)) {
			observerRef.current.observe(element);
			observedElementsRef.current.add(element);
		}
	}, []);

	const unobserveElement = useCallback((element: Element | null) => {
		if (!(element && observerRef.current)) return;

		if (observedElementsRef.current.has(element)) {
			observerRef.current.unobserve(element);
			observedElementsRef.current.delete(element);
		}
	}, []);

	const disconnect = useCallback(() => {
		if (observerRef.current) {
			observerRef.current.disconnect();
			observedElementsRef.current.clear();
		}
	}, []);

	return {
		observeElement,
		unobserveElement,
		disconnect,
	};
}

/**
 * Hook específico para lazy loading de thumbnails
 * Combina intersection observer con lógica de carga de thumbnails
 */
export function useLazyThumbnailLoading() {
	const loadedThumbnailsRef = useRef<Set<string>>(new Set());
	const pendingLoadsRef = useRef<Set<string>>(new Set());

	const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
		const visibleEntries = entries.filter((entry) => entry.isIntersecting);

		for (const entry of visibleEntries) {
			const fileId = (entry.target as HTMLElement).dataset.fileId;

			if (fileId && !loadedThumbnailsRef.current.has(fileId) && !pendingLoadsRef.current.has(fileId)) {
				pendingLoadsRef.current.add(fileId);

				// Dispatch custom event for thumbnail loading
				window.dispatchEvent(
					new CustomEvent('lazyLoadThumbnail', {
						detail: { fileId },
					})
				);
			}
		}
	}, []);

	const { observeElement, unobserveElement, disconnect } = useIntersectionObserver({
		threshold: 0.1,
		rootMargin: '100px', // Start loading 100px before visible
		onIntersect: handleIntersection,
	});

	const markThumbnailLoaded = useCallback((fileId: string) => {
		loadedThumbnailsRef.current.add(fileId);
		pendingLoadsRef.current.delete(fileId);
	}, []);

	const markThumbnailError = useCallback((fileId: string) => {
		pendingLoadsRef.current.delete(fileId);
	}, []);

	return {
		observeElement,
		unobserveElement,
		disconnect,
		markThumbnailLoaded,
		markThumbnailError,
		isLoaded: (fileId: string) => loadedThumbnailsRef.current.has(fileId),
		isPending: (fileId: string) => pendingLoadsRef.current.has(fileId),
	};
}
