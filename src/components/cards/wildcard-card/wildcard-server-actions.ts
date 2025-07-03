'use server';

import { db } from '@/lib/drizzle';
import { wildcards, images } from '@/lib/drizzle/schema';
import { eq, and, inArray, like, or, desc, asc } from 'drizzle-orm';

export interface WildcardCardData {
	id: string;
	name: string;
	emoji: string;
	color: string;
	description: string | null;
	category: string | null;
	featuredImage: string | null;
	isFavorite: boolean;
	createdAt: Date;
	updatedAt: Date;
	shortcut: string | null;
	parentId: string | null;
	// El children puede ser un string en la entidad original pero aquí lo procesamos como array
	children?: any[];
	_count: {
		images: number;
		videos: number;
		childWildcards: number;
	};
	recentImages?: string[];
}

/**
 * Obtiene los datos de un comodín para mostrar en una tarjeta
 */
export async function getWildcardCardData(wildcardId: string): Promise<WildcardCardData> {
	const wildcard = await db.query.wildcards.findFirst({
		where: eq(wildcards.id, wildcardId),
		with: {
			images: { columns: { id: true } },
			videos: { columns: { id: true } },
			childWildcards: { columns: { id: true } },
		},
	});

	if (!wildcard) {
		throw new Error(`Comodín no encontrado: ${wildcardId}`);
	}

	// Obtener imágenes recientes relacionadas con este comodín
	const recentImages = await db.query.images.findMany({
		where: inArray(images.id, wildcard.images.map((img) => img.id)),
		columns: {
			id: true,
			path: true,
			thumbnailWidth: true,
			thumbnailHeight: true,
		},
		orderBy: images.updatedAt,
		limit: 4,
	});

	const recentImagePaths = recentImages.map((img: { id: string }) => {
		// Convertir la ruta del sistema a una URL para el navegador
		const imagePath = `/api/thumbnails/${img.id}`;
		return imagePath;
	});

	// Intentar parsear el campo children si existe
	let children = [];
	if (typeof wildcard.children === 'string' && wildcard.children !== 'empty_array') {
		try {
			children = JSON.parse(wildcard.children);
		} catch (e) {
			console.error('Error parsing wildcard children:', e);
		}
	}

	return {
		...wildcard,
		_count: {
			images: wildcard.images.length,
			videos: wildcard.videos.length,
			childWildcards: wildcard.childWildcards.length,
		},
		recentImages: recentImagePaths,
		children,
	};
}

/**
 * Obtiene una lista de comodines para mostrar en una galería de tarjetas
 */
export async function getWildcardsForCards(options: {
	limit?: number;
	category?: string;
	parentId?: string | null;
	searchTerm?: string;
	orderBy?: 'name' | 'updatedAt' | 'createdAt';
	orderDir?: 'asc' | 'desc';
}) {
	const { limit = 20, category, parentId, searchTerm, orderBy = 'updatedAt', orderDir = 'desc' } = options;

	const whereConditions = [];
	if (category) {
		whereConditions.push(eq(wildcards.category, category));
	}
	if (parentId !== undefined) {
		whereConditions.push(eq(wildcards.parentId, parentId));
	}
	if (searchTerm) {
		whereConditions.push(
			or(
				like(wildcards.name, `%${searchTerm}%`),
				like(wildcards.description, `%${searchTerm}%`),
			),
		);
	}

	const orderByColumn = wildcards[orderBy];
	const orderByClause = orderDir === 'desc' ? desc(orderByColumn) : asc(orderByColumn);

	const wildcardsData = await db.query.wildcards.findMany({
		where: and(...whereConditions),
		with: {
			images: { columns: { id: true } },
			videos: { columns: { id: true } },
			childWildcards: { columns: { id: true } },
		},
		orderBy: orderByClause,
		limit: limit,
	});

	return wildcardsData.map((wildcard) => ({
		...wildcard,
		_count: {
			images: wildcard.images.length,
			videos: wildcard.videos.length,
			childWildcards: wildcard.childWildcards.length,
		},
	}));
}
