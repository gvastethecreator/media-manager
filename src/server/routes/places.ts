const PlaceCreateSchema = z.object({
	name: z.string().min(1),
	description: z.string().nullable().optional(),
	emoji: z.string().nullable().optional(),
	color: z.string().nullable().optional(),
	category: z.string().nullable().optional(),
	isPublic: z.boolean().optional(),
	isFavorite: z.boolean().optional(),
	totalImages: z.number().int().min(0).optional(),
	totalVideos: z.number().int().min(0).optional(),
	type: z.string().nullable().optional(),
	location: z.string().nullable().optional(),
	climate: z.string().nullable().optional(),
	population: z.string().nullable().optional(),
	government: z.string().nullable().optional(),
	economy: z.string().nullable().optional(),
	culture: z.string().nullable().optional(),
	history: z.string().nullable().optional(),
	geography: z.string().nullable().optional(),
	landmarks: z.string().nullable().optional(),
	dangers: z.string().nullable().optional(),
	resources: z.string().nullable().optional(),
	notes: z.string().nullable().optional(),
	featuredImage: z.string().nullable().optional(),
	parentId: z.string().nullable().optional(),
});

const PlaceUpdateSchema = PlaceCreateSchema.partial();

// GET /places - Listar lugares con filtros
router.get('/', async (req, res) => {
	try {
		const { search, limit = '50', offset = '0', sortBy = 'name', sortOrder = 'asc' } = req.query;

		const filters = {
			search: search as string,
			limit: Number.parseInt(limit as string),
			offset: Number.parseInt(offset as string),
			sortBy: sortBy as 'name' | 'createdAt' | 'updatedAt',
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

// GET /places/:id/media - Obtener imágenes y videos recientes de un lugar
router.get('/:id/media', async (req, res) => {
	try {
		const { id } = req.params;
		const limit = Number(req.query.limit) || 6;

		const media = await placeService.getRecentPlaceMedia(id, limit);
		res.json(media);
	} catch (error) {
		console.error('Error getting place media:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// POST /places - Crear nuevo lugar
router.post('/', async (req, res) => {
	try {
		const validatedData = PlaceCreateSchema.parse(req.body);
		const place = await placeService.createPlace(validatedData);

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
		const validatedData = PlaceUpdateSchema.parse(req.body);
		const place = await placeService.updatePlace(id, validatedData);

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
