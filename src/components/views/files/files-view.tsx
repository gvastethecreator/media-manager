import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoadingScreen } from '@/components/core/feedback';
import { FileBrowser } from '@/components/features/file-browser/file-browser';
import { BaseContentView } from '@/components/views/base/base-content-view';
import { clientLogger } from '@/lib/logger/client-logger';
import { useAudioStore } from '@/store/entities/audio';
import { useDocumentStore } from '@/store/entities/document';
import { useImageStore } from '@/store/entities/image';
import { useVideoStore } from '@/store/entities/video';
import type { AnyEntityWithStats } from '@/types/migration';
import type { ViewProps } from '../types';
import { EntityStatsType } from '@/types/file-browser/entity-stats';

const viewLogger = clientLogger.withContext('FilesView');

/**
 * Vista principal de todos los archivos
 * Muestra una galería con todos los archivos (imágenes, documentos, audio, etc.)
 * basada en los datos de la base de datos, no del sistema de archivos
 */
export function FilesView(_: ViewProps) {
	// Obtener todos los tipos de archivos desde los stores correspondientes
	const imagesRecord = useImageStore((s) => s.images);
	const videosRecord = useVideoStore((s) => s.videos);
	const audiosArray = useAudioStore((s) => s.audios);
	const documentsRecord = useDocumentStore((s) => s.documents);

	// Estados de carga de cada store
	const imagesLoading = useImageStore((s) => s.isLoading);
	const videosLoading = useVideoStore((s) => s.isLoading);
	const audiosLoading = useAudioStore((s) => s.isLoading);
	const documentsLoading = useDocumentStore((s) => s.isLoading);

	// Errores de cada store
	const imagesError = useImageStore((s) => s.error);
	const videosError = useVideoStore((s) => s.error);
	const audiosError = useAudioStore((s) => s.error);
	const documentsError = useDocumentStore((s) => s.error);

	// Funciones de carga
	const loadImages = useImageStore((s) => s.loadImages);
	const fetchVideos = useVideoStore((s) => s.fetchVideos);
	const fetchAudios = useAudioStore((s) => s.fetchAudios);
	const fetchDocuments = useDocumentStore((s) => s.fetchDocuments);

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

		// Ordenar por fecha de actualización
		return files.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
	}, [imagesRecord, videosRecord, audiosArray, documentsRecord]);

	// Calcular estados combinados
	const isLoading = imagesLoading || videosLoading || audiosLoading || documentsLoading;
	const error = imagesError || videosError || audiosError || documentsError;
	const fileCount = allFiles.length;

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

			if (!hasImages) loadImages();
			if (!hasVideos) fetchVideos();
			if (!hasAudios) fetchAudios();
			if (!hasDocuments) fetchDocuments();
		}
	}, [imagesRecord, videosRecord, audiosArray, documentsRecord, loadImages, fetchVideos, fetchAudios, fetchDocuments]);

	const handleFileClick = useCallback(
		(file: AnyEntityWithStats) => {
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
		(file: AnyEntityWithStats) => {
			viewLogger.info('🖱️ Doble click en archivo:', file.name);
			// Igual que el click simple por ahora
			handleFileClick(file);
		},
		[handleFileClick]
	);

	if (isLoading && allFiles.length === 0) {
		return <LoadingScreen message="Cargando archivos..." />;
	}

	if (error && allFiles.length === 0) {
		return (
			<BaseContentView description={`Error: ${error}`} title="Error al cargar archivos">
				<div className="text-center">
					<p className="mb-4 text-muted-foreground">Ha ocurrido un error al cargar los archivos.</p>
					<button
						className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
						onClick={() => {
							loadImages();
							fetchVideos();
							fetchAudios();
							fetchDocuments();
						}}
					>
						Intentar de nuevo
					</button>
				</div>
			</BaseContentView>
		);
	}

	return (
		<BaseContentView description={`${fileCount} archivos en total`} title="Todos los archivos">
			<FileBrowser
				entityType={EntityStatsType.IMAGE}
				isLoading={isLoading} // Usamos image como base para el FileBrowser
				items={allFiles}
				onItemClick={handleFileClick}
				onItemDoubleClick={handleFileDoubleClick}
			/>
		</BaseContentView>
	);
}
