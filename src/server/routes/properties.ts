import { Router } from 'express';
import { and, eq } from 'drizzle-orm';
import { serverLogger } from '@/lib/logger/server-logger';
import { z } from 'zod';
import { db } from '@/lib/drizzle';
import { properties, imageProperties, images } from '@/lib/drizzle/schema/index';
import { PropertyService } from '@/services/property/property.service';

const propertyService = new PropertyService();

import { toPropertyWithStats } from '@/transformers/property/mappers';

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
			limit: Number.parseInt(limit as string, 10),
			offset: Number.parseInt(offset as string, 10),
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
		return;
	} catch (error) {
		serverLogger.error('Error getting properties:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
		return;
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
		return;
	} catch (error) {
		serverLogger.error('Error getting property:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
		return;
	}
});

// POST /properties - Crear nueva property
router.post('/', async (req, res) => {
	try {
		const { name, value, category, description, isPublic } = req.body;

		if (!(name && value)) {
			res.status(400).json({ error: 'El nombre y valor son requeridos' });
			return;
		}

		const property = await propertyService.createProperty({
			name,
			value,
			category,
			description,
			isFavorite: isPublic,
		});

		res.status(201).json(toPropertyWithStats(property));
		return;
	} catch (error) {
		serverLogger.error('Error creating property:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
		return;
	}
});

// PUT /properties/:id - Actualizar property
router.put('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const { name, value, category, description, isPublic } = req.body;

		const property = await propertyService.updateProperty(id, {
			name,
			value,
			category,
			description,
			isFavorite: isPublic,
		});

		if (!property) {
			res.status(404).json({ error: 'Property no encontrada' });
			return;
		}

		res.json(toPropertyWithStats(property));
		return;
	} catch (error) {
		serverLogger.error('Error updating property:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
		return;
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

		res.json({ message: 'Property eliminada correctamente' });
		return;
	} catch (error) {
		serverLogger.error('Error deleting property:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
		return;
	}
});

// POST /properties/:id/images/:imageId - Agregar imagen a property
router.post('/:id/images/:imageId', async (req, res) => {
	try {
		const { id, imageId } = req.params;

		const property = await db.query.properties.findFirst({ where: eq(properties.id, id) });
		if (!property) {
			res.status(404).json({ error: 'Property no encontrada' });
			return;
		}

		const image = await db.query.images.findFirst({ where: eq(images.id, imageId) });
		if (!image) {
			res.status(404).json({ error: 'Imagen no encontrada' });
			return;
		}

		// A=imageId, B=propertyId
		const existing = await db
			.select()
			.from(imageProperties)
			.where(and(eq(imageProperties.A, imageId), eq(imageProperties.B, id)))
			.limit(1);

		if (existing.length > 0) {
			res.status(200).json({ message: 'La imagen ya está asociada', alreadyExists: true });
			return;
		}

		await db.insert(imageProperties).values({ A: imageId, B: id });
		serverLogger.info(`✅ Imagen ${imageId} agregada a property ${id}`);
		res.status(201).json({ message: 'Imagen agregada a la property exitosamente' });
	} catch (error) {
		serverLogger.error('Error adding image to property:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// DELETE /properties/:id/images/:imageId
router.delete('/:id/images/:imageId', async (req, res) => {
	try {
		const { id, imageId } = req.params;
		await db.delete(imageProperties).where(and(eq(imageProperties.A, imageId), eq(imageProperties.B, id)));
		res.status(200).json({ message: 'Imagen removida de la property' });
	} catch (error) {
		serverLogger.error('Error removing image from property:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

export { router as propertiesRouter };

export default router;
