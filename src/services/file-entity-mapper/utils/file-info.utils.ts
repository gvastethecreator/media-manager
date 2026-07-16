import { stat } from 'node:fs/promises';
import { basename, extname } from 'node:path';
import type { EntityType, FileInfo } from '@/types/file-entity-mapper';
import { ENTITY_TYPE_MAPPING } from '@/types/file-entity-mapper';
import { calculateFileHash } from './hash.utils';

/**
 * Mapeo de extensiones de archivo a mimeTypes
 */
const MIME_TYPES: Record<string, string> = {
	// Documentos
	'.pdf': 'application/pdf',
	'.doc': 'application/msword',
	'.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'.txt': 'text/plain',
	'.rtf': 'application/rtf',
	'.odt': 'application/vnd.oasis.opendocument.text',
	'.md': 'text/markdown',
	'.html': 'text/html',
	'.htm': 'text/html',
	// Hojas de cálculo
	'.xls': 'application/vnd.ms-excel',
	'.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	'.ods': 'application/vnd.oasis.opendocument.spreadsheet',
	'.csv': 'text/csv',
	// Presentaciones
	'.ppt': 'application/vnd.ms-powerpoint',
	'.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
	'.odp': 'application/vnd.oasis.opendocument.presentation',
	// Datos estructurados
	'.json': 'application/json',
	'.xml': 'application/xml',
	'.yaml': 'text/yaml',
	'.yml': 'text/yaml',
	// Modelos 3D
	'.gltf': 'model/gltf+json',
	'.glb': 'model/gltf-binary',
	'.obj': 'model/obj',
	'.stl': 'model/stl',
};

/**
 * Determina el tipo de entidad basado en la extensión del archivo
 */
export function getEntityTypeFromExtension(extension: string): EntityType {
	if (!extension) {
		return 'unknown' as EntityType;
	}
	const normalizedExt = extension.toLowerCase();
	if (!normalizedExt) {
		return 'unknown' as EntityType;
	}
	if (!ENTITY_TYPE_MAPPING || typeof ENTITY_TYPE_MAPPING !== 'object') {
		return 'unknown' as EntityType;
	}
	for (const [entityType, extensions] of Object.entries(ENTITY_TYPE_MAPPING)) {
		if (extensions?.includes(normalizedExt)) {
			return entityType as EntityType;
		}
	}
	return 'unknown' as EntityType;
}

/**
 * Obtiene el mimeType basado en la extensión del archivo
 */
export function getMimeTypeFromExtension(extension: string): string {
	return MIME_TYPES[extension.toLowerCase()] || 'application/octet-stream';
}

/**
 * Extrae información básica de un archivo
 */
export async function getFileInfo(filePath: string, folderId: string): Promise<FileInfo> {
	const extension = extname(filePath).toLowerCase();
	const sourcePromise =
		getEntityTypeFromExtension(extension) === ('image' as EntityType)
			? import('@/server/security/configured-media-source').then(({ resolveConfiguredMediaSource }) =>
					resolveConfiguredMediaSource(filePath)
				)
			: Promise.resolve(undefined);
	const [stats, source] = await Promise.all([stat(filePath), sourcePromise]);
	const name = basename(filePath, extension);
	const hash = await calculateFileHash(filePath);
	return {
		name,
		path: filePath,
		size: stats.size,
		extension,
		hash,
		lastModified: stats.mtime,
		folderId,
		source,
	};
}
