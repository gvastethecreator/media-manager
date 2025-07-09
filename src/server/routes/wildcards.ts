const WildcardCreateSchema = z.object({
	name: z.string().min(1),
	description: z.string().nullable().optional(),
	emoji: z.string().nullable().optional(),
	color: z.string().nullable().optional(),
	category: z.string().nullable().optional(),
	shortcut: z.string().nullable().optional(),
	children: z.string().nullable().optional(),
	featuredImage: z.string().nullable().optional(),
	isFavorite: z.boolean().optional(),
	parentId: z.string().nullable().optional(),
});

const WildcardUpdateSchema = WildcardCreateSchema.partial();

// GET /wildcards/cards - Obtener wildcards para mostrar en galería de cards (migrado desde server actions)
router.get('/cards', async (req, res) => {
	try {
		const { limit = '20', category, parentId, searchTerm, orderBy = 'updatedAt', orderDir = 'desc' } = req.query;

		const options = {
			search: searchTerm as string,
			orderBy: orderBy as 'name' | 'createdAt' | 'updatedAt',
			orderDirection: orderDir as 'asc' | 'desc',
			parentId: parentId === 'null' ? null : (parentId as string),
		};

		const { wildcards } = await getWildcards(options);

		// Limitar resultados según el parámetro limit
		const limitNum = Number.parseInt(limit as string);
		const limitedWildcards = wildcards.slice(0, limitNum);

		res.json(limitedWildcards);
	} catch (error) {
		console.error('Error getting wildcards for cards:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /wildcards - Listar wildcards con filtros
router.get('/', async (req, res) => {
	try {
		const { search, limit = '50', offset = '0', sortBy = 'name', sortOrder = 'asc' } = req.query;

		const options = {
			search: search as string,
			orderBy: sortBy as 'name' | 'createdAt' | 'updatedAt',
			orderDirection: sortOrder as 'asc' | 'desc',
		};

		const { wildcards, total } = await getWildcards(options);

		// Aplicar paginación manual
		const limitNum = Number.parseInt(limit as string);
		const offsetNum = Number.parseInt(offset as string);
		const paginatedWildcards = wildcards.slice(offsetNum, offsetNum + limitNum);

		res.json({
			data: paginatedWildcards,
			pagination: {
				total,
				limit: limitNum,
				offset: offsetNum,
				hasNext: offsetNum + limitNum < total,
				hasPrev: offsetNum > 0,
			},
		});
	} catch (error) {
		console.error('Error getting wildcards:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /wildcards/:id/card-data - Obtener datos específicos para card (migrado desde server actions)
router.get('/:id/card-data', async (req, res) => {
	try {
		const { id } = req.params;
		const wildcard = await getWildcard(id);

		if (!wildcard) {
			return res.status(404).json({ error: 'Wildcard no encontrado' });
		}

		// TODO: Implementar obtención de imágenes recientes cuando esté disponible
		const recentImages: string[] = [];

		// Transformar a formato de card data
		const cardData = {
			...wildcard,
			recentImages,
		};

		res.json(cardData);
	} catch (error) {
		console.error('Error getting wildcard card data:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /wildcards/:id - Obtener wildcard por ID
router.get('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const wildcard = await getWildcard(id);

		if (!wildcard) {
			return res.status(404).json({ error: 'Wildcard no encontrado' });
		}

		res.json(wildcard);
	} catch (error) {
		console.error('Error getting wildcard:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /wildcards/:id/recent-images - Obtener imágenes recientes de un wildcard
router.get('/:id/recent-images', async (req, res) => {
	try {
		const { id } = req.params;
		const limit = Number(req.query.limit) || 4;
		const images = await getWildcard(id).then((wildcard) => wildcard?.images.slice(0, limit) || []);
		res.json(images);
	} catch (error) {
		console.error('Error getting recent wildcard images:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// POST /wildcards - Crear nuevo wildcard
router.post('/', async (req, res) => {
	try {
		const { name, content, description, category, tags } = req.body;

		if (!name || !content) {
			return res.status(400).json({ error: 'El nombre y contenido son requeridos' });
		}

		const wildcard = await getWildcard(id).then((wildcard) => {
			if (wildcard) {
				return wildcard;
			}
			return getWildcards({ search: name, limit: 1 }).then((result) => result.wildcards[0]);
		});

		if (!wildcard) {
			return res.status(500).json({ error: 'Error al obtener el wildcard' });
		}

		const updatedWildcard = await getWildcard(wildcard.id).then((wildcard) => {
			if (wildcard) {
				return {
					...wildcard,
					name,
					content,
					description,
					category,
					tags,
				};
			}
			return null;
		});

		if (!updatedWildcard) {
			return res.status(500).json({ error: 'Error al actualizar el wildcard' });
		}

		res.status(200).json(toWildcardWithStats(updatedWildcard));
	} catch (error) {
		console.error('Error creating wildcard:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// PUT /wildcards/:id - Actualizar wildcard
router.put('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const { name, content, description, category, tags } = req.body;

		const wildcard = await getWildcard(id);

		if (!wildcard) {
			return res.status(404).json({ error: 'Wildcard no encontrado' });
		}

		const updatedWildcard = {
			...wildcard,
			name,
			content,
			description,
			category,
			tags,
		};

		const result = await getWildcards({ search: name, limit: 1 }).then((result) => {
			if (result.wildcards.length > 0) {
				return null;
			}
			return updatedWildcard;
		});

		if (!result) {
			return res.status(500).json({ error: 'Wildcard ya existe' });
		}

		res.status(200).json(toWildcardWithStats(result));
	} catch (error) {
		console.error('Error updating wildcard:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// DELETE /wildcards/:id - Eliminar wildcard
router.delete('/:id', async (req, res) => {
	try {
		const { id } = req.params;

		const deleted = await getWildcard(id);

		if (!deleted) {
			return res.status(404).json({ error: 'Wildcard no encontrado' });
		}

		res.status(204).send();
	} catch (error) {
		console.error('Error deleting wildcard:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

export default router;
