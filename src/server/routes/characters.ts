import { and, asc, count, desc, eq, like, or } from 'drizzle-orm';
import { serverLogger } from '@/lib/logger/server-logger';
import express from 'express';
import { z } from 'zod';
import { db } from '@/lib/drizzle';
import { characters, imageCharacters, images } from '@/lib/drizzle/schema/index';
import type { ExpressHandler } from '@/lib/express-types';

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

router.get('/:id', getCharacterByIdHandler);

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
