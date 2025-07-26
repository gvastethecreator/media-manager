import { Router } from 'express';
import { z } from 'zod';
import * as propertyService from '@/services/property/property.service';
import { toPropertyWithStats } from '@/transformers/property';

const router = Router();

const PropertyCreateSchema = z.object({
	name: z.string().min(1),
	description: z.string().nullable().optional(),
	emoji: z.string().nullable().optional(),
	color: z.string().nullable().optional(),
	category: z.string().nullable().optional(),
	shortcut: z.string().nullable().optional(),
	featuredImage: z.string().nullable().optional(),
	isFavorite: z.boolean().optional(),
});

const PropertyUpdateSchema = PropertyCreateSchema.partial();

// GET /properties - Listar properties con filtros
router.get('/', async (req, res) => {
	try {
		const { search, limit = '50', offset = '0', sortBy = 'name', sortOrder = 'asc', type } = req.query;

		const filters = {
			search: search as string,
			limit: Number.parseInt(limit as string),
			offset: Number.parseInt(offset as string),
			sortBy: sortBy as 'name' | 'createdAt' | 'updatedAt',
			sortOrder: sortOrder as 'asc' | 'desc',
			type: type as string,
		};

		const { properties, total } = await propertyService.getProperties(filters);
		const transformedProperties = properties.map(toPropertyWithStats);

		res.json({
			data: transformedProperties,
			pagination: {
				total,
				limit: filters.limit,
				offset: filters.offset,
				hasNext: filters.offset + filters.limit < total,
				hasPrev: filters.offset > 0,
			},
		});
	} catch (error) {
		console.error('Error getting properties:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /properties/:id - Obtener property por ID
router.get('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const property = await propertyService.getPropertyById(id);

		if (!property) {
			res.status(404).json({ error: 'Property no encontrada' });
			return;
		}

		res.json(toPropertyWithStats(property));
	} catch (error) {
		console.error('Error getting property:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// POST /properties - Crear nueva property
router.post('/', async (req, res) => {
	try {
		const { name, value, type, description, isPublic } = req.body;

		if (!name || !value) {
			res.status(400).json({ error: 'El nombre y valor son requeridos' });
			return;
		}

		const property = await propertyService.createProperty({
			name,
			value,
			type,
			description,
			isPublic,
		});

		res.status(201).json(toPropertyWithStats(property));
	} catch (error) {
		console.error('Error creating property:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// PUT /properties/:id - Actualizar property
router.put('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const { name, value, type, description, isPublic } = req.body;

		const property = await propertyService.updateProperty(id, {
			name,
			value,
			type,
			description,
			isPublic,
		});

		if (!property) {
			res.status(404).json({ error: 'Property no encontrada' });
			return;
		}

		res.json(toPropertyWithStats(property));
	} catch (error) {
		console.error('Error updating property:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// DELETE /properties/:id - Eliminar property
router.delete('/:id', async (req, res) => {
	try {
		const { id } = req.params;

		const deleted = await propertyService.deleteProperty(id);

		if (!deleted) {
			res.status(404).json({ error: 'Property no encontrada' });
			return;
		}

		res.status(204).send();
	} catch (error) {
		console.error('Error deleting property:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

export default router;
