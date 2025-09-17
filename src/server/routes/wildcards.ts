import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { serverLogger } from '@/lib/logger/server-logger';
import wildcardService from '@/services/wildcard/wildcard.service';

const router = Router();
const logger = serverLogger.withContext('WildcardsRouter');

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

const ENTITY_ERROR_STATUS: Record<string, number> = {
	ENTITY_NOT_FOUND: 404,
	NOT_FOUND: 404,
	VALIDATION_ERROR: 400,
};

function toNumber(value: unknown, fallback: number): number {
	if (value === undefined || value === null) {
		return fallback;
	}

	const raw = Array.isArray(value) ? value[0] : value;
	const parsed = Number.parseInt(String(raw), 10);
	if (Number.isNaN(parsed) || parsed < 0) {
		return fallback;
	}

	return parsed;
}

function toBoolean(value: unknown): boolean | undefined {
	if (value === undefined || value === null) {
		return undefined;
	}

	const raw = Array.isArray(value) ? value[0] : value;
	if (typeof raw === 'string') {
		return raw.toLowerCase() === 'true';
	}

	return undefined;
}

function normalizeParentId(value: unknown): string | null | undefined {
	if (value === undefined || value === null) {
		return undefined;
	}

	const raw = Array.isArray(value) ? value[0] : value;
	if (raw === 'null') {
		return null;
	}

	return typeof raw === 'string' ? raw : String(raw);
}

function mapErrorToStatus(error: unknown): number {
	if (error instanceof z.ZodError) {
		return 400;
	}

	if (error && typeof error === 'object' && 'code' in error) {
		const code = (error as { code?: string }).code;
		if (code && ENTITY_ERROR_STATUS[code]) {
			return ENTITY_ERROR_STATUS[code];
		}
	}

	return 500;
}

function extractErrorMessage(error: unknown, fallback: string): string {
	if (error instanceof z.ZodError) {
		return 'Datos de entrada inválidos';
	}

	if (error instanceof Error && error.message) {
		return error.message;
	}

	if (error && typeof error === 'object' && 'message' in error) {
		const message = (error as { message?: unknown }).message;
		if (typeof message === 'string' && message.trim().length > 0) {
			return message;
		}
	}

	if (typeof error === 'string' && error.trim().length > 0) {
		return error;
	}

	return fallback;
}

function respondWithError(res: Response, error: unknown, fallback: string): void {
	if (res.headersSent) {
		return;
	}

	const status = mapErrorToStatus(error);
	const message = extractErrorMessage(error, fallback);
	logger.error(message, { error, status });

	if (error instanceof z.ZodError) {
		res.status(status).json({ error: true, message, details: error.flatten() });
		return;
	}

	res.status(status).json({ error: true, message });
}

// GET /wildcards/cards - Obtener wildcards para cards
router.get('/cards', async (req: Request, res: Response) => {
	try {
		const limit = toNumber(req.query.limit, 20);
		const orderBy = (req.query.orderBy as 'name' | 'createdAt' | 'updatedAt') ?? 'updatedAt';
		const orderDirection = (req.query.orderDir as 'asc' | 'desc') ?? 'desc';
		const searchTerm = typeof req.query.searchTerm === 'string' ? req.query.searchTerm : undefined;
		const parentId = normalizeParentId(req.query.parentId);
		const category = typeof req.query.category === 'string' ? req.query.category : undefined;

		const { wildcards } = await wildcardService.getWildcards({
			search: searchTerm,
			orderBy,
			orderDirection,
			parentId,
		});

		const filtered = category
			? wildcards.filter((item) => item.category === category)
			: wildcards;

		res.json(filtered.slice(0, limit));
	} catch (error) {
		respondWithError(res, error, 'Error al obtener wildcards para cards');
	}
});

// GET /wildcards - Listar wildcards con filtros
router.get('/', async (req: Request, res: Response) => {
	try {
		const limit = toNumber(req.query.limit, 50);
		const offset = toNumber(req.query.offset, 0);
		const search = typeof req.query.search === 'string' ? req.query.search : undefined;
		const sortBy = (req.query.sortBy as 'name' | 'createdAt' | 'updatedAt') ?? 'name';
		const sortOrder = (req.query.sortOrder as 'asc' | 'desc') ?? 'asc';
		const parentId = normalizeParentId(req.query.parentId);
		const onlyFavorites = toBoolean(req.query.onlyFavorites);

		const { wildcards, total } = await wildcardService.getWildcards({
			search,
			orderBy: sortBy,
			orderDirection: sortOrder,
			onlyFavorites: onlyFavorites ?? false,
			parentId,
		});

		const data = wildcards.slice(offset, offset + limit);
		res.json({
			data,
			pagination: {
				total,
				limit,
				offset,
				hasNext: offset + limit < total,
				hasPrev: offset > 0,
			},
		});
	} catch (error) {
		respondWithError(res, error, 'Error al obtener wildcards');
	}
});

// GET /wildcards/:id/card-data - Datos enriquecidos para cards
router.get('/:id/card-data', async (req: Request, res: Response) => {
	try {
		const wildcard = await wildcardService.getWildcard(req.params.id);
		if (!wildcard) {
			res.status(404).json({ error: true, message: 'Wildcard no encontrado' });
			return;
		}

		res.json({
			...wildcard,
			recentImages: [] as string[],
		});
	} catch (error) {
		respondWithError(res, error, 'Error al obtener datos del wildcard');
	}
});

// GET /wildcards/:id - Obtener wildcard por ID
router.get('/:id', async (req: Request, res: Response) => {
	try {
		const wildcard = await wildcardService.getWildcard(req.params.id);
		if (!wildcard) {
			res.status(404).json({ error: true, message: 'Wildcard no encontrado' });
			return;
		}

		res.json(wildcard);
	} catch (error) {
		respondWithError(res, error, 'Error al obtener wildcard');
	}
});

// GET /wildcards/:id/recent-images - placeholder temporal
router.get('/:id/recent-images', async (_req: Request, res: Response) => {
	try {
		res.json([]);
	} catch (error) {
		respondWithError(res, error, 'Error al obtener imágenes recientes del wildcard');
	}
});

// POST /wildcards - Crear nuevo wildcard
router.post('/', async (req: Request, res: Response) => {
	try {
		const payload = WildcardCreateSchema.parse(req.body);
		const created = await wildcardService.createWildcard(payload);
		res.status(201).json(created);
	} catch (error) {
		respondWithError(res, error, 'Error al crear wildcard');
	}
});

// PUT /wildcards/:id - Actualizar wildcard
router.put('/:id', async (req: Request, res: Response) => {
	try {
		const payload = WildcardUpdateSchema.parse(req.body);
		const updated = await wildcardService.updateWildcard(req.params.id, payload);
		res.json(updated);
	} catch (error) {
		respondWithError(res, error, 'Error al actualizar wildcard');
	}
});

// DELETE /wildcards/:id - Eliminar wildcard
router.delete('/:id', async (req: Request, res: Response) => {
	try {
		await wildcardService.deleteWildcard(req.params.id);
		res.status(204).send();
	} catch (error) {
		respondWithError(res, error, 'Error al eliminar wildcard');
	}
});

export default router;
