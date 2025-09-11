import { stat } from 'node:fs/promises';
import { basename, extname } from 'node:path';
import type { FileInfo } from '@/types/file-entity-mapper';
import { FileHashService } from './file-hash.service';

/**
 * Servicio para extracción de información básica de archivos
 * Extraído de FileEntityMapperService para mejorar modularidad
 */
export class FileInfoService {
	private static instance: FileInfoService;
	private fileHashService: FileHashService;

	private constructor() {
		this.fileHashService = FileHashService.getInstance();
	}

	static getInstance(): FileInfoService {
		if (!FileInfoService.instance) {
			FileInfoService.instance = new FileInfoService();
		}
		return FileInfoService.instance;
	}

	/**
	 * Extrae información completa de un archivo
	 */
	async getFileInfo(filePath: string, folderId: string): Promise<FileInfo> {
		const stats = await stat(filePath);
		const extension = extname(filePath).toLowerCase();
		const name = basename(filePath, extension);
		const hash = await this.fileHashService.calculateFileHash(filePath);

		return {
			name,
			path: filePath,
			size: stats.size,
			extension,
			hash,
			lastModified: stats.mtime,
			folderId,
		};
	}

	/**
	 * Obtiene el tipo MIME desde la extensión
	 */
	getMimeTypeFromExtension(extension: string): string {
		const mimeTypes: Record<string, string> = {
			'.pdf': 'application/pdf',
			'.doc': 'application/msword',
			'.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			'.txt': 'text/plain',
			'.rtf': 'application/rtf',
			'.odt': 'application/vnd.oasis.opendocument.text',
			'.jpg': 'image/jpeg',
			'.jpeg': 'image/jpeg',
			'.png': 'image/png',
			'.gif': 'image/gif',
			'.webp': 'image/webp',
			'.bmp': 'image/bmp',
			'.tiff': 'image/tiff',
			'.svg': 'image/svg+xml',
			'.mp4': 'video/mp4',
			'.avi': 'video/x-msvideo',
			'.mov': 'video/quicktime',
			'.wmv': 'video/x-ms-wmv',
			'.webm': 'video/webm',
			'.mp3': 'audio/mpeg',
			'.wav': 'audio/wav',
			'.flac': 'audio/flac',
			'.ogg': 'audio/ogg',
			'.aac': 'audio/aac',
			'.obj': 'model/obj',
			'.gltf': 'model/gltf+json',
			'.glb': 'model/gltf-binary',
			'.fbx': 'model/fbx',
			'.dae': 'model/vnd.collada+xml',
			'.json': 'application/json',
		};
		return mimeTypes[extension] || 'application/octet-stream';
	}
}
