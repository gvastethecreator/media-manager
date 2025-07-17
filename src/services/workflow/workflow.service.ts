/**
 * 🌊 Servicio para la entidad Workflow
 * @file Servicio de Workflow con lógica de negocio
 * @module services/workflow.service
 * @description Capa de servicio para la entidad Workflow que maneja la lógica de negocio
 * @updated 2025-01-27 - MIGRADO A DRIZZLE ORM
 */

import { asc, count, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { workflows } from '@/lib/drizzle/schema/index';
import { serverLogger } from '@/lib/logger/server-logger';
import { type EventType, emit } from '@/lib/server/events.server';
import type { WorkflowCreateInput, WorkflowUpdateInput, WorkflowWithStats } from '@/types/entities/workflow';

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
		workflowLogger.info('🔍 Obteniendo workflows con Drizzle');

		const drizzleWorkflows = await db
			.select({
				id: workflows.id,
				name: workflows.name,
				description: workflows.description,
				config: workflows.config,
				steps: workflows.steps,
				isActive: workflows.isActive,
				createdAt: workflows.createdAt,
				updatedAt: workflows.updatedAt,
			})
			.from(workflows)
			.orderBy(asc(workflows.name));

		// Crear estadísticas básicas para cada workflow
		return drizzleWorkflows.map((workflow) => {
			const configLength = workflow.config ? workflow.config.length : 0;
			const stepsLength = workflow.steps ? workflow.steps.length : 0;
			const contentLength = configLength + stepsLength;
			const isValid = contentLength > 0;

			// Construir WorkflowWithStats siguiendo la estructura esperada
			const workflowWithStats: WorkflowWithStats = {
				...workflow,
				isActive: Boolean(workflow.isActive),
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
export async function getWorkflowById(id: string): Promise<any | null> {
	try {
		workflowLogger.info(`🔍 Obteniendo workflow por ID: ${id}`);

		const drizzleWorkflow = await db
			.select({
				id: workflows.id,
				name: workflows.name,
				description: workflows.description,
				config: workflows.config,
				steps: workflows.steps,
				isActive: workflows.isActive,
				createdAt: workflows.createdAt,
				updatedAt: workflows.updatedAt,
			})
			.from(workflows)
			.where(eq(workflows.id, id))
			.limit(1);

		if (drizzleWorkflow.length === 0) {
			workflowLogger.warn(`Workflow no encontrado: ${id}`);
			return null;
		}

		const rawWorkflow = drizzleWorkflow[0];

		return {
			...rawWorkflow,
			isActive: Boolean(rawWorkflow.isActive),
		};
	} catch (error) {
		workflowLogger.error('Error obteniendo workflow por ID:', { id, error });
		throw new Error('Error al obtener workflow');
	}
}

/**
 * Crea un nuevo workflow
 */
export async function createWorkflow(data: WorkflowCreateInput): Promise<any> {
	try {
		workflowLogger.info(`🆕 Creando workflow: ${data.name}`);

		const newWorkflowData = {
			name: data.name,
			description: data.description || null,
			config: data.config || null,
			steps: data.steps || null,
			isActive: data.isActive ?? true,
		};

		const [newWorkflow] = await db.insert(workflows).values(newWorkflowData).returning({
			id: workflows.id,
			name: workflows.name,
			description: workflows.description,
			config: workflows.config,
			steps: workflows.steps,
			isActive: workflows.isActive,
			createdAt: workflows.createdAt,
			updatedAt: workflows.updatedAt,
		});

		const finalWorkflow = {
			...newWorkflow,
			isActive: Boolean(newWorkflow.isActive),
		};

		// Emitir eventos con el nuevo sistema
		await emit({
			type: EVENT_TYPE_MAPPING[EVENTS.WORKFLOW_CREATED],
			data: { action: 'create', entity: finalWorkflow, eventType: EVENTS.WORKFLOW_CREATED },
		});

		await emit({
			type: EVENT_TYPE_MAPPING[EVENTS.WORKFLOWS_CHANGED],
			data: { action: 'change', eventType: EVENTS.WORKFLOWS_CHANGED },
		});

		workflowLogger.info('✅ Workflow creado:', finalWorkflow.name);
		return finalWorkflow;
	} catch (error) {
		workflowLogger.error('❌ Error creando workflow:', { data, error });
		throw new Error('Error al crear workflow');
	}
}

/**
 * Actualiza un workflow existente
 */
export async function updateWorkflow(id: string, data: WorkflowUpdateInput): Promise<any> {
	try {
		workflowLogger.info(`🔄 Actualizando workflow: ${id}`);

		const updateData: any = {};
		if (data.name !== undefined) updateData.name = data.name;
		if (data.description !== undefined) updateData.description = data.description;
		if (data.config !== undefined) updateData.config = data.config;
		if (data.steps !== undefined) updateData.steps = data.steps;
		if (data.isActive !== undefined) updateData.isActive = data.isActive;

		const [updatedWorkflow] = await db.update(workflows).set(updateData).where(eq(workflows.id, id)).returning({
			id: workflows.id,
			name: workflows.name,
			description: workflows.description,
			config: workflows.config,
			steps: workflows.steps,
			isActive: workflows.isActive,
			createdAt: workflows.createdAt,
			updatedAt: workflows.updatedAt,
		});

		const finalWorkflow = {
			...updatedWorkflow,
			isActive: Boolean(updatedWorkflow.isActive),
		};

		// Emitir eventos con el nuevo sistema
		await emit({
			type: EVENT_TYPE_MAPPING[EVENTS.WORKFLOW_UPDATED],
			data: { action: 'update', entity: finalWorkflow, eventType: EVENTS.WORKFLOW_UPDATED },
		});

		await emit({
			type: EVENT_TYPE_MAPPING[EVENTS.WORKFLOWS_CHANGED],
			data: { action: 'change', eventType: EVENTS.WORKFLOWS_CHANGED },
		});

		workflowLogger.info('✅ Workflow actualizado:', finalWorkflow.name);
		return finalWorkflow;
	} catch (error) {
		workflowLogger.error('❌ Error actualizando workflow:', { id, data, error });
		throw new Error('Error al actualizar workflow');
	}
}

/**
 * Elimina un workflow
 */
export async function deleteWorkflow(id: string): Promise<void> {
	try {
		workflowLogger.info(`🗑️ Eliminando workflow: ${id}`);

		await db.delete(workflows).where(eq(workflows.id, id));

		// Emitir eventos con el nuevo sistema
		await emit({
			type: EVENT_TYPE_MAPPING[EVENTS.WORKFLOW_DELETED],
			data: { action: 'delete', entity: { id }, eventType: EVENTS.WORKFLOW_DELETED },
		});

		await emit({
			type: EVENT_TYPE_MAPPING[EVENTS.WORKFLOWS_CHANGED],
			data: { action: 'change', eventType: EVENTS.WORKFLOWS_CHANGED },
		});

		workflowLogger.info('✅ Workflow eliminado:', id);
	} catch (error) {
		workflowLogger.error('❌ Error eliminando workflow:', { id, error });
		throw new Error('Error al eliminar workflow');
	}
}

/**
 * Verifica si un workflow existe
 */
export async function workflowExists(id: string): Promise<boolean> {
	try {
		const workflow = await db.select({ id: workflows.id }).from(workflows).where(eq(workflows.id, id)).limit(1);

		return workflow.length > 0;
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
		const [result] = await db.select({ count: count() }).from(workflows);

		return result.count;
	} catch (error) {
		workflowLogger.error('Error obteniendo conteo de workflows:', { error });
		throw new Error('Error al obtener conteo de workflows');
	}
}
