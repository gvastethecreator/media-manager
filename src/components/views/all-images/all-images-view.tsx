import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
// import { useAutoFolderIndexing } from '@/hooks/use-auto-folder-indexing'; // Deshabilitado temporalmente
import { clientLogger } from '@/lib/logger/client-logger';
import { useImageStore } from '@/store/entities/image';
import { useImageViewer } from '@/store/image-viewer.store';
import type { ImageWithStats } from '@/types/entities/image';
import type { AnyEntityWithStats, EntityWithStats } from '@/types/migration';
import { isImageWithStats } from '@/types/migration';
import type { ViewProps } from '../types';
import AllImagesContentView from './all-images-content-view';

const viewLogger = clientLogger.withContext('AllImagesView');

/**
 * Vista principal de todas las imágenes
 * Muestra una galería con todas las imágenes disponibles
 */
export const AllImagesView = function AllImagesView(_props: ViewProps) {
	// Usar selectores individuales para evitar recrear objetos
	const imagesRecord = useImageStore((s) => s.images);
	const isLoading = useImageStore((s) => s.isLoading);
	const error = useImageStore((s) => s.error);
	const loadImages = useImageStore((s) => s.loadImages);

	// Calcular la cantidad de imágenes
	const imageCount = Object.keys(imagesRecord || {}).length;

	// 🚀 PERFORMANCE FIX: Crear sorted images de manera estable usando useMemo
	const sortedImages = useMemo(() => {
		const images = Object.values(imagesRecord || {});

		// Solo crear nuevo array si hay imágenes
		if (images.length === 0) {
			return [];
		}

		// Ordenar sin mutar el array original
		return images.slice().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
	}, [imagesRecord]); // Solo depende del record de imágenes

	// Auto-indexing deshabilitado temporalmente para evitar loops infinitos
	// TODO: Re-habilitar una vez corregido el problema de re-renders
	// const { status, isIndexing, progress, startIndexing } = useAutoFolderIndexing({
	//   autoStart: true,
	//   maxFoldersPerBatch: 2,
	//   checkInterval: 5 * 60 * 1000, // 5 minutos
	//   onIndexingComplete: (status) => {
	//     logger.info('✅ Auto-indexing completado:', status);
	//   },
	// });

	// Valores por defecto mientras auto-indexing está deshabilitado
	const status = {
		isIndexing: false,
		indexedFolders: 0,
		totalFolders: 0,
		currentFolder: null,
		errors: [],
	};
	const isIndexing = false;
	const progress = 0;
	const startIndexing = () => {
		viewLogger.info('Auto-indexing está temporalmente deshabilitado');
	};

	// Flag para controlar si ya se intentó cargar las imágenes
	const hasTriedToLoad = useRef(false);

	useEffect(() => {
		console.log('🔍 DEBUG AllImagesView: useEffect ejecutado');
		console.log('🔍 DEBUG AllImagesView: imageCount:', imageCount);
		console.log('🔍 DEBUG AllImagesView: hasTriedToLoad:', hasTriedToLoad.current);

		// Solo cargar la primera vez cuando el componente se monta
		if (!hasTriedToLoad.current && imageCount === 0 && !isLoading) {
			hasTriedToLoad.current = true;
			console.log('🚀 DEBUG AllImagesView: Store de imágenes vacío, llamando loadImages()');
			viewLogger.info('Store de imágenes vacío, cargando desde el servidor...');
			loadImages();
		} else {
			console.log('✅ DEBUG AllImagesView: Ya se intentó cargar o no es necesario');
		}
	}, [imageCount, isLoading, loadImages]); // Dependencias necesarias

	const navigate = useNavigate();
	const { openViewer } = useImageViewer();

	const handleImageClick = useCallback((item: AnyEntityWithStats) => {
		// Verificar que sea una imagen usando type guard
		if (isImageWithStats(item)) {
			const image = item as ImageWithStats;
			viewLogger.info('🖱️ Click en imagen:', image.name);

			// Navegar a la vista de detalle de imagen
			// Por ahora mantenemos en la misma vista
			viewLogger.info('Imagen seleccionada:', image.name);
		} else {
			viewLogger.warn('⚠️ Item clickeado no es una imagen:', item);
		}
	}, []);

	const handleImageDoubleClick = useCallback(
		(item: AnyEntityWithStats) => {
			// Verificar que sea una imagen usando type guard
			if (isImageWithStats(item)) {
				const image = item as ImageWithStats;
				viewLogger.info('🖱️ Doble click en imagen:', image.name);

				// Abrir visor de imágenes
				const imageEntities = (sortedImages || []).filter((img: AnyEntityWithStats) =>
					isImageWithStats(img)
				) as EntityWithStats[];

				const currentIndex = imageEntities.findIndex((img: EntityWithStats) => img.id === image.id);
				openViewer(imageEntities, currentIndex);
			} else {
				viewLogger.warn('⚠️ Item con doble click no es una imagen:', item);
			}
		},
		[sortedImages, openViewer]
	);

	// Función para manejar el upload de archivos
	const handleFileUpload = useCallback(
		async (_files: File[]) => {
			// Esto debería ser manejado por el content view, pero aquí se recargan las imágenes
			loadImages({ refresh: true });
		},
		[loadImages]
	);

	const handleFileSelect = useCallback((_event: React.ChangeEvent<HTMLInputElement>) => {
		// Esto debería ser manejado por el content view
	}, []);

	return (
		<AllImagesContentView
			error={error}
			handleFileSelect={handleFileSelect}
			handleFileUpload={handleFileUpload}
			handleImageClick={handleImageClick}
			handleImageDoubleClick={handleImageDoubleClick}
			images={sortedImages}
			indexingStatus={status}
			isIndexing={isIndexing}
			isLoading={isLoading}
			progress={progress}
			startIndexing={startIndexing}
		/>
	);
};
