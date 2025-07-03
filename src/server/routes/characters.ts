import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { serializeCharacter } from '@/transformers/character';

const router = Router();
const prismaClient = new PrismaClient();

// Schema de validación para crear personaje
const CreateCharacterSchema = z.object({
	name: z.string().min(1, 'El nombre es requerido').max(255),
	description: z.string().max(1000).optional().nullable(),
	emoji: z.string().max(10).optional().nullable(),
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/)
		.optional()
		.nullable(),
	category: z.string().max(100).default('general').optional(),
	shortcut: z.string().max(10).optional().nullable(),
	sortBy: z.string().max(50).default('name').optional(),
	filters: z.string().default('[]').optional(),
	featuredImage: z.string().url().optional().nullable(),
	isFavorite: z.boolean().default(false).optional(),

	// Atributos específicos del personaje
	level: z.number().int().min(1).max(100).default(1).optional(),
	class: z.string().max(100).default('unknown').optional(),
	race: z.string().max(100).default('unknown').optional(),
	type: z.string().max(100).optional().nullable(),
	alignment: z.string().max(50).default('neutral').optional(),

	// Características detalladas (JSON strings)
	backstory: z.string().default('').optional(),
	stats: z.string().default('').optional(),
	psychologicalProfile: z.string().default('').optional(),
	socialProfile: z.string().default('').optional(),
	relationships: z.string().default('[]').optional(),
	goals: z.string().default('[]').optional(),
	fears: z.string().default('[]').optional(),
	beliefs: z.string().default('[]').optional(),
	personality: z.string().default('[]').optional(),
	skills: z.string().default('[]').optional(),
	abilities: z.string().default('[]').optional(),
});

// Schema de validación para actualizar personaje
const UpdateCharacterSchema = CreateCharacterSchema.partial();

// Schema para filtros de búsqueda
const CharacterFiltersSchema = z.object({
	search: z.string().optional(),
	limit: z.coerce.number().min(1).max(100).default(20),
	offset: z.coerce.number().min(0).default(0),
	sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'imageCount']).default('updatedAt'),
	sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Incluye estándar para personajes con relaciones
const characterInclude = {
	images: {
		take: 5,
		select: { id: true, name: true, path: true, width: true, height: true },
	},
	videos: {
		take: 5,
		select: { id: true, name: true, path: true, duration: true },
	},
	albums: {
		select: { id: true, name: true, emoji: true, color: true },
	},
	tags: {
		select: { id: true, name: true, emoji: true, color: true },
	},
	collections: {
		select: { id: true, name: true, emoji: true, color: true },
	},
	places: {
		select: { id: true, name: true, emoji: true, color: true },
	},
	worldItems: {
		select: { id: true, name: true, emoji: true, color: true },
	},
	relatedCharacters: {
		select: { id: true, name: true, emoji: true, color: true, class: true, race: true },
	},
	_count: {
		select: {
			images: true,
			videos: true,
			albums: true,
			collections: true,
			tags: true,
			places: true,
			worldItems: true,
			concepts: true,
			prompts: true,
			notes: true,
			wildcards: true,
			properties: true,
			groups: true,
			relatedCharacters: true,
		},
	},
};

// GET /api/characters - Obtener personajes con filtros
router.get('/', async (req, res) => {
	const parse = CharacterFiltersSchema.safeParse(req.query);
	if (!parse.success) {
		return res.status(400).json({ error: 'Parámetros inválidos', details: parse.error.errors });
	}

	const { search, limit, offset, sortBy, sortOrder } = parse.data;

	try {
		const where = search
			? {
					OR: [
						{ name: { contains: search, mode: 'insensitive' as const } },
						{ description: { contains: search, mode: 'insensitive' as const } },
					],
				}
			: {};

		const [characters, total] = await Promise.all([
			prismaClient.character.findMany({
				where,
				include: characterInclude,
				orderBy: { [sortBy]: sortOrder },
				take: limit,
				skip: offset,
			}),
			prismaClient.character.count({ where }),
		]);

		const serializedCharacters = characters.map(serializeCharacter);

		res.json({
			data: serializedCharacters,
			pagination: {
				total,
				limit,
				offset,
				hasNext: offset + limit < total,
				hasPrev: offset > 0,
			},
		});
	} catch (error) {
		console.error('Error obteniendo personajes:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /api/characters/search - Buscar personajes
router.get('/search', async (req, res) => {
	const { q } = req.query;

	if (!q || typeof q !== 'string' || q.length < 2) {
		return res.status(400).json({ error: 'Query debe tener al menos 2 caracteres' });
	}

	try {
		const characters = await prismaClient.character.findMany({
			where: {
				OR: [{ name: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }],
			},
			include: {
				_count: {
					select: { images: true },
				},
			},
			take: 10, // Límite para búsqueda
			orderBy: { name: 'asc' },
		});

		res.json(characters.map(serializeCharacter));
	} catch (error) {
		console.error('Error buscando personajes:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /api/characters/:id - Obtener un personaje por ID
router.get('/:id', async (req, res) => {
	try {
		const { id } = req.params;

		if (!z.string().uuid().safeParse(id).success) {
			return res.status(400).json({ error: 'ID de personaje inválido' });
		}

		const character = await prismaClient.character.findUnique({
			where: { id },
			include: {
				...characterInclude,
				images: true,
				videos: true,
				relatedCharacters: {
					include: {
						_count: {
							select: { images: true, videos: true },
						},
					},
				},
				relatedTo: {
					select: { id: true, name: true, emoji: true, color: true, class: true, race: true },
				},
			},
		});

		if (!character) {
			return res.status(404).json({ error: 'Personaje no encontrado' });
		}

		res.json(serializeCharacter(character));
	} catch (error) {
		console.error('Error al obtener personaje:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// GET /api/characters/:id/images - Obtener imágenes del personaje
router.get('/:id/images', async (req, res) => {
	try {
		const { id } = req.params;

		if (!z.string().uuid().safeParse(id).success) {
			return res.status(400).json({ error: 'ID de personaje inválido' });
		}

		const character = await prismaClient.character.findUnique({
			where: { id },
			include: {
				images: {
					include: {
						_count: {
							select: {
								tags: true,
								albums: true,
								collections: true,
								characters: true,
								places: true,
								worldItems: true,
								notes: true,
							},
						},
						folder: true,
					},
				},
			},
		});

		if (!character) {
			return res.status(404).json({ error: 'Personaje no encontrado' });
		}

		res.json(character.images);
	} catch (error) {
		console.error('Error al obtener imágenes del personaje:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /api/characters/:id/media - Obtener imágenes y videos recientes de un personaje
router.get('/:id/media', async (req, res) => {
	try {
		const { id } = req.params;
		const limit = Number(req.query.limit) || 6;

		if (!z.string().uuid().safeParse(id).success) {
			return res.status(400).json({ error: 'ID de personaje inválido' });
		}

		const recentMedia = await getRecentCharacterMedia(id, limit);
		res.json(recentMedia);
	} catch (error) {
		console.error('Error al obtener medios recientes del personaje:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// Helper function (should be moved to a service or utility file)
async function getRecentCharacterMedia(characterId: string, limit: number) {
    const recentImages = await prismaClient.image.findMany({
        where: {
            characters: {
                some: {
                    id: characterId,
                },
            },
        },
        select: {
            id: true,
            name: true,
            path: true,
        },
        orderBy: {
            updatedAt: 'desc',
        },
        take: Math.ceil(limit / 2),
    });

    const recentVideos = await prismaClient.video.findMany({
        where: {
            characters: {
                some: {
                    id: characterId,
                },
            },
        },
        select: {
            id: true,
            name: true,
            path: true,
        },
        orderBy: {
            updatedAt: 'desc',
        },
        take: Math.floor(limit / 2),
    });

    const imageResults = recentImages.map((img) => ({
        id: img.id,
        name: img.name,
        thumbnailUrl: `/api/thumbnails/${img.id}`,
        url: `/api/images/${img.id}`,
        isVideo: false,
    }));

    const videoResults = recentVideos.map((video) => ({
        id: video.id,
        name: video.name,
        thumbnailUrl: `/api/video-thumbnails/${video.id}`,
        url: `/api/videos/${video.id}`,
        isVideo: true,
    }));

    return [...imageResults, ...videoResults].sort((a, b) => (a.id > b.id ? -1 : 1)).slice(0, limit);
}


// POST /api/characters - Crear nuevo personaje
router.post('/', async (req, res) => {
	try {
		const validationResult = CreateCharacterSchema.safeParse(req.body);

		if (!validationResult.success) {
			return res.status(400).json({
				error: 'Datos de entrada inválidos',
				details: validationResult.error.errors,
			});
		}

		const data = validationResult.data;

		// Verificar que no exista un personaje con el mismo nombre
		const existingCharacter = await prismaClient.character.findFirst({
			where: { name: data.name },
		});

		if (existingCharacter) {
			return res.status(409).json({
				error: 'Ya existe un personaje con ese nombre',
			});
		}

		const newCharacter = await prismaClient.character.create({
			data: {
				name: data.name,
				description: data.description,
				emoji: data.emoji || '👤',
				color: data.color || '#3b82f6',
				category: data.category || 'general',
				shortcut: data.shortcut,
				sortBy: data.sortBy || 'name',
				filters: data.filters || '[]',
				featuredImage: data.featuredImage,
				isFavorite: data.isFavorite || false,
				level: data.level || 1,
				class: data.class || 'unknown',
				race: data.race || 'unknown',
				type: data.type,
				alignment: data.alignment || 'neutral',
				backstory: data.backstory || '',
				stats: data.stats || '',
				psychologicalProfile: data.psychologicalProfile || '',
				socialProfile: data.socialProfile || '',
				relationships: data.relationships || '[]',
				goals: data.goals || '[]',
				fears: data.fears || '[]',
				beliefs: data.beliefs || '[]',
				personality: data.personality || '[]',
				skills: data.skills || '[]',
				abilities: data.abilities || '[]',
			},
			include: characterInclude,
		});

		res.status(201).json(serializeCharacter(newCharacter));
	} catch (error) {
		console.error('Error al crear personaje:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// PUT /api/characters/:id - Actualizar personaje
router.put('/:id', async (req, res) => {
	try {
		const { id } = req.params;

		if (!z.string().uuid().safeParse(id).success) {
			return res.status(400).json({ error: 'ID de personaje inválido' });
		}

		const validationResult = UpdateCharacterSchema.safeParse(req.body);

		if (!validationResult.success) {
			return res.status(400).json({
				error: 'Datos de entrada inválidos',
				details: validationResult.error.errors,
			});
		}

		const data = validationResult.data;

		// Verificar que el personaje existe
		const existingCharacter = await prismaClient.character.findUnique({
			where: { id },
		});

		if (!existingCharacter) {
			return res.status(404).json({ error: 'Personaje no encontrado' });
		}

		// Si se actualiza el nombre, verificar que no exista otro con el mismo nombre
		if (data.name && data.name !== existingCharacter.name) {
			const duplicateCharacter = await prismaClient.character.findFirst({
				where: { name: data.name, id: { not: id } },
			});

			if (duplicateCharacter) {
				return res.status(409).json({
					error: 'Ya existe un personaje con ese nombre',
				});
			}
		}

		const updatedCharacter = await prismaClient.character.update({
			where: { id },
			data: {
				...(data.name && { name: data.name }),
				...(data.description !== undefined && { description: data.description }),
				...(data.emoji !== undefined && { emoji: data.emoji }),
				...(data.color !== undefined && { color: data.color }),
				...(data.category !== undefined && { category: data.category }),
				...(data.shortcut !== undefined && { shortcut: data.shortcut }),
				...(data.sortBy !== undefined && { sortBy: data.sortBy }),
				...(data.filters !== undefined && { filters: data.filters }),
				...(data.featuredImage !== undefined && { featuredImage: data.featuredImage }),
				...(data.isFavorite !== undefined && { isFavorite: data.isFavorite }),
				...(data.level !== undefined && { level: data.level }),
				...(data.class !== undefined && { class: data.class }),
				...(data.race !== undefined && { race: data.race }),
				...(data.type !== undefined && { type: data.type }),
				...(data.alignment !== undefined && { alignment: data.alignment }),
				...(data.backstory !== undefined && { backstory: data.backstory }),
				...(data.stats !== undefined && { stats: data.stats }),
				...(data.psychologicalProfile !== undefined && { psychologicalProfile: data.psychologicalProfile }),
				...(data.socialProfile !== undefined && { socialProfile: data.socialProfile }),
				...(data.relationships !== undefined && { relationships: data.relationships }),
				...(data.goals !== undefined && { goals: data.goals }),
				...(data.fears !== undefined && { fears: data.fears }),
				...(data.beliefs !== undefined && { beliefs: data.beliefs }),
				...(data.personality !== undefined && { personality: data.personality }),
				...(data.skills !== undefined && { skills: data.skills }),
				...(data.abilities !== undefined && { abilities: data.abilities }),
			},
			include: characterInclude,
		});

		res.json(serializeCharacter(updatedCharacter));
	} catch (error) {
		console.error('Error al actualizar personaje:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// DELETE /api/characters/:id - Eliminar personaje
router.delete('/:id', async (req, res) => {
	try {
		const { id } = req.params;

		if (!z.string().uuid().safeParse(id).success) {
			return res.status(400).json({ error: 'ID de personaje inválido' });
		}

		// Verificar que el personaje existe
		const existingCharacter = await prismaClient.character.findUnique({
			where: { id },
			include: {
				_count: {
					select: {
						images: true,
						videos: true,
						albums: true,
						collections: true,
						relatedCharacters: true,
					},
				},
			},
		});

		if (!existingCharacter) {
			return res.status(404).json({ error: 'Personaje no encontrado' });
		}

		await prismaClient.character.delete({
			where: { id },
		});

		res.json({
			success: true,
			message: 'Personaje eliminado correctamente',
			deletedId: id,
			stats: {
				imagesCount: existingCharacter._count.images,
				videosCount: existingCharacter._count.videos,
				albumsCount: existingCharacter._count.albums,
				collectionsCount: existingCharacter._count.collections,
				relatedCharactersCount: existingCharacter._count.relatedCharacters,
			},
		});
	} catch (error) {
		console.error('Error al eliminar personaje:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// POST /api/characters/:id/relations/:characterId - Agregar relación entre personajes
router.post('/:id/relations/:characterId', async (req, res) => {
	try {
		const { id, characterId } = req.params;

		if (!z.string().uuid().safeParse(id).success || !z.string().uuid().safeParse(characterId).success) {
			return res.status(400).json({ error: 'IDs inválidos' });
		}

		if (id === characterId) {
			return res.status(400).json({ error: 'Un personaje no puede relacionarse consigo mismo' });
		}

		// Verificar que ambos personajes existen
		const [character1, character2] = await Promise.all([
			prismaClient.character.findUnique({ where: { id } }),
			prismaClient.character.findUnique({ where: { id: characterId } }),
		]);

		if (!character1) return res.status(404).json({ error: 'Personaje principal no encontrado' });
		if (!character2) return res.status(404).json({ error: 'Personaje relacionado no encontrado' });

		const updatedCharacter = await prismaClient.character.update({
			where: { id },
			data: {
				relatedCharacters: {
					connect: { id: characterId },
				},
			},
			include: characterInclude,
		});

		res.json({
			success: true,
			message: 'Relación entre personajes agregada correctamente',
			character: serializeCharacter(updatedCharacter),
		});
	} catch (error) {
		console.error('Error al agregar relación:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// DELETE /api/characters/:id/relations/:characterId - Eliminar relación entre personajes
router.delete('/:id/relations/:characterId', async (req, res) => {
	try {
		const { id, characterId } = req.params;

		if (!z.string().uuid().safeParse(id).success || !z.string().uuid().safeParse(characterId).success) {
			return res.status(400).json({ error: 'IDs inválidos' });
		}

		const updatedCharacter = await prismaClient.character.update({
			where: { id },
			data: {
				relatedCharacters: {
					disconnect: { id: characterId },
				},
			},
			include: characterInclude,
		});

		res.json({
			success: true,
			message: 'Relación entre personajes eliminada correctamente',
			character: serializeCharacter(updatedCharacter),
		});
	} catch (error) {
		console.error('Error al eliminar relación:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// GET /api/characters/stats/classes - Obtener estadísticas por clase
router.get('/stats/classes', async (req, res) => {
	try {
		const classStats = await prismaClient.character.groupBy({
			by: ['class'],
			_count: {
				class: true,
			},
			_avg: {
				level: true,
			},
			orderBy: {
				_count: {
					class: 'desc',
				},
			},
		});

		res.json({
			data: classStats.map((stat) => ({
				class: stat.class,
				count: stat._count.class,
				averageLevel: Math.round(stat._avg.level || 1),
			})),
		});
	} catch (error) {
		console.error('Error al obtener estadísticas de clases:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// GET /api/characters/stats/races - Obtener estadísticas por raza
router.get('/stats/races', async (req, res) => {
	try {
		const raceStats = await prismaClient.character.groupBy({
			by: ['race'],
			_count: {
				race: true,
			},
			_avg: {
				level: true,
			},
			orderBy: {
				_count: {
					race: 'desc',
				},
			},
		});

		res.json({
			data: raceStats.map((stat) => ({
				race: stat.race,
				count: stat._count.race,
				averageLevel: Math.round(stat._avg.level || 1),
			})),
		});
	} catch (error) {
		console.error('Error al obtener estadísticas de razas:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

export { router as charactersRouter };
