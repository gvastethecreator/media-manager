/**
 * @file Servicio de creación de entidades básicas
 * @module services/file-entity-mapper/core/entity-creation
 */

import { createAudio } from '@/services/audio/audio.service';
import { createDocument } from '@/services/document/document.service';
import { createFile3D } from '@/services/file3d/file3d.service';
import type { CreateImageInput } from '@/services/image/image.service';
import { ImageService } from '@/services/image/image.service';
import { createJsonFile } from '@/services/json-file/json-file.service';
import { createVideo as createVideoServer } from '@/server/services/video.server.service';
import type { DocumentCreateInput } from '@/transformers/document/validators';
import type { AudioCreateInput } from '@/types/entities/audio';
import type { File3DCreateInput } from '@/types/entities/file3d';
import type { JsonFileCreateInput } from '@/types/entities/json-file';
import type { VideoCreateInput } from '@/types/entities/video';
import { EntityType, FileInfo } from '@/types/file-entity-mapper';

/**
 * Servicio responsable de crear entidades básicas en la base de datos
 * sin metadata ni thumbnails (Etapa 1 del proceso)
 */
export class EntityCreationService {
	private static instance: EntityCreationService;
	private imageService: ImageService;

	private constructor() {
		this.imageService = ImageService.getInstance();
	}

	public static getInstance(): EntityCreationService {
		if (!EntityCreationService.instance) {
			EntityCreationService.instance = new EntityCreationService();
		}
		return EntityCreationService.instance;
	}

	/**
	 * Obtiene el tipo MIME basado en la extensión del archivo
	 */
	private getMimeTypeFromExtension(extension: string): string {
		const mimeTypes: Record<string, string> = {
			// Images
			'.jpg': 'image/jpeg',
			'.jpeg': 'image/jpeg',
			'.png': 'image/png',
			'.gif': 'image/gif',
			'.bmp': 'image/bmp',
			'.webp': 'image/webp',
			'.svg': 'image/svg+xml',
			'.ico': 'image/x-icon',
			'.tiff': 'image/tiff',
			'.tif': 'image/tiff',
			'.avif': 'image/avif',
			'.heic': 'image/heic',
			'.heif': 'image/heif',

			// Videos
			'.mp4': 'video/mp4',
			'.avi': 'video/x-msvideo',
			'.mov': 'video/quicktime',
			'.wmv': 'video/x-ms-wmv',
			'.flv': 'video/x-flv',
			'.webm': 'video/webm',
			'.mkv': 'video/x-matroska',
			'.m4v': 'video/x-m4v',
			'.3gp': 'video/3gpp',
			'.ogv': 'video/ogg',

			// Audio
			'.mp3': 'audio/mpeg',
			'.wav': 'audio/wav',
			'.flac': 'audio/flac',
			'.aac': 'audio/aac',
			'.ogg': 'audio/ogg',
			'.wma': 'audio/x-ms-wma',
			'.m4a': 'audio/m4a',
			'.opus': 'audio/opus',

			// Documents
			'.pdf': 'application/pdf',
			'.doc': 'application/msword',
			'.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			'.xls': 'application/vnd.ms-excel',
			'.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'.ppt': 'application/vnd.ms-powerpoint',
			'.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
			'.txt': 'text/plain',
			'.rtf': 'application/rtf',
			'.odt': 'application/vnd.oasis.opendocument.text',
			'.ods': 'application/vnd.oasis.opendocument.spreadsheet',
			'.odp': 'application/vnd.oasis.opendocument.presentation',

			// 3D Files
			'.obj': 'model/obj',
			'.fbx': 'model/fbx',
			'.dae': 'model/vnd.collada+xml',
			'.3ds': 'model/3ds',
			'.blend': 'application/x-blender',
			'.gltf': 'model/gltf+json',
			'.glb': 'model/gltf-binary',
			'.stl': 'model/stl',
			'.ply': 'model/ply',
			'.x3d': 'model/x3d+xml',

			// JSON Files
			'.json': 'application/json',
			'.geojson': 'application/geo+json',
		};

		return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
	}

	/**
	 * Crea la entidad básica correspondiente según el tipo de archivo
	 */
	public async createBasicEntity(fileInfo: FileInfo, entityType: EntityType): Promise<string> {
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
					hash: fileInfo.hash,
					size: fileInfo.size,
					mimeType: this.getMimeTypeFromExtension(fileInfo.extension),
					duration: 0, // Will be updated after processing
					folderId: fileInfo.folderId,
					isFavorite: false,
				};
				const video = await createVideoServer(videoData);
				entityId = video.id;
				break;
			}

			case EntityType.AUDIO: {
				if (!fileInfo.hash) {
					throw new Error('File hash is required for audio creation');
				}
				const audioData: AudioCreateInput = {
					name: fileInfo.name,
					description: null,
					path: fileInfo.path,
					hash: fileInfo.hash,
					size: fileInfo.size,
					mimeType: this.getMimeTypeFromExtension(fileInfo.extension),
					extension: fileInfo.extension,
					folderId: fileInfo.folderId,
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

			case EntityType.JSON: {
				if (!fileInfo.hash) {
					throw new Error('File hash is required for json file creation');
				}
				const jsonData: JsonFileCreateInput = {
					name: fileInfo.name,
					path: fileInfo.path,
					hash: fileInfo.hash,
					size: fileInfo.size,
					mimeType: this.getMimeTypeFromExtension(fileInfo.extension),
					extension: fileInfo.extension,
					folderId: fileInfo.folderId,
					isFavorite: false,
					isArchived: false,
					content: null,
					schema: null,
					isValid: true,
					validationErrors: null,
					keyCount: null,
					depth: null,
				};
				const jsonFile = await createJsonFile(jsonData);
				entityId = jsonFile.id;
				break;
			}

			default:
				throw new Error(`Unsupported entity type: ${entityType}`);
		}

		return entityId;
	}
}
