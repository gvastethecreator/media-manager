'use client';

import { getImages } from '@/app/actions/images/image-crud.actions';
import { EmptyState } from '@/components/core/data-display/empty-state/empty-state';
import { LoadingScreen } from '@/components/core/feedback';
import { FileBrowser } from '@/components/features/file-browser/file-browser';
import { useFiles } from '@/lib/contexts';
import { clientLogger } from '@/lib/logger/client-logger';
import { ImageIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

const viewLogger = clientLogger.withContext('AllImagesView');

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
					const fileItems = result.images.map((image: any) => {
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
							tags: image.tags?.map((tag: any) => tag.name) || [],
							collections: image.collections?.map((collection: any) => collection.name) || [],
							characters: image.characters?.map((character: any) => character.name) || [],
							places: image.places?.map((place: any) => place.name) || [],
							worldItems: image.worldItems?.map((item: any) => item.name) || [],
							concepts: image.concepts?.map((concept: any) => concept.name) || [],
							prompts: image.prompts?.map((prompt: any) => prompt.name) || [],
							notes: image.notes?.map((note: any) => note.name) || [],
							groups: image.groups?.map((group: any) => group.name) || [],
							properties: image.properties?.map((property: any) => property.name) || [],
							wildcards: image.wildcards?.map((wildcard: any) => wildcard.name) || [],
							favorite: image.isFavorite,
							isFavorite: image.isFavorite,
							thumbnail: thumbnailStr,
						};
					});

					// Actualizar el contexto con las imágenes obtenidas
					setFiles(fileItems as any);
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

	return (
		<>
			{/* Contenido original */}
			{error ? (
				<div className="flex h-full w-full items-center justify-center">
					<p className="text-destructive">Error: {error}</p>
				</div>
			) : isLoading ? (
				<LoadingScreen />
			) : (
				<div className="flex h-full w-full">
					{/* Contenido del FileBrowser */}
					{items && items.length > 0 ? (
						<FileBrowser items={items as any} onItemClick={handleSelectItem as any} />
					) : (
						<EmptyState
							icon={ImageIcon}
							title="No hay imágenes"
							description="No se encontraron imágenes en el sistema"
						/>
					)}
				</div>
			)}
		</>
	);
}
