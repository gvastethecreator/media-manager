import type { FileInfo } from '@/types/file-entity-mapper';
import { EntityType } from '@/types/file-entity-mapper';
import { ImageService } from '@/services/image/image.service';
import { getVideoByHash as getVideoByHashServer } from '@/server/services/video.server.service';
import { getAudioByHash } from '@/services/audio/audio.service';
import { getDocumentByHash } from '@/services/document/document.service';
import { getFile3DByHash } from '@/services/file3d/file3d.service';
import { getJsonFileByHash } from '@/services/json-file/json-file.service';

/**
 * Servicio para verificación de entidades existentes por hash
 * Extraído de FileEntityMapperService para mejorar modularidad
 */
export class EntityExistenceService {
	private static instance: EntityExistenceService;
	private imageService: ImageService;

	private constructor() {
		this.imageService = ImageService.getInstance();
	}

	static getInstance(): EntityExistenceService {
		if (!EntityExistenceService.instance) {
			EntityExistenceService.instance = new EntityExistenceService();
		}
		return EntityExistenceService.instance;
	}

	/**
	 * Verifica si ya existe una entidad con el mismo hash
	 */
	async checkExistingEntity(fileInfo: FileInfo, entityType: EntityType): Promise<boolean> {
		try {
			if (!fileInfo.hash) {
				return false;
			}

			switch (entityType) {
				case EntityType.IMAGE: {
					const existingImage = await this.imageService.getImageByHash(fileInfo.hash);
					return !!existingImage;
				}
				case EntityType.VIDEO: {
					const existingVideo = await getVideoByHashServer(fileInfo.hash);
					return !!existingVideo;
				}
				case EntityType.AUDIO: {
					const existingAudio = await getAudioByHash(fileInfo.hash);
					return !!existingAudio;
				}
				case EntityType.FILE3D: {
					const existingFile3D = await getFile3DByHash(fileInfo.hash);
					return !!existingFile3D;
				}
				case EntityType.DOCUMENT: {
					const existingDocument = await getDocumentByHash(fileInfo.hash);
					return !!existingDocument;
				}
				case EntityType.JSON: {
					const existingJson = await getJsonFileByHash(fileInfo.hash);
					return !!existingJson;
				}
				default:
					return false;
			}
		} catch (e) {
			console.warn('Error checking existing entity', e);
			return false;
		}
	}
}
