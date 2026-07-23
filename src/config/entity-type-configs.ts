/**
 * @file Configuración centralizada para tipos de entidades
 * @module config/entity-type-configs
 * @description Sistema de configuración que mapea tipos de entidades a sus propiedades visuales,
 *              operaciones soportadas y generadores de thumbnails
 */

import {
	AudioWaveform,
	Database,
	File,
	FileText,
	Folder,
	FolderKanban,
	Grid2X2,
	Image as ImageIcon,
	type LucideIcon,
	MapPin,
	MessageSquare,
	Palette,
	SquareStack,
	StickyNote,
	Tag,
	Users,
	Video,
	WandSparkles,
} from 'lucide-react';
import type { ContextMenuAction } from '@/components/features/file-browser-new/components/item-context-menu';
import type { AnyEntityWithStats } from '@/types/entities';
import { EntityStatsType } from '@/types/file-browser/entity-stats';

/**
 * 🎨 Configuración completa para cada tipo de entidad
 */
export interface EntityTypeConfig {
	/** Color principal (hex) */
	color: string;
	/** Nombre para mostrar */
	displayName: string;
	/** Nombre plural */
	displayNamePlural: string;
	/** Emoji representativo */
	emoji: string;
	/** Icono de Lucide React */
	icon: LucideIcon;
	/** Configuración adicional específica del tipo */
	metadata?: Record<string, unknown>;
	/** Color secundario opcional para gradientes */
	secondaryColor?: string;
	/** Formatos de archivo soportados (si aplica) */
	supportedFormats?: string[];
	/** Operaciones soportadas en menú contextual */
	supportedOperations: ContextMenuAction[];
	/** Función para generar thumbnail */
	thumbnailGenerator?: (item: AnyEntityWithStats) => Promise<string>;
	/** Tipo de entidad */
	type: EntityStatsType;
}

/**
 * 🎯 Operaciones base para todos los tipos de entidad
 */
const BASE_OPERATIONS: ContextMenuAction[] = [
	'open',
	'copy',
	'rename',
	'delete',
	'move',
	'add-to-collection',
	'add-to-album',
	'add-tag',
	'favorite-toggle',
];

/**
 * 🎬 Operaciones adicionales para archivos multimedia
 */
const MEDIA_OPERATIONS: ContextMenuAction[] = [...BASE_OPERATIONS, 'preview', 'download', 'open-in-explorer'];

/**
 * 📁 Operaciones para entidades contenedoras
 */
const CONTAINER_OPERATIONS: ContextMenuAction[] = ['open', 'rename', 'delete', 'move', 'paste'];

/**
 * 🏷️ Operaciones para entidades relacionales
 */
const RELATIONAL_OPERATIONS: ContextMenuAction[] = ['open', 'delete', 'copy', 'favorite-toggle'];

/**
 * 🖼️ Generador de thumbnail para imágenes
 */
function generateImageThumbnail(item: AnyEntityWithStats): Promise<string> {
	// Verificar si es una imagen
	if (item.entityType !== 'image') {
		return Promise.resolve('');
	}

	// Si ya tiene thumbnailUrl, usarlo
	if ('thumbnailUrl' in item && typeof item.thumbnailUrl === 'string') {
		return Promise.resolve(item.thumbnailUrl);
	}

	// Si tiene id, generar URL de API
	if (item.id) {
		return Promise.resolve(`/api/images/${item.id}/thumbnail`);
	}

	return Promise.resolve('');
}

/**
 * 🎬 Generador de thumbnail para videos
 */
function generateVideoThumbnail(item: AnyEntityWithStats): Promise<string> {
	// Verificar si es un video
	if (item.entityType !== 'video') {
		return Promise.resolve('');
	}

	// Si ya tiene thumbnail, usarlo
	if ('thumbnail' in item && item.thumbnail) {
		return Promise.resolve(`/api/videos/${item.id}/thumbnail`);
	}

	// Si tiene id, generar URL de API
	if (item.id) {
		return Promise.resolve(`/api/videos/${item.id}/thumbnail`);
	}

	return Promise.resolve('');
}

/**
 * 🎵 Generador de thumbnail para audio
 */
function generateAudioThumbnail(item: AnyEntityWithStats): Promise<string> {
	// Para audio, generar un thumbnail visual basado en waveform o usar icono
	if (item.entityType !== 'audio') {
		return Promise.resolve('');
	}

	// Placeholder para generación de waveform
	return Promise.resolve(`/api/audio/${item.id}/waveform`);
}

/**
 * 📄 Generador de thumbnail para documentos
 */
function generateDocumentThumbnail(item: AnyEntityWithStats): Promise<string> {
	// Para documentos, generar preview de primera página
	if (item.entityType !== 'document') {
		return Promise.resolve('');
	}

	return Promise.resolve(`/api/thumbnails/unified/document/${item.id}`);
}

/**
 * 📁 Generador de thumbnail para carpetas
 */
function generateFolderThumbnail(item: AnyEntityWithStats): Promise<string> {
	// Para carpetas, mostrar preview de contenido o icono
	if (item.entityType !== 'folder') {
		return Promise.resolve('');
	}

	// Thumbnail compuesto de archivos dentro
	return Promise.resolve(`/api/folders/${item.id}/preview`);
}

/**
 * 🎨 Configuraciones para todos los tipos de entidad
 */
export const ENTITY_TYPE_CONFIGS: Record<EntityStatsType, EntityTypeConfig> = {
	[EntityStatsType.IMAGE]: {
		type: EntityStatsType.IMAGE,
		displayName: 'Imagen',
		displayNamePlural: 'Imágenes',
		icon: ImageIcon,
		color: 'var(--entity-image)',
		emoji: '🖼️',
		supportedOperations: MEDIA_OPERATIONS,
		supportedFormats: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.bmp', '.tiff', '.svg'],
		thumbnailGenerator: generateImageThumbnail,
		metadata: {
			hasPreview: true,
			hasMetadata: true,
			supportsZoom: true,
		},
	},

	[EntityStatsType.VIDEO]: {
		type: EntityStatsType.VIDEO,
		displayName: 'Video',
		displayNamePlural: 'Videos',
		icon: Video,
		color: 'var(--entity-video)',
		emoji: '🎬',
		supportedOperations: MEDIA_OPERATIONS,
		supportedFormats: ['.mp4', '.webm', '.avi', '.mov', '.mkv', '.flv', '.wmv', '.m4v'],
		thumbnailGenerator: generateVideoThumbnail,
		metadata: {
			hasPreview: true,
			hasMetadata: true,
			supportsPlayback: true,
		},
	},

	[EntityStatsType.AUDIO]: {
		type: EntityStatsType.AUDIO,
		displayName: 'Audio',
		displayNamePlural: 'Audios',
		icon: AudioWaveform,
		color: 'var(--entity-audio)',
		emoji: '🎵',
		supportedOperations: MEDIA_OPERATIONS,
		supportedFormats: ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a'],
		thumbnailGenerator: generateAudioThumbnail,
		metadata: {
			hasPreview: true,
			hasWaveform: true,
			supportsPlayback: true,
		},
	},

	[EntityStatsType.DOCUMENT]: {
		type: EntityStatsType.DOCUMENT,
		displayName: 'Documento',
		displayNamePlural: 'Documentos',
		icon: FileText,
		color: 'var(--entity-document)',
		emoji: '📄',
		supportedOperations: MEDIA_OPERATIONS,
		supportedFormats: ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt'],
		thumbnailGenerator: generateDocumentThumbnail,
		metadata: {
			hasPreview: true,
			hasTextContent: true,
			supportsSearch: true,
		},
	},

	[EntityStatsType.FOLDER]: {
		type: EntityStatsType.FOLDER,
		displayName: 'Carpeta',
		displayNamePlural: 'Carpetas',
		icon: Folder,
		color: 'var(--entity-folder)',
		emoji: '📁',
		supportedOperations: CONTAINER_OPERATIONS,
		thumbnailGenerator: generateFolderThumbnail,
		metadata: {
			isContainer: true,
			hasChildren: true,
		},
	},

	[EntityStatsType.COLLECTION]: {
		type: EntityStatsType.COLLECTION,
		displayName: 'Colección',
		displayNamePlural: 'Colecciones',
		icon: SquareStack,
		color: 'var(--entity-collection)',
		emoji: '📚',
		supportedOperations: RELATIONAL_OPERATIONS,
		metadata: {
			isContainer: true,
			hasItems: true,
			supportsSorting: true,
		},
	},

	[EntityStatsType.ALBUM]: {
		type: EntityStatsType.ALBUM,
		displayName: 'Álbum',
		displayNamePlural: 'Álbumes',
		icon: Grid2X2,
		color: 'var(--entity-album)',
		emoji: '📖',
		supportedOperations: RELATIONAL_OPERATIONS,
		metadata: {
			isContainer: true,
			hasItems: true,
			supportsSlideshow: true,
		},
	},

	[EntityStatsType.TAG]: {
		type: EntityStatsType.TAG,
		displayName: 'Etiqueta',
		displayNamePlural: 'Etiquetas',
		icon: Tag,
		color: 'var(--entity-tag)',
		emoji: '🏷️',
		supportedOperations: RELATIONAL_OPERATIONS,
		metadata: {
			isRelational: true,
			hasColor: true,
			hasCategory: true,
		},
	},

	[EntityStatsType.CHARACTER]: {
		type: EntityStatsType.CHARACTER,
		displayName: 'Personaje',
		displayNamePlural: 'Personajes',
		icon: Users,
		color: 'var(--entity-character)',
		emoji: '🧑‍🎤',
		supportedOperations: RELATIONAL_OPERATIONS,
		metadata: {
			isRelational: true,
			hasAvatar: true,
			hasBio: true,
		},
	},

	[EntityStatsType.PLACE]: {
		type: EntityStatsType.PLACE,
		displayName: 'Lugar',
		displayNamePlural: 'Lugares',
		icon: MapPin,
		color: 'var(--entity-place)',
		emoji: '📍',
		supportedOperations: RELATIONAL_OPERATIONS,
		metadata: {
			isRelational: true,
			hasLocation: true,
			hasMap: true,
		},
	},

	[EntityStatsType.WORLD_ITEM]: {
		type: EntityStatsType.WORLD_ITEM,
		displayName: 'Objeto',
		displayNamePlural: 'Objetos',
		icon: WandSparkles,
		color: 'var(--entity-world-item)',
		emoji: '🌍',
		supportedOperations: RELATIONAL_OPERATIONS,
		metadata: {
			isRelational: true,
			hasRarity: true,
			hasStats: true,
		},
	},

	[EntityStatsType.CONCEPT]: {
		type: EntityStatsType.CONCEPT,
		displayName: 'Concepto',
		displayNamePlural: 'Conceptos',
		icon: Palette,
		color: 'var(--entity-concept)',
		emoji: '💡',
		supportedOperations: RELATIONAL_OPERATIONS,
		metadata: {
			isRelational: true,
			hasDescription: true,
			hasExamples: true,
		},
	},

	[EntityStatsType.PROMPT]: {
		type: EntityStatsType.PROMPT,
		displayName: 'Prompt',
		displayNamePlural: 'Prompts',
		icon: MessageSquare,
		color: 'var(--entity-prompt)',
		emoji: '🤖',
		supportedOperations: RELATIONAL_OPERATIONS,
		metadata: {
			isRelational: true,
			hasText: true,
			hasParameters: true,
		},
	},

	[EntityStatsType.NOTE]: {
		type: EntityStatsType.NOTE,
		displayName: 'Nota',
		displayNamePlural: 'Notas',
		icon: StickyNote,
		color: 'var(--entity-note)',
		emoji: '📝',
		supportedOperations: RELATIONAL_OPERATIONS,
		metadata: {
			isRelational: true,
			hasContent: true,
			hasFormatting: true,
		},
	},

	[EntityStatsType.PROPERTY]: {
		type: EntityStatsType.PROPERTY,
		displayName: 'Propiedad',
		displayNamePlural: 'Propiedades',
		icon: Database,
		color: 'var(--entity-property)',
		emoji: '🔧',
		supportedOperations: RELATIONAL_OPERATIONS,
		metadata: {
			isRelational: true,
			hasValue: true,
			hasType: true,
		},
	},

	[EntityStatsType.WILDCARD]: {
		type: EntityStatsType.WILDCARD,
		displayName: 'Comodín',
		displayNamePlural: 'Comodines',
		icon: WandSparkles,
		color: 'var(--entity-wildcard)',
		emoji: '🃏',
		supportedOperations: RELATIONAL_OPERATIONS,
		metadata: {
			isRelational: true,
			hasPattern: true,
			hasVariations: true,
		},
	},

	[EntityStatsType.GROUP]: {
		type: EntityStatsType.GROUP,
		displayName: 'Grupo',
		displayNamePlural: 'Grupos',
		icon: FolderKanban,
		color: 'var(--entity-group)',
		emoji: '👥',
		supportedOperations: RELATIONAL_OPERATIONS,
		metadata: {
			isContainer: true,
			hasMembers: true,
			hasHierarchy: true,
		},
	},

	[EntityStatsType.UPLOADED_IMAGE]: {
		type: EntityStatsType.UPLOADED_IMAGE,
		displayName: 'Imagen Subida',
		displayNamePlural: 'Imágenes Subidas',
		icon: ImageIcon,
		color: 'var(--entity-image)',
		emoji: '📤',
		supportedOperations: MEDIA_OPERATIONS,
		supportedFormats: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
		thumbnailGenerator: generateImageThumbnail,
		metadata: {
			hasPreview: true,
			hasUploadInfo: true,
			isTemporary: true,
		},
	},

	[EntityStatsType.JSON_FILE]: {
		type: EntityStatsType.JSON_FILE,
		displayName: 'Archivo JSON',
		displayNamePlural: 'Archivos JSON',
		icon: FileText,
		color: 'var(--entity-json)',
		emoji: '🧾',
		supportedOperations: MEDIA_OPERATIONS,
		supportedFormats: ['.json'],
		metadata: {
			hasTextContent: true,
			supportsSearch: true,
		},
	},

	[EntityStatsType.FILE_3D]: {
		type: EntityStatsType.FILE_3D,
		displayName: 'Archivo 3D',
		displayNamePlural: 'Archivos 3D',
		icon: File,
		color: 'var(--entity-file-3d)',
		emoji: '📦',
		supportedOperations: MEDIA_OPERATIONS,
		supportedFormats: ['.obj', '.fbx', '.gltf', '.glb', '.stl'],
		metadata: {
			hasPreview: false,
			supports3D: true,
		},
	},
};

/**
 * 🔍 Obtiene la configuración para un tipo de entidad
 */
export function getEntityTypeConfig(type: EntityStatsType): EntityTypeConfig | undefined {
	return ENTITY_TYPE_CONFIGS[type];
}

/**
 * 🎨 Obtiene el color para un tipo de entidad
 */
export function getEntityTypeColor(type: EntityStatsType): string {
	const config = getEntityTypeConfig(type);
	return config?.color || 'var(--dt-neutral-500)'; // Gris por defecto
}

/**
 * 🎯 Obtiene el icono para un tipo de entidad
 */
export function getEntityTypeIcon(type: EntityStatsType): LucideIcon {
	const config = getEntityTypeConfig(type);
	return config?.icon || File; // Archivo genérico por defecto
}

/**
 * 📝 Obtiene el nombre para mostrar de un tipo de entidad
 */
export function getEntityTypeDisplayName(type: EntityStatsType, plural = false): string {
	const config = getEntityTypeConfig(type);
	if (!config) {
		return plural ? 'Elementos' : 'Elemento';
	}
	return plural ? config.displayNamePlural : config.displayName;
}

/**
 * 😀 Obtiene el emoji para un tipo de entidad
 */
export function getEntityTypeEmoji(type: EntityStatsType): string {
	const config = getEntityTypeConfig(type);
	return config?.emoji || '📄';
}

/**
 * ⚡ Obtiene las operaciones soportadas para un tipo de entidad
 */
export function getEntityTypeSupportedOperations(type: EntityStatsType): ContextMenuAction[] {
	const config = getEntityTypeConfig(type);
	return config?.supportedOperations || BASE_OPERATIONS;
}

/**
 * 🖼️ Genera thumbnail para una entidad
 */
export async function generateEntityThumbnail(item: AnyEntityWithStats): Promise<string> {
	const config = getEntityTypeConfig(item.entityType as EntityStatsType);

	if (config?.thumbnailGenerator) {
		try {
			return await config.thumbnailGenerator(item);
		} catch (error) {
			console.warn(`Error generando thumbnail para ${item.entityType}:`, error);
		}
	}

	// Fallback a icono o imagen por defecto
	return '';
}

/**
 * 📋 Verifica si un formato de archivo es soportado por un tipo de entidad
 */
export function isFormatSupported(type: EntityStatsType, format: string): boolean {
	const config = getEntityTypeConfig(type);
	if (!config?.supportedFormats) {
		return false;
	}

	const normalizedFormat = format.toLowerCase();
	return config.supportedFormats.some((supportedFormat) => normalizedFormat.endsWith(supportedFormat.toLowerCase()));
}

/**
 * 🔍 Detecta el tipo de entidad basado en la extensión del archivo
 */
export function detectEntityTypeFromExtension(filename: string): EntityStatsType | null {
	const extension = filename.toLowerCase().split('.').pop();
	if (!extension) {
		return null;
	}

	const extensionWithDot = `.${extension}`;

	// Buscar en todas las configuraciones
	for (const [type, config] of Object.entries(ENTITY_TYPE_CONFIGS)) {
		if (config.supportedFormats?.some((format) => format.toLowerCase() === extensionWithDot)) {
			return type as EntityStatsType;
		}
	}

	return null;
}

/**
 * 📊 Obtiene metadatos específicos de un tipo de entidad
 */
export function getEntityTypeMetadata(type: EntityStatsType): Record<string, unknown> {
	const config = getEntityTypeConfig(type);
	return config?.metadata || {};
}

/**
 * 🎨 Obtiene todos los colores únicos de los tipos de entidad
 */
export function getAllEntityTypeColors(): string[] {
	return [...new Set(Object.values(ENTITY_TYPE_CONFIGS).map((config) => config.color))];
}

/**
 * 📝 Obtiene lista de todos los tipos de entidad ordenados por nombre
 */
export function getAllEntityTypes(): EntityStatsType[] {
	return Object.values(EntityStatsType).sort((a, b) => {
		const configA = getEntityTypeConfig(a);
		const configB = getEntityTypeConfig(b);
		const nameA = configA?.displayName || a;
		const nameB = configB?.displayName || b;
		return nameA.localeCompare(nameB);
	});
}

/**
 * 🔄 Obtiene tipos de entidad por categoría
 */
export function getEntityTypesByCategory(): Record<string, EntityStatsType[]> {
	const categories = {
		Archivos: [EntityStatsType.IMAGE, EntityStatsType.VIDEO, EntityStatsType.AUDIO, EntityStatsType.DOCUMENT],
		Contenedores: [EntityStatsType.FOLDER, EntityStatsType.COLLECTION, EntityStatsType.ALBUM],
		Entidades: [EntityStatsType.CHARACTER, EntityStatsType.PLACE, EntityStatsType.WORLD_ITEM],
		Contenido: [EntityStatsType.CONCEPT, EntityStatsType.PROMPT, EntityStatsType.NOTE],
		Organización: [EntityStatsType.TAG, EntityStatsType.PROPERTY, EntityStatsType.GROUP],
		Especiales: [EntityStatsType.WILDCARD, EntityStatsType.UPLOADED_IMAGE],
	};

	return categories;
}
