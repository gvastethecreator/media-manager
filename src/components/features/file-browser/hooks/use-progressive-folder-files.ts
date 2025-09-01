import { useMemo, useRef } from 'react';
import type { MediaItem } from '../components/media-thumbnail';
import { useFolderFiles as useOriginalFolderFiles } from './use-folder-files';

interface ProgressiveLoadingState {
	items: MediaItem[];
	isLoading: boolean;
	error: string | null;
	loadingStage: 'initial' | 'loading' | 'complete';
	loadedCount: number;
	totalCount: number;
	shouldShowPreloader: boolean;
}

/**
 * Hook simplificado que envuelve useFolderFiles con preloader básico
 * Evita loops infinitos con lógica simplificada
 */
export function useProgressiveFolderFiles(folderId: string | null): ProgressiveLoadingState {
	const { items, isLoading, error } = useOriginalFolderFiles(folderId);

	// Solo guardamos el último count exitoso para evitar loops
	const lastSuccessCountRef = useRef(0);

	// Actualizar count solo cuando termine la carga exitosamente
	if (!isLoading && items.length > 0) {
		lastSuccessCountRef.current = items.length;
	}

	const loadingStage = useMemo((): 'initial' | 'loading' | 'complete' => {
		if (!folderId) return 'initial';
		if (isLoading && items.length === 0) return 'initial';
		if (isLoading) return 'loading';
		return 'complete';
	}, [folderId, isLoading, items.length]);

	// Mostrar preloader solo en carga inicial o si no hay items
	const shouldShowPreloader = useMemo(() => {
		return isLoading && items.length === 0;
	}, [isLoading, items.length]);

	return {
		items,
		isLoading,
		error,
		loadingStage,
		loadedCount: items.length,
		totalCount: lastSuccessCountRef.current,
		shouldShowPreloader,
	};
}
