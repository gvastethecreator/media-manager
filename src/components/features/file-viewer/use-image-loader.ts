import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ImageItem } from './file-viewer.types';

/**
 * 🖼️ HOOK: useImageLoader
 *
 * Gestiona la carga optimizada de URLs de imágenes con precarga de vecinos
 */
export function useImageLoader(images: ImageItem[], currentIndex: number, isOpen: boolean) {
	const [urls, setUrls] = useState<Record<string, string>>({});
	const [isLoading, setIsLoading] = useState(true);

	// Función memoizada para cargar URL de imagen
	const loadImageUrl = useCallback((imageId: string): string => {
		try {
			// Usar el endpoint de contenido completo
			const url = `/api/images/${imageId}/content`;
			return url;
		} catch (error) {
			console.error(`Error cargando URL para ${imageId}:`, error);
			throw error;
		}
	}, []);

	// Determinar qué imágenes cargar inicialmente: actual ± vecinos
	const indicesToLoad = useMemo(() => {
		const len = images.length;
		if (len === 0) return [] as number[];
		if (len === 1) return [currentIndex];
		const prevIndex = (currentIndex - 1 + len) % len;
		const nextIndex = (currentIndex + 1) % len;
		return [prevIndex, currentIndex, nextIndex];
	}, [currentIndex, images]);

	// Effect para cargar las URLs iniciales
	useEffect(() => {
		if (!isOpen) {
			return;
		}

		const loadInitialUrls = async () => {
			const imagesToLoad = indicesToLoad
				.map((idx) => images[idx])
				.filter((img): img is ImageItem => Boolean(img && !urls[img.id]));

			if (!imagesToLoad.length) {
				setIsLoading(false);
				return;
			}

			try {
				const newUrls: Record<string, string> = {};

				await Promise.all(
					imagesToLoad.map(async (img) => {
						if (!img || urls[img.id]) {
							return;
						}

						try {
							const url = await loadImageUrl(img.id);
							if (url) newUrls[img.id] = url;
						} catch (error) {
							console.error(`Error cargando URL para ${img.name}:`, error);
						}
					})
				);

				if (Object.keys(newUrls).length > 0) {
					setUrls((prev) => ({ ...prev, ...newUrls }));
				}

				setIsLoading(false);
			} catch (error) {
				console.error('Error cargando URLs iniciales:', error);
				setIsLoading(false);
			}
		};

		loadInitialUrls();
	}, [isOpen, images, urls, loadImageUrl, indicesToLoad]);

	return { urls, setUrls, isLoading, setIsLoading, loadImageUrl };
}
