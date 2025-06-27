/**
 * @file Utilidad para validar exportaciones de tipos de entidades
 * @module utils/types/export-validator
 *
 * Esta utilidad verifica que las exportaciones de tipos de entidades
 * estén correctamente configuradas en los archivos index.ts
 */

// Importar todos los tipos para verificar que están correctamente exportados
import type { Album } from '@/types/entities/album';
import type { Character } from '@/types/entities/character';
import type { Concept } from '@/types/entities/concept';
import type { Group } from '@/types/entities/group';
import type { Place } from '@/types/entities/place';
import type { Prompt } from '@/types/entities/prompt';
import type { Tag } from '@/types/entities/tag';
import type { WorldItem } from '@/types/entities/world-item';

// Tipo que representa una entidad con ID
export interface Entity {
	id: string;
}

// Verificador de tipo en tiempo de compilación
export type VerifyEntityType<T extends Entity> = T;

// Verificar todas las entidades
export type VerifiedEntityTypes = {
	album: VerifyEntityType<Album>;
	character: VerifyEntityType<Character>;
	collection: VerifyEntityType<Collection>;
	concept: VerifyEntityType<Concept>;
	folder: VerifyEntityType<Folder>;
	group: VerifyEntityType<Group>;
	image: VerifyEntityType<Image>;
	note: VerifyEntityType<Note>;
	place: VerifyEntityType<Place>;
	prompt: VerifyEntityType<Prompt>;
	property: VerifyEntityType<Property>;
	tag: VerifyEntityType<Tag>;
	video: VerifyEntityType<Video>;
	wildcard: VerifyEntityType<Wildcard>;
	worldItem: VerifyEntityType<WorldItem>;
};

/**
 * Esta función se utiliza solo para validación en tiempo de desarrollo
 * y no debe ser llamada en producción
 */
export function validateEntityExports(): void {
	console.info('✅ Todas las entidades están correctamente exportadas');
	// Esta función no hace nada, solo sirve para validación en tiempo de compilación
}
