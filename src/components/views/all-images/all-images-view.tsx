'use client';

import { getImages } from '@/app/actions/images/image-crud.actions';
import type { ImageResult } from '@/app/actions/images/image-types.actions';
import { BaseContentView, ContentViewProvider } from '@/components/views/base';
import type { BaseContentProps } from '@/components/views/base';
import { clientEvents } from '@/lib/client/events.client';
import { useFiles } from '@/lib/contexts';
import { serverLogger } from '@/lib/logger/server-logger';
import type { FileItem as FileItemType } from '@/types/file-item';
import { ImageIcon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

const viewLogger = serverLogger.withContext('AllImagesView');

export function AllImagesView() {
	const { currentItems: items, handleSelectItem, isLoading: contextLoading, setFiles } = useFiles();
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Cargar todas las imágenes al montar el componente
	useEffect(() => {
		const loadImages = async () => {
			try {
				setIsLoading(true);
				viewLogger.info('🔄 Cargando todas las imágenes...');

				const result = await getImages({
					page: 1,
					pageSize: 100,
					sortBy: 'createdAt',
					sortOrder: 'desc',
				});

				if (result?.images) {
					// Transformar las imágenes al formato FileItem del contexto
					const fileItems = result.images.map((image: ImageResult) => {
						// Convertir thumbnail si existe
						let thumbnailStr: string | undefined = undefined;
						if (image.thumbnail) {
							thumbnailStr = `data:image/webp;base64,${Buffer.from(image.thumbnail).toString('base64')}`;
						}

						return {
							id: image.id,
							name: image.name,
							path: image.path,
							size: image.size,
							type: 'image',
							modified: new Date(image.updatedAt),
							metadata: {
								width: image.width,
								height: image.height,
								format: 'image/webp',
							},
							tags: image.tags?.map((tag) => tag.name) || [],
							collections: image.collections?.map((collection) => collection.name) || [],
							characters: [],
							places: [],
							worldItems: [],
							favorite: image.isFavorite,
							isFavorite: image.isFavorite,
							thumbnail: thumbnailStr,
						};
					});

					// Actualizar el contexto con las imágenes obtenidas
					setFiles(fileItems as unknown as typeof fileItems);
					viewLogger.info(`✅ ${fileItems.length} imágenes cargadas`);
				} else {
					setError('No se pudieron obtener las imágenes');
				}
			} catch (err) {
				viewLogger.error('❌ Error cargando imágenes:', err);
				setError('Error cargando las imágenes');
			} finally {
				setIsLoading(false);
			}
		};

		loadImages();
	}, [setFiles]);

	// Adaptar items del contexto al tipo FileItem requerido por BaseContentProps
	const adaptedItems = useMemo<FileItemType[]>(() => {
		return items.map((item) => ({
			id: item.id,
			hash: item.id, // Usamos el ID como hash si no existe
			name: item.name,
			path: item.path,
			type: 'image',
			size: item.size,
			width: item.metadata?.width || 0,
			height: item.metadata?.height || 0,
			metadata: item.metadata ? JSON.stringify(item.metadata) : null,
			thumbnail: item.thumbnail || null,
			thumbnailSize: null,
			thumbnailWidth: null,
			thumbnailHeight: null,
			thumbnailError: null,
			thumbnailErrorAt: null,
			thumbnailOptimizedAt: null,
			isPublic: false,
			isFavorite: item.isFavorite || item.favorite || false,
			folderId: '',
			createdAt: new Date(),
			updatedAt: new Date(),
			collections: (item.collections || []).map((c) => ({ id: c, name: c })),
			tags: (item.tags || []).map((t) => ({
				id: t,
				name: t,
				color: '#cccccc',
			})),
			albums: [],
			characters: (item.characters || []).map((c) => ({ id: c, name: c })),
			places: (item.places || []).map((p) => ({ id: p, name: p })),
			worldItems: (item.worldItems || []).map((w) => ({ id: w, name: w })),
			concepts: [],
			prompts: [],
			notes: [],
		}));
	}, [items]);

	// Usar el hook de eventos optimistas del cliente con el tipo adaptado
	const [optimisticItems, _addEvent] = clientEvents.useEvents<FileItemType[]>(adaptedItems);

	// Manejador de selección de elementos
	const toggleItemSelection = useCallback(
		(fileItem: FileItemType, isMultiSelect = false) => {
			viewLogger.info('Seleccionando item:', {
				itemId: fileItem.id,
				isMultiSelect,
			});

			// Encontramos el item original por ID para pasar al handler
			const originalItem = items.find((item) => item.id === fileItem.id);
			if (originalItem) {
				handleSelectItem(originalItem);
			}
		},
		[items, handleSelectItem]
	);

	// Propiedades para el ContentViewProvider
	const contentProps: BaseContentProps = {
		items: optimisticItems, // Usamos los items optimistas
		isLoading: isLoading || contextLoading,
		toggleItemSelection,
		error,
		emptyState: {
			icon: ImageIcon,
			title: 'No hay imágenes',
			description:
				'No se encontraron imágenes en el sistema. Agrega imágenes desde el panel de configuración o arrastra y suelta archivos aquí.',
		},
	};

	return (
		<ContentViewProvider {...contentProps}>
			<BaseContentView />
		</ContentViewProvider>
	);
}
