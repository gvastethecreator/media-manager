import { Router } from 'express';
import { z } from 'zod';
import {
	createWorkflow,
	deleteWorkflow,
	getWorkflowById,
	getWorkflows,
	updateWorkflow,
} from '@/services/workflow/workflow.service';

const router = Router();

const WorkflowCreateSchema = z.object({
	name: z.string().min(1),
	description: z.string().nullable().optional(),
	emoji: z.string().nullable().optional(),
	color: z.string().nullable().optional(),
	category: z.string().nullable().optional(),
	isPublic: z.boolean().optional(),
	isFavorite: z.boolean().optional(),
	isActive: z.boolean().optional(),
	version: z.string().nullable().optional(),
	config: z.string().nullable().optional(),
	steps: z.string().nullable().optional(),
	triggers: z.string().nullable().optional(),
	conditions: z.string().nullable().optional(),
	actions: z.string().nullable().optional(),
	schedule: z.string().nullable().optional(),
	lastRun: z.date().nullable().optional(),
	nextRun: z.date().nullable().optional(),
	runCount: z.number().int().min(0).optional(),
	successCount: z.number().int().min(0).optional(),
	errorCount: z.number().int().min(0).optional(),
});

const WorkflowUpdateSchema = WorkflowCreateSchema.partial();

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
		const validatedData = WorkflowCreateSchema.parse(req.body);
		const newWorkflow = await createWorkflow(validatedData);
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
		const validatedData = WorkflowUpdateSchema.parse(req.body);
		const updatedWorkflow = await updateWorkflow(id, validatedData);
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
