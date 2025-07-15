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
 * - Taxonomy: Clasificación y etiquetado (tags, properties, wildcards, characters, places, worldItems, concepts, prompts, notes)
 * - Content: Contenido adicional (imageStats, activities, audios, documents, jsonFiles, file3Ds, metadatas, thumbnails, workflows)
 * - Relations: Relaciones many-to-many entre entidades
 * =================================================================================
 */

// =================================================================================
// CONTENT DOMAIN EXPORTS
// =================================================================================
export {
	activities,
	audios,
	documents,
	file3Ds,
	imageStats,
	jsonFiles,
	metadatas,
	thumbnails,
	workflows,
} from './content';
// =================================================================================
// CORE DOMAIN EXPORTS
// =================================================================================
export {
	profiles,
	queueJobs,
	settings,
} from './core';
// =================================================================================
// MEDIA DOMAIN EXPORTS
// =================================================================================
export {
	folders,
	images,
	uploadedImages,
	videos,
} from './media';
// =================================================================================
// ORGANIZATION DOMAIN EXPORTS
// =================================================================================
export {
	albums,
	collections,
	favorites,
	files,
	groups,
} from './organization';
// =================================================================================
// RELATIONS DOMAIN EXPORTS
// =================================================================================
export {
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
} from './relations';
// =================================================================================
// TAXONOMY DOMAIN EXPORTS
// =================================================================================
export {
	characters,
	concepts,
	notes,
	places,
	prompts,
	properties,
	tags,
	wildcards,
	worldItems,
} from './taxonomy';

// =================================================================================
// SCHEMA OBJECT FOR DRIZZLE KIT
// =================================================================================
// El objeto schema se crea en drizzle/index.ts para evitar problemas de importación circular
