import { updateImageMetadata, updateMultipleImagesMetadata } from '@/app/actions/images/metadata.actions';
import { extractAIGenerationInfo } from '@/app/actions/metadata/parsers';
import express from 'express';

const router = express.Router();

// GET /metadata/image/:imageId - Obtener metadata de imagen
router.get('/image/:imageId', async (req, res) => {
	try {
		const { imageId } = req.params;

		// TODO: Implementar función para obtener metadata existente
		// Por ahora retornamos estructura base
		const result = {
			success: true,
			metadata: {},
			aiMetadata: null,
			errors: [],
			parser: null,
		};

		res.json(result);
	} catch (error) {
		console.error('Error getting image metadata:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// POST /metadata/extract/:imageId - Extraer metadata de imagen
router.post('/extract/:imageId', async (req, res) => {
	try {
		const { imageId } = req.params;

		// TODO: Implementar extracción real de metadata desde archivo
		const metadata = {}; // Obtener metadata del archivo

		const aiMetadata = await extractAIGenerationInfo(metadata);

		const result = {
			success: true,
			metadata,
			aiMetadata,
			errors: [],
			parser: aiMetadata ? 'auto-detected' : null,
		};

		res.json(result);
	} catch (error) {
		console.error('Error extracting metadata:', error);
		res.status(500).json({
			success: false,
			metadata: {},
			aiMetadata: null,
			errors: [error instanceof Error ? error.message : 'Error desconocido'],
			parser: null,
		});
	}
});

// GET /metadata/parsers - Obtener parsers disponibles
router.get('/parsers', async (req, res) => {
	try {
		const parsers = ['comfyui', 'automatic1111', 'invokeai', 'novelai', 'generic'];

		res.json(parsers);
	} catch (error) {
		console.error('Error getting parsers:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// PUT /metadata/image/:imageId - Actualizar metadata de imagen
router.put('/image/:imageId', async (req, res) => {
	try {
		const { imageId } = req.params;
		const { metadata } = req.body;

		if (!metadata) {
			return res.status(400).json({ error: 'Los datos de metadata son requeridos' });
		}

		await updateImageMetadata(imageId, metadata);

		const result = {
			success: true,
			metadata,
			aiMetadata: null,
			errors: [],
			parser: null,
		};

		res.json(result);
	} catch (error) {
		console.error('Error updating image metadata:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// PUT /metadata/bulk-update - Actualizar metadata en lote
router.put('/bulk-update', async (req, res) => {
	try {
		const { imageIds, metadata } = req.body;

		if (!imageIds || !Array.isArray(imageIds) || !metadata) {
			return res.status(400).json({
				error: 'imageIds (array) y metadata son requeridos',
			});
		}

		await updateMultipleImagesMetadata(imageIds, metadata);

		res.json({
			updated: imageIds.length,
			errors: [],
		});
	} catch (error) {
		console.error('Error in bulk metadata update:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// POST /metadata/reprocess/:imageId - Reprocesar metadata de imagen
router.post('/reprocess/:imageId', async (req, res) => {
	try {
		const { imageId } = req.params;

		// TODO: Implementar reprocesamiento completo
		const metadata = {}; // Re-extraer del archivo
		const aiMetadata = await extractAIGenerationInfo(metadata);

		// Actualizar en base de datos
		await updateImageMetadata(imageId, metadata);

		const result = {
			success: true,
			metadata,
			aiMetadata,
			errors: [],
			parser: aiMetadata ? 'reprocessed' : null,
		};

		res.json(result);
	} catch (error) {
		console.error('Error reprocessing metadata:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

export default router;
