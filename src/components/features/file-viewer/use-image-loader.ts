import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ImageItem } from './file-viewer.types';

/**
 * Detecta el tipo de archivo basado en mimeType, type, o extensión
 */
function detectFileType(item: ImageItem): 'image' | 'video' | 'audio' | 'document' | 'json' | 'file3d' | 'unknown' {
	const mimeType = item.mimeType?.toLowerCase() || '';
	const type = item.type?.toLowerCase() || '';
	const ext = item.name?.toLowerCase().split('.').pop() || '';

	// Por mimeType
	if (mimeType.startsWith('image/')) return 'image';
	if (mimeType.startsWith('video/')) return 'video';
	if (mimeType.startsWith('audio/')) return 'audio';
	if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'document';
	if (mimeType.includes('json')) return 'json';
	if (mimeType.includes('model') || mimeType.includes('gltf') || mimeType.includes('obj')) return 'file3d';

	// Por type del item
	if (type === 'image') return 'image';
	if (type === 'video') return 'video';
	if (type === 'audio') return 'audio';
	if (type === 'document') return 'document';
	if (type === 'json' || type === 'jsonfile') return 'json';
	if (type === 'file3d' || type === '3d') return 'file3d';

	// Por extensión
	const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'bmp', 'tiff', 'tif', 'svg', 'ico'];
	const videoExts = ['mp4', 'webm', 'avi', 'mov', 'mkv', 'flv', 'wmv', 'm4v', 'mpg', 'mpeg', '3gp'];
	const audioExts = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a', 'opus', 'aiff'];
	const docExts = ['pdf', 'doc', 'docx', 'txt', 'md', 'rtf', 'odt', 'pages', 'epub', 'mobi'];
	const jsonExts = ['json'];
	const file3dExts = ['obj', 'fbx', 'gltf', 'glb', 'dae', '3ds', 'blend', 'stl', 'ply', 'x3d'];

	if (imageExts.includes(ext)) return 'image';
	if (videoExts.includes(ext)) return 'video';
	if (audioExts.includes(ext)) return 'audio';
	if (docExts.includes(ext)) return 'document';
	if (jsonExts.includes(ext)) return 'json';
	if (file3dExts.includes(ext)) return 'file3d';

	return 'unknown';
}

/**
 * 🖼️ HOOK: useImageLoader (renombrado conceptualmente a useFileLoader)
 *
 * Gestiona la carga optimizada de URLs de archivos con precarga de vecinos
 * Soporta: imágenes, videos, audio, documentos, JSON, modelos 3D
 */
export function useImageLoader(images: ImageItem[], currentIndex: number, isOpen: boolean) {
	const [urls, setUrls] = useState<Record<string, string>>({});
	const [isLoading, setIsLoading] = useState(true);

	// Función memoizada para cargar URL de archivo según su tipo
	const loadImageUrl = useCallback(
		(imageId: string): string => {
			try {
				const item = images.find((i) => i.id === imageId);
				if (!item) {
					console.warn(`Item no encontrado: ${imageId}`);
					return '';
				}

				const fileType = detectFileType(item);

				// Construir URL según el tipo de archivo
				switch (fileType) {
					case 'video':
						return `/api/videos/${imageId}/content`;
					case 'audio':
						// Si tiene path, usar endpoint de archivos genérico
						if (item.path) {
							return `/api/files/content?path=${encodeURIComponent(item.path)}`;
						}
						return `/api/audio/${imageId}/content`;
					case 'document':
					case 'json':
					case 'file3d':
						// Usar endpoint de archivos genérico con path
						if (item.path) {
							return `/api/files/content?path=${encodeURIComponent(item.path)}`;
						}
						return `/api/files/${imageId}/content`;
					default:
						// Usar el endpoint de contenido completo para imágenes
						return `/api/images/${imageId}/content`;
				}
			} catch (error) {
				console.error(`Error cargando URL para ${imageId}:`, error);
				throw error;
			}
		},
		[images]
	);

	// Determinar qué archivos cargar inicialmente: actual ± vecinos
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
			const itemsToLoad = indicesToLoad
				.map((idx) => images[idx])
				.filter((img): img is ImageItem => Boolean(img && !urls[img.id]));

			if (!itemsToLoad.length) {
				setIsLoading(false);
				return;
			}

			try {
				const newUrls: Record<string, string> = {};

				await Promise.all(
					itemsToLoad.map(async (item) => {
						if (!item || urls[item.id]) {
							return;
						}

						try {
							const url = loadImageUrl(item.id);
							if (url) newUrls[item.id] = url;
						} catch (error) {
							console.error(`Error cargando URL para ${item.name}:`, error);
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
