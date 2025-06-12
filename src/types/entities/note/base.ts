/**
 * 📝 Tipo base para Note, solo campos canónicos y serializables
 */
export interface NoteBase {
	id: string;
	title: string;
	content: string;
	category: string;
	priority: number;
	status: string;
	featuredImage?: string | null;
	isFavorite: boolean;
	presetId?: string | null;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Relación de nota con otras entidades
 */
export interface NoteRelation {
	entityId: string;
	entityType: string;
	noteId: string;
}

// ✅ NoteBase ahora es seguro y serializable para frontend/backend.
