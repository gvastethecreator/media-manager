'use server';

// Server Actions para Workflow
import { validateWorkflow } from '@/transformers/workflow/serializers';
import type { WorkflowComplete as Workflow } from '@/types/entities/workflow/types';

export async function createWorkflow(input: unknown): Promise<Workflow> {
	const workflow = validateWorkflow(input);
	// TODO: Persistir en DB
	return workflow;
}

export async function getWorkflowById(_id: string): Promise<Workflow | null> {
	// TODO: Obtener de DB
	return null;
}

export async function updateWorkflow(_id: string, input: unknown): Promise<Workflow> {
	const workflow = validateWorkflow(input);
	// TODO: Actualizar en DB
	return workflow;
}

export async function deleteWorkflow(_id: string): Promise<boolean> {
	// TODO: Eliminar de DB
	return true;
}
