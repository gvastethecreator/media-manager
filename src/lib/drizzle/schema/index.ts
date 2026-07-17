/**
 * =================================================================================
 * DRIZZLE SCHEMA INDEX - UNIFIED EXPORT
 * =================================================================================
 * Archivo principal que exporta todas las tablas del esquema dividido por dominios
 *
 * Dominios incluidos:
 * - Core: Tablas fundamentales del sistema (queueJobs, profiles, settings)
 * - Media: Archivos multimedia (folders, images, videos, uploadedImages)
 * - Organization: Organización de contenido (groups, albums, collections, favorites, files)
 * - Taxonomy: Clasificación y etiquetado (tags, properties, wildcards, prompts, notes)
 * - Worldbuilding: Construcción de mundos (characters, places, concepts, worldItems)
 * - Content: Contenido adicional (fileStats, activities, audios, documents, jsonFiles, file3Ds, metadatas, thumbnails)
 * - Relations: Relaciones many-to-many entre entidades
 * =================================================================================
 */

// =================================================================================
// CORE DOMAIN EXPORTS
// =================================================================================
export { activities, entityAggregates, fileStats, metadatas, profiles, queueJobs, settings, thumbnails } from "./core";
// =================================================================================
// DEV DOMAIN EXPORTS
// =================================================================================
export { alertLevelEnum, devFeatures, featureStatusEnum, serverAlerts } from "./dev";
// =================================================================================
// FILES/MEDIA DOMAIN EXPORTS
// =================================================================================
export {
	// Archivos
	audios,
	documents,
	file3Ds,
	images,
	jsonFiles,
	uploadedImages,
	videos,
} from "./files";
// =================================================================================
// MEDIA CORE DOMAIN EXPORTS
// =================================================================================
export { assets, mediaRoots, sourceFiles } from "./media-core";
// =================================================================================
// ORGANIZATION DOMAIN EXPORTS
// =================================================================================
export { albums, collections, favorites, files, folders, groups } from "./organization";
// =================================================================================
// RELATIONS DOMAIN EXPORTS
// =================================================================================
export {
	albumPlaces,
	characterPlaces,
	groupAlbums,
	// Relaciones de grupos
	groupImages,
	groupTags,
	groupVideos,
	// Relaciones básicas de organización
	imageAlbums,
	// Relaciones de entidades complejas
	imageCharacters,
	imageCollections,
	imageConcepts,
	imageNotes,
	imagePlaces,
	imagePrompts,
	imageProperties,
	// Relaciones de taxonomía
	imageTags,
	imageWildcards,
	imageWorldItems,
	videoAlbums,
	videoCharacters,
	videoCollections,
	videoConcepts,
	videoNotes,
	videoPlaces,
	videoPrompts,
	videoProperties,
	videoTags,
	videoWildcards,
	videoWorldItems,
} from "./relations";
// =================================================================================
// TAXONOMY DOMAIN EXPORTS
// =================================================================================
export { notes, prompts, properties, tags, taxonomyArtifacts, wildcards } from "./taxonomy";
// =================================================================================
// WORLDBUILDING DOMAIN EXPORTS
// =================================================================================
export { characters, concepts, places, worldItems } from "./worldbuilding";

// =================================================================================
// SCHEMA OBJECT FOR DRIZZLE KIT
// =================================================================================
// El objeto schema se crea en drizzle/index.ts para evitar problemas de importación circular
