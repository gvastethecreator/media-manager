'use server';

import { getPrismaClient } from '@/lib/db';
import { fromPrismaWorkflow, fromPrismaWorkflows } from '@/transformers/workflow/transformer';
import type { WorkflowFormData } from '@/types/entities/workflow/types';
import { handlePrismaError } from '@/utils/errors/prisma-errors';
import { revalidatePath } from 'next/cache';

// GET
export async function getWorkflows() {
	try {
		const prisma = await getPrismaClient();
		const workflows = await prisma.workflow.findMany({
			orderBy: { createdAt: 'desc' },
		});
		return fromPrismaWorkflows(workflows);
	} catch (error) {
		throw handlePrismaError(error, 'Error al obtener los workflows');
	}
}

export async function getWorkflowById(id: string) {
	try {
		const prisma = await getPrismaClient();
		const workflow = await prisma.workflow.findUnique({
			where: { id },
		});
		if (!workflow) {
			throw new Error('Workflow no encontrado');
		}
		return fromPrismaWorkflow(workflow);
	} catch (error) {
		throw handlePrismaError(error, `Error al obtener el workflow con ID ${id}`);
	}
}

// CREATE
export async function createWorkflow(data: WorkflowFormData) {
	try {
		const prisma = await getPrismaClient();
		const newWorkflow = await prisma.workflow.create({
			data: {
				name: data.name,
				filePath: data.filePath,
				content: data.content,
			},
		});
		revalidatePath('/workflow');
		return fromPrismaWorkflow(newWorkflow);
	} catch (error) {
		throw handlePrismaError(error, 'Error al crear el workflow');
	}
}

// UPDATE
export async function updateWorkflow(id: string, data: WorkflowFormData) {
	try {
		const prisma = await getPrismaClient();
		const updatedWorkflow = await prisma.workflow.update({
			where: { id },
			data: {
				name: data.name,
				filePath: data.filePath,
				content: data.content,
			},
		});
		revalidatePath('/workflow');
		revalidatePath(`/workflow/${id}`);
		return fromPrismaWorkflow(updatedWorkflow);
	} catch (error) {
		throw handlePrismaError(error, `Error al actualizar el workflow con ID ${id}`);
	}
}

// DELETE
export async function deleteWorkflow(id: string) {
	try {
		const prisma = await getPrismaClient();
		await prisma.workflow.delete({
			where: { id },
		});
		revalidatePath('/workflow');
		return { success: true };
	} catch (error) {
		throw handlePrismaError(error, `Error al eliminar el workflow con ID ${id}`);
	}
}