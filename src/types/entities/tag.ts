import type { FileItem } from '@/types/file-item';

// Tipo base para Tag
export interface Tag {
	id: string;
	name: string;
	color: string;
	description?: string | null;
	shortcut?: string | null;
	createdAt: Date;
	updatedAt: Date;
}

// Tipo para crear un nuevo tag
export interface TagCreate {
	name: string;
	color?: string;
	description?: string;
	shortcut?: string;
}

// Tipo para actualizar un tag
export interface TagUpdate extends Partial<Omit<TagCreate, 'name'>> {
	id: string;
	name?: string;
}

// Tipo para tag con estadísticas
export interface TagWithStats extends Tag {
	count: number;
	size: string;
}

// Tipo para tag con imágenes relacionadas
export interface TagWithImages extends Tag {
	images: FileItem[];
}

// Tipo para tag relacionado (versión simplificada para relaciones)
export interface RelatedTag {
	id: string;
	name: string;
	color: string;
}

// Tipo para respuesta de API de tags
export interface TagResponse extends Tag {
	_count?: {
		images: number;
	};
	images?: {
		size: number;
	}[];
}
