const WorldItemCreateSchema = z.object({
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
	rarity: z.string().nullable().optional(),
	value: z.string().nullable().optional(),
	weight: z.string().nullable().optional(),
	materials: z.string().nullable().optional(),
	origin: z.string().nullable().optional(),
	properties: z.string().nullable().optional(),
	uses: z.string().nullable().optional(),
	history: z.string().nullable().optional(),
	notes: z.string().nullable().optional(),
	featuredImage: z.string().nullable().optional(),
	parentId: z.string().nullable().optional(),
});

const WorldItemUpdateSchema = WorldItemCreateSchema.partial();

// GET /world-items - Listar world items con filtros
router.get('/', async (req, res) => {
	try {
		const { search, limit = '50', offset = '0', sortBy = 'name', sortOrder = 'asc' } = req.query;

		const filters = {
			search: search as string,
			limit: Number.parseInt(limit as string),
			offset: Number.parseInt(offset as string),
			sortBy: sortBy as 'name' | 'createdAt' | 'updatedAt' | 'totalImages' | 'totalVideos',
			sortOrder: sortOrder as 'asc' | 'desc',
		};

		const { worldItems, total } = await worldItemService.getWorldItems(filters);
		const transformedWorldItems = worldItems.map(toWorldItemWithStats);

		res.json({
			data: transformedWorldItems,
			pagination: {
				total,
				limit: filters.limit,
				offset: filters.offset,
				hasNext: filters.offset + filters.limit < total,
				hasPrev: filters.offset > 0,
			},
		});
	} catch (error) {
		console.error('Error getting world items:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /world-items/:id - Obtener world item por ID
router.get('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const worldItem = await worldItemService.getWorldItemById(id);

		if (!worldItem) {
			return res.status(404).json({ error: 'World item no encontrado' });
		}

		res.json(toWorldItemWithStats(worldItem));
	} catch (error) {
		console.error('Error getting world item:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /world-items/:id/images - Obtener imágenes de un world item
router.get('/:id/images', async (req, res) => {
	try {
		const { id } = req.params;
		const images = await worldItemService.getWorldItemImages(id);
		const transformedImages = images.map(toImageWithStats);

		res.json(transformedImages);
	} catch (error) {
		console.error('Error getting world item images:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /world-items/:id/recent-images - Obtener imágenes recientes de un world item
router.get('/:id/recent-images', async (req, res) => {
	try {
		const { id } = req.params;
		const limit = Number(req.query.limit) || 6;
		const images = await worldItemService.getRecentWorldItemImages(id, limit);
		res.json(images);
	} catch (error) {
		console.error('Error getting recent world item images:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// POST /world-items - Crear nuevo world item
router.post('/', async (req, res) => {
	try {
		const validatedData = WorldItemCreateSchema.parse(req.body);
		const worldItem = await worldItemService.createWorldItem(validatedData);

		res.status(201).json(toWorldItemWithStats(worldItem));
	} catch (error) {
		console.error('Error creating world item:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// PUT /world-items/:id - Actualizar world item
router.put('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const validatedData = WorldItemUpdateSchema.parse(req.body);
		const worldItem = await worldItemService.updateWorldItem(id, validatedData);

		if (!worldItem) {
			return res.status(404).json({ error: 'World item no encontrado' });
		}

		res.json(toWorldItemWithStats(worldItem));
	} catch (error) {
		console.error('Error updating world item:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// DELETE /world-items/:id - Eliminar world item
router.delete('/:id', async (req, res) => {
	try {
		const { id } = req.params;

		const deleted = await worldItemService.deleteWorldItem(id);

		if (!deleted) {
			return res.status(404).json({ error: 'World item no encontrado' });
		}

		res.status(204).send();
	} catch (error) {
		console.error('Error deleting world item:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

export default router;
