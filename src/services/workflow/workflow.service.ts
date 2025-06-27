/**
 * 🌊 Servicio para la entidad Workflow
 * @file Servicio de Workflow con lógica de negocio
 * @module services/workflow.service
 * @description Capa de servicio para la entidad Workflow que maneja la lógica de negocio
 * @updated 2025-06-27
 */

import { prisma } from '@/lib/database/prisma';
import { serverLogger } from '@/lib/logger/server-logger';
import { type EventType, emit } from '@/lib/server/events.server';
import type { WorkflowWithStats } from '@/types/entities/workflow';
import type { Prisma, Workflow } from '@prisma/client';

const workflowLogger = serverLogger.withContext('WorkflowService');

// Constantes para los tipos de eventos
const EVENTS = {
	WORKFLOW_CREATED: 'workflow:created',
	WORKFLOW_UPDATED: 'workflow:updated',
	WORKFLOW_DELETED: 'workflow:deleted',
	WORKFLOWS_CHANGED: 'workflows:changed',
};

// Mapeo de eventos a EventType - usar eventos existentes
const EVENT_TYPE_MAPPING: Record<string, EventType> = {
	[EVENTS.WORKFLOW_CREATED]: 'entities:modified',
	[EVENTS.WORKFLOW_UPDATED]: 'entities:modified',
	[EVENTS.WORKFLOW_DELETED]: 'entities:modified',
	[EVENTS.WORKFLOWS_CHANGED]: 'entities:modified',
};

/**
 * Obtiene todos los workflows con estadísticas básicas
 */
export async function getWorkflows(): Promise<WorkflowWithStats[]> {
	try {
		const workflows = await prisma.workflow.findMany({
			orderBy: { name: 'asc' },
		});

		// Crear estadísticas básicas para cada workflow
		return workflows.map((workflow) => {
			const contentLength = workflow.content.length;
			const isValid = contentLength > 0;

			// Construir WorkflowWithStats siguiendo la estructura esperada
			const workflowWithStats: WorkflowWithStats = {
				...workflow,
				statistics: {
					totalExecutions: 0, // No hay modelo WorkflowExecution aún
					successfulExecutions: 0,
					failureRate: 0,
					averageDuration: 0,
					nodeCount: 0, // Podría calcularse parseando el content JSON
					connectionCount: 0,
					lastExecution: null,
					createdDate: workflow.createdAt,
					modifiedDate: workflow.updatedAt,
					isValid,
					contentSize: contentLength,
				},
				formattedCreatedAt: workflow.createdAt.toLocaleDateString(),
				formattedUpdatedAt: workflow.updatedAt.toLocaleDateString(),
				isRecent: Date.now() - workflow.updatedAt.getTime() < 7 * 24 * 60 * 60 * 1000, // últimos 7 días
			};

			return workflowWithStats;
		});
	} catch (error) {
		workflowLogger.error('Error obteniendo workflows:', { error });
		throw new Error('Error al obtener workflows');
	}
}

/**
 * Obtiene un workflow por su ID
 */
export async function getWorkflowById(id: string): Promise<Workflow | null> {
	try {
		return await prisma.workflow.findUnique({
			where: { id },
		});
	} catch (error) {
		workflowLogger.error('Error obteniendo workflow por ID:', { id, error });
		throw new Error('Error al obtener workflow');
	}
}

/**
 * Crea un nuevo workflow
 */
export async function createWorkflow(data: Prisma.WorkflowCreateInput): Promise<Workflow> {
	try {
		const newWorkflow = await prisma.workflow.create({
			data,
		});

		// Emitir eventos con el nuevo sistema
		await emit({
			type: EVENT_TYPE_MAPPING[EVENTS.WORKFLOW_CREATED],
			data: { action: 'create', entity: newWorkflow, eventType: EVENTS.WORKFLOW_CREATED },
		});

		await emit({
			type: EVENT_TYPE_MAPPING[EVENTS.WORKFLOWS_CHANGED],
			data: { action: 'change', eventType: EVENTS.WORKFLOWS_CHANGED },
		});

		workflowLogger.info('Workflow creado:', newWorkflow.name);
		return newWorkflow;
	} catch (error) {
		workflowLogger.error('Error creando workflow:', { data, error });
		throw new Error('Error al crear workflow');
	}
}

/**
 * Actualiza un workflow existente
 */
export async function updateWorkflow(id: string, data: Prisma.WorkflowUpdateInput): Promise<Workflow> {
	try {
		const updatedWorkflow = await prisma.workflow.update({
			where: { id },
			data,
		});

		// Emitir eventos con el nuevo sistema
		await emit({
			type: EVENT_TYPE_MAPPING[EVENTS.WORKFLOW_UPDATED],
			data: { action: 'update', entity: updatedWorkflow, eventType: EVENTS.WORKFLOW_UPDATED },
		});

		await emit({
			type: EVENT_TYPE_MAPPING[EVENTS.WORKFLOWS_CHANGED],
			data: { action: 'change', eventType: EVENTS.WORKFLOWS_CHANGED },
		});

		workflowLogger.info('Workflow actualizado:', updatedWorkflow.name);
		return updatedWorkflow;
	} catch (error) {
		workflowLogger.error('Error actualizando workflow:', { id, data, error });
		throw new Error('Error al actualizar workflow');
	}
}

/**
 * Elimina un workflow
 */
export async function deleteWorkflow(id: string): Promise<void> {
	try {
		await prisma.workflow.delete({
			where: { id },
		});

		// Emitir eventos con el nuevo sistema
		await emit({
			type: EVENT_TYPE_MAPPING[EVENTS.WORKFLOW_DELETED],
			data: { action: 'delete', entity: { id }, eventType: EVENTS.WORKFLOW_DELETED },
		});

		await emit({
			type: EVENT_TYPE_MAPPING[EVENTS.WORKFLOWS_CHANGED],
			data: { action: 'change', eventType: EVENTS.WORKFLOWS_CHANGED },
		});

		workflowLogger.info('Workflow eliminado:', id);
	} catch (error) {
		workflowLogger.error('Error eliminando workflow:', { id, error });
		throw new Error('Error al eliminar workflow');
	}
}

/**
 * Verifica si un workflow existe
 */
export async function workflowExists(id: string): Promise<boolean> {
	try {
		const workflow = await prisma.workflow.findUnique({
			where: { id },
			select: { id: true },
		});
		return workflow !== null;
	} catch (error) {
		workflowLogger.error('Error verificando existencia de workflow:', { id, error });
		return false;
	}
}

/**
 * Obtiene el conteo total de workflows
 */
export async function getWorkflowCount(): Promise<number> {
	try {
		return await prisma.workflow.count();
	} catch (error) {
		workflowLogger.error('Error obteniendo conteo de workflows:', { error });
		throw new Error('Error al obtener conteo de workflows');
	}
}
