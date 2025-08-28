import { useEffect, useMemo } from 'react';
import { useImageStore } from '@/store/entities/image';
import { useVideoStore } from '@/store/entities/video';
import { useAudioStore } from '@/store/entities/audio';
import { useDocumentStore } from '@/store/entities/document';
import { useJsonFileStore } from '@/store/entities/json-file/json-file.store';
import { useFile3DStore } from '@/store/entities/file-3d';
import type { ImageWithStats } from '@/types/entities/image';
import type { VideoWithStats } from '@/types/entities/video/types';
import type { AudioWithStats } from '@/types/entities/audio';
import type { DocumentWithStats } from '@/types/entities/document';
import type { JsonFileWithStats } from '@/types/entities/json-file';
import type { File3DWithStats } from '@/types/entities/file3d';
import type { MediaItem } from '../components/media-thumbnail';

type MediaUnion =
	| (ImageWithStats & { entityType: 'image' })
	| (VideoWithStats & { entityType: 'video' })
	| (AudioWithStats & { entityType: 'audio' })
	| (DocumentWithStats & { entityType: 'document' })
	| (JsonFileWithStats & { entityType: 'jsonFile' })
	| (File3DWithStats & { entityType: 'file3d' });

export function useFolderFiles(folderId: string | null) {
	const { getImagesByFolder, fetchImages, folderLoadState } = useImageStore();
	const { getVideosByFolder, fetchVideos, isLoading: loadingVideos } = useVideoStore();
	const { fetchAudios, isLoading: loadingAudios } = useAudioStore();
	const { fetchDocuments, isLoading: loadingDocuments, documents } = useDocumentStore();
	const { fetchJsonFiles, loading: loadingJson, jsonFiles } = useJsonFileStore();
	const { fetchFile3Ds, loading: loadingFile3D, file3Ds } = useFile3DStore();

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
		console.log('[useFolderFiles] Computing items:', {
			folderId,
			images: images.length,
			videos: videos.length,
			audios: audios.length,
			documents: Object.keys(documents || {}).length,
			jsonFiles: (jsonFiles || []).length,
			file3Ds: (file3Ds || []).length,
		});

		const result: MediaItem[] = [];
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
		// Audios
		if (folderId) {
			for (const a of audios.filter((x) => x.folderId === folderId)) {
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
			// Documents
			const docsArr = Object.values(documents || {});
			for (const d of docsArr.filter((x) => x.folderId === folderId)) {
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
			// JSON Files
			for (const j of (jsonFiles || []).filter((x) => x.folderId === folderId)) {
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
			// 3D Files
			for (const f of (file3Ds || []).filter((x) => x.folderId === folderId)) {
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

		console.log('[useFolderFiles] Final result:', {
			totalItems: result.length,
			itemsByType: result.reduce(
				(acc, item) => {
					acc[item.entityType] = (acc[item.entityType] || 0) + 1;
					return acc;
				},
				{} as Record<string, number>
			),
		});

		return result;
	}, [images, videos, audios, documents, jsonFiles, file3Ds, folderId]);

	return {
		items,
		isLoading:
			loadingImages || loadingVideos || loadingAudios || !!loadingDocuments || !!loadingJson || !!loadingFile3D,
		error: null as string | null,
	};
}
