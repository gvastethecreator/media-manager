import * as crypto from 'node:crypto';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
// Usar servicios del servidor para evitar fetch relativo en backend
import {
    createVideo as createVideoServer,
    getVideoByHash as getVideoByHashServer,
} from '@/server/services/video.server.service';
import { createAudio, getAudioByHash } from '@/services/audio/audio.service';
import { createDocument, getDocumentByHash } from '@/services/document/document.service';
import { createFile3D, getFile3DByHash } from '@/services/file3d/file3d.service';
import type { CreateImageInput } from '@/services/image/image.service';
import { ImageService } from '@/services/image/image.service';
import { MetadataIntegrationService } from '@/services/metadata-integration.service';
import type { DocumentCreateInput } from '@/transformers/document/validators';
import type { AudioCreateInput } from '@/types/entities/audio';
import type { File3DCreateInput } from '@/types/entities/file3d';
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
	private metadataService: MetadataIntegrationService;

	private constructor() {
		this.imageService = ImageService.getInstance();
		this.metadataService = MetadataIntegrationService.getInstance();
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
			if (extensions?.includes(normalizedExt)) {
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
	private async checkExistingEntity(fileInfo: FileInfo, entityType: EntityType): Promise<boolean> {
		try {
			switch (entityType) {
				case EntityType.IMAGE: {
					if (!fileInfo.hash) return false;
					const existingImage = await this.imageService.getImageByHash(fileInfo.hash);
					return !!existingImage;
				}
				case EntityType.VIDEO: {
					if (!fileInfo.hash) return false;
					const existingVideo = await getVideoByHashServer(fileInfo.hash);
					return !!existingVideo;
				}
				case EntityType.AUDIO: {
					if (!fileInfo.hash) return false;
					const existingAudio = await getAudioByHash(fileInfo.hash);
					return !!existingAudio;
				}
				case EntityType.FILE3D: {
					if (!fileInfo.hash) return false;
					const existingFile3D = await getFile3DByHash(fileInfo.hash);
					return !!existingFile3D;
				}
				case EntityType.DOCUMENT: {
					if (!fileInfo.hash) return false;
					const existingDocument = await getDocumentByHash(fileInfo.hash);
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
	 * 🚀 Crea solo la entidad básica sin metadata ni thumbnails (Etapa 1)
	 */
	public async createBasicEntityFromFile(filePath: string, folderId: string): Promise<EntityCreationResult> {
		console.log(`🔧 FileEntityMapper: [ETAPA 1] Indexando archivo ${filePath}`);
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
			const exists = await this.checkExistingEntity(fileInfo, entityType);
			if (exists) {
				console.log(`⚠️ FileEntityMapper: [ETAPA 1] Entidad ya existe para ${filePath}`);
				return {
					success: true,
					entityType,
					error: 'Entity already exists',
				};
			}

			// Crear la entidad básica SIN metadata
			const entityId = await this.createBasicEntity(fileInfo, entityType);

			return {
				success: true,
				entityType,
				entityId,
			};
		} catch (error) {
			console.error(`Error creating basic entity for ${filePath}:`, error);
			return {
				success: false,
				entityType: EntityType.UNKNOWN,
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}

	/**
	 * 🔍 Extrae metadata para una entidad existente (Etapa 2)
	 */
	public async extractMetadataForEntity(
		filePath: string,
		entityId: string,
		entityType: EntityType
	): Promise<{ success: boolean; error?: string }> {
		console.log(`🔍 FileEntityMapper: [ETAPA 2] Extrayendo metadata para ${filePath}`);
		try {
			// Importar el servicio de extracción de metadata unificado
			const { extractAllMetadata } = await import('@/server/services/metadata/unified-parser.service');

			// Leer el archivo como buffer
			const fileBuffer = await fs.readFile(filePath);
			const fileName = path.basename(filePath);

			// Extraer metadata usando el servicio unificado
			const metadataResult = await extractAllMetadata(fileBuffer, fileName);

			if (metadataResult.success) {
				console.log(`✅ [ETAPA 2] Metadata extraída exitosamente para: ${filePath}`, {
					origin: metadataResult.origin?.engine,
					hasAI: metadataResult.ai_metadata ? 'Sí' : 'No',
					errorsCount: metadataResult.errors.length,
				});
				return { success: true };
			}
			console.warn(`⚠️ [ETAPA 2] No se pudo extraer metadata de ${filePath}:`, metadataResult.errors);
			return { success: false, error: 'Metadata extraction failed' };
		} catch (error) {
			console.warn(`⚠️ [ETAPA 2] Error al extraer metadata de ${filePath}:`, error);
			return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
		}
	}

	/**
	 * 🖼️ Procesa thumbnail para una entidad existente (Etapa 3)
	 */
	public async processThumbnailForEntity(
		filePath: string,
		entityId: string,
		entityType: EntityType
	): Promise<{ success: boolean; error?: string }> {
		console.log(`🖼️ FileEntityMapper: [ETAPA 3] Procesando thumbnail para ${filePath}`);
		try {
			// Solo procesar thumbnails para tipos que los soportan
			if (entityType === EntityType.IMAGE || entityType === EntityType.VIDEO) {
				// TODO: Implementar generación de thumbnails
				// Por ahora solo simulamos el proceso
				await new Promise((resolve) => setTimeout(resolve, 100)); // Simular procesamiento
				console.log(`✅ [ETAPA 3] Thumbnail procesado para: ${filePath}`);
				return { success: true };
			}
			// Para otros tipos, marcar como exitoso sin procesar
			return { success: true };
		} catch (error) {
			console.warn(`⚠️ [ETAPA 3] Error al procesar thumbnail de ${filePath}:`, error);
			return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
		}
	}

	/**
	 * 🏗️ Método auxiliar para crear entidad básica
	 */
	private async createBasicEntity(fileInfo: FileInfo, entityType: EntityType): Promise<string> {
		let entityId: string;

		switch (entityType) {
			case EntityType.IMAGE: {
				if (!fileInfo.hash) {
					throw new Error('File hash is required for image creation');
				}
				const imageData: CreateImageInput = {
					name: fileInfo.name,
					path: fileInfo.path,
					size: fileInfo.size,
					width: 0, // Will be updated after processing
					height: 0, // Will be updated after processing
					hash: fileInfo.hash,
					folderId: fileInfo.folderId,
				};
				const image = await this.imageService.createImage(imageData);
				entityId = image.id;
				break;
			}

			case EntityType.VIDEO: {
				if (!fileInfo.hash) {
					throw new Error('File hash is required for video creation');
				}
				const videoData: VideoCreateInput = {
					name: fileInfo.name,
					path: fileInfo.path,
					size: fileInfo.size,
					hash: fileInfo.hash,
					folderId: fileInfo.folderId,
					mimeType: this.getMimeTypeFromExtension(fileInfo.extension),
					duration: 0, // Will be updated after processing
					isFavorite: false,
				};
				const video = await createVideoServer(videoData as any);
				entityId = video.id;
				break;
			}

			case EntityType.AUDIO: {
				if (!fileInfo.hash) {
					throw new Error('File hash is required for audio creation');
				}
				const audioData: AudioCreateInput = {
					name: fileInfo.name,
					path: fileInfo.path,
					hash: fileInfo.hash,
					size: fileInfo.size,
					folderId: fileInfo.folderId,
					mimeType: this.getMimeTypeFromExtension(fileInfo.extension),
					extension: fileInfo.extension,
					description: null,
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
				if (!fileInfo.hash) {
					throw new Error('File hash is required for file3d creation');
				}
				const file3dData: File3DCreateInput = {
					name: fileInfo.name,
					path: fileInfo.path,
					hash: fileInfo.hash,
					size: fileInfo.size,
					mimeType: this.getMimeTypeFromExtension(fileInfo.extension),
					extension: fileInfo.extension,
					folderId: fileInfo.folderId,
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
				if (!fileInfo.hash) {
					throw new Error('File hash is required for document creation');
				}
				const documentData: DocumentCreateInput = {
					name: fileInfo.name,
					path: fileInfo.path,
					hash: fileInfo.hash,
					size: fileInfo.size,
					mimeType: this.getMimeTypeFromExtension(fileInfo.extension),
					extension: fileInfo.extension,
					folderId: fileInfo.folderId,
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

		return entityId;
	}

	/**
	 * 🔄 Método original que ahora usa las 3 etapas secuencialmente (para compatibilidad)
	 */
	public async createEntityFromFile(filePath: string, folderId: string): Promise<EntityCreationResult> {
		console.log(`🔧 FileEntityMapper: Procesando archivo completo ${filePath}`);

		// Etapa 1: Crear entidad básica
		const basicResult = await this.createBasicEntityFromFile(filePath, folderId);
		if (!basicResult.success) {
			return basicResult;
		}

		// Si la entidad ya existía, no hacer etapas adicionales
		if (basicResult.error === 'Entity already exists') {
			return basicResult;
		}

		const entityId = basicResult.entityId!;
		const entityType = basicResult.entityType;

		// Etapa 2: Extraer metadata
		const metadataResult = await this.extractMetadataForEntity(filePath, entityId, entityType);
		if (!metadataResult.success) {
			console.warn(`⚠️ Metadata extraction failed for ${filePath}: ${metadataResult.error}`);
		}

		// Etapa 3: Procesar thumbnail
		const thumbnailResult = await this.processThumbnailForEntity(filePath, entityId, entityType);
		if (!thumbnailResult.success) {
			console.warn(`⚠️ Thumbnail processing failed for ${filePath}: ${thumbnailResult.error}`);
		}

		return {
			success: true,
			entityType,
			entityId,
		};
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
