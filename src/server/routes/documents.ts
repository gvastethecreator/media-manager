/**
 * @file Rutas para generación de previews de documentos
 * @module server/routes/documents
 */

import { eq } from 'drizzle-orm';
import express from 'express';
import { db } from '@/lib/drizzle/index.js';
import { metadatas } from '@/lib/drizzle/schema/index.js';
import { serverLogger } from '@/lib/logger/server-logger';

const router = express.Router();

/**
 * 📄 Interfaz para opciones de generación de preview de documento
 */
interface DocumentPreviewOptions {
	page?: number;
	width?: number;
	height?: number;
	quality?: 'low' | 'medium' | 'high';
}

/**
 * GET /documents/:id/preview - Generar preview de documento
 */
router.get('/:id/preview', async (req, res) => {
	try {
		const { id } = req.params;
		const options: DocumentPreviewOptions = {
			page: Number.parseInt(req.query.page as string, 10) || 1,
			width: Number.parseInt(req.query.width as string, 10) || 212,
			height: Number.parseInt(req.query.height as string, 10) || 300,
			quality: (req.query.quality as 'low' | 'medium' | 'high') || 'medium',
		};

		// Obtener thumbnail de la tabla metadatas
		const thumbnailId = `${id}-thumbnail`;
		const metadataRecords = await db
			.select({ value: metadatas.value })
			.from(metadatas)
			.where(eq(metadatas.id, thumbnailId));

		if (metadataRecords.length > 0) {
			const thumbnailSvg = metadataRecords[0].value;
			res.setHeader('Content-Type', 'image/svg+xml');
			res.setHeader('Cache-Control', 'public, max-age=3600');
			res.send(thumbnailSvg);
			return;
		}

		// Fallback: generar placeholder
		const backgroundColor = '#ffffff';
		const textColor = '#1f2937';
		const accentColor = '#3b82f6';

		const svgWidth = options.width ?? 212;
		const svgHeight = options.height ?? 300;
		const errorSVG = `
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
		res.send(errorSVG);
	} catch (error) {
		serverLogger.error('Error generando preview de documento:', error);
		res.status(500).json({ error: 'Error generating document preview' });
	}
});

export default router;
