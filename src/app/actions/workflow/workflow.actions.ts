'use server';

import { Prisma, Workflow } from '@prisma/client';
import { revalidatePath } from '@/lib/server/revalidate';
import * as WorkflowService from '@/services/workflow';
import { WorkflowWithStats } from '@/types/entities/workflow';

/**
 * 🌊 Server Actions para la entidad Workflow
 * @description Controladores delgados que delegan toda la lógica al servicio
 */

const revalidatePaths = ['/settings/workflows'];

/**
 * Obtiene todos los workflows con sus estadísticas
 */
export async function getWorkflows(): Promise<WorkflowWithStats[]> {
	return await WorkflowService.getWorkflows();
}

/**
 * Crea un nuevo workflow
 */
export async function createWorkflow(data: Prisma.WorkflowCreateInput): Promise<Workflow> {
	const result = await WorkflowService.createWorkflow(data);
	for (const path of revalidatePaths) {
		revalidatePath(path);
	}
	return result;
}

/**
 * Actualiza un workflow existente
 */
export async function updateWorkflow(id: string, data: Prisma.WorkflowUpdateInput): Promise<Workflow> {
	const result = await WorkflowService.updateWorkflow(id, data);
	for (const path of revalidatePaths) {
		revalidatePath(path);
	}
	revalidatePath(`/settings/workflows/${id}`);
	return result;
}

/**
 * Elimina un workflow
 */
export async function deleteWorkflow(id: string): Promise<void> {
	await WorkflowService.deleteWorkflow(id);
	for (const path of revalidatePaths) {
		revalidatePath(path);
	}
}
