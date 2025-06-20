/**
 * @file Transformador principal para la entidad Workflow
 * @module transformers/workflow/transformer
 * @description Contiene la lógica para convertir un objeto Workflow de Prisma a nuestro tipo canónico.
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { WorkflowComplete } from '@/types/entities/workflow/types';
import { TransformerError } from '@/utils/transformers/errors';

const logger = serverLogger.withContext('WorkflowTransformer');

/**
 * 🔄 Transforma un objeto Workflow de Prisma a nuestro tipo canónico WorkflowComplete.
 *
 * @param prismaWorkflow - El objeto Workflow obtenido de Prisma.
 * @returns Un objeto WorkflowComplete compatible con nuestra aplicación.
 * @throws {TransformerError} Si el objeto de entrada es nulo o inválido.
 */
export function fromPrismaWorkflow(prismaWorkflow: any): WorkflowComplete {
	if (!prismaWorkflow) {
		throw new TransformerError('El objeto de workflow de Prisma no puede ser nulo.');
	}

	try {
		const { _count, ...workflowData } = prismaWorkflow;

		const workflowComplete: WorkflowComplete = {
			...workflowData,
			// Conteos
			_count: {
				images: _count?.images ?? 0,
				videos: _count?.videos ?? 0,
				audio: _count?.audio ?? 0,
				file3d: _count?.file3d ?? 0,
				documents: _count?.documents ?? 0,
				jsonFiles: _count?.jsonFiles ?? 0,
				albums: _count?.albums ?? 0,
				collections: _count?.collections ?? 0,
				tags: _count?.tags ?? 0,
				characters: _count?.characters ?? 0,
				places: _count?.places ?? 0,
				worldItems: _count?.worldItems ?? 0,
				concepts: _count?.concepts ?? 0,
				prompts: _count?.prompts ?? 0,
				notes: _count?.notes ?? 0,
				wildcards: _count?.wildcards ?? 0,
				properties: _count?.properties ?? 0,
				groups: _count?.groups ?? 0,
			},
		};

		return workflowComplete;
	} catch (error) {
		logger.error('Error transformando workflow desde Prisma', {
			error,
			workflowId: prismaWorkflow?.id,
		});
		throw new TransformerError(`Error al transformar el workflow: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Transforma una lista de workflows de Prisma a una lista de WorkflowComplete.
 *
 * @param prismaWorkflows - Un array de objetos Workflow de Prisma.
 * @returns Un array de objetos WorkflowComplete.
 */
export function fromPrismaWorkflows(prismaWorkflows: any[]): WorkflowComplete[] {
	return prismaWorkflows.map(fromPrismaWorkflow);
}
