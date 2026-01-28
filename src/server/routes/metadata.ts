import express from 'express';
import { serverLogger } from '@/lib/logger/server-logger';
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
		serverLogger.error(`Error actualizando metadatos ${req.params.id}:`, errorMessage);
		res.status(500).json({ error: 'Error interno del servidor', details: errorMessage });
		return;
	}
});

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
		serverLogger.error('Error en la actualización masiva de metadatos:', errorMessage);
		res.status(500).json({ error: 'Error interno del servidor', details: errorMessage });
		return;
	}
});

export default router;
