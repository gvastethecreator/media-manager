import { useEffect, useMemo } from 'react';
import { useFolder } from '@/lib/api/folders';
import { useAudioStore } from '@/store/entities/audio';
import { useDocumentStore } from '@/store/entities/document';
import { useFile3DStore } from '@/store/entities/file-3d';
import { useImageStore } from '@/store/entities/image';
import { useJsonFileStore } from '@/store/entities/json-file/json-file.store';
import { useVideoStore } from '@/store/entities/video';
import type { MediaItem } from '../components/media-thumbnail';

// Opciones para el hook useFolderFiles
interface UseFolderFilesOptions {
	includeSubfolders?: boolean;
}

/**
 * Helper function para filtrar entidades por carpeta, considerando subcarpetas si es necesario
 */
function filterByFolder<T extends { folderId: string; path?: string }>(
	items: T[],
	folderId: string,
	includeSubfolders: boolean,
	folderPath?: string
): T[] {
	if (!includeSubfolders) {
		// Comportamiento tradicional: solo elementos directos de la carpeta
		return items.filter((item) => item.folderId === folderId);
	}

	// Si includeSubfolders está activado, también incluir elementos de subcarpetas
	if (!folderPath) {
		// Si no tenemos la ruta de la carpeta, fallback al comportamiento tradicional
		return items.filter((item) => item.folderId === folderId);
	}

	return items.filter((item) => {
		// Incluir elementos directos de la carpeta
		if (item.folderId === folderId) {
			return true;
		}

		// Incluir elementos de subcarpetas si tienen path y está dentro del folderPath
		if (item.path && folderPath) {
			// Normalizar paths para comparación
			const itemPath = item.path.replace(/\\/g, '/');
			const normalizedFolderPath = folderPath.replace(/\\/g, '/');

			// Verificar si el archivo está en una subcarpeta
			return itemPath.startsWith(`${normalizedFolderPath}/`);
		}

		return false;
	});
}

export function useFolderFiles(folderId: string | null, options: UseFolderFilesOptions = {}) {
	const { includeSubfolders = false } = options;

	const { getImagesByFolder, fetchImages, folderLoadState } = useImageStore();
	const { getVideosByFolder, fetchVideos, isLoading: loadingVideos } = useVideoStore();
	const { fetchAudios, isLoading: loadingAudios } = useAudioStore();
	const { fetchDocuments, isLoading: loadingDocuments, documents } = useDocumentStore();
	const { fetchJsonFiles, loading: loadingJson, jsonFiles } = useJsonFileStore();
	const { fetchFile3Ds, loading: loadingFile3D, file3Ds } = useFile3DStore();

	// Obtener información de la carpeta para conocer su ruta (solo si includeSubfolders está habilitado)
	const { data: folderData } = useFolder(includeSubfolders && folderId ? folderId : '');

	const imageFolderState = folderId ? folderLoadState?.[folderId] : undefined;
	const loadingImages = imageFolderState?.loading ?? !imageFolderState?.loaded;

	const images = folderId ? getImagesByFolder(folderId) : [];
	const videos = folderId ? getVideosByFolder(folderId) : [];
	// Otros datasets (se filtran por folderId más abajo)
	const audios = useAudioStore((s) => s.audios);
	// Stores actuales no exponen consulta por folder para todos; cargamos global y filtramos por path si hace falta más adelante

	useEffect(() => {
		if (!folderId) return;
		// Cargar imágenes si falta
		if (!(imageFolderState?.loaded || imageFolderState?.loading)) {
			fetchImages({ folderId });
		}
		// Cargar videos del folder (VideoStore no tiene folderLoadState, hacemos fetch directo)
		// Nota: el cliente de videos permite filtrar por múltiples folders; aquí pasamos uno.
		(async () => {
			await fetchVideos([folderId]);
			await Promise.allSettled([fetchAudios(), fetchDocuments(), fetchJsonFiles(), fetchFile3Ds()]);
		})();
	}, [folderId, imageFolderState, fetchImages, fetchVideos, fetchAudios, fetchDocuments, fetchJsonFiles, fetchFile3Ds]);

	const items: MediaItem[] = useMemo(() => {
		const result: MediaItem[] = [];
		const folderPath = folderData?.path;

		// Images
		for (const img of images) {
			result.push({
				id: img.id,
				name: img.name,
				entityType: 'image',
				thumbnailUrl: null,
				// metadatos comunes para vistas (opcionales)
				createdAt: (img as any).createdAt,
				size: (img as any).size,
				path: (img as any).path,
				width: (img as any).width,
				height: (img as any).height,
			});
		}
		// Videos
		for (const vid of videos) {
			const base64 = (vid as any).thumbnail ? `data:image/webp;base64,${(vid as any).thumbnail}` : null;
			result.push({
				id: vid.id,
				name: vid.name,
				entityType: 'video',
				thumbnailUrl: base64,
				createdAt: (vid as any).createdAt,
				size: (vid as any).size,
				path: (vid as any).path,
				width: (vid as any).width,
				height: (vid as any).height,
			});
		}
		// Audios - usar función de filtrado para subcarpetas
		if (folderId) {
			const filteredAudios = filterByFolder(audios, folderId, includeSubfolders, folderPath);
			for (const a of filteredAudios) {
				result.push({
					id: a.id,
					name: a.name,
					entityType: 'audio',
					mimeType: a.mimeType ?? null,
					createdAt: (a as any).createdAt,
					size: (a as any).size,
					path: (a as any).path,
				});
			}
			// Documents - usar función de filtrado para subcarpetas
			const docsArr = Object.values(documents || {});
			const filteredDocs = filterByFolder(docsArr, folderId, includeSubfolders, folderPath);
			for (const d of filteredDocs) {
				result.push({
					id: d.id,
					name: d.name,
					entityType: 'document',
					mimeType: (d as any).mimeType ?? null,
					createdAt: (d as any).createdAt,
					size: (d as any).size,
					path: (d as any).path,
				});
			}
			// JSON Files - usar función de filtrado para subcarpetas
			const filteredJsonFiles = filterByFolder(jsonFiles || [], folderId, includeSubfolders, folderPath);
			for (const j of filteredJsonFiles) {
				result.push({
					id: j.id,
					name: j.name,
					entityType: 'jsonFile',
					mimeType: j.mimeType ?? null,
					createdAt: (j as any).createdAt,
					size: (j as any).size,
					path: (j as any).path,
				});
			}
			// 3D Files - usar función de filtrado para subcarpetas
			const filteredFile3Ds = filterByFolder(file3Ds || [], folderId, includeSubfolders, folderPath);
			for (const f of filteredFile3Ds) {
				result.push({
					id: f.id,
					name: f.name,
					entityType: 'file3d',
					mimeType: f.mimeType ?? null,
					createdAt: (f as any).createdAt,
					size: (f as any).size,
					path: (f as any).path,
				});
			}
		}

		return result;
	}, [images, videos, audios, documents, jsonFiles, file3Ds, folderId, includeSubfolders, folderData?.path]);

	return {
		items,
		isLoading:
			loadingImages || loadingVideos || loadingAudios || !!loadingDocuments || !!loadingJson || !!loadingFile3D,
		error: null as string | null,
	};
}
