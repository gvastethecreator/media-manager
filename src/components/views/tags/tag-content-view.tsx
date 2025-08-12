import { useCallback, useEffect, useState } from 'react';
// import { getTagImages } from '@/app/actions/tags'; // Función no encontrada, comentada
import { useTagStore } from '@/store/entities/tag';
import { useSelectedTag } from '@/store/entities/tag/selectors';
import type { EntityWithStats } from '@/types/entities/entity.types';

/**
 * 🏷️ Vista de contenido de etiquetas
 *
 * Muestra todas las imágenes asociadas a una etiqueta utilizando el componente EntityCard
 */
export function TagContentView() {
	const selectedId = useTagStore((state) => state.selectedId);
	const selectedTag = useSelectedTag();

	const [_images, setImages] = useState<EntityWithStats[]>([]);
	const [_isLoading, setIsLoading] = useState(false);

	// Función para cargar imágenes de la etiqueta
	const _fetchTagImages = useCallback(async (_tagId: string) => {
		// const images = await getTagImages(tagId);
		// return images as EntityWithStats[];
		// Simulación mientras se encuentra la función correcta
		await new Promise((res) => setTimeout(res, 500));
		return [] as EntityWithStats[];
	}, []);

	useEffect(() => {
		if (!selectedId) {
			return;
		}
		const fetchImages = async () => {
			setIsLoading(true);
			// const images = await getTagImages(currentTag.id);
			// setImages(images);
			// Simulación mientras se encuentra la función correcta
			await new Promise((res) => setTimeout(res, 500));
			setImages([]); // Poner un array vacío por ahora
			setIsLoading(false);
		};
		fetchImages();
	}, [selectedId]);

	// Renderizar el componente adecuadamente
	return (
		<div className="flex h-full w-full flex-col p-4">
			<h1 className="mb-4 font-bold text-2xl">Imágenes con etiqueta: {selectedTag?.name || 'Cargando...'}</h1>

			<p className="mb-6 text-muted-foreground">{selectedTag?._count?.images || 0} imágenes con esta etiqueta</p>

			<div className="mt-8 text-center">
				<p className="text-muted-foreground">Componente TagContentView en desarrollo. Próximamente disponible.</p>
			</div>
		</div>
	);
}
