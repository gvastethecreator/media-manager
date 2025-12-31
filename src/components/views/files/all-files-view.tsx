import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoadingScreen } from '@/components/core/feedback';
import { type BrowserItem, FileBrowser, toBrowserItem } from '@/components/features/file-browser-new';
import { clientLogger } from '@/lib/logger/client-logger';
import { useAudioStore } from '@/store/entities/audio';
import { useDocumentStore } from '@/store/entities/document';
import { useFile3DStore } from '@/store/entities/file-3d';
import { useImageStore } from '@/store/entities/image';
import { useJsonFileStore } from '@/store/entities/json-file';
import { useVideoStore } from '@/store/entities/video';
import { useImageViewer } from '@/store/image-viewer.store';
import { useFileViewerStore } from '@/store/ui/file-viewer.slice';
import type { AnyEntityWithStats } from '@/types/entities';
import { isImageWithStats, isVideoWithStats } from '@/types/entity-guards';
import type { ViewProps } from '../types';

const viewLogger = clientLogger.withContext('AllFilesView');

/**
 * Vista principal de todos los archivos
 * Muestra una galería con todos los archivos (imágenes, documentos, audio, etc.)
 * basada en los datos de la base de datos, no del sistema de archivos
 */
export function AllFilesView(_: ViewProps) {
	// Obtener todos los tipos de archivos desde los stores correspondientes
	const imagesRecord = useImageStore((s) => s.images);
	const videosRecord = useVideoStore((s) => s.videos);
	const audiosArray = useAudioStore((s) => s.audios);
	const documentsRecord = useDocumentStore((s) => s.documents);
	const jsonFilesArray = useJsonFileStore((s) => s.jsonFiles);
	const file3DsArray = useFile3DStore((s) => s.file3Ds);

	// Estados de carga de cada store
	const imagesLoading = useImageStore((s) => s.isLoading);
	const videosLoading = useVideoStore((s) => s.isLoading);
	const audiosLoading = useAudioStore((s) => s.isLoading);
	const documentsLoading = useDocumentStore((s) => s.isLoading);
	const jsonLoading = useJsonFileStore((s) => s.loading);
	const file3DsLoading = useFile3DStore((s) => s.loading);

	// Errores de cada store
	const imagesError = useImageStore((s) => s.error);
	const videosError = useVideoStore((s) => s.error);
	const audiosError = useAudioStore((s) => s.error);
	const documentsError = useDocumentStore((s) => s.error);
	const jsonError = useJsonFileStore((s) => s.error);
	const file3DsError = useFile3DStore((s) => s.error);

	// Funciones de carga
	const loadImages = useImageStore((s) => s.loadImages);
	const fetchVideos = useVideoStore((s) => s.fetchVideos);
	const fetchAudios = useAudioStore((s) => s.fetchAudios);
	const fetchDocuments = useDocumentStore((s) => s.fetchDocuments);
	const fetchJsonFiles = useJsonFileStore((s) => s.fetchJsonFiles);
	const fetchFile3Ds = useFile3DStore((s) => s.fetchFile3Ds);

	const navigate = useNavigate();

	// Control para prevenir llamadas infinitas
	const hasInitializedRef = useRef(false);

	// Combinar todos los archivos en una sola lista
	const allFiles = useMemo(() => {
		const files: AnyEntityWithStats[] = [];

		// Agregar imágenes (Record)
		if (imagesRecord) {
			files.push(...Object.values(imagesRecord));
		}

		// Agregar videos (Record)
		if (videosRecord) {
			files.push(...Object.values(videosRecord));
		}

		// Agregar audios (Array)
		if (audiosArray) {
			files.push(...audiosArray);
		}

		// Agregar documentos (Record)
		if (documentsRecord) {
			files.push(...Object.values(documentsRecord));
		}

		// Agregar JSON (Array) con discriminador de tipo
		if (jsonFilesArray) {
			files.push(
				...(jsonFilesArray as any[]).map((j) => ({
					...j,
					entityType: 'jsonFile' as const,
				}))
			);
		}

		// Agregar archivos 3D (Array) con discriminador de tipo
		if (file3DsArray) {
			files.push(
				...(file3DsArray as any[]).map((f) => ({
					...f,
					entityType: 'file3d' as const,
				}))
			);
		}

		// Ordenar por fecha de actualización
		return files.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
	}, [imagesRecord, videosRecord, audiosArray, documentsRecord, jsonFilesArray, file3DsArray]);

	// Calcular estados combinados (forma estable para el formatter)
	const isLoading = [imagesLoading, videosLoading, audiosLoading, documentsLoading, jsonLoading, file3DsLoading].some(
		Boolean
	);
	const error = imagesError || videosError || audiosError || documentsError || jsonError || file3DsError;
	const fileCount = allFiles.length;
	const browserItems = useMemo(
		() => allFiles.map((f) => toBrowserItem(f as unknown as Record<string, unknown>)),
		[allFiles]
	);

	useEffect(() => {
		// Cargar todos los tipos de archivos solo una vez al montar el componente
		if (!hasInitializedRef.current) {
			viewLogger.info('Cargando todos los tipos de archivos...');
			hasInitializedRef.current = true;

			// Cargar solo si no hay datos ya cargados
			const hasImages = Object.keys(imagesRecord || {}).length > 0;
			const hasVideos = Object.keys(videosRecord || {}).length > 0;
			const hasAudios = (audiosArray || []).length > 0;
			const hasDocuments = Object.keys(documentsRecord || {}).length > 0;
			const hasJson = (jsonFilesArray || []).length > 0;
			const hasFile3Ds = (file3DsArray || []).length > 0;

			if (!hasImages) {
				loadImages();
			}
			if (!hasVideos) {
				fetchVideos();
			}
			if (!hasAudios) {
				fetchAudios();
			}
			if (!hasDocuments) {
				fetchDocuments();
			}
			if (!hasJson) {
				fetchJsonFiles();
			}
			if (!hasFile3Ds) {
				fetchFile3Ds();
			}
		}
	}, [
		imagesRecord,
		videosRecord,
		audiosArray,
		documentsRecord,
		jsonFilesArray,
		file3DsArray,
		loadImages,
		fetchVideos,
		fetchAudios,
		fetchDocuments,
		fetchJsonFiles,
		fetchFile3Ds,
	]);

	const { openViewer: openImageViewer } = useImageViewer();
	const { openViewer: openFileViewer } = useFileViewerStore();

	const handleFileClick = useCallback(
		(file: BrowserItem) => {
			viewLogger.info('🖱️ Click en archivo:', file.name);

			// Navegar según el entityType
			switch (file.entityType) {
				case 'image':
					navigate('/all-images');
					break;
				case 'video':
					navigate('/videos');
					break;
				case 'audio':
					navigate('/audio');
					break;
				case 'document':
					navigate('/documents');
					break;
				default:
					viewLogger.info('Abriendo archivo:', file.name);
			}
		},
		[navigate]
	);

	const handleFileDoubleClick = useCallback(
		(file: BrowserItem) => {
			viewLogger.info('🖱️ Doble click en archivo:', file.name);
			viewLogger.info('🔍 Debug - entityType:', file.entityType);

			const entity = file.raw as unknown as AnyEntityWithStats | undefined;
			if (!entity) {
				viewLogger.info('🔍 Debug - sin raw en item; usando fallback de navegación');
				handleFileClick(file);
				return;
			}

			viewLogger.info('🔍 Debug - isImageWithStats:', isImageWithStats(entity));
			viewLogger.info('🔍 Debug - isVideoWithStats:', isVideoWithStats(entity));

			// Manejar imágenes con el image viewer
			if (isImageWithStats(entity)) {
				viewLogger.info('📸 Abriendo imagen en image viewer');
				const imageEntities = allFiles.filter((item) => isImageWithStats(item));
				const currentIndex = imageEntities.findIndex((img) => img.id === entity.id);
				openImageViewer(imageEntities, currentIndex);
				return;
			}

			// Manejar videos con el file viewer
			if (isVideoWithStats(entity)) {
				viewLogger.info('🎬 Abriendo video en file viewer');
				const videoItems = allFiles
					.filter((item) => isVideoWithStats(item))
					.map((video) => ({
						id: video.id,
						name: video.name,
						type: 'video' as const,
						path: video.path,
						size: video.size || 0,
						width: video.width,
						height: video.height,
						thumbnail: video.thumbnail || `/api/videos/${video.id}/thumbnail`,
						thumbnailUrl: video.thumbnailUrl || `/api/videos/${video.id}/thumbnail`,
						metadata: video.metadata,
					}));

				const currentIndex = videoItems.findIndex((item) => item.id === entity.id);
				openFileViewer(videoItems, Math.max(0, currentIndex));
				return;
			}

			// Para otros tipos de archivos, usar comportamiento anterior (navegar)
			viewLogger.info('📁 Tipo de archivo no soportado, navegando');
			handleFileClick(file);
		},
		[allFiles, openImageViewer, openFileViewer, handleFileClick]
	);

	if (isLoading && allFiles.length === 0) {
		return <LoadingScreen message="Cargando archivos..." />;
	}

	if (error && allFiles.length === 0) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="text-center">
					<h2 className="mb-2 font-semibold text-lg">Error al cargar archivos</h2>
					<p className="mb-4 text-muted-foreground">Error: {error}</p>
					<button
						className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
						onClick={() => {
							loadImages();
							fetchVideos();
							fetchAudios();
							fetchDocuments();
							fetchJsonFiles();
							fetchFile3Ds();
						}}
						type="button"
					>
						Intentar de nuevo
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="h-full">
			<FileBrowser items={browserItems} onItemClick={handleFileClick} onItemDoubleClick={handleFileDoubleClick} />
		</div>
	);
}
