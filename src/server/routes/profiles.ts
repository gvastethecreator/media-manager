import { Router } from 'express';
import { z } from 'zod';
import { profileService } from '../../services/profile/profile.service';

const router = Router();

// Schema para validación
const createProfileSchema = z.object({
	name: z.string().min(1, 'El nombre es requerido'),
	theme: z.enum(['light', 'dark', 'system']).default('system'),
	language: z.string().default('es'),
});

const updateProfileSchema = z.object({
	name: z.string().min(1).optional(),
	theme: z.enum(['light', 'dark', 'system']).optional(),
	language: z.string().optional(),
});

// GET /api/profiles/active - Obtener perfil activo
router.get('/active', async (req, res) => {
	try {
		const profile = await profileService.getActiveProfile();

		if (!profile) {
			return res.status(404).json({
				error: 'No se encontró un perfil activo',
				timestamp: new Date().toISOString(),
			});
		}

		res.json({
			data: profile,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error('Error obteniendo perfil activo:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
			timestamp: new Date().toISOString(),
		});
	}
});

// GET /api/profiles - Obtener todos los perfiles
router.get('/', async (req, res) => {
	try {
		const page = Number(req.query.page) || 1;
		const limit = Number(req.query.limit) || 10;
		const search = req.query.search as string;

		const result = await profileService.getPaginatedProfiles({
			page,
			limit,
			search,
		});

		res.json({
			data: result.profiles,
			pagination: {
				page: result.page,
				limit: result.limit,
				total: result.total,
				pages: result.pages,
			},
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error('Error obteniendo perfiles:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
			timestamp: new Date().toISOString(),
		});
	}
});

// POST /api/profiles - Crear nuevo perfil
router.post('/', async (req, res) => {
	try {
		const validatedData = createProfileSchema.parse(req.body);

		const profile = await profileService.createProfile(validatedData);

		res.status(201).json({
			data: profile,
			message: 'Perfil creado exitosamente',
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			return res.status(400).json({
				error: 'Datos de entrada inválidos',
				details: error.errors,
				timestamp: new Date().toISOString(),
			});
		}

		console.error('Error creando perfil:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
			timestamp: new Date().toISOString(),
		});
	}
});

// PUT /api/profiles/:id - Actualizar perfil
router.put('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const validatedData = updateProfileSchema.parse(req.body);

		const profile = await profileService.updateProfile(id, validatedData);

		if (!profile) {
			return res.status(404).json({
				error: 'Perfil no encontrado',
				timestamp: new Date().toISOString(),
			});
		}

		res.json({
			data: profile,
			message: 'Perfil actualizado exitosamente',
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			return res.status(400).json({
				error: 'Datos de entrada inválidos',
				details: error.errors,
				timestamp: new Date().toISOString(),
			});
		}

		console.error('Error actualizando perfil:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
			timestamp: new Date().toISOString(),
		});
	}
});

// POST /api/profiles/:id/activate - Activar perfil
router.post('/:id/activate', async (req, res) => {
	try {
		const { id } = req.params;

		const profile = await profileService.setActiveProfile(id);

		if (!profile) {
			return res.status(404).json({
				error: 'Perfil no encontrado',
				timestamp: new Date().toISOString(),
			});
		}

		res.json({
			data: profile,
			message: 'Perfil activado exitosamente',
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error('Error activando perfil:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
			timestamp: new Date().toISOString(),
		});
	}
});

// DELETE /api/profiles/:id - Eliminar perfil
router.delete('/:id', async (req, res) => {
	try {
		const { id } = req.params;

		const success = await profileService.deleteProfile(id);

		if (!success) {
			return res.status(404).json({
				error: 'Perfil no encontrado',
				timestamp: new Date().toISOString(),
			});
		}

		res.json({
			message: 'Perfil eliminado exitosamente',
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error('Error eliminando perfil:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			message: error instanceof Error ? error.message : 'Error desconocido',
			timestamp: new Date().toISOString(),
		});
	}
});

export default router;
