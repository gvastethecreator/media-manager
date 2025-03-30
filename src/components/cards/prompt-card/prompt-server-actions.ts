'use server';

import { prisma } from '@/lib/prisma';

/**
 * Representa los datos de un prompt para la tarjeta
 */
export interface PromptCardData {
	/** Identificador único */
	id: string;
	/** Nombre del prompt */
	name: string;
	/** Emoji representativo */
	emoji?: string | null;
	/** Color principal en formato hex */
	color?: string | null;
	/** Descripción corta */
	description?: string | null;
	/** Propósito del prompt */
	purpose?: string | null;
	/** Contenido completo del prompt */
	content?: string | null;
	/** Categoría del prompt */
	category?: string | null;
	/** Parámetros parseados */
	parsedParameters?: Record<string, any>;
	/** Etiquetas parseadas */
	parsedTags?: string[];
	/** Parámetros en formato JSON */
	parameters?: string | null;
	/** Si está marcado como favorito */
	isFavorite?: boolean;
	/** Modelo de IA con el que fue creado */
	model?: string | null;
	/** URL de imagen destacada */
	featuredImage?: string | null;
	/** Fecha de creación */
	createdAt: Date;
	/** Fecha de última actualización */
	updatedAt: Date;
	/** Imágenes recientes generadas con este prompt */
	recentImages?: { id: string; thumbnailUrl: string }[];
	/** Contadores de relaciones */
	_count?: {
		images?: number;
		videos?: number;
		albums?: number;
		collections?: number;
		tags?: number;
		concepts?: number;
		notes?: number;
		characters?: number;
		places?: number;
		worldItems?: number;
		properties?: number;
		wildcards?: number;
		groups?: number;
	};
}

/**
 * Busca prompts en la base de datos
 */
export async function searchPrompts(
	query = '',
	limit = 50
): Promise<PromptCardData[]> {
	try {
		const prompts = await prisma.prompt.findMany({
			where: {
				OR: [
					{ name: { contains: query, mode: 'insensitive' } },
					{ description: { contains: query, mode: 'insensitive' } },
					{ content: { contains: query, mode: 'insensitive' } },
					{ purpose: { contains: query, mode: 'insensitive' } },
					{ parameters: { contains: query, mode: 'insensitive' } },
					{ category: { contains: query, mode: 'insensitive' } },
				],
			},
			orderBy: { updatedAt: 'desc' },
			take: limit,
			include: {
				_count: {
					select: {
						images: true,
						videos: true,
						albums: true,
						collections: true,
						tags: true,
						concepts: true,
						notes: true,
						characters: true,
						places: true,
						worldItems: true,
						properties: true,
						wildcards: true,
						groups: true,
					},
				},
				tags: {
					take: 10,
					select: {
						name: true
					}
				}
			},
		});

		// Procesar los prompts para la UI
		return await Promise.all(
			prompts.map(async (prompt) => {
				// Obtener imágenes recientes
				const recentImages = await getRecentPromptImages(prompt.id);

				// Parsear parámetros
				const parsedParameters = parseJsonField(prompt.parameters);

				// Extraer nombres de etiquetas
				const parsedTags = prompt.tags?.map(tag => tag.name) || [];

				return {
					...prompt,
					parsedParameters,
					parsedTags,
					recentImages,
					tags: undefined, // Eliminar campo original para no duplicar datos
				};
			})
		);
	} catch (error) {
		console.error('Error buscando prompts:', error);
		throw new Error('No se pudieron cargar los prompts');
	}
}

/**
 * Obtiene las imágenes recientes generadas con un prompt
 */
export async function getRecentPromptImages(promptId: string) {
	try {
		const images = await prisma.image.findMany({
			where: { promptId },
			orderBy: { createdAt: 'desc' },
			take: 6,
			select: {
				id: true,
				thumbnailUrl: true,
			},
		});

		return images;
	} catch (error) {
		console.error('Error cargando imágenes:', error);
		return [];
	}
}

/**
 * Obtiene un prompt específico por su ID
 */
export async function getPromptById(id: string): Promise<PromptCardData | null> {
	try {
		const prompt = await prisma.prompt.findUnique({
			where: { id },
			include: {
				_count: {
					select: {
						images: true,
						videos: true,
						albums: true,
						collections: true,
						tags: true,
						concepts: true,
						notes: true,
						characters: true,
						places: true,
						worldItems: true,
						properties: true,
						wildcards: true,
						groups: true,
					},
				},
				tags: {
					take: 10,
					select: {
						name: true
					}
				}
			},
		});

		if (!prompt) return null;

		// Obtener imágenes recientes
		const recentImages = await getRecentPromptImages(prompt.id);

		// Parsear parámetros
		const parsedParameters = parseJsonField(prompt.parameters);

		// Extraer nombres de etiquetas
		const parsedTags = prompt.tags?.map(tag => tag.name) || [];

		return {
			...prompt,
			parsedParameters,
			parsedTags,
			recentImages,
			tags: undefined, // Eliminar campo original para no duplicar datos
		};
	} catch (error) {
		console.error('Error obteniendo prompt:', error);
		return null;
	}
}

/**
 * Parsea un campo JSON
 */
function parseJsonField<T>(jsonString?: string | null): T | undefined {
	if (!jsonString) return undefined;

	try {
		return JSON.parse(jsonString) as T;
	} catch (error) {
		console.error('Error parseando JSON:', error);
		return undefined;
	}
}