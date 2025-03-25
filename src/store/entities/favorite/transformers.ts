import type { Image } from '@prisma/client';
import type { FavoriteViewConfig } from './types';

// 🔄 Transformar imágenes para la vista
export const transformImagesForView = (
	images: Image[],
	viewConfig: FavoriteViewConfig
): Image[] => {
	const { sortBy, sortOrder } = viewConfig;

	return [...images].sort((a, b) => {
		const aValue = a[sortBy];
		const bValue = b[sortBy];

		if (typeof aValue === 'string' && typeof bValue === 'string') {
			return sortOrder === 'asc'
				? aValue.localeCompare(bValue)
				: bValue.localeCompare(aValue);
		}

		if (aValue instanceof Date && bValue instanceof Date) {
			return sortOrder === 'asc'
				? aValue.getTime() - bValue.getTime()
				: bValue.getTime() - aValue.getTime();
		}

		return 0;
	});
};

// 🔍 Filtrar imágenes por criterio
export const filterImages = (images: Image[], filterBy: string | null): Image[] => {
	if (!filterBy) return images;

	const lowerFilter = filterBy.toLowerCase();
	return images.filter((image) =>
		image.name.toLowerCase().includes(lowerFilter)
	);
};

// 📊 Agrupar imágenes por criterio
export const groupImages = (images: Image[], groupBy: string | null): Record<string, Image[]> => {
	if (!groupBy) return { all: images };

	return images.reduce((groups, image) => {
		const key = image[groupBy]?.toString() || 'otros';
		return {
			...groups,
			[key]: [...(groups[key] || []), image],
		};
	}, {} as Record<string, Image[]>);
};