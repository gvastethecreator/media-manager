/**
 * @file Document Event Constants
 * @module services/document/document-events
 * @description Event name constants for the Document service
 */

export const DOCUMENT_EVENTS = {
	DOCUMENT_CREATED: 'document:created',
	DOCUMENT_UPDATED: 'document:updated',
	DOCUMENT_DELETED: 'document:deleted',
	DOCUMENTS_CHANGED: 'documents:changed',
} as const;
