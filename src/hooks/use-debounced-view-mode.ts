/**
 * Hook para debounce del cambio de viewMode
 * Esto ayuda a suavizar las transiciones y evitar cambios muy rápidos
 */
import { useCallback, useRef } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';

export function useDebouncedViewMode() {
	const setViewMode = useViewOptionsStore((state) => state.setViewMode);
	const currentViewMode = useViewOptionsStore((state) => state.viewMode);
	const pendingViewModeRef = useRef<string | null>(null);

	// Debounced callback para cambios de viewMode
	const debouncedSetViewMode = useDebouncedCallback(
		(newViewMode: string) => {
			if (pendingViewModeRef.current === newViewMode) {
				setViewMode(newViewMode as any);
				pendingViewModeRef.current = null;
			}
		},
		150 // 150ms de debounce para suavizar transiciones
	);

	const setDebouncedViewMode = useCallback(
		(newViewMode: string) => {
			// Si es el mismo modo, no hacer nada
			if (currentViewMode === newViewMode) {
				return;
			}

			// Guardar el modo pendiente
			pendingViewModeRef.current = newViewMode;

			// Aplicar cambio inmediato para feedback visual rápido
			setViewMode(newViewMode as any);

			// También aplicar el debounced como respaldo
			debouncedSetViewMode(newViewMode);
		},
		[currentViewMode, setViewMode, debouncedSetViewMode]
	);

	return {
		viewMode: currentViewMode,
		setViewMode: setDebouncedViewMode,
		isTransitioning: pendingViewModeRef.current !== null,
	};
}
