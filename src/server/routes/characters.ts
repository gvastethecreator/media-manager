import { and, asc, count, desc, eq, like, or } from 'drizzle-orm';
import express from 'express';
import { z } from 'zod';
import { db } from '@/lib/drizzle';
import { characters } from '@/lib/drizzle/schema/index';
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
		console.error('🚨 [ERROR] Error en /api/characters:', error);
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
		console.error('Error getting character:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
};

router.get('/:id', getCharacterByIdHandler);

export default router;
