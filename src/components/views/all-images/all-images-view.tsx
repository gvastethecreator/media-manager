import { useCallback, useEffect, useMemo } from 'react';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import { useAutoFolderIndexing } from '@/hooks/use-auto-folder-indexing';
import { clientLogger } from '@/lib/logger/client-logger';
import { useImageStore } from '@/store/entities/image';
import { useImageViewer } from '@/store/image-viewer.store';
import type { ImageWithStats } from '@/types/entities/image';
import type { EntityWithStats, isImageWithStats } from '@/types/migration';
import type { ViewProps } from '../types';
import AllImagesContentView from './all-images-content-view';

const viewLogger = clientLogger.withContext('AllImagesView');

/**
 * Vista principal de todas las imágenes
 * Muestra una galería con todas las imágenes disponibles
 */
export const AllImagesView = function AllImagesView({ _className }: ViewProps) {
	// Usar selectores individuales para evitar recrear objetos
	const imagesRecord = useImageStore((s) => s.images);
	const isLoading = useImageStore((s) => s.isLoading);
	const error = useImageStore((s) => s.error);
	const loadImages = useImageStore((s) => s.loadImages);
	const getSortedImages = useImageStore((s) => s.getSortedImages);

	// Hook para indexación automática de carpetas
	const {
		status: indexingStatus,
		isIndexing,
		progress,
		startIndexing,
	} = useAutoFolderIndexing({
		autoStart: true,
		maxFoldersPerBatch: 3,
		onIndexingStart: () => {
			viewLogger.info('🔄 Iniciando indexación automática de carpetas');
		},
		onIndexingComplete: (status) => {
			viewLogger.info(`✅ Indexación completada: ${status.indexedFolders} carpetas procesadas`);
			// Recargar imágenes después de la indexación
			loadImages({ refresh: true });
		},
		onProgress: (status) => {
			viewLogger.debug(`📊 Progreso de indexación: ${status.indexedFolders}/${status.totalFolders}`);
		},
	});

	useEffect(() => {
		if (Object.keys(imagesRecord).length === 0) {
			viewLogger.info('Store de imágenes vacío, cargando desde el servidor...');
			loadImages();
		}
	}, [loadImages, imagesRecord]);

	const { setCurrentView, setCurrentItem } = useNavigationStore();
	const { openViewer } = useImageViewer();

	// Cachear el resultado de getSortedImages
	const sortedImages = useMemo(() => {
		const images = getSortedImages();
		return Array.isArray(images) ? images : [];
	}, [getSortedImages]);

	const handleImageClick = useCallback(
		(item: EntityWithStats) => {
			// Verificar que sea una imagen usando type guard
			if (isImageWithStats(item)) {
				const image = item as ImageWithStats;
				viewLogger.info('🖱️ Click en imagen:', image.name);

				// Navegar a la vista de detalle de imagen
				setCurrentItem({
					id: image.id,
					name: image.name || '',
					path: image.path || '',
					description: image.description || undefined,
					count: 1,
					createdAt: image.createdAt,
					itemType: 'image',
				});
				setCurrentView('all-images'); // Usamos vista existente por ahora
			} else {
				viewLogger.warn('⚠️ Item clickeado no es una imagen:', item);
			}
		},
		[setCurrentView, setCurrentItem]
	);

	const handleImageDoubleClick = useCallback(
		(item: EntityWithStats) => {
			// Verificar que sea una imagen usando type guard
			if (isImageWithStats(item)) {
				const image = item as ImageWithStats;
				viewLogger.info('🖱️ Doble click en imagen:', image.name);

				// Abrir visor de imágenes
				const imageItems = sortedImages
					.filter((img: EntityWithStats) => isImageWithStats(img))
					.map((img: EntityWithStats) => ({
						id: img.id,
						name: img.name || '',
						src: img.thumbnailUrl || `/api/images/${img.id}/content`,
						alt: img.name || '',
						width: 'width' in img ? img.width : 0,
						height: 'height' in img ? img.height : 0,
						thumbnail: img.thumbnailUrl || null,
						type: 'image',
						path: img.path || '',
						size: 'size' in img ? img.size : 0,
						mimeType: 'mimeType' in img ? img.mimeType : '',
						metadata: null,
						url: img.thumbnailUrl || `/api/images/${img.id}/content`,
						parsedMetadata: undefined,
					}));

				const currentIndex = imageItems.findIndex((img: any) => img.id === image.id);
				openViewer(imageItems, currentIndex);
			} else {
				viewLogger.warn('⚠️ Item con doble click no es una imagen:', item);
			}
		},
		[sortedImages, openViewer]
	);

	// Función para manejar el upload de archivos
	const handleFileUpload = useCallback(
		async (files: File[]) => {
			// Esto debería ser manejado por el content view, pero aquí se recargan las imágenes
			loadImages({ refresh: true });
		},
		[loadImages]
	);

	const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
		// Esto debería ser manejado por el content view
	}, []);

	return (
		<AllImagesContentView
			images={sortedImages}
			isLoading={isLoading}
			error={error}
			indexingStatus={indexingStatus}
			isIndexing={isIndexing}
			progress={progress}
			startIndexing={startIndexing}
			handleImageClick={handleImageClick}
			handleImageDoubleClick={handleImageDoubleClick}
			handleFileUpload={handleFileUpload}
			handleFileSelect={handleFileSelect}
		/>
	);
};
