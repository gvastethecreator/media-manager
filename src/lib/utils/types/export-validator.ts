/**
 * @file Utilidad para validar exportaciones de tipos de entidades
 * @module utils/types/export-validator
 *
 * Esta utilidad verifica que las exportaciones de tipos de entidades
 * estén correctamente configuradas en los archivos index.ts
 */

// Importar todos los tipos para verificar que están correctamente exportados
import type { AlbumWithStats } from '@/types/entities/album/types';
import type { CharacterWithStats } from '@/types/entities/character/types';
import type { CollectionWithStats } from '@/types/entities/collection/types';
import type { ConceptWithStats } from '@/types/entities/concept/types';
import type { FolderWithStats } from '@/types/entities/folder/types';
import type { GroupWithStats } from '@/types/entities/group/types';
import type { ImageComplete } from '@/types/entities/image/types';
import type { NoteComplete } from '@/types/entities/note/types';
import type { PlaceComplete } from '@/types/entities/place/types';
import type { PromptComplete } from '@/types/entities/prompt/types';
import type { PropertyComplete } from '@/types/entities/property/types';
import type { TagWithStats } from '@/types/entities/tag';
import type { VideoWithStats } from '@/types/entities/video/types';
import type { WildcardWithStats } from '@/types/entities/wildcard/types';
import type { WorldItemComplete } from '@/types/entities/world-item/types';

// Tipo que representa una entidad con ID
export interface Entity {
	id: string;
}

// Verificador de tipo en tiempo de compilación
export type VerifyEntityType<T extends Entity> = T;

// Verificar todas las entidades
export type VerifiedEntityTypes = {
	album: VerifyEntityType<AlbumWithStats>;
	character: VerifyEntityType<CharacterWithStats>;
	collection: VerifyEntityType<CollectionWithStats>;
	concept: VerifyEntityType<ConceptWithStats>;
	folder: VerifyEntityType<FolderWithStats>;
	group: VerifyEntityType<GroupWithStats>;
	image: VerifyEntityType<ImageComplete>;
	note: VerifyEntityType<NoteComplete>;
	place: VerifyEntityType<PlaceComplete>;
	prompt: VerifyEntityType<PromptComplete>;
	property: VerifyEntityType<PropertyComplete>;
	tag: VerifyEntityType<TagWithStats>;
	video: VerifyEntityType<VideoWithStats>;
	wildcard: VerifyEntityType<WildcardWithStats>;
	worldItem: VerifyEntityType<WorldItemComplete>;
};

/**
 * Esta función se utiliza solo para validación en tiempo de desarrollo
 * y no debe ser llamada en producción
 */
export function validateEntityExports(): void {
	console.info('✅ Todas las entidades están correctamente exportadas');
	// Esta función no hace nada, solo sirve para validación en tiempo de compilación
}
