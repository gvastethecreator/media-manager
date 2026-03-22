/**
 * @file Rutas para generación de previews de documentos - Versión Effect-TS
 * @module server/routes/documents.effect
 */

import { eq } from 'drizzle-orm';
import { Effect } from 'effect';
import express from 'express';
import { db } from '@/lib/drizzle/index.js';
import { metadatas } from '@/lib/drizzle/schema/index.js';
import { effectHandler } from '@/lib/effect/adapters/express.adapter';
import { serverLogger } from '@/lib/logger/server-logger';

const router = express.Router();
const logger = serverLogger.withContext('DocumentsEffect');

/**
 * 📄 Interfaz para opciones de generación de preview de documento
 */
interface DocumentPreviewOptions {
	height?: number;
	page?: number;
	quality?: 'low' | 'medium' | 'high';
	width?: number;
}

/**
 * GET /api/documents/:id/preview - Generar preview de documento
 */
router.get(
	'/:id/preview',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const { id } = req.params;
			const options: DocumentPreviewOptions = {
				page: Number.parseInt(req.query.page as string, 10) || 1,
				width: Number.parseInt(req.query.width as string, 10) || 212,
				height: Number.parseInt(req.query.height as string, 10) || 300,
				quality: (req.query.quality as 'low' | 'medium' | 'high') || 'medium',
			};

			// Obtener thumbnail de la tabla metadatas
			const thumbnailId = `${id}-thumbnail`;
			const fetchMetadata = Effect.tryPromise<Array<{ value: string }>, Error>({
				try: () => db.select({ value: metadatas.value }).from(metadatas).where(eq(metadatas.id, thumbnailId)),
				catch: (error) => {
					logger.error(`Error obteniendo thumbnail para documento ${id}:`, error);
					return new Error(String(error));
				},
			});
			const metadataRecords = yield* fetchMetadata;

			if (metadataRecords && metadataRecords.length > 0) {
				const thumbnailSvg = metadataRecords[0].value;
				res.setHeader('Content-Type', 'image/svg+xml');
				res.setHeader('Cache-Control', 'public, max-age=3600');
				res.send(thumbnailSvg);
				return { success: true, servedFromCache: true };
			}

			// Fallback: generar placeholder
			const backgroundColor = '#ffffff';
			const textColor = '#1f2937';

			const svgWidth = options.width ?? 212;
			const svgHeight = options.height ?? 300;
			const placeholderSVG = `
<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${backgroundColor}"/>
  <g transform="translate(${svgWidth / 2},${svgHeight / 2})">
    <text text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="${textColor}">
      📄 Document
    </text>
  </g>
</svg>`;

			res.setHeader('Content-Type', 'image/svg+xml');
			res.setHeader('Cache-Control', 'public, max-age=60');
			res.send(placeholderSVG);
			return { success: true, servedFromCache: false };
		})
	)
);

export default router;
