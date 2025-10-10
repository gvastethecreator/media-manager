import type { EntityCreationResult, EntityCreationStats, EntityType } from '@/types/file-entity-mapper';
import { FileEntityMapperCore } from './core.service';
import { getEntityTypeFromExtension } from './utils/file-info.utils';

/**
 * Servicio principal que mantiene la API pública original
 * Delega toda la lógica al core service y procesadores especializados
 *
 * @deprecated Use FileEntityMapperCore directly for new code
 */
export class FileEntityMapperService {
	private static instance: FileEntityMapperService;
	private core: FileEntityMapperCore;

	private constructor() {
		this.core = FileEntityMapperCore.getInstance();
	}

	static getInstance(): FileEntityMapperService {
		if (!FileEntityMapperService.instance) {
			FileEntityMapperService.instance = new FileEntityMapperService();
		}
		return FileEntityMapperService.instance;
	}

	/**
	 * Determina el tipo de entidad basado en la extensión del archivo
	 */
	getEntityTypeFromExtension(extension: string): EntityType {
		return getEntityTypeFromExtension(extension);
	}

	/**
	 * Crea entidad básica desde archivo (sin metadata ni thumbnail)
	 */
	async createBasicEntityFromFile(filePath: string, folderId: string): Promise<EntityCreationResult> {
		return this.core.createBasicEntityFromFile(filePath, folderId);
	}

	/**
	 * Extrae metadata especializada según tipo de entidad
	 */
	async extractMetadataForEntity(
		filePath: string,
		entityId: string,
		entityType: EntityType
	): Promise<{ success: boolean; error?: string }> {
		return this.core.extractMetadataForEntity(filePath, entityId, entityType);
	}

	/**
	 * Procesa generación de thumbnail según tipo de entidad
	 */
	async processThumbnailForEntity(
		filePath: string,
		entityId: string,
		entityType: EntityType
	): Promise<{ success: boolean; error?: string }> {
		return this.core.processThumbnailForEntity(filePath, entityId, entityType);
	}

	/**
	 * Crea entidad completa (3 etapas: básica + metadata + thumbnail)
	 */
	async createEntityFromFile(filePath: string, folderId: string): Promise<EntityCreationResult> {
		return this.core.createEntityFromFile(filePath, folderId);
	}

	/**
	 * Procesa múltiples archivos en lote con cola de concurrencia
	 */
	async processFiles(filePaths: string[], folderId: string): Promise<EntityCreationStats> {
		return this.core.processFiles(filePaths, folderId);
	}
}
