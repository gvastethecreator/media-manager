'use server';

import { getPrismaClient } from '@/lib/database/db';
import type { PropertyComplete as Property } from '@/types/prisma';

export interface PropertyCardData extends Property {
	_count: {
		images: number;
		videos: number;
		notes: number;
		concepts: number;
		prompts: number;
		wildcards: number;
	};
	recentImages?: string[];
}

/**
 * Obtiene los datos de una propiedad para mostrar en una tarjeta
 */
export async function getPropertyCardData(propertyId: string): Promise<PropertyCardData> {
	const prisma = await getPrismaClient();

	const property = await prisma.property.findUnique({
		where: {
			id: propertyId,
		},
		include: {
			_count: {
				select: {
					images: true,
					videos: true,
					notes: true,
					concepts: true,
					prompts: true,
					wildcards: true,
				},
			},
		},
	});

	if (!property) {
		throw new Error(`Propiedad no encontrada: ${propertyId}`);
	}

	// Obtener imágenes recientes relacionadas con esta propiedad
	const recentImages = await prisma.image.findMany({
		where: {
			properties: {
				some: {
					id: propertyId,
				},
			},
		},
		select: {
			id: true,
			path: true,
			thumbnailWidth: true,
			thumbnailHeight: true,
		},
		orderBy: {
			updatedAt: 'desc',
		},
		take: 4,
	});

	const recentImagePaths = recentImages.map((img: { id: string }) => {
		// Convertir la ruta del sistema a una URL para el navegador
		const imagePath = `/api/thumbnails/${img.id}`;
		return imagePath;
	});

	return {
		...property,
		recentImages: recentImagePaths,
	};
}

/**
 * Obtiene una lista de propiedades para mostrar en una galería de tarjetas
 */
export async function getPropertiesForCards(options: {
	limit?: number;
	category?: string;
	searchTerm?: string;
	orderBy?: 'name' | 'updatedAt' | 'createdAt';
	orderDir?: 'asc' | 'desc';
}) {
	const { limit = 20, category, searchTerm, orderBy = 'updatedAt', orderDir = 'desc' } = options;

	const prisma = await getPrismaClient();

	const properties = await prisma.property.findMany({
		where: {
			...(category ? { category } : {}),
			...(searchTerm
				? {
						OR: [{ name: { contains: searchTerm } }, { description: { contains: searchTerm } }],
					}
				: {}),
		},
		include: {
			_count: {
				select: {
					images: true,
					videos: true,
					notes: true,
					concepts: true,
					prompts: true,
					wildcards: true,
				},
			},
		},
		orderBy: {
			[orderBy]: orderDir,
		},
		take: limit,
	});

	return properties;
}
