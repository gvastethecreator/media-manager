import { useEffect, useMemo, useRef } from 'react';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';
import type { MediaItem } from '../components/media-thumbnail';
import { useFolderFilesPaginated } from './use-folder-files-paginated';

interface ProgressiveLoadingState {
	items: MediaItem[];
	isLoading: boolean;
	error: string | null;
	loadingStage: 'initial' | 'loading' | 'complete';
	loadedCount: number;
	totalCount: number;
	shouldShowPreloader: boolean;
	// New chunked loading features
	hasMore: boolean;
	loadMore: () => void;
	chunkSize: number;
	isLoadingMore: boolean;
	// Infinite scroll features
	scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Hook optimizado con carga paginada REAL desde backend
 * Reemplaza el sistema anterior de chunks simulados
 * Incluye soporte para incluir subcarpetas
 */
export function useProgressiveFolderFiles(folderId: string | null): ProgressiveLoadingState {
	const includeSubfolders = useViewOptionsStore((state) => state.includeSubfolders);
	const infiniteScroll = useViewOptionsStore((state) => state.infiniteScroll);

	// Ref para el contenedor de scroll
	const scrollContainerRef = useRef<HTMLDivElement>(null);

	// Usar el nuevo hook paginado que hace carga real
	const { files, isLoading, isLoadingMore, error, hasMore, loadMore, total, loadedCount } = useFolderFilesPaginated({
		folderId,
		includeSubfolders,
		pageSize: 150, // Tamaño de página optimizado
		enabled: !!folderId,
	});

	const loadingStage = useMemo((): 'initial' | 'loading' | 'complete' => {
		if (!folderId) return 'initial';
		if (isLoading && files.length === 0) return 'initial';
		if (isLoading || isLoadingMore) return 'loading';
		return 'complete';
	}, [folderId, isLoading, isLoadingMore, files.length]);

	// Mostrar preloader solo en carga inicial
	const shouldShowPreloader = useMemo(() => {
		return isLoading && files.length === 0;
	}, [isLoading, files.length]);

	// Infinite scroll automático con scroll real
	useEffect(() => {
		if (!(infiniteScroll.enabled && infiniteScroll.autoLoad && hasMore) || isLoadingMore || isLoading) {
			return;
		}

		const container = scrollContainerRef.current;
		if (!container) return;

		// Refs para anti-spam y heurística mejorada
		const lastTriggerScrollHeightRef = { current: 0 };
		const lastTriggerTimeRef = { current: 0 };
		const MIN_MS_BETWEEN_LOADS = Math.max(0, infiniteScroll.cooldownMs ?? 300);

		const handleScroll = () => {
			const { scrollTop, scrollHeight, clientHeight } = container;
			const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

			// Umbral dinámico mejorado: considera el viewport y contenido actual
			const baseThreshold = infiniteScroll.threshold;
			const viewportThreshold = Math.round(clientHeight * 1.2);
			const contentBasedThreshold = Math.min(scrollHeight * 0.1, clientHeight * 2);
			const dynamicThreshold = Math.max(baseThreshold, viewportThreshold, contentBasedThreshold);

			// Condición de disparo anticipado con mejor heurística
			if (distanceFromBottom <= dynamicThreshold) {
				const now = Date.now();
				// Anti-spam mejorado: verificar que realmente se agregó contenido Y tiempo suficiente
				if (
					scrollHeight !== lastTriggerScrollHeightRef.current &&
					now - lastTriggerTimeRef.current >= MIN_MS_BETWEEN_LOADS
				) {
					lastTriggerScrollHeightRef.current = scrollHeight;
					lastTriggerTimeRef.current = now;

					// Llamar a loadMore que ahora hace petición real al backend
					loadMore();
				}
			}
		};

		container.addEventListener('scroll', handleScroll, { passive: true });
		return () => container.removeEventListener('scroll', handleScroll);
	}, [
		infiniteScroll.enabled,
		infiniteScroll.autoLoad,
		infiniteScroll.threshold,
		infiniteScroll.cooldownMs,
		hasMore,
		isLoadingMore,
		isLoading,
		loadMore,
	]);

	return {
		items: files,
		isLoading,
		error: error?.message || null,
		loadingStage,
		loadedCount,
		totalCount: total,
		shouldShowPreloader,
		hasMore,
		loadMore,
		chunkSize: 150, // Tamaño de página real
		isLoadingMore,
		scrollContainerRef,
	};
}
