import { Router } from 'express';
import { z } from 'zod';
import { createCharacter, deleteCharacter, getCharacter, getCharacters, toggleCharacterFavorite, updateCharacter } from '@/services/character/character.service';

const router = Router();

const CharacterCreateSchema = z.object({
	name: z.string().min(1),
	description: z.string().nullable().optional(),
	emoji: z.string().nullable().optional(),
	color: z.string().nullable().optional(),
	category: z.string().nullable().optional(),
	isPublic: z.boolean().optional(),
	isFavorite: z.boolean().optional(),
	totalImages: z.number().int().min(0).optional(),
	totalVideos: z.number().int().min(0).optional(),
	age: z.string().nullable().optional(),
	gender: z.string().nullable().optional(),
	species: z.string().nullable().optional(),
	occupation: z.string().nullable().optional(),
	personality: z.string().nullable().optional(),
	background: z.string().nullable().optional(),
	relationships: z.string().nullable().optional(),
	skills: z.string().nullable().optional(),
	equipment: z.string().nullable().optional(),
	notes: z.string().nullable().optional(),
	featuredImage: z.string().nullable().optional(),
	parentId: z.string().nullable().optional(),
});

const CharacterUpdateSchema = CharacterCreateSchema.partial();

// GET /api/characters - Obtener todos los personajes
router.get('/', async (_req, res) => {
	try {
		console.log('🔍 Obteniendo personajes con Drizzle ORM');
		const characters = await getCharacters();
		console.log(`✅ ${characters.characters.length} personajes obtenidos`);
		res.json(characters);
	} catch (error) {
		console.error('❌ Error al obtener personajes:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// GET /api/characters/:id - Obtener un personaje por ID
router.get('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		console.log(`🔍 Obteniendo personaje ${id} con Drizzle ORM`);

		const character = await getCharacter(id);

		if (!character) {
			return res.status(404).json({ error: 'Personaje no encontrado' });
		}

		console.log(`✅ Personaje ${id} obtenido exitosamente`);
		res.json(character);
	} catch (error) {
		console.error('❌ Error al obtener personaje:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// POST /api/characters - Crear un nuevo personaje
router.post('/', async (req, res) => {
	try {
		const validatedData = CharacterCreateSchema.parse(req.body);
		const newCharacter = await createCharacter(validatedData);
		res.status(201).json(newCharacter);
	} catch (error) {
		console.error('❌ Error al crear personaje:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// PUT /api/characters/:id - Actualizar un personaje existente
router.put('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const validatedData = CharacterUpdateSchema.parse(req.body);
		const updatedCharacter = await updateCharacter(id, validatedData);
		if (!updatedCharacter) {
			return res.status(404).json({ error: 'Personaje no encontrado' });
		}
		res.json(updatedCharacter);
	} catch (error) {
		console.error('❌ Error al actualizar personaje:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// DELETE /api/characters/:id - Eliminar un personaje
router.delete('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		await deleteCharacter(id);
		res.status(204).send();
	} catch (error) {
		console.error('❌ Error al eliminar personaje:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

// PUT /api/characters/:id/favorite - Cambiar estado de favorito
router.put('/:id/favorite', async (req, res) => {
	try {
		const { id } = req.params;
		const updatedCharacter = await toggleCharacterFavorite(id);
		res.json(updatedCharacter);
	} catch (error) {
		console.error('❌ Error al cambiar estado de favorito del personaje:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

export { router as charactersRouter };

// Exportación default para compatibilidad con server/index.ts
export default router;
