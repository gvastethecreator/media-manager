import { Router } from 'express';
import {
	createWorkflow,
	deleteWorkflow,
	getWorkflowById,
	getWorkflows,
	updateWorkflow,
} from '@/services/workflow/workflow.service';

const router = Router();

// GET /api/workflows - Obtener todos los workflows
router.get('/', async (_req, res) => {
	try {
		const workflows = await getWorkflows();
		res.json(workflows);
	} catch (error) {
		console.error('Error al obtener workflows:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /api/workflows/:id - Obtener un workflow por ID
router.get('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const workflow = await getWorkflowById(id);
		if (!workflow) {
			return res.status(404).json({ error: 'Workflow no encontrado' });
		}
		res.json(workflow);
	} catch (error) {
		console.error('Error al obtener workflow por ID:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// POST /api/workflows - Crear un nuevo workflow
router.post('/', async (req, res) => {
	try {
		// Aquí se podría añadir validación con Zod si fuera necesario
		const newWorkflow = await createWorkflow(req.body);
		res.status(201).json(newWorkflow);
	} catch (error) {
		console.error('Error al crear workflow:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// PUT /api/workflows/:id - Actualizar un workflow
router.put('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		// Aquí se podría añadir validación con Zod si fuera necesario
		const updatedWorkflow = await updateWorkflow(id, req.body);
		res.json(updatedWorkflow);
	} catch (error) {
		console.error('Error al actualizar workflow:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// DELETE /api/workflows/:id - Eliminar un workflow
router.delete('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		await deleteWorkflow(id);
		res.json({ message: 'Workflow eliminado correctamente' });
	} catch (error) {
		console.error('Error al eliminar workflow:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

export { router as workflowsRouter };
