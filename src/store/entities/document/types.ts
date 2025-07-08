/**
 * @file Tipos para el store de la entidad Document.
 * @module store/entities/document/types
 * @description Define la forma del estado y las acciones para el store de Document.
 * ✅ MIGRADO A DRIZZLE - Usa tipos locales en lugar de Prisma
 */

import type { DocumentCreateInput, DocumentUpdateInput, DocumentWithStats } from '@/types/entities/document';

// --- Estado del Slice ---

export interface DocumentCoreState {
	documents: Record<string, DocumentWithStats>;
	isLoading: boolean;
	error: string | null;
	lastUpdated: number | null;
}

export type DocumentUIState = Record<string, never>;

export type DocumentFilterState = Record<string, never>;

// --- Acciones del Slice ---

export interface DocumentCoreActions {
	loadDocuments: () => Promise<void>;
	createDocument: (data: DocumentCreateInput) => Promise<void>;
	updateDocument: (id: string, data: DocumentUpdateInput) => Promise<void>;
	deleteDocument: (id: string) => Promise<void>;
}

export type DocumentUIActions = Record<string, never>;

export type DocumentFilterActions = Record<string, never>;

// --- Store Completo ---

export type DocumentStore = DocumentCoreState &
	DocumentCoreActions &
	DocumentUIState &
	DocumentUIActions &
	DocumentFilterState &
	DocumentFilterActions;
