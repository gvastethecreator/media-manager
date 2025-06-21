'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { toWorkflowWithStats, WorkflowExecutionAggregates } from '@/transformers/workflow';
import { WorkflowWithStats } from '@/types/entities/workflow';
import { Prisma, Workflow, WorkflowStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const logger = serverLogger.withContext('WorkflowActions');

const revalidatePaths = ['/settings/workflows'];

/**
 * Obtiene todos los workflows con sus estadísticas de ejecución.
 */
export async function getWorkflows(): Promise<WorkflowWithStats[]> {
	try {
		const workflows = await prisma.workflow.findMany({
			orderBy: { name: 'asc' },
		});

		// Obtenemos todas las estadísticas en una sola consulta para evitar N+1
		const stats = await prisma.workflowExecution.groupBy({
			by: ['workflowId'],
			_count: {
				workflowId: true,
			},
			_avg: {
				duration: true,
			},
			_max: {
				startedAt: true,
			},
		});

		const successfulCounts = await prisma.workflowExecution.groupBy({
			by: ['workflowId'],
			where: { status: WorkflowStatus.COMPLETED },
			_count: {
				workflowId: true,
			},
		});

		// Mapeamos las estadísticas a un formato más accesible
		const statsMap = stats.reduce(
			(acc, s) => {
				acc[s.workflowId] = {
					totalExecutions: s._count.workflowId,
					_avg: { duration: s._avg.duration },
					_max: { startedAt: s._max.startedAt },
					successfulExecutions: 0, // inicializamos
				};
				return acc;
			},
			{} as Record<string, Omit<WorkflowExecutionAggregates, 'successfulExecutions'> & { successfulExecutions: number }>,
		);

		successfulCounts.forEach(s => {
			if (statsMap[s.workflowId]) {
				statsMap[s.workflowId].successfulExecutions = s._count.workflowId;
			}
		});

		// Combinamos los workflows con sus estadísticas
		return workflows.map(wf => {
			const workflowStats = statsMap[wf.id] || {
				totalExecutions: 0,
				successfulExecutions: 0,
				_avg: { duration: 0 },
				_max: { startedAt: null },
			};
			return toWorkflowWithStats(wf, workflowStats);
		});
	} catch (error) {
		logger.error('❌ Error al obtener workflows:', error);
		throw new Error('No se pudieron obtener los workflows.');
	}
}

/**
 * Crea un nuevo workflow.
 */
export async function createWorkflow(data: Prisma.WorkflowCreateInput): Promise<Workflow> {
	try {
		const newWorkflow = await prisma.workflow.create({ data });
		revalidatePaths.forEach(p => revalidatePath(p));
		logger.info('✅ Workflow creado:', newWorkflow.name);
		return newWorkflow;
	} catch (error) {
		logger.error('❌ Error al crear workflow:', { data, error });
		throw new Error('No se pudo crear el workflow.');
	}
}

/**
 * Actualiza un workflow existente.
 */
export async function updateWorkflow(id: string, data: Prisma.WorkflowUpdateInput): Promise<Workflow> {
	try {
		const updatedWorkflow = await prisma.workflow.update({ where: { id }, data });
		revalidatePaths.forEach(p => revalidatePath(p));
		revalidatePath(`/settings/workflows/${id}`);
		logger.info('✅ Workflow actualizado:', updatedWorkflow.name);
		return updatedWorkflow;
	} catch (error) {
		logger.error('❌ Error al actualizar workflow:', { id, error });
		throw new Error('No se pudo actualizar el workflow.');
	}
}

/**
 * Elimina un workflow.
 */
export async function deleteWorkflow(id: string): Promise<void> {
	try {
		await prisma.workflow.delete({ where: { id } });
		revalidatePaths.forEach(p => revalidatePath(p));
		logger.info('✅ Workflow eliminado:', id);
	} catch (error) {
		logger.error('❌ Error al eliminar workflow:', { id, error });
		throw new Error('No se pudo eliminar el workflow.');
	}
}
