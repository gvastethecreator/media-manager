/**
 * @file Tipos para Tag
 * @module types/entities/tag/types
 */

export interface TagBase {
	id: string;
	name: string;
	description?: string;
	color?: string;
	emoji?: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface TagComplete extends TagBase {
	// Relaciones completas cuando sea necesario
}

export interface TagPreview extends Pick<TagBase, 'id' | 'name' | 'color' | 'emoji'> {
	stats?: {
		imageCount?: number;
	};
}
