/**
 * =================================================================================
 * REMAINING RELATIONS - DRIZZLE ORM
 * =================================================================================
 * Definición de las relaciones many-to-many restantes del sistema
 * Refactorizado para usar helpers DRY
 * =================================================================================
 */

import { createRelationTable } from './relation-helpers';
import { images } from '../files/images';
import { videos } from '../files/videos';
import { albums } from '../organization/albums';
import { groups } from '../organization/groups';
import { tags } from '../organization/tags';
import { notes } from '../taxonomy/notes';
import { prompts } from '../taxonomy/prompts';
import { wildcards } from '../taxonomy/wildcards';
import { characters } from '../worldbuilding/characters';
import { concepts } from '../worldbuilding/concepts';
import { places } from '../worldbuilding/places';
import { worldItems } from '../worldbuilding/worldItems';

// =================================================================================
// MEDIA - WILDCARD RELATIONS
// =================================================================================
export const imageWildcards = createRelationTable(
	'_ImageToWildcard',
	() => images.id,
	() => wildcards.id
);
export const videoWildcards = createRelationTable(
	'_VideoToWildcard',
	() => videos.id,
	() => wildcards.id
);

// =================================================================================
// MEDIA - CHARACTER RELATIONS
// =================================================================================
export const imageCharacters = createRelationTable(
	'_ImageToCharacter',
	() => images.id,
	() => characters.id
);
export const videoCharacters = createRelationTable(
	'_VideoToCharacter',
	() => videos.id,
	() => characters.id
);

// =================================================================================
// MEDIA - PLACE RELATIONS
// =================================================================================
export const imagePlaces = createRelationTable(
	'_ImageToPlace',
	() => images.id,
	() => places.id
);
export const videoPlaces = createRelationTable(
	'_VideoToPlace',
	() => videos.id,
	() => places.id
);

// =================================================================================
// ENTITY - PLACE CROSS RELATIONS
// =================================================================================
export const albumPlaces = createRelationTable(
	'_AlbumToPlace',
	() => albums.id,
	() => places.id
);
export const characterPlaces = createRelationTable(
	'_CharacterToPlace',
	() => characters.id,
	() => places.id
);

// =================================================================================
// MEDIA - WORLD ITEM RELATIONS
// =================================================================================
export const imageWorldItems = createRelationTable(
	'_ImageToWorldItem',
	() => images.id,
	() => worldItems.id
);
export const videoWorldItems = createRelationTable(
	'_VideoToWorldItem',
	() => videos.id,
	() => worldItems.id
);

// =================================================================================
// MEDIA - CONCEPT RELATIONS
// =================================================================================
export const imageConcepts = createRelationTable(
	'_ImageToConcept',
	() => images.id,
	() => concepts.id
);
export const videoConcepts = createRelationTable(
	'_VideoToConcept',
	() => videos.id,
	() => concepts.id
);

// =================================================================================
// MEDIA - PROMPT RELATIONS
// =================================================================================
export const imagePrompts = createRelationTable(
	'_ImageToPrompt',
	() => images.id,
	() => prompts.id
);
export const videoPrompts = createRelationTable(
	'_VideoToPrompt',
	() => videos.id,
	() => prompts.id
);

// =================================================================================
// MEDIA - NOTE RELATIONS
// =================================================================================
export const imageNotes = createRelationTable(
	'_ImageToNote',
	() => images.id,
	() => notes.id
);
export const videoNotes = createRelationTable(
	'_VideoToNote',
	() => videos.id,
	() => notes.id
);

// =================================================================================
// GROUP - MEDIA RELATIONS
// =================================================================================
export const groupImages = createRelationTable(
	'_GroupToImage',
	() => groups.id,
	() => images.id
);
export const groupVideos = createRelationTable(
	'_GroupToVideo',
	() => groups.id,
	() => videos.id
);
export const groupAlbums = createRelationTable(
	'_GroupToAlbum',
	() => groups.id,
	() => albums.id
);
export const groupTags = createRelationTable(
	'_GroupToTag',
	() => groups.id,
	() => tags.id
);
