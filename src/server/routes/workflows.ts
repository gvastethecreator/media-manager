// @ts-nocheck - Temporary suppression for Express handler parameter types
import { Router } from 'express';
import { z } from 'zod';
import {
	createWorkflow,
	deleteWorkflow,
	getWorkflowById,
	getWorkflows,
	updateWorkflow,
} from '@/services/workflow/workflow.service';

const router = Router() as any;

const WorkflowCreateSchema = z.object({
	name: z.string().min(1),
	description: z.string().nullish(),
	emoji: z.string().nullish(),
	color: z.string().nullish(),
	category: z.string().nullish(),

	isFavorite: z.boolean().optional(),
	isActive: z.boolean().optional(),
	version: z.string().nullish(),
	config: z.string().nullish(),
	steps: z.string().nullish(),
	triggers: z.string().nullish(),
	conditions: z.string().nullish(),
	actions: z.string().nullish(),
	schedule: z.string().nullish(),
	lastRun: z.date().nullish(),
	nextRun: z.date().nullish(),
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
			res.status(404).json({ error: 'Workflow no encontrado' });
			return;
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
		const rawData = WorkflowCreateSchema.parse(req.body);
		// Normalizar undefined a null para campos nullable
		const validatedData = {
			...rawData,
			description: rawData.description ?? null,
			emoji: rawData.emoji ?? null,
			color: rawData.color ?? null,
			category: rawData.category ?? null,
			version: rawData.version || '',
			config: rawData.config ?? null,
			steps: rawData.steps ?? null,
			triggers: rawData.triggers ?? null,
			conditions: rawData.conditions ?? null,
			actions: rawData.actions ?? null,
			schedule: rawData.schedule ?? null,
			lastRun: rawData.lastRun ?? null,
			nextRun: rawData.nextRun ?? null,

			isFavorite: rawData.isFavorite ?? false,
			isActive: rawData.isActive ?? false,
			runCount: rawData.runCount ?? 0,
			successCount: rawData.successCount ?? 0,
			errorCount: rawData.errorCount ?? 0,
		};
		const newWorkflow = await createWorkflow(validatedData);
		return res.status(201).json(newWorkflow);
	} catch (error) {
		console.error('Error al crear workflow:', error);
		return res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// PUT /api/workflows/:id - Actualizar un workflow
router.put('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const rawData = WorkflowUpdateSchema.parse(req.body);
		// Normalizar tipos para Update (nullable vs undefined)
		const validatedData: any = {};
		if (rawData.name !== undefined) validatedData.name = rawData.name;
		if (rawData.description !== undefined) validatedData.description = rawData.description ?? null;
		if (rawData.emoji !== undefined) validatedData.emoji = rawData.emoji ?? null;
		if (rawData.color !== undefined) validatedData.color = rawData.color ?? null;
		if (rawData.category !== undefined) validatedData.category = rawData.category ?? null;
		if (rawData.version !== undefined) validatedData.version = rawData.version || '';
		if (rawData.config !== undefined) validatedData.config = rawData.config ?? null;
		if (rawData.steps !== undefined) validatedData.steps = rawData.steps ?? null;
		if (rawData.triggers !== undefined) validatedData.triggers = rawData.triggers ?? null;
		if (rawData.conditions !== undefined) validatedData.conditions = rawData.conditions ?? null;
		if (rawData.actions !== undefined) validatedData.actions = rawData.actions ?? null;
		if (rawData.schedule !== undefined) validatedData.schedule = rawData.schedule ?? null;
		if (rawData.lastRun !== undefined) validatedData.lastRun = rawData.lastRun ?? null;
		if (rawData.nextRun !== undefined) validatedData.nextRun = rawData.nextRun ?? null;

		if (rawData.isFavorite !== undefined) validatedData.isFavorite = rawData.isFavorite;
		if (rawData.isActive !== undefined) validatedData.isActive = rawData.isActive;
		if (rawData.runCount !== undefined) validatedData.runCount = rawData.runCount;
		if (rawData.successCount !== undefined) validatedData.successCount = rawData.successCount;
		if (rawData.errorCount !== undefined) validatedData.errorCount = rawData.errorCount;

		const updatedWorkflow = await updateWorkflow(id, validatedData);
		return res.json(updatedWorkflow);
	} catch (error) {
		console.error('Error al actualizar workflow:', error);
		return res.status(500).json({ error: 'Error interno del servidor' });
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
