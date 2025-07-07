import { Router } from 'express';
import { CharacterService } from '@/services/character/character.service';

const router = Router();
const characterService = new CharacterService();

// GET /api/characters - Obtener todos los personajes
router.get('/', async (_req, res) => {
	try {
		console.log('🔍 Obteniendo personajes con Drizzle ORM');
		const characters = await characterService.getCharacters();
		console.log(`✅ ${characters.length} personajes obtenidos`);
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

		const character = await characterService.getCharacter(id);

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

export { router as charactersRouter };

// Exportación default para compatibilidad con server/index.ts
export default router;
