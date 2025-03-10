'use server';

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/server/events.server';
import { type ServerImage, convertServerImageToFileItem } from '@/services/image-converter.service';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats.service';
import type { FileItem } from '@/types/file-item';
import type { Concept as PrismaConcept } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const conceptLogger = logger.withContext('ConceptActions');

const REVALIDATE_PATHS = ['/settings', '/concepts', '/concepts/[id]'] as const;

const revalidateAllPaths = async () => {
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path);
	}
	conceptLogger.info('🔄 Rutas revalidadas');
};

class ConceptError extends Error {
	constructor(
		message: string,
		public cause?: unknown
	) {
		super(message);
		this.name = 'ConceptError';
	}
}

export interface ConceptCreate {
	name: string;
	emoji?: string;
	description?: string | null;
	color?: string;
	content?: string;
	category?: string;
	tags?: string;
	featuredImage?: string | null;
}

export interface ConceptUpdate extends Partial<ConceptCreate> {
	id: string;
}

export interface Concept extends PrismaConcept {
	count?: number;
}

export interface ConceptWithStats extends PrismaConcept {
	_count: {
		prompts: number;
		notes: number;
		characters: number;
		places: number;
		objects: number;
	};
	lastUpdated: Date;
}

export interface ConceptWithImages extends PrismaConcept {
	images: FileItem[];
}

export interface ExtendedConcept extends PrismaConcept {
	characters: {
		images: PrismaConcept[];
	}[];
	places: {
		images: PrismaConcept[];
	}[];
	objects: {
		images: PrismaConcept[];
	}[];
}

export async function getConcepts(): Promise<ConceptWithStats[]> {
	try {
		conceptLogger.info('💡 Obteniendo conceptos con estadísticas');

		// Obtener conceptos con conteos y estadísticas
		const concepts = await prisma.concept.findMany({
			include: {
				_count: {
					select: {
						prompts: true,
						notes: true,
						characters: true,
						places: true,
						objects: true,
					},
				},
			},
			orderBy: [
				{
					name: 'asc',
				},
			],
		});

		// Mapear conceptos a formato con estadísticas
		const conceptsWithStats = concepts.map((concept) => ({
			...concept,
			_count: concept._count,
			lastUpdated: concept.updatedAt,
		}));

		conceptLogger.info('✅ Conceptos obtenidos', { count: concepts.length });
		return conceptsWithStats;
	} catch (error) {
		conceptLogger.error('❌ Error al obtener conceptos', error);
		throw new ConceptError('No se pudieron obtener los conceptos');
	}
}

export async function getConcept(id: string): Promise<Concept> {
	try {
		conceptLogger.info('🔍 Obteniendo concepto:', id);
		const concept = await prisma.concept.findUnique({
			where: { id },
			include: {
				_count: {
					select: {
						prompts: true,
						notes: true,
						characters: true,
						places: true,
						objects: true,
					},
				},
			},
		});

		if (!concept) {
			throw new ConceptError('Concepto no encontrado');
		}

		conceptLogger.info('✅ Concepto obtenido:', concept.name);
		return {
			...concept,
			count: Object.values(concept._count).reduce((acc, count) => acc + count, 0),
		};
	} catch (error) {
		conceptLogger.error('❌ Error al obtener concepto:', error);
		if (error instanceof ConceptError) {
			throw error;
		}
		throw new ConceptError('No se pudo obtener el concepto', error);
	}
}

export async function createConcept(data: ConceptCreate): Promise<Concept> {
	try {
		conceptLogger.info('📝 Creando concepto:', data.name);
		const concept = await prisma.concept.create({
			data: {
				name: data.name,
				emoji: data.emoji || '💡',
				description: data.description || null,
				color: data.color || '#3b82f6',
				content: data.content || '',
				category: data.category || 'general',
				tags: data.tags || '[]',
				featuredImage: data.featuredImage || null,
			},
		});

		// Emitir eventos
		await emit({
			type: 'concepts:modified',
			data: { action: 'create', concept },
		});
		statsEventEmitter.emit(STATS_EVENTS.CONCEPT_CHANGE);

		conceptLogger.info('✅ Concepto creado:', concept.name);
		await revalidateAllPaths();
		return concept;
	} catch (error) {
		conceptLogger.error('❌ Error al crear concepto:', error);
		throw new ConceptError('No se pudo crear el concepto', error);
	}
}

export async function updateConcept(id: string, data: ConceptUpdate): Promise<Concept> {
	try {
		conceptLogger.info('📝 Actualizando concepto:', id);
		const concept = await prisma.concept.update({
			where: { id },
			data,
		});

		// Emitir eventos
		await emit({
			type: 'concepts:modified',
			id,
			data: { action: 'update', concept },
		});
		statsEventEmitter.emit(STATS_EVENTS.CONCEPT_CHANGE);

		conceptLogger.info('✅ Concepto actualizado:', concept.name);
		await revalidateAllPaths();
		return concept;
	} catch (error) {
		conceptLogger.error('❌ Error al actualizar concepto:', error);
		throw new ConceptError('No se pudo actualizar el concepto', error);
	}
}

export async function deleteConcept(id: string): Promise<void> {
	try {
		conceptLogger.info('🗑️ Eliminando concepto:', id);
		await prisma.concept.delete({
			where: { id },
		});

		// Emitir eventos
		await emit({
			type: 'concepts:modified',
			id,
			data: { action: 'delete', id },
		});
		statsEventEmitter.emit(STATS_EVENTS.CONCEPT_CHANGE);

		conceptLogger.info('✅ Concepto eliminado');
		await revalidateAllPaths();
	} catch (error) {
		conceptLogger.error('❌ Error al eliminar concepto:', error);
		throw new ConceptError('No se pudo eliminar el concepto', error);
	}
}

export async function getConceptImages(id: string) {
	try {
		conceptLogger.info('🖼️ Obteniendo imágenes del concepto:', id);
		const concept = (await prisma.concept.findUnique({
			where: { id },
			include: {
				characters: {
					include: {
						images: {
							include: {
								tags: true,
								collections: true,
								albums: true,
								stats: true,
							},
						},
					},
				},
				places: {
					include: {
						images: {
							include: {
								tags: true,
								collections: true,
								albums: true,
								stats: true,
							},
						},
					},
				},
				objects: {
					include: {
						images: {
							include: {
								tags: true,
								collections: true,
								albums: true,
								stats: true,
							},
						},
					},
				},
			},
		})) as ExtendedConcept | null;

		if (!concept) {
			throw new ConceptError('Concepto no encontrado');
		}

		const images = [
			...concept.characters.flatMap((char) => char.images),
			...concept.places.flatMap((place) => place.images),
			...concept.objects.flatMap((obj) => obj.images),
		].map((img) => convertServerImageToFileItem(img as ServerImage));

		conceptLogger.info(`✅ ${images.length} imágenes obtenidas`);
		return images;
	} catch (error) {
		conceptLogger.error('❌ Error al obtener imágenes del concepto:', error);
		throw new ConceptError('No se pudieron obtener las imágenes del concepto', error);
	}
}
