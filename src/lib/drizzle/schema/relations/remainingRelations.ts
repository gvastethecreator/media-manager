/**
 * =================================================================================
 * REMAINING RELATIONS - DRIZZLE ORM
 * =================================================================================
 * Definición de las relaciones many-to-many restantes del sistema
 * Refactorizado para usar helpers DRY
 * =================================================================================
 */

import { createRelationTable } from './relation-helpers';

// =================================================================================
// MEDIA - WILDCARD RELATIONS
// =================================================================================
export const imageWildcards = createRelationTable('_ImageToWildcard', 'imageId', 'wildcardId');
export const videoWildcards = createRelationTable('_VideoToWildcard', 'videoId', 'wildcardId');

// =================================================================================
// MEDIA - CHARACTER RELATIONS
// =================================================================================
export const imageCharacters = createRelationTable('_ImageToCharacter', 'imageId', 'characterId');
export const videoCharacters = createRelationTable('_VideoToCharacter', 'videoId', 'characterId');

// =================================================================================
// MEDIA - PLACE RELATIONS
// =================================================================================
export const imagePlaces = createRelationTable('_ImageToPlace', 'imageId', 'placeId');
export const videoPlaces = createRelationTable('_VideoToPlace', 'videoId', 'placeId');

// =================================================================================
// ENTITY - PLACE CROSS RELATIONS
// =================================================================================
export const albumPlaces = createRelationTable('_AlbumToPlace', 'albumId', 'placeId');
export const characterPlaces = createRelationTable('_CharacterToPlace', 'characterId', 'placeId');

// =================================================================================
// MEDIA - WORLD ITEM RELATIONS
// =================================================================================
export const imageWorldItems = createRelationTable('_ImageToWorldItem', 'imageId', 'worldItemId');
export const videoWorldItems = createRelationTable('_VideoToWorldItem', 'videoId', 'worldItemId');

// =================================================================================
// MEDIA - CONCEPT RELATIONS
// =================================================================================
export const imageConcepts = createRelationTable('_ImageToConcept', 'imageId', 'conceptId');
export const videoConcepts = createRelationTable('_VideoToConcept', 'videoId', 'conceptId');

// =================================================================================
// MEDIA - PROMPT RELATIONS
// =================================================================================
export const imagePrompts = createRelationTable('_ImageToPrompt', 'imageId', 'promptId');
export const videoPrompts = createRelationTable('_VideoToPrompt', 'videoId', 'promptId');

// =================================================================================
// MEDIA - NOTE RELATIONS
// =================================================================================
export const imageNotes = createRelationTable('_ImageToNote', 'imageId', 'noteId');
export const videoNotes = createRelationTable('_VideoToNote', 'videoId', 'noteId');

// =================================================================================
// GROUP - MEDIA RELATIONS
// =================================================================================
export const groupImages = createRelationTable('_GroupToImage', 'groupId', 'imageId');
export const groupVideos = createRelationTable('_GroupToVideo', 'groupId', 'videoId');
export const groupAlbums = createRelationTable('_GroupToAlbum', 'groupId', 'albumId');
export const groupTags = createRelationTable('_GroupToTag', 'groupId', 'tagId');
