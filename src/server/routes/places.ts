import * as crypto from 'crypto';
import { and, asc, count, desc, eq, like, or } from 'drizzle-orm';
import express from 'express';
import { z } from 'zod';
import { db } from '@/lib/drizzle';
import { places } from '@/lib/drizzle/schema/index';

const router = express.Router();

// Schemas de validación
const PlaceFiltersSchema = z.object({
	search: z.string().optional(),
	limit: z.coerce.number().min(1).max(100).default(50),
	offset: z.coerce.number().min(0).default(0),
	sortBy: z.enum(['name', 'createdAt', 'updatedAt']).default('updatedAt'),
	sortOrder: z.enum(['asc', 'desc']).default('desc'),
	category: z.string().optional(),
	isFavorite: z.coerce.boolean().optional(),
});

// GET /api/places - Listar lugares
router.get('/', async (req, res) => {
	const parse = PlaceFiltersSchema.safeParse(req.query);
	if (!parse.success) {
		res.status(400).json({ error: 'Parámetros inválidos', details: parse.error.issues });
		return;
	}

	const { search, limit, offset, sortBy, sortOrder, category, isFavorite } = parse.data;

	try {
		console.log('🔍 [DEBUG] Iniciando consulta de places...');

		const whereConditions = [];
		if (search) {
			whereConditions.push(
				or(
					like(places.name, `%${search}%`),
					like(places.description, `%${search}%`),
					like(places.category, `%${search}%`),
					like(places.location, `%${search}%`)
				)
			);
		}
		if (category) {
			whereConditions.push(like(places.category, `%${category}%`));
		}
		if (isFavorite !== undefined) {
			whereConditions.push(eq(places.isFavorite, isFavorite));
		}

		const orderByColumn = places[sortBy];
		const orderByClause = sortOrder === 'desc' ? desc(orderByColumn) : asc(orderByColumn);

		const [placesData, totalResult] = await Promise.all([
			db.query.places.findMany({
				where: and(...whereConditions),
				orderBy: orderByClause,
				limit,
				offset,
			}),
			db
				.select({ count: count() })
				.from(places)
				.where(and(...whereConditions)),
		]);

		const total = totalResult[0].count;
		console.log('🔍 [DEBUG] Places obtenidos:', placesData.length);

		res.json({
			data: placesData,
			pagination: {
				total,
				limit,
				offset,
				hasNext: offset + limit < total,
				hasPrev: offset > 0,
			},
		});
	} catch (error) {
		console.error('🚨 [ERROR] Error en /api/places:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /api/places/:id - Obtener lugar específico
router.get('/:id', async (req, res) => {
	try {
		const { id } = req.params;

		const place = await db.query.places.findFirst({
			where: eq(places.id, id),
		});

		if (!place) {
			res.status(404).json({ error: 'Lugar no encontrado' });
			return;
		}

		res.json(place);
	} catch (error) {
		console.error('Error getting place:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// Schema de validación para crear/actualizar lugares
const PlaceCreateSchema = z.object({
	name: z.string().min(1).max(255),
	description: z.string().optional(),
	emoji: z.string().optional().default('📍'),
	color: z.string().optional().default('#3b82f6'),
	category: z.string().optional(),
	type: z.string().optional(),
	location: z.string().optional(),
	climate: z.string().optional(),
	population: z.string().optional(),
	government: z.string().optional(),
	economy: z.string().optional(),
	culture: z.string().optional(),
	history: z.string().optional(),
	geography: z.string().optional(),
	landmarks: z.string().optional(),
	dangers: z.string().optional(),
	resources: z.string().optional(),
	notes: z.string().optional(),
	featuredImage: z.string().optional(),
	parentId: z.string().optional(),
	isFavorite: z.boolean().optional().default(false),
});

const PlaceUpdateSchema = PlaceCreateSchema.partial();

// POST /api/places - Crear lugar
router.post('/', async (req, res) => {
	const parse = PlaceCreateSchema.safeParse(req.body);
	if (!parse.success) {
		res.status(400).json({ error: 'Datos inválidos', details: parse.error.issues });
		return;
	}

	try {
		const data = parse.data;
		const newPlace = {
			id: crypto.randomUUID(),
			name: data.name,
			description: data.description || null,
			emoji: data.emoji || '📍',
			color: data.color || '#3b82f6',
			category: data.category || null,
			type: data.type || null,
			location: data.location || null,
			climate: data.climate || null,
			population: data.population || null,
			government: data.government || null,
			economy: data.economy || null,
			culture: data.culture || null,
			history: data.history || null,
			geography: data.geography || null,
			landmarks: data.landmarks || null,
			dangers: data.dangers || null,
			resources: data.resources || null,
			notes: data.notes || null,
			featuredImage: data.featuredImage || null,
			parentId: data.parentId || null,
			isFavorite: data.isFavorite ?? false,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const [created] = await db.insert(places).values(newPlace).returning();
		res.status(201).json(created);
	} catch (error) {
		console.error('Error creating place:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// PUT /api/places/:id - Actualizar lugar
router.put('/:id', async (req, res) => {
	const { id } = req.params;
	const parse = PlaceUpdateSchema.safeParse(req.body);

	if (!parse.success) {
		res.status(400).json({ error: 'Datos inválidos', details: parse.error.issues });
		return;
	}

	try {
		// Verificar que existe
		const existing = await db.query.places.findFirst({
			where: eq(places.id, id),
		});

		if (!existing) {
			res.status(404).json({ error: 'Lugar no encontrado' });
			return;
		}

		const data = parse.data;
		const updateData: any = {
			updatedAt: new Date(),
		};

		// Solo actualizar campos proporcionados
		if (data.name !== undefined) updateData.name = data.name;
		if (data.description !== undefined) updateData.description = data.description;
		if (data.emoji !== undefined) updateData.emoji = data.emoji;
		if (data.color !== undefined) updateData.color = data.color;
		if (data.category !== undefined) updateData.category = data.category;
		if (data.type !== undefined) updateData.type = data.type;
		if (data.location !== undefined) updateData.location = data.location;
		if (data.climate !== undefined) updateData.climate = data.climate;
		if (data.population !== undefined) updateData.population = data.population;
		if (data.government !== undefined) updateData.government = data.government;
		if (data.economy !== undefined) updateData.economy = data.economy;
		if (data.culture !== undefined) updateData.culture = data.culture;
		if (data.history !== undefined) updateData.history = data.history;
		if (data.geography !== undefined) updateData.geography = data.geography;
		if (data.landmarks !== undefined) updateData.landmarks = data.landmarks;
		if (data.dangers !== undefined) updateData.dangers = data.dangers;
		if (data.resources !== undefined) updateData.resources = data.resources;
		if (data.notes !== undefined) updateData.notes = data.notes;
		if (data.featuredImage !== undefined) updateData.featuredImage = data.featuredImage;
		if (data.parentId !== undefined) updateData.parentId = data.parentId;
		if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite;

		const [updated] = await db.update(places).set(updateData).where(eq(places.id, id)).returning();
		res.json(updated);
	} catch (error) {
		console.error('Error updating place:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// DELETE /api/places/:id - Eliminar lugar
router.delete('/:id', async (req, res) => {
	const { id } = req.params;

	try {
		// Verificar que existe
		const existing = await db.query.places.findFirst({
			where: eq(places.id, id),
		});

		if (!existing) {
			res.status(404).json({ error: 'Lugar no encontrado' });
			return;
		}

		await db.delete(places).where(eq(places.id, id));
		res.json({ success: true, message: 'Lugar eliminado correctamente', deletedId: id });
	} catch (error) {
		console.error('Error deleting place:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

export default router;
