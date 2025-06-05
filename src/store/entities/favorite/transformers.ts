import type { Image } from '@prisma/client';
import type { FavoriteViewConfig } from './types';

// 🔄 Transformar imágenes para la vista
export const transformImagesForView = (images: Image[], viewConfig: FavoriteViewConfig): Image[] => {
	const { sortBy, sortOrder } = viewConfig;

	return [...images].sort((a, b) => {
		const aValue = a[sortBy];
		const bValue = b[sortBy];

		if (typeof aValue === 'string' && typeof bValue === 'string') {
			return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
		}

		if (aValue instanceof Date && bValue instanceof Date) {
			return sortOrder === 'asc' ? aValue.getTime() - bValue.getTime() : bValue.getTime() - aValue.getTime();
		}

		return 0;
	});
};

// 🔍 Filtrar imágenes por criterio
export const filterImages = (images: Image[], filterBy: string | null): Image[] => {
	if (!filterBy) return images;

	const lowerFilter = filterBy.toLowerCase();
	return images.filter((image) => image.name.toLowerCase().includes(lowerFilter));
};

// 📊 Agrupar imágenes por criterio
export const groupImages = (images: Image[], groupBy: string | null): Record<string, Image[]> => {
	if (!groupBy) return { all: images };

	return images.reduce(
		(groups, image) => {
			const key = image[groupBy]?.toString() || 'otros';
			return {
				...groups,
				[key]: [...(groups[key] || []), image],
			};
		},
		{} as Record<string, Image[]>
	);
};

/**
 * Agrupa imágenes por un campo específico
 * @param images Lista de imágenes a agrupar
 * @param groupBy Campo por el que agrupar
 * @returns Objeto con imágenes agrupadas
 */
export function groupImagesByField(images: Image[], groupBy: keyof Image): Record<string, Image[]> {
	// Validar que el campo existe
	if (!images.length || !(groupBy in images[0])) {
		return {};
	}

	// Crear objeto para agrupar
	const result: Record<string, Image[]> = {};

	// Agrupar imágenes
	for (const image of images) {
		const key = image[groupBy]?.toString() || 'otros';
		if (!result[key]) {
			result[key] = [];
		}
		result[key].push(image);
	}

	return result;
}

/**
 * Agrupa imágenes favoritas por categoría
 * @param favorites Lista de favoritos
 * @returns Imágenes agrupadas por categoría
 */
export function groupFavoritesByCategory(favorites: FavoriteWithImage[]): Record<string, ImageWithFavorite[]> {
	// Extraer imágenes de favoritos
	const images = favorites.map((fav) => ({
		...fav.image,
		favoriteId: fav.id,
		favoriteCreatedAt: fav.createdAt,
	}));

	// Usar la función de agrupación
	return groupImagesByField(images, 'category');
}
