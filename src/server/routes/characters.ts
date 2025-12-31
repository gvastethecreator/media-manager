import * as crypto from 'crypto';
import { and, asc, count, desc, eq, inArray, like, or } from 'drizzle-orm';
import express from 'express';
import { z } from 'zod';
import { db } from '@/lib/drizzle';
import { characters, imageCharacters, images } from '@/lib/drizzle/schema/index';
import type { ExpressHandler } from '@/lib/express-types';
import { serverLogger } from '@/lib/logger/server-logger';
import { toImageWithStats } from '@/transformers/image';

const router = express.Router();

// Schemas de validación
const CharacterFiltersSchema = z.object({
	search: z.string().optional(),
	limit: z.coerce.number().min(1).max(100).default(20),
	offset: z.coerce.number().min(0).default(0),
	sortBy: z.enum(['name', 'createdAt', 'updatedAt']).default('updatedAt'),
	sortOrder: z.enum(['asc', 'desc']).default('desc'),
	category: z.string().optional(),
	isFavorite: z.coerce.boolean().optional(),
});

const CharacterCreateSchema = z
	.object({
		name: z.string().min(1).max(255),
		description: z.string().optional().nullable(),
		emoji: z.string().optional().nullable(),
		color: z.string().optional().nullable(),
		category: z.string().optional().nullable(),
		isFavorite: z.boolean().optional(),
		age: z.string().optional().nullable(),
		gender: z.string().optional().nullable(),
		species: z.string().optional().nullable(),
		occupation: z.string().optional().nullable(),
		personality: z.string().optional().nullable(),
		background: z.string().optional().nullable(),
		relationships: z.string().optional().nullable(),
		skills: z.string().optional().nullable(),
		equipment: z.string().optional().nullable(),
		notes: z.string().optional().nullable(),
		featuredImage: z.string().optional().nullable(),
		parentId: z.string().optional().nullable(),
	})
	.passthrough();

const CharacterUpdateSchema = CharacterCreateSchema.partial().passthrough();

// GET /api/characters - Listar personajes
const getCharactersHandler: ExpressHandler = async (req, res) => {
	const parse = CharacterFiltersSchema.safeParse(req.query);
	if (!parse.success) {
		res.status(400).json({ error: 'Parámetros inválidos', details: parse.error.issues });
		return;
	}

	const { search, limit, offset, sortBy, sortOrder, category, isFavorite } = parse.data;

	try {
		const whereConditions = [];
		if (search) {
			whereConditions.push(
				or(
					like(characters.name, `%${search}%`),
					like(characters.description, `%${search}%`),
					like(characters.category, `%${search}%`)
				)
			);
		}
		if (category) {
			whereConditions.push(like(characters.category, `%${category}%`));
		}
		if (isFavorite !== undefined) {
			whereConditions.push(eq(characters.isFavorite, isFavorite));
		}

		const orderByColumn = characters[sortBy];
		const orderByClause = sortOrder === 'desc' ? desc(orderByColumn) : asc(orderByColumn);

		const [charactersData, totalResult] = await Promise.all([
			db.query.characters.findMany({
				where: and(...whereConditions),
				orderBy: orderByClause,
				limit,
				offset,
			}),
			db
				.select({ count: count() })
				.from(characters)
				.where(and(...whereConditions)),
		]);

		const total = totalResult[0].count;

		res.json({
			data: charactersData,
			pagination: {
				total,
				limit,
				offset,
				hasNext: offset + limit < total,
				hasPrev: offset > 0,
			},
		});
	} catch (error) {
		serverLogger.error('🚨 [ERROR] Error en /api/characters:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
};

router.get('/', getCharactersHandler);

// POST /api/characters - Crear personaje
router.post('/', async (req, res) => {
	const parse = CharacterCreateSchema.safeParse(req.body);
	if (!parse.success) {
		res.status(400).json({ error: 'Datos inválidos', details: parse.error.issues });
		return;
	}

	try {
		const data = parse.data;
		const newCharacter = {
			id: crypto.randomUUID(),
			name: data.name,
			description: data.description ?? null,
			emoji: data.emoji ?? '👤',
			color: data.color ?? '#3b82f6',
			category: data.category ?? null,
			isFavorite: data.isFavorite ?? false,
			age: data.age ?? null,
			gender: data.gender ?? null,
			species: data.species ?? null,
			occupation: data.occupation ?? null,
			personality: data.personality ?? null,
			background: data.background ?? null,
			relationships: data.relationships ?? null,
			skills: data.skills ?? null,
			equipment: data.equipment ?? null,
			notes: data.notes ?? null,
			featuredImage: data.featuredImage ?? null,
			parentId: data.parentId ?? null,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const [created] = await db.insert(characters).values(newCharacter).returning();
		res.status(201).json(created);
	} catch (error) {
		const msg = error instanceof Error ? error.message : String(error);
		if (msg.includes('UNIQUE') || msg.includes('Character_name_key')) {
			res.status(409).json({ error: 'Ya existe un personaje con ese nombre' });
			return;
		}
		serverLogger.error('Error creating character:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /api/characters/:id - Obtener personaje específico
const getCharacterByIdHandler: ExpressHandler = async (req, res) => {
	try {
		const { id } = req.params;

		const character = await db.query.characters.findFirst({
			where: eq(characters.id, id),
		});

		if (!character) {
			res.status(404).json({ error: 'Personaje no encontrado' });
			return;
		}

		res.json(character);
	} catch (error) {
		serverLogger.error('Error getting character:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
};

// GET /api/characters/:id/media - Obtener medios recientes de un personaje
// IMPORTANTE: Esta ruta debe estar ANTES de /:id para evitar que /:id capture 'media' como ID
router.get('/:id/media', async (req, res) => {
	try {
		const { id } = req.params;
		const limit = Number(req.query.limit) || 6;

		// Verificar que el personaje existe
		const character = await db.query.characters.findFirst({
			where: eq(characters.id, id),
		});
		if (!character) {
			res.status(404).json({ error: 'Personaje no encontrado' });
			return;
		}

		// Obtener imágenes recientes del personaje
		const recentImages = await db
			.select({
				id: images.id,
				name: images.name,
			})
			.from(images)
			.innerJoin(imageCharacters, eq(imageCharacters.A, images.id))
			.where(eq(imageCharacters.B, id))
			.orderBy(desc(images.updatedAt))
			.limit(limit);

		const thumbnails = recentImages.map((img: { id: string; name: string }) => ({
			id: img.id,
			name: img.name,
			thumbnailUrl: `/api/thumbnails/${img.id}`,
			url: `/api/images/${img.id}`,
			isVideo: false,
		}));

		res.json(thumbnails);
	} catch (error) {
		serverLogger.error('Error getting character media:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /api/characters/:id/images - Obtener imágenes de un personaje
// NOTE: Este endpoint existe para alinear el contrato con el cliente (useCharacterImages)
// IMPORTANTE: Esta ruta debe estar ANTES de /:id
router.get('/:id/images', async (req, res) => {
	try {
		const { id } = req.params;

		// Verificar que el personaje existe
		const character = await db.query.characters.findFirst({
			where: eq(characters.id, id),
		});
		if (!character) {
			res.status(404).json({ error: 'Personaje no encontrado' });
			return;
		}

		// Obtener IDs de imágenes asociadas (A=imageId, B=characterId)
		const relations = await db
			.select({ imageId: imageCharacters.A })
			.from(imageCharacters)
			.where(eq(imageCharacters.B, id));

		const imageIds = relations
			.map((r: { imageId: string | null }) => r.imageId)
			.filter((id: string | null): id is string => Boolean(id));
		if (imageIds.length === 0) {
			res.json([]);
			return;
		}

		// Cargar imágenes (sin includes pesados; el transformer completa stats por defecto)
		const drizzleImages = await db.query.images.findMany({
			where: inArray(images.id, imageIds),
			orderBy: desc(images.updatedAt),
		});

		res.json(drizzleImages.map((img: unknown) => toImageWithStats(img as any)));
	} catch (error) {
		serverLogger.error('Error getting character images:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

router.get('/:id', getCharacterByIdHandler);

// PUT /api/characters/:id - Actualizar personaje
router.put('/:id', async (req, res) => {
	const { id } = req.params;
	const parse = CharacterUpdateSchema.safeParse(req.body);
	if (!parse.success) {
		res.status(400).json({ error: 'Datos inválidos', details: parse.error.issues });
		return;
	}

	try {
		const existing = await db.query.characters.findFirst({ where: eq(characters.id, id) });
		if (!existing) {
			res.status(404).json({ error: 'Personaje no encontrado' });
			return;
		}

		const data = parse.data;
		const updateData: Record<string, unknown> = {
			updatedAt: new Date(),
		};

		// Solo aplicar campos presentes (undefined => no tocar)
		if (data.name !== undefined) updateData.name = data.name;
		if (data.description !== undefined) updateData.description = data.description;
		if (data.emoji !== undefined) updateData.emoji = data.emoji;
		if (data.color !== undefined) updateData.color = data.color;
		if (data.category !== undefined) updateData.category = data.category;
		if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite;
		if (data.age !== undefined) updateData.age = data.age;
		if (data.gender !== undefined) updateData.gender = data.gender;
		if (data.species !== undefined) updateData.species = data.species;
		if (data.occupation !== undefined) updateData.occupation = data.occupation;
		if (data.personality !== undefined) updateData.personality = data.personality;
		if (data.background !== undefined) updateData.background = data.background;
		if (data.relationships !== undefined) updateData.relationships = data.relationships;
		if (data.skills !== undefined) updateData.skills = data.skills;
		if (data.equipment !== undefined) updateData.equipment = data.equipment;
		if (data.notes !== undefined) updateData.notes = data.notes;
		if (data.featuredImage !== undefined) updateData.featuredImage = data.featuredImage;
		if (data.parentId !== undefined) updateData.parentId = data.parentId;

		const [updated] = await db
			.update(characters)
			.set(updateData as any)
			.where(eq(characters.id, id))
			.returning();

		res.json(updated);
	} catch (error) {
		serverLogger.error('Error updating character:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// DELETE /api/characters/:id - Eliminar personaje
router.delete('/:id', async (req, res) => {
	try {
		const { id } = req.params;

		const existing = await db.query.characters.findFirst({ where: eq(characters.id, id) });
		if (!existing) {
			res.status(404).json({ error: 'Personaje no encontrado' });
			return;
		}

		// Limpiar relaciones (A=imageId, B=characterId)
		await db.delete(imageCharacters).where(eq(imageCharacters.B, id));
		await db.delete(characters).where(eq(characters.id, id));

		res.status(204).send();
	} catch (error) {
		serverLogger.error('Error deleting character:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// POST /api/characters/:id/images/:imageId - Agregar imagen a personaje
router.post('/:id/images/:imageId', async (req, res) => {
	try {
		const { id, imageId } = req.params;

		const character = await db.query.characters.findFirst({
			where: eq(characters.id, id),
		});
		if (!character) {
			res.status(404).json({ error: 'Personaje no encontrado' });
			return;
		}

		const image = await db.query.images.findFirst({
			where: eq(images.id, imageId),
		});
		if (!image) {
			res.status(404).json({ error: 'Imagen no encontrada' });
			return;
		}

		// A=imageId, B=characterId
		const existingRelation = await db
			.select()
			.from(imageCharacters)
			.where(and(eq(imageCharacters.A, imageId), eq(imageCharacters.B, id)))
			.limit(1);

		if (existingRelation.length > 0) {
			res.status(200).json({ message: 'La imagen ya está asociada al personaje', alreadyExists: true });
			return;
		}

		await db.insert(imageCharacters).values({ A: imageId, B: id });
		serverLogger.info(`✅ Imagen ${imageId} agregada a personaje ${id}`);
		res.status(201).json({ message: 'Imagen agregada al personaje exitosamente' });
	} catch (error) {
		serverLogger.error('Error adding image to character:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// DELETE /api/characters/:id/images/:imageId
router.delete('/:id/images/:imageId', async (req, res) => {
	try {
		const { id, imageId } = req.params;
		await db.delete(imageCharacters).where(and(eq(imageCharacters.A, imageId), eq(imageCharacters.B, id)));
		serverLogger.info(`✅ Imagen ${imageId} removida de personaje ${id}`);
		res.status(200).json({ message: 'Imagen removida del personaje' });
	} catch (error) {
		serverLogger.error('Error removing image from character:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

export default router;
