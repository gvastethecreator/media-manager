import express from 'express';
import { PlaceService } from '@/services/place/place.service';
import { toImageWithStats } from '@/transformers/image/image.transformer';
import { toPlaceWithStats } from '@/transformers/place/place.transformer';

const router = express.Router();
const placeService = new PlaceService();

// GET /places - Listar lugares con filtros
router.get('/', async (req, res) => {
	try {
		const { search, limit = '50', offset = '0', sortBy = 'name', sortOrder = 'asc' } = req.query;

		const filters = {
			search: search as string,
			limit: Number.parseInt(limit as string),
			offset: Number.parseInt(offset as string),
			sortBy: sortBy as 'name' | 'createdAt' | 'updatedAt' | 'imageCount',
			sortOrder: sortOrder as 'asc' | 'desc',
		};

		const { places, total } = await placeService.getPlaces(filters);
		const transformedPlaces = places.map(toPlaceWithStats);

		res.json({
			data: transformedPlaces,
			pagination: {
				total,
				limit: filters.limit,
				offset: filters.offset,
				hasNext: filters.offset + filters.limit < total,
				hasPrev: filters.offset > 0,
			},
		});
	} catch (error) {
		console.error('Error getting places:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /places/:id - Obtener lugar por ID
router.get('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const place = await placeService.getPlaceById(id);

		if (!place) {
			return res.status(404).json({ error: 'Lugar no encontrado' });
		}

		res.json(toPlaceWithStats(place));
	} catch (error) {
		console.error('Error getting place:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /places/:id/images - Obtener imágenes de un lugar
router.get('/:id/images', async (req, res) => {
	try {
		const { id } = req.params;
		const images = await placeService.getPlaceImages(id);
		const transformedImages = images.map(toImageWithStats);

		res.json(transformedImages);
	} catch (error) {
		console.error('Error getting place images:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// POST /places - Crear nuevo lugar
router.post('/', async (req, res) => {
	try {
		const { name, description, color, location, coordinates } = req.body;

		if (!name) {
			return res.status(400).json({ error: 'El nombre es requerido' });
		}

		const place = await placeService.createPlace({
			name,
			description,
			color,
			location,
			coordinates,
		});

		res.status(201).json(toPlaceWithStats(place));
	} catch (error) {
		console.error('Error creating place:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// PUT /places/:id - Actualizar lugar
router.put('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const { name, description, color, location, coordinates } = req.body;

		const place = await placeService.updatePlace(id, {
			name,
			description,
			color,
			location,
			coordinates,
		});

		if (!place) {
			return res.status(404).json({ error: 'Lugar no encontrado' });
		}

		res.json(toPlaceWithStats(place));
	} catch (error) {
		console.error('Error updating place:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// DELETE /places/:id - Eliminar lugar
router.delete('/:id', async (req, res) => {
	try {
		const { id } = req.params;

		const deleted = await placeService.deletePlace(id);

		if (!deleted) {
			return res.status(404).json({ error: 'Lugar no encontrado' });
		}

		res.status(204).send();
	} catch (error) {
		console.error('Error deleting place:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

export default router;
