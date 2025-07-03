/**
 * @file Tipos para el store de la entidad Document.
 * @module store/entities/document/types
 * @description Define la forma del estado y las acciones para el store de Document.
 */

import type { Prisma } from '@prisma/client';
import type { DocumentWithStats } from '@/types/entities/document';

// --- Estado del Slice ---

export interface DocumentCoreState {
	documents: Record<string, DocumentWithStats>;
	isLoading: boolean;
	error: string | null;
	lastUpdated: number | null;
}

export type DocumentUIState = {};

export type DocumentFilterState = {};

// --- Acciones del Slice ---

export interface DocumentCoreActions {
	loadDocuments: () => Promise<void>;
	createDocument: (data: Prisma.DocumentCreateInput) => Promise<void>;
	updateDocument: (id: string, data: Prisma.DocumentUpdateInput) => Promise<void>;
	deleteDocument: (id: string) => Promise<void>;
}

export type DocumentUIActions = {};

export type DocumentFilterActions = {};

// --- Store Completo ---

export type DocumentStore = DocumentCoreState &
	DocumentCoreActions &
	DocumentUIState &
	DocumentUIActions &
	DocumentFilterState &
	DocumentFilterActions;
