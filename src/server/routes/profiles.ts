import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { profileService } from '../../services/profile/profile.service';

const router = Router();

const createProfileSchema = z.object({
	name: z.string().min(1, 'El nombre es requerido'),
	emoji: z.string().nullable().optional(),
	color: z.string().nullable().optional(),
	description: z.string().nullable().optional(),
	isActive: z.boolean().optional(),
	settingsId: z.string().nullable().optional(),
	imageId: z.string().nullable().optional(),
});

const updateProfileSchema = createProfileSchema.partial();

function toString(value: unknown): string | undefined {
	if (value === undefined || value === null) {
		return undefined;
	}

	if (Array.isArray(value)) {
		return value[0] ? String(value[0]) : undefined;
	}

	return typeof value === 'string' ? value : String(value);
}

function toNumber(value: unknown, fallback: number): number {
	const raw = toString(value);
	if (!raw) {
		return fallback;
	}

	const parsed = Number.parseInt(raw, 10);
	return Number.isNaN(parsed) ? fallback : parsed;
}

function respondWithServerError(res: Response, error: unknown, context: string) {
	const message = error instanceof Error ? error.message : 'Error desconocido';
	console.error(context, error);
	res.status(500).json({
		error: 'Error interno del servidor',
		message,
		timestamp: new Date().toISOString(),
	});
}

router.get('/active', async (_req: Request, res: Response) => {
	try {
		const profile = await profileService.getActiveProfile();

		if (!profile) {
			res.status(404).json({
				error: 'No se encontró un perfil activo',
				timestamp: new Date().toISOString(),
			});
			return;
		}

		res.json({
			data: profile,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		respondWithServerError(res, error, 'Error obteniendo perfil activo');
	}
});

router.get('/', async (req: Request, res: Response) => {
	try {
		const page = toNumber(req.query.page, 1);
		const limit = toNumber(req.query.limit, 10);
		const search = toString(req.query.search);

		const result = await profileService.getProfiles({ search }, { page, limit });

		res.json({
			data: result,
			pagination: {
				page,
				limit,
				total: result.length,
				pages: Math.ceil(result.length / limit),
			},
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		respondWithServerError(res, error, 'Error obteniendo perfiles');
	}
});

router.post('/', async (req: Request, res: Response) => {
	try {
		const rawData = createProfileSchema.parse(req.body);
		const validatedData = {
			...rawData,
			emoji: rawData.emoji ?? undefined,
			color: rawData.color ?? undefined,
			description: rawData.description ?? undefined,
			settingsId: rawData.settingsId ?? undefined,
			imageId: rawData.imageId ?? undefined,
		};

		const profile = await profileService.createProfile(validatedData);

		res.status(201).json({
			data: profile,
			message: 'Perfil creado exitosamente',
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			res.status(400).json({
				error: 'Datos de entrada inválidos',
				details: error.issues,
				timestamp: new Date().toISOString(),
			});
			return;
		}

		respondWithServerError(res, error, 'Error creando perfil');
	}
});

router.put('/:id', async (req: Request, res: Response) => {
	try {
		const payload = updateProfileSchema.parse(req.body);
		const validatedData = {
			...payload,
			emoji: payload.emoji ?? undefined,
			color: payload.color ?? undefined,
			description: payload.description ?? undefined,
			settingsId: payload.settingsId ?? undefined,
			imageId: payload.imageId ?? undefined,
		};

		const profile = await profileService.updateProfile(req.params.id, validatedData);

		if (!profile) {
			res.status(404).json({
				error: 'Perfil no encontrado',
				timestamp: new Date().toISOString(),
			});
			return;
		}

		res.json({
			data: profile,
			message: 'Perfil actualizado exitosamente',
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			res.status(400).json({
				error: 'Datos de entrada inválidos',
				details: error.issues,
				timestamp: new Date().toISOString(),
			});
			return;
		}

		respondWithServerError(res, error, 'Error actualizando perfil');
	}
});

router.post('/:id/activate', async (req: Request, res: Response) => {
	try {
		await profileService.setActiveProfile(req.params.id);

		res.json({
			message: 'Perfil activado exitosamente',
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		respondWithServerError(res, error, 'Error activando perfil');
	}
});

router.delete('/:id', async (req: Request, res: Response) => {
	try {
		await profileService.delete(req.params.id);

		res.json({
			message: 'Perfil eliminado exitosamente',
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		respondWithServerError(res, error, 'Error eliminando perfil');
	}
});

export default router;
