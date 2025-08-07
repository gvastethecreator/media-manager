import {
	Album,
	BookOpen,
	Calendar,
	HardDrive,
	ImageIcon,
	MapPin,
	MessageSquare,
	Package,
	Ruler,
	Tag,
	User,
	Video,
} from 'lucide-react';
import { formatFileSize } from '@/lib/utils';
import { formatDate } from '@/lib/utils/format.utils';
import type { AnyEntityWithStats } from '@/types/entities';
import type { BasicMetadataField, RelatedEntity } from '../types';

/**
 * Extrae dimensiones de una entidad desde múltiples fuentes
 */
const extractDimensions = (item: AnyEntityWithStats): { width?: number; height?: number } => {
	// Primero buscar en thumbnailWidth/thumbnailHeight
	if ('thumbnailWidth' in item && 'thumbnailHeight' in item) {
		return {
			width: item.thumbnailWidth as number,
			height: item.thumbnailHeight as number,
		};
	}

	// Luego en width/height directos
	if ('width' in item && 'height' in item) {
		return {
			width: item.width as number,
			height: item.height as number,
		};
	}

	// También buscar en metadatos
	if ('metadata' in item && typeof item.metadata === 'string' && item.metadata) {
		try {
			const parsedMetadata = JSON.parse(item.metadata);
			if (parsedMetadata.width && parsedMetadata.height) {
				return {
					width: parsedMetadata.width,
					height: parsedMetadata.height,
				};
			}
			if (parsedMetadata.exif?.ExifImageWidth && parsedMetadata.exif?.ExifImageHeight) {
				return {
					width: parsedMetadata.exif.ExifImageWidth,
					height: parsedMetadata.exif.ExifImageHeight,
				};
			}
		} catch {
			// Ignorar errores de parsing
		}
	}

	return {};
};

/**
 * Obtiene metadatos básicos de una entidad (tamaño, dimensiones, fechas)
 */
export const getBasicMetadata = (item: AnyEntityWithStats): BasicMetadataField[] => {
	const metadata: BasicMetadataField[] = [];

	// Agregar tamaño si existe
	if ('size' in item && typeof item.size === 'number') {
		metadata.push({
			key: 'Tamaño',
			value: formatFileSize(item.size),
			icon: HardDrive,
		});
	}

	// Agregar dimensiones si existen
	const { width, height } = extractDimensions(item);
	if (width && height && width > 0 && height > 0) {
		metadata.push({
			key: 'Dimensiones',
			value: `${width} × ${height}`,
			icon: Ruler,
		});
	}

	// Agregar fechas
	if ('addedAt' in item && item.addedAt) {
		metadata.push({
			key: 'Agregado',
			value: formatDate(new Date(item.addedAt)),
			icon: Calendar,
		});
	}

	if ('updatedAt' in item && item.updatedAt) {
		metadata.push({
			key: 'Modificado',
			value: formatDate(new Date(item.updatedAt)),
			icon: Calendar,
		});
	}

	return metadata;
};

/**
 * Configuración de tipos de entidades relacionadas
 */
const RELATED_ENTITY_CONFIG: Record<string, Omit<RelatedEntity, 'count'>> = {
	images: { type: 'Imágenes', icon: ImageIcon, color: 'bg-blue-100 text-blue-800' },
	videos: { type: 'Videos', icon: Video, color: 'bg-red-100 text-red-800' },
	albums: { type: 'Álbumes', icon: Album, color: 'bg-purple-100 text-purple-800' },
	collections: { type: 'Colecciones', icon: Album, color: 'bg-green-100 text-green-800' },
	tags: { type: 'Etiquetas', icon: Tag, color: 'bg-pink-100 text-pink-800' },
	characters: { type: 'Personajes', icon: User, color: 'bg-orange-100 text-orange-800' },
	places: { type: 'Lugares', icon: MapPin, color: 'bg-teal-100 text-teal-800' },
	worldItems: { type: 'Objetos', icon: Package, color: 'bg-indigo-100 text-indigo-800' },
	concepts: { type: 'Conceptos', icon: BookOpen, color: 'bg-yellow-100 text-yellow-800' },
	prompts: { type: 'Prompts', icon: MessageSquare, color: 'bg-cyan-100 text-cyan-800' },
};

/**
 * Obtiene las entidades relacionadas de una entidad (conteos de imágenes, videos, etc.)
 */
export const getRelatedEntities = (item: AnyEntityWithStats): RelatedEntity[] => {
	const hasCount = '_count' in item && item._count;
	if (!hasCount) {
		return [];
	}

	const count = item._count as Record<string, number>;
	const related: RelatedEntity[] = [];

	for (const [key, config] of Object.entries(RELATED_ENTITY_CONFIG)) {
		if (count[key] > 0) {
			related.push({
				...config,
				count: count[key],
			});
		}
	}

	return related;
};
