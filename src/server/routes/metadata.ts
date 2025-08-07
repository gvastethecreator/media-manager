import express from 'express';
// import { getImageMetadata, updateImageMetadata, clearImageMetadata } from '../services/metadata.service';
// import { extractAIGenerationInfo } from '../services/metadata/parsers.service';
import * as MetadataService from '@/services/metadata';

const router = express.Router();

// Nueva ruta para actualizar metadatos por su ID
router.put('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const data = req.body;

		if (!data) {
			res.status(400).json({ error: 'Los datos de metadata son requeridos' });
			return;
		}

		const updatedMetadata = await MetadataService.updateMetadata(id, data);

		if (!updatedMetadata) {
			res.status(404).json({ error: `Metadato con id ${id} no encontrado` });
			return;
		}

		res.json(updatedMetadata);
		return;
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
		console.error(`Error actualizando metadatos ${req.params.id}:`, errorMessage);
		res.status(500).json({ error: 'Error interno del servidor', details: errorMessage });
		return;
	}
});

// GET /metadata/image/:imageId - Obtener metadata de imagen
/*
router.get('/image/:imageId', async (req, res) => {
	try {
		const { imageId } = req.params;
		const metadata = await getImageMetadata(imageId);
		res.json(metadata);
	} catch (error) {
		console.error('Error obteniendo metadatos de imagen:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});
*/

// DELETE /metadata/image/:imageId - Limpiar metadata de imagen
/*
router.delete('/image/:imageId', async (req, res) => {
	try {
		const { imageId } = req.params;
		const result = await clearImageMetadata(imageId);
		res.json(result);
	} catch (error) {
		console.error('Error limpiando metadatos de imagen:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});
*/

// POST /metadata/extract/:imageId - Extraer metadata de imagen
/*
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
*/

// GET /metadata/parsers - Obtener parsers disponibles
/*
router.get('/parsers', async (req, res) => {
	try {
		const parsers = ['comfyui', 'automatic1111', 'invokeai', 'novelai', 'generic'];

		res.json(parsers);
	} catch (error) {
		console.error('Error getting parsers:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});
*/

// PUT /metadata/image/:imageId - Actualizar metadata de imagen
/*
router.put('/image/:imageId', async (req, res) => {
	try {
		const { imageId } = req.params;
		const metadata = req.body;

		if (!metadata) {
			res.status(400).json({ error: 'Los datos de metadata son requeridos' });; return;
		}

		const updatedMetadata = await updateImageMetadata(imageId, metadata);

		res.json(updatedMetadata);
	} catch (error) {
		console.error('Error actualizando metadatos de imagen:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});
*/

// PUT /metadata/bulk-update - Actualizar metadata en lote
router.put('/bulk-update', async (req, res) => {
	try {
		const { updates } = req.body;

		if (!(updates && Array.isArray(updates))) {
			res.status(400).json({
				error: 'El campo "updates" (un array de objetos con id y data) es requerido',
			});
			return;
		}

		const result = await MetadataService.updateMultipleMetadata(updates);
		res.json(result);
		return;
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
		console.error('Error en la actualización masiva de metadatos:', errorMessage);
		res.status(500).json({ error: 'Error interno del servidor', details: errorMessage });
		return;
	}
});

// POST /metadata/reprocess/:imageId - Reprocesar metadata de imagen
/*
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
*/

export default router;
