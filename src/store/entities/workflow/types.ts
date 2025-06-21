/**
 * @file Definición de tipos para el store de Workflow
 * @module store/entities/workflow/types
 * @description Tipos refactorizados siguiendo el patrón de slices.
 */

import type { WorkflowWithStats } from '@/types/entities/workflow';
import type { Prisma } from '@prisma/client';

// --- ENUMS Y FILTROS ESPECÍFICOS DEL STORE ---

/**
 * 🎯 Filtros específicos para Workflow
 * (Adaptado de la versión legacy)
 */
export interface WorkflowFilters {
	searchTerm?: string;
	tags?: string[]; // Filtrar por IDs de tags
	isFavorite?: boolean;
}

/**
 * Criterios de ordenación para workflows
 */
export enum WorkflowSortCriteria {
	NAME_ASC = 'name:asc',
	NAME_DESC = 'name:desc',
	CREATED_ASC = 'createdAt:asc',
	CREATED_DESC = 'createdAt:desc',
	EXECUTIONS_ASC = 'executions:asc',
	EXECUTIONS_DESC = 'executions:desc',
	SUCCESS_RATE_ASC = 'successRate:asc',
	SUCCESS_RATE_DESC = 'successRate:desc',
}

// --- Interfaces de Estado y Acciones por Slice ---

/**
 * 📊 Estado principal (core) del store de Workflow
 */
export interface WorkflowCoreState {
	workflows: Record<string, WorkflowWithStats>;
	isLoading: boolean;
	error: string | null;
	lastUpdated: number | null;
}

/**
 * 🔄 Acciones del core slice
 */
export interface WorkflowCoreActions {
	loadWorkflows: () => Promise<void>;
	createWorkflow: (data: Prisma.WorkflowCreateInput) => Promise<void>;
	updateWorkflow: (id: string, data: Prisma.WorkflowUpdateInput) => Promise<void>;
	deleteWorkflow: (id: string) => Promise<void>;
}

/**
 * 🎨 Estado de UI para workflows
 */
export interface WorkflowUIState {
	selectedId: string | null;
	editingId: string | null;
	isCreateModalOpen: boolean;
}

/**
 * 🎯 Acciones del UI slice
 */
export interface WorkflowUIActions {
	selectWorkflow: (id: string | null) => void;
	openCreateModal: () => void;
	closeCreateModal: () => void;
	openEditModal: (id: string) => void;
	closeEditModal: () => void;
}

/**
 * 🔍 Estado de los filtros para workflows
 */
export interface WorkflowFilterState {
	filters: WorkflowFilters;
	sortBy: WorkflowSortCriteria;
}

/**
 * 🔍 Acciones del filter slice
 */
export interface WorkflowFilterActions {
	updateFilters: (filters: Partial<WorkflowFilters>) => void;
	setSortBy: (sortBy: WorkflowSortCriteria) => void;
	clearFilters: () => void;
}

/**
 * 📦 Tipo del store completo de Workflow
 */
export interface WorkflowStore extends WorkflowCoreState, WorkflowCoreActions, WorkflowUIState, WorkflowUIActions, WorkflowFilterState, WorkflowFilterActions {}