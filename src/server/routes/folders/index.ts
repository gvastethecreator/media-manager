/**
 * @file Router principal de folders
 * @module server/routes/folders
 * @description Exporta el router de Express para las rutas de carpetas
 */

import { Router } from 'express';

export const foldersRouter = Router();

// TODO: Implementar endpoints de folders
// Las rutas específicas están modularizadas en:
// - core.ts (CRUD básico)
// - files-endpoints.ts (archivos en carpetas)
// - media.ts (media en carpetas)
// - preview-endpoint.ts (previews)
// - sync.ts (sincronización)
// - tree.ts (árbol de carpetas)
// - updates.ts (actualizaciones)

foldersRouter.get('/health', (_req, res) => {
	res.json({ status: 'ok', service: 'folders' });
});
