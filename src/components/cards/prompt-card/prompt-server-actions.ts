'use server';

import { getPrismaClient } from '@/lib/database/db';

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
	parsedParameters?: Record<string, any> | null;
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
export async function searchPrompts(query = '', limit = 50): Promise<PromptCardData[]> {
	try {
		const prisma = await getPrismaClient();

		const prompts = await prisma.prompt.findMany({
			where: {
				OR: [
					{ name: { contains: query } },
					{ description: { contains: query } },
					{ content: { contains: query } },
					{ purpose: { contains: query } },
					{ parameters: { contains: query } },
					{ category: { contains: query } },
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
						name: true,
					},
				},
			},
		});

		// Procesar los prompts para la UI
		const processedPrompts = await Promise.all(
			prompts.map(async (prompt) => {
				// Obtener imágenes recientes
				const recentImages = await getRecentPromptImages(prompt.id);

				// Parsear parámetros
				let parsedParameters: Record<string, any> | null = null;
				try {
					if (prompt.parameters) {
						parsedParameters = JSON.parse(prompt.parameters);
					}
				} catch (error) {
					console.error('Error al parsear parámetros:', error);
				}

				// Extraer nombres de etiquetas si están disponibles
				const parsedTags = prompt.tags ? prompt.tags.map((tag) => tag.name) : [];

				return {
					...prompt,
					parsedParameters,
					parsedTags,
					recentImages,
					tags: undefined, // Eliminar campo original para no duplicar datos
				} as PromptCardData;
			})
		);

		return processedPrompts;
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
		const prisma = await getPrismaClient();

		const images = await prisma.image.findMany({
			where: {
				prompts: {
					some: {
						id: promptId,
					},
				},
			},
			orderBy: { createdAt: 'desc' },
			take: 6,
			select: {
				id: true,
				thumbnail: true,
			},
		});

		// Transformar a formato requerido
		return images.map((image) => ({
			id: image.id,
			thumbnailUrl: image.thumbnail ? `data:image/jpeg;base64,${Buffer.from(image.thumbnail).toString('base64')}` : '',
		}));
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
		const prisma = await getPrismaClient();

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
						name: true,
					},
				},
			},
		});

		if (!prompt) return null;

		// Obtener imágenes recientes
		const recentImages = await getRecentPromptImages(prompt.id);

		// Parsear parámetros
		let parsedParameters: Record<string, any> | null = null;
		try {
			if (prompt.parameters) {
				parsedParameters = JSON.parse(prompt.parameters);
			}
		} catch (error) {
			console.error('Error al parsear parámetros:', error);
		}

		// Extraer nombres de etiquetas
		const parsedTags = prompt.tags ? prompt.tags.map((tag) => tag.name) : [];

		return {
			...prompt,
			parsedParameters,
			parsedTags,
			recentImages,
			tags: undefined, // Eliminar campo original para no duplicar datos
		} as PromptCardData;
	} catch (error) {
		console.error('Error obteniendo prompt:', error);
		return null;
	}
}

/**
 * Parsea un campo JSON
 */
function _parseJsonField<T>(jsonString?: string | null): T | null {
	if (!jsonString) return null;

	try {
		return JSON.parse(jsonString) as T;
	} catch (error) {
		console.error('Error parseando JSON:', error);
		return null;
	}
}
