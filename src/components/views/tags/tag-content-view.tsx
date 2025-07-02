import { useCallback, useEffect, useState } from 'react';
// import { getTagImages } from '@/app/actions/tags'; // Función no encontrada, comentada
import { useTagStore } from '@/store/entities/tag';
import type { FileItem } from '@/types/files';

/**
 * 🏷️ Vista de contenido de etiquetas
 *
 * Muestra todas las imágenes asociadas a una etiqueta utilizando el componente EntityCard
 */
export function TagContentView() {
	const selectedId = useTagStore((state) => state.selectedId);
	const selectedTag = useTagStore((state) => state.items.find((tag) => tag.id === selectedId));

	const [_images, setImages] = useState<FileItem[]>([]);
	const [_isLoading, setIsLoading] = useState(false);

	// Función para cargar imágenes de la etiqueta
	const _fetchTagImages = useCallback(async (_tagId: string) => {
		// const images = await getTagImages(tagId);
		// return images as unknown as FileItem[];
		// Simulación mientras se encuentra la función correcta
		await new Promise((res) => setTimeout(res, 500));
		return [] as unknown as FileItem[];
	}, []);

	useEffect(() => {
		if (!selectedId) return;
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
		<div className="flex flex-col h-full w-full p-4">
			<h1 className="text-2xl font-bold mb-4">Imágenes con etiqueta: {selectedTag?.name || 'Cargando...'}</h1>

			<p className="text-muted-foreground mb-6">{selectedTag?._count?.images || 0} imágenes con esta etiqueta</p>

			<div className="text-center mt-8">
				<p className="text-muted-foreground">Componente TagContentView en desarrollo. Próximamente disponible.</p>
			</div>
		</div>
	);
}
