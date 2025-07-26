import * as crypto from 'node:crypto';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { createAudio, getAudioByHash } from '@/services/audio/audio.service';
import { createDocument, getDocumentByHash } from '@/services/document/document.service';
import { createFile3D, getFile3DByHash } from '@/services/file3d/file3d.service';
import { ImageService } from '@/services/image/image.service';
import { createVideo, getVideoByHash } from '@/services/video/video.service';
import type { AudioCreateInput } from '@/types/entities/audio';
import type { DocumentCreateInput } from '@/types/entities/document';
import type { File3DCreateInput } from '@/types/entities/file3d';
import type { CreateImageInput } from '@/services/image/image.service';
import type { VideoCreateInput } from '@/types/entities/video';
import {
	ENTITY_TYPE_MAPPING,
	EntityCreationResult,
	EntityCreationStats,
	EntityType,
	FileInfo,
} from '@/types/file-entity-mapper';

export class FileEntityMapperService {
	private static instance: FileEntityMapperService;
	private imageService: ImageService;

	private constructor() {
		this.imageService = ImageService.getInstance();
	}

	public static getInstance(): FileEntityMapperService {
		if (!FileEntityMapperService.instance) {
			FileEntityMapperService.instance = new FileEntityMapperService();
		}
		return FileEntityMapperService.instance;
	}

	/**
	 * Determina el tipo de entidad basado en la extensión del archivo
	 */
	public getEntityTypeFromExtension(extension: string): EntityType {
		if (!extension) {
			return EntityType.UNKNOWN;
		}

		const normalizedExt = extension.toLowerCase();
		if (!normalizedExt) {
			return EntityType.UNKNOWN;
		}

		// Validación null-safe para evitar errores de Object.entries
		if (!ENTITY_TYPE_MAPPING || typeof ENTITY_TYPE_MAPPING !== 'object') {
			return EntityType.UNKNOWN;
		}

		for (const [entityType, extensions] of Object.entries(ENTITY_TYPE_MAPPING)) {
			if (extensions && extensions.includes(normalizedExt)) {
				return entityType as EntityType;
			}
		}

		return EntityType.UNKNOWN;
	}

	/**
	 * Calcula el hash MD5 de un archivo
	 */
	private async calculateFileHash(filePath: string): Promise<string> {
		try {
			const fileBuffer = await fs.readFile(filePath);
			return crypto.createHash('md5').update(fileBuffer).digest('hex');
		} catch (error) {
			console.error(`Error calculating hash for ${filePath}:`, error);
			throw error;
		}
	}

	/**
	 * Obtiene información básica del archivo
	 */
	private async getFileInfo(filePath: string, folderId: string): Promise<FileInfo> {
		try {
			const stats = await fs.stat(filePath);
			const extension = path.extname(filePath).toLowerCase();
			const name = path.basename(filePath, extension);
			const hash = await this.calculateFileHash(filePath);

			return {
				name,
				path: filePath,
				size: stats.size,
				extension,
				hash,
				lastModified: stats.mtime,
				folderId,
			};
		} catch (error) {
			console.error(`Error getting file info for ${filePath}:`, error);
			throw error;
		}
	}

	/**
	 * Obtiene el tipo MIME basado en la extensión del archivo
	 */
	private getMimeTypeFromExtension(extension: string): string {
		const mimeTypes: Record<string, string> = {
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
			// Otros
			'.json': 'application/json',
			'.xml': 'application/xml',
			'.yaml': 'text/yaml',
			'.yml': 'text/yaml',
		};

		return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
	}

	/**
	 * Verifica si ya existe una entidad para el archivo
	 */
	private async checkExistingEntity(fileInfo: FileInfo, entityType: EntityType, folderId: string): Promise<boolean> {
		try {
			switch (entityType) {
				case EntityType.IMAGE: {
					const existingImage = await this.imageService.getImageByHash(fileInfo.hash!);
					return !!existingImage;
				}
				case EntityType.VIDEO: {
					const existingVideo = await getVideoByHash(fileInfo.hash!);
					return !!existingVideo;
				}
				case EntityType.AUDIO: {
					const existingAudio = await getAudioByHash(fileInfo.hash!);
					return !!existingAudio;
				}
				case EntityType.FILE3D: {
					const existingFile3D = await getFile3DByHash(fileInfo.hash!);
					return !!existingFile3D;
				}
				case EntityType.DOCUMENT: {
					const existingDocument = await getDocumentByHash(fileInfo.hash!);
					return !!existingDocument;
				}
				default:
					return false;
			}
		} catch (error) {
			// Si hay error al verificar, asumimos que no existe
			console.warn(`Error checking existing entity for ${fileInfo.path}:`, error);
			return false;
		}
	}

	/**
	 * Crea una entidad basada en el tipo de archivo
	 */
	public async createEntityFromFile(filePath: string, folderId: string): Promise<EntityCreationResult> {
		try {
			// Obtener información del archivo
			const fileInfo = await this.getFileInfo(filePath, folderId);
			const entityType = this.getEntityTypeFromExtension(fileInfo.extension);

			// Si es un tipo desconocido, no crear entidad
			if (entityType === EntityType.UNKNOWN) {
				return {
					success: false,
					entityType,
					error: `Unsupported file type: ${fileInfo.extension}`,
				};
			}

			// Verificar si ya existe una entidad para este archivo
			const exists = await this.checkExistingEntity(fileInfo, entityType, folderId);
			if (exists) {
				return {
					success: true,
					entityType,
					error: 'Entity already exists',
				};
			}

			// Crear la entidad según el tipo
			let entityId: string;

			switch (entityType) {
				case EntityType.IMAGE: {
					const imageData: CreateImageInput = {
						name: fileInfo.name,
						path: fileInfo.path,
						size: fileInfo.size,
						width: 0, // Will be updated after processing
						height: 0, // Will be updated after processing
						hash: fileInfo.hash!,
						folderId,
					};
					const image = await this.imageService.createImage(imageData);
					entityId = image.id;
					break;
				}

				case EntityType.VIDEO: {
					const videoData: VideoCreateInput = {
						name: fileInfo.name,
						path: fileInfo.path,
						size: fileInfo.size,
						hash: fileInfo.hash!,
						folderId,
						duration: 0, // Will be updated after processing
						isFavorite: false,
					};
					const video = await createVideo(videoData);
					entityId = video.id;
					break;
				}

				case EntityType.AUDIO: {
					const audioData: AudioCreateInput = {
						name: fileInfo.name,
						path: fileInfo.path,
						hash: fileInfo.hash!,
						size: fileInfo.size,
						folderId,
						mimeType: this.getMimeTypeFromExtension(fileInfo.extension),
						extension: fileInfo.extension,
						isFavorite: false,
						isArchived: false,
						duration: null,
						bitrate: null,
						sampleRate: null,
						channels: null,
						format: null,
						codec: null,
						title: null,
						artist: null,
						album: null,
						year: null,
						genre: null,
						track: null,
						disc: null,
						albumArtist: null,
						composer: null,
						comment: null,
						lyrics: null,
						bpm: null,
						key: null,
						mood: null,
					};
					const audio = await createAudio(audioData);
					entityId = audio.id;
					break;
				}

				case EntityType.FILE3D: {
					const file3dData: File3DCreateInput = {
						name: fileInfo.name,
						path: fileInfo.path,
						hash: fileInfo.hash!,
						size: fileInfo.size,
						mimeType: this.getMimeTypeFromExtension(fileInfo.extension),
						extension: fileInfo.extension,
						folderId,
						isFavorite: false,
						isArchived: false,
						format: null,
						version: null,
						vertices: null,
						faces: null,
						triangles: null,
						materials: null,
						textures: null,
						animations: null,
						bones: null,
						scenes: null,
						cameras: null,
						lights: null,
						hasUV: null,
						hasNormals: null,
						hasColors: null,
						boundingBox: null,
					};
					const file3d = await createFile3D(file3dData);
					entityId = file3d.id;
					break;
				}

				case EntityType.DOCUMENT: {
					const documentData: DocumentCreateInput = {
						name: fileInfo.name,
						path: fileInfo.path,
						hash: fileInfo.hash!,
						size: fileInfo.size,
						mimeType: this.getMimeTypeFromExtension(fileInfo.extension),
						extension: fileInfo.extension,
						folderId,
						isFavorite: false,
						isArchived: false,
						pageCount: null,
						wordCount: null,
						language: null,
						title: null,
						author: null,
						subject: null,
						keywords: null,
						creator: null,
						producer: null,
						creationDate: null,
						modificationDate: null,
						encrypted: null,
						version: null,
						content: null,
						summary: null,
					};
					const document = await createDocument(documentData);
					entityId = document.id;
					break;
				}

				default:
					throw new Error(`Unsupported entity type: ${entityType}`);
			}

			return {
				success: true,
				entityType,
				entityId,
			};
		} catch (error) {
			console.error(`Error creating entity for ${filePath}:`, error);
			return {
				success: false,
				entityType: EntityType.UNKNOWN,
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}

	/**
	 * Procesa múltiples archivos y crea sus entidades correspondientes
	 */
	public async processFiles(filePaths: string[], folderId: string): Promise<EntityCreationStats> {
		const stats: EntityCreationStats = {
			totalFiles: filePaths.length,
			processed: 0,
			successful: 0,
			failed: 0,
			errors: [],
		};

		for (const filePath of filePaths) {
			try {
				const result = await this.createEntityFromFile(filePath, folderId);
				stats.processed++;

				if (result.success) {
					stats.successful++;
				} else {
					stats.failed++;
					if (result.error && result.error !== 'Entity already exists') {
						stats.errors.push({
							file: filePath,
							error: result.error,
						});
					}
				}
			} catch (error) {
				stats.processed++;
				stats.failed++;
				stats.errors.push({
					file: filePath,
					error: error instanceof Error ? error.message : 'Unknown error',
				});
			}
		}

		return stats;
	}
}
