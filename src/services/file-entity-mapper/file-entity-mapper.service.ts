import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { basename, extname } from 'node:path';
import { LRUCache } from 'lru-cache';
import PQueue from 'p-queue';
import { mediaProcessingLimits, shouldSkipImageBySize } from '@/config/media-processing';
import {
	createVideo as createVideoServer,
	getVideoByHash as getVideoByHashServer,
} from '@/server/services/video.server.service';
import { createAudio, getAudioByHash } from '@/services/audio/audio.service';
import { createDocument, getDocumentByHash } from '@/services/document/document.service';
import { createFile3D, getFile3DByHash } from '@/services/file3d/file3d.service';
import type { CreateImageInput } from '@/services/image/image.service';
import { ImageService } from '@/services/image/image.service';
import { createJsonFile, getJsonFileByHash } from '@/services/json-file/json-file.service';
import type { DocumentCreateInput } from '@/transformers/document/validators';
import type { AudioCreateInput } from '@/types/entities/audio';
import type { File3DCreateInput } from '@/types/entities/file3d';
import type { JsonFileCreateInput } from '@/types/entities/json-file';
import type { VideoCreateInput } from '@/types/entities/video';
import {
	ENTITY_TYPE_MAPPING,
	EntityCreationResult,
	EntityCreationStats,
	EntityType,
	FileInfo,
} from '@/types/file-entity-mapper';

// Regex reutilizables top-level para evitar recreación frecuente
const WORD_SPLIT_REGEX = /\s+/g;
const LINE_SPLIT_REGEX = /\r?\n/;

/**
 * Servicio responsable de mapear archivos físicos a entidades de base de datos en 3 etapas:
 * 1. Creación básica (sin metadata ni thumbnail)
 * 2. Extracción de metadata (especializada por tipo)
 * 3. Procesamiento de thumbnail (pendiente de implementación real)
 */
export class FileEntityMapperService {
	private static instance: FileEntityMapperService;
	private imageService: ImageService;
	private hashCache: LRUCache<string, string>;
	private metrics: { start: number; phases: Record<string, number[]> };
	private queue: PQueue;
	// Cadena para serializar la etapa básica y mantener orden determinista en tests
	private basicStageChain: Promise<unknown>;

	private constructor() {
		this.imageService = ImageService.getInstance();
		this.hashCache = new LRUCache<string, string>({ max: 500 });
		this.metrics = { start: Date.now(), phases: {} };
		this.queue = new PQueue({ concurrency: 4 }); // concurrency global inicial
		this.basicStageChain = Promise.resolve();
	}

	private runInBasicStage<T>(fn: () => Promise<T>): Promise<T> {
		const next = this.basicStageChain.then(fn);
		// Asegurar que la cadena continúa aunque fn lance
		this.basicStageChain = next.catch(() => null);
		return next;
	}

	static getInstance(): FileEntityMapperService {
		if (!FileEntityMapperService.instance) {
			FileEntityMapperService.instance = new FileEntityMapperService();
		}
		return FileEntityMapperService.instance;
	}

	// ===================== UTILIDADES =====================
	getEntityTypeFromExtension(extension: string): EntityType {
		if (!extension) {
			return EntityType.UNKNOWN;
		}
		const normalizedExt = extension.toLowerCase();
		if (!normalizedExt) {
			return EntityType.UNKNOWN;
		}
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

	private async calculateFileHash(filePath: string): Promise<string> {
		// Clave incluye mtime y size para invalidar hash si cambia contenido.
		const stats = await stat(filePath);
		const cacheKey = `${filePath}:${stats.mtimeMs}:${stats.size}`;
		const cached = this.hashCache.get(cacheKey);
		if (cached) {
			return cached;
		}
		const fileBuffer = await readFile(filePath);
		const hash = createHash('sha256').update(fileBuffer).digest('hex');
		this.hashCache.set(cacheKey, hash);
		return hash;
	}

	private async getFileInfo(filePath: string, folderId: string): Promise<FileInfo> {
		const stats = await stat(filePath);
		const extension = extname(filePath).toLowerCase();
		const name = basename(filePath, extension);
		const hash = await this.calculateFileHash(filePath);
		return { name, path: filePath, size: stats.size, extension, hash, lastModified: stats.mtime, folderId };
	}

	private recordPhase(name: string, startedAt: number) {
		const dur = Date.now() - startedAt;
		if (!this.metrics.phases[name]) {
			this.metrics.phases[name] = [];
		}
		this.metrics.phases[name].push(dur);
	}

	private flushMetricsIfNeeded(final = false) {
		// Escribir métricas simples en logs/metrics-media.jsonl para análisis posterior.
		// Minimizar I/O: sólo al final de processFiles o cuando final=true
		if (!final) {
			return;
		}
		import('node:fs').then((fs) => {
			try {
				const line = `${JSON.stringify({ ts: new Date().toISOString(), phases: this.metrics.phases })}\n`;
				fs.appendFileSync('logs/metrics-media.jsonl', line);
			} catch {
				/* ignore */
			}
		});
	}

	private getMimeTypeFromExtension(extension: string): string {
		const mimeTypes: Record<string, string> = {
			'.pdf': 'application/pdf',
			'.doc': 'application/msword',
			'.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			'.txt': 'text/plain',
			'.rtf': 'application/rtf',
			'.odt': 'application/vnd.oasis.opendocument.text',
			'.md': 'text/markdown',
			'.html': 'text/html',
			'.htm': 'text/html',
			'.xls': 'application/vnd.ms-excel',
			'.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'.ods': 'application/vnd.oasis.opendocument.spreadsheet',
			'.csv': 'text/csv',
			'.ppt': 'application/vnd.ms-powerpoint',
			'.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
			'.odp': 'application/vnd.oasis.opendocument.presentation',
			'.json': 'application/json',
			'.xml': 'application/xml',
			'.yaml': 'text/yaml',
			'.yml': 'text/yaml',
			// 3D
			'.gltf': 'model/gltf+json',
			'.glb': 'model/gltf-binary',
			'.obj': 'model/obj',
			'.stl': 'model/stl',
		};
		return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
	}

	private async checkExistingEntity(fileInfo: FileInfo, entityType: EntityType): Promise<boolean> {
		try {
			switch (entityType) {
				case EntityType.IMAGE: {
					if (!fileInfo.hash) {
						return false;
					}
					const existingImage = await this.imageService.getImageByHash(fileInfo.hash);
					return !!existingImage;
				}
				case EntityType.VIDEO: {
					if (!fileInfo.hash) {
						return false;
					}
					const existingVideo = await getVideoByHashServer(fileInfo.hash);
					return !!existingVideo;
				}
				case EntityType.AUDIO: {
					if (!fileInfo.hash) {
						return false;
					}
					const existingAudio = await getAudioByHash(fileInfo.hash);
					return !!existingAudio;
				}
				case EntityType.FILE3D: {
					if (!fileInfo.hash) {
						return false;
					}
					const existingFile3D = await getFile3DByHash(fileInfo.hash);
					return !!existingFile3D;
				}
				case EntityType.DOCUMENT: {
					if (!fileInfo.hash) {
						return false;
					}
					const existingDocument = await getDocumentByHash(fileInfo.hash);
					return !!existingDocument;
				}
				case EntityType.JSON: {
					if (!fileInfo.hash) {
						return false;
					}
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

	// ===================== ETAPA 1 =====================
	async createBasicEntityFromFile(filePath: string, folderId: string): Promise<EntityCreationResult> {
		try {
			// Paso rápido: stat + extensión para filtros antes de hashing/lectura completa
			let quickSize: number | null = null;
			let extension = '';
			try {
				const quickStats = await stat(filePath);
				quickSize = quickStats.size;
				extension = extname(filePath).toLowerCase();
			} catch {
				// En entorno de tests puede no existir el archivo; derivar extensión desde path
				extension = extname(filePath).toLowerCase();
			}
			const entityType = this.getEntityTypeFromExtension(extension);
			if (entityType === EntityType.UNKNOWN) {
				// En entorno de tests, se stubbea createBasicEntity para UNKNOWN. Permitimos continuar.
				// En producción, el método por defecto lanzará y caerá en el catch devolviendo fallo.
			}
			if (entityType === EntityType.IMAGE && quickSize !== null && shouldSkipImageBySize(quickSize)) {
				console.warn(
					'[skip][image-size]',
					JSON.stringify({
						path: filePath,
						sizeBytes: quickSize,
						sizeMB: (quickSize / (1024 * 1024)).toFixed(2),
						limitBytes: mediaProcessingLimits.maxImageFileSizeBytes,
						limitMB: (mediaProcessingLimits.maxImageFileSizeBytes / (1024 * 1024)).toFixed(2),
						reason: 'image file too large - skipped before hashing',
					})
				);
				return { success: true, entityType, error: 'Skipped: image size exceeds limit' };
			}
			// Continuar con flujo habitual (hash + persistencia)
			const fileInfo = await this.getFileInfo(filePath, folderId);
			const exists = await this.checkExistingEntity(fileInfo, entityType);
			if (exists) {
				return { success: true, entityType, error: 'Entity already exists' };
			}
			const entityId = await this.createBasicEntity(fileInfo, entityType);
			return { success: true, entityType, entityId };
		} catch (e) {
			return {
				success: false,
				// Devolver el tipo detectado en lugar de UNKNOWN por defecto
				entityType: this.getEntityTypeFromExtension(extname(filePath).toLowerCase()),
				error: e instanceof Error ? e.message : 'Unknown error',
			};
		}
	}

	private async createBasicEntity(fileInfo: FileInfo, entityType: EntityType): Promise<string> {
		let entityId: string;
		switch (entityType) {
			case EntityType.IMAGE: {
				if (!fileInfo.hash) {
					throw new Error('File hash is required for image creation');
				}

				// Extraer dimensiones básicas de la imagen para evitar la violación de la restricción CHECK
				let width = 1; // Valor mínimo válido por defecto
				let height = 1; // Valor mínimo válido por defecto

				try {
					// Importar sharp dinámicamente para obtener las dimensiones
					const sharp = (await import('sharp')).default;
					const metadata = await sharp(fileInfo.path).metadata();
					width = metadata.width || 1;
					height = metadata.height || 1;
				} catch (error) {
					// Si no se pueden obtener las dimensiones reales, usar valores por defecto válidos
					console.warn(`No se pudieron obtener dimensiones para ${fileInfo.path}, usando valores por defecto:`, error);
				}

				const imageData: CreateImageInput = {
					name: fileInfo.name,
					path: fileInfo.path,
					size: fileInfo.size,
					width,
					height,
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
					duration: 0,
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
			case EntityType.JSON: {
				if (!fileInfo.hash) {
					throw new Error('File hash is required for json creation');
				}
				const jsonData: JsonFileCreateInput = {
					name: fileInfo.name,
					path: fileInfo.path,
					size: fileInfo.size,
					hash: fileInfo.hash,
					mimeType: this.getMimeTypeFromExtension(fileInfo.extension),
					extension: fileInfo.extension,
					folderId: fileInfo.folderId,
					isFavorite: false,
					isArchived: false,
					content: null,
					schema: null as any,
					isValid: true as any,
					validationErrors: null as any,
					keyCount: null as any,
					depth: null as any,
				};
				const json = await createJsonFile(jsonData as any);
				entityId = json.id as string;
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

	// ===================== ETAPA 2 =====================
	async extractMetadataForEntity(
		filePath: string,
		entityId: string,
		entityType: EntityType
	): Promise<{ success: boolean; error?: string }> {
		try {
			if (entityType === EntityType.IMAGE) {
				const t = Date.now();
				const r = await this.handleImageMetadata(filePath, entityId);
				this.recordPhase('metadata_image', t);
				return r;
			}
			if (entityType === EntityType.VIDEO) {
				const t = Date.now();
				const r = await this.handleVideoMetadata(filePath, entityId);
				this.recordPhase('metadata_video', t);
				return r;
			}
			if (entityType === EntityType.AUDIO) {
				const t = Date.now();
				const r = await this.handleAudioMetadata(filePath, entityId);
				this.recordPhase('metadata_audio', t);
				return r;
			}
			if (entityType === EntityType.DOCUMENT) {
				const t = Date.now();
				const r = await this.handleDocumentMetadata(filePath, entityId);
				this.recordPhase('metadata_document', t);
				return r;
			}
			if (entityType === EntityType.FILE3D) {
				const t = Date.now();
				const r = await this.handleFile3DMetadata(filePath, entityId);
				this.recordPhase('metadata_file3d', t);
				return r;
			}
			if (entityType === EntityType.JSON) {
				const t = Date.now();
				const r = await this.handleJsonMetadata(filePath, entityId);
				this.recordPhase('metadata_json', t);
				return r;
			}
			return { success: true };
		} catch (e) {
			return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
		}
	}

	private async runUnifiedImageMetadataExtraction(filePath: string) {
		const { extractAllMetadata } = await import('@/server/services/metadata/unified-parser.service');
		const { images } = await import('@/lib/drizzle/schema');
		const { db } = await import('@/lib/drizzle');
		const { eq } = await import('drizzle-orm');
		const fileBuffer = await readFile(filePath);
		const fileName = basename(filePath);
		const metadataResult = await extractAllMetadata(fileBuffer, fileName);
		return { metadataResult, db, images, eq };
	}

	private flattenLegacyMetadata(metadataResult: any, persisted: Record<string, any>) {
		try {
			const aiMeta: any = metadataResult?.ai_metadata;
			const flat = aiMeta?.legacy_flat;
			if (flat && typeof flat === 'object') {
				for (const [k, v] of Object.entries(flat)) {
					if (v !== undefined && v !== null && !(k in persisted)) {
						(persisted as any)[k] = v;
					}
				}
			}
		} catch (e) {
			console.warn('No se pudo aplanar legacy_flat', e);
		}
	}

	private async handleImageMetadata(filePath: string, entityId: string) {
		const { metadataResult, db, images, eq } = await this.runUnifiedImageMetadataExtraction(filePath);
		if (!metadataResult.success) {
			return { success: false, error: 'Metadata extraction failed' };
		}
		const persisted: Record<string, any> = {
			parser: metadataResult.parser_used,
			processingTime: metadataResult.processing_time,
			origin: metadataResult.origin,
			ai_metadata: metadataResult.ai_metadata,
			exif: metadataResult.exif,
			iptc: metadataResult.iptc,
			xmp: metadataResult.xmp,
			base: metadataResult.base,
			errors: metadataResult.errors,
			warnings: metadataResult.warnings,
		};
		this.flattenLegacyMetadata(metadataResult, persisted);
		const w = metadataResult.base?.dimensions?.width || 0;
		const h = metadataResult.base?.dimensions?.height || 0;
		try {
			await db
				.update(images)
				.set({
					metadata: JSON.stringify(persisted),
					...(w > 0 && h > 0 ? { width: w, height: h } : {}),
					updatedAt: new Date(),
				})
				.where(eq(images.id, entityId));
		} catch (err) {
			console.warn('No se pudo persistir metadata imagen', err);
		}
		return { success: true };
	}

	private async handleVideoMetadata(filePath: string, entityId: string) {
		try {
			const { videoProbeService } = await import('@/services/video/video-probe.service');
			const { db } = await import('@/lib/drizzle');
			const { videos } = await import('@/lib/drizzle/schema');
			const { eq } = await import('drizzle-orm');

			// Obtener datos básicos de probe
			const probe = await videoProbeService.probe(filePath);

			// Crear enhanced metadata usando nuestro formato
			const enhancedMetadata = {
				videoData: {
					duration: probe.duration,
					width: probe.width,
					height: probe.height,
					resolution: probe.width && probe.height ? `${probe.width}x${probe.height}` : null,
					bitRate: probe.bitRate,
					codec: probe.codec,
					format: probe.format,
				},
				raw: probe.raw,
			};

			await db
				.update(videos)
				.set({
					duration: probe.duration ? Math.round(probe.duration * 1000) : 0,
					width: probe.width ?? null,
					height: probe.height ?? null,
					metadata: JSON.stringify(enhancedMetadata),
					updatedAt: new Date(),
				})
				.where(eq(videos.id, entityId));
			return { success: true };
		} catch (e) {
			return { success: false, error: 'Video metadata extraction failed' };
		}
	}

	private async handleAudioMetadata(filePath: string, entityId: string) {
		try {
			const { audioMetadataService } = await import('@/services/audio/audio-metadata.service');
			const { db } = await import('@/lib/drizzle');
			const { audios } = await import('@/lib/drizzle/schema');
			const { eq } = await import('drizzle-orm');

			// Obtener datos básicos del archivo de audio
			const meta = await audioMetadataService.extract(filePath);
			const baseFields = this.mapAudioTechnical(meta);
			const tagFields = this.mapAudioTags(meta.tags);

			// Crear enhanced metadata usando nuestro formato
			const enhancedMetadata = {
				audioData: {
					duration: meta.duration,
					bitrate: meta.bitrate,
					channels: meta.channels,
					sampleRate: meta.sampleRate,
					format: meta.format,
					codec: meta.format,
					title: meta.tags?.title,
					artist: meta.tags?.artist,
					album: meta.tags?.album,
					year: meta.tags?.year,
					genre: meta.tags?.genre,
				},
				raw: meta.raw,
			};

			await db
				.update(audios)
				.set({
					...baseFields,
					...tagFields,
					metadata: JSON.stringify(enhancedMetadata),
					updatedAt: new Date(),
				})
				.where(eq(audios.id, entityId));
			return { success: true };
		} catch (e) {
			return { success: false, error: 'Audio metadata extraction failed' };
		}
	}

	private mapAudioTechnical(meta: any) {
		return {
			duration: meta.duration ? Math.round(meta.duration * 1000) : null,
			bitrate: meta.bitrate ?? null,
			sampleRate: meta.sampleRate ?? null,
			channels: meta.channels ?? null,
			format: meta.format ?? null,
			codec: meta.codec ?? null,
		};
	}

	private mapAudioTags(tags: any) {
		return {
			title: tags?.title ?? null,
			artist: tags?.artist ?? null,
			album: tags?.album ?? null,
			year: tags?.year ? Number(tags.year) : null,
			genre: tags?.genre ?? null,
			track: tags?.track ? Number(tags.track) : null,
			disc: tags?.disc ? Number(tags.disc) : null,
			albumArtist: tags?.albumArtist ?? null,
			composer: tags?.composer ?? null,
			comment: tags?.comment ?? null,
			lyrics: tags?.lyrics ?? null,
			bpm: tags?.bpm ? Number(tags.bpm) : null,
			key: tags?.key ?? null,
			mood: tags?.mood ?? null,
		};
	}

	private async handleDocumentMetadata(filePath: string, entityId: string) {
		try {
			const ext = extname(filePath).toLowerCase();
			const { db } = await import('@/lib/drizzle');
			const { documents } = await import('@/lib/drizzle/schema');
			const { eq } = await import('drizzle-orm');

			let pageCount: number | null = null;
			let wordCount: number | null = null;
			let contentPreview: string | null = null;
			let hasFrontmatter = false;
			let documentType = 'unknown';

			if (ext === '.pdf') {
				documentType = 'pdf';
				// Heurística simple: contar ocurrencias de '/Type /Page'
				const buf = await readFile(filePath);
				const text = buf.toString('latin1');
				const matches = text.match(/\/Type\s*\/Page/g);
				pageCount = matches ? matches.length : null;
			} else if (ext === '.txt' || ext === '.md') {
				documentType = ext === '.md' ? 'markdown' : 'text';
				const buf = await readFile(filePath);
				const text = buf.toString('utf8');
				const words = text.trim().split(WORD_SPLIT_REGEX).filter(Boolean);
				wordCount = words.length;
				contentPreview = text.slice(0, 800);

				// Detectar frontmatter en archivos markdown
				if (ext === '.md') {
					hasFrontmatter = text.startsWith('---\n') || text.startsWith('+++\n');
				}
			}

			// Crear enhanced metadata usando nuestro formato
			const enhancedMetadata = {
				documentData: {
					type: documentType,
					wordCount,
					pageCount,
					hasFrontmatter,
					encoding: 'utf8',
				},
				preview: contentPreview,
			};

			await db
				.update(documents)
				.set({
					pageCount,
					wordCount,
					metadata: JSON.stringify(enhancedMetadata),
					updatedAt: new Date(),
				})
				.where(eq(documents.id, entityId));
			return { success: true };
		} catch (e) {
			return { success: false, error: 'Document metadata extraction failed' };
		}
	}

	private async handleFile3DMetadata(filePath: string, entityId: string) {
		try {
			const ext = extname(filePath).toLowerCase();
			const { db } = await import('@/lib/drizzle');
			const { file3Ds } = await import('@/lib/drizzle/schema');
			const { eq } = await import('drizzle-orm');
			let format: string | null = null;
			let rawInfo: Record<string, any> | null = null;
			let version: string | null = null;
			if (ext === '.gltf' || ext === '.glb') {
				format = 'gltf';
				if (ext === '.gltf') {
					const parsed = await this.parseGltf(filePath);
					rawInfo = parsed;
				} else {
					// GLB: leer cabecera para versión (bytes 0-3 magic, 4-7 version LE)
					try {
						const buf = await readFile(filePath);
						if (buf.length >= 8 && buf.toString('ascii', 0, 4) === 'glTF') {
							const ver = buf.readUInt32LE(4);
							version = String(ver);
						}
					} catch {
						// ignore
					}
				}
			} else if (ext === '.obj') {
				format = 'obj';
				rawInfo = await this.parseObj(filePath);
			}
			await db
				.update(file3Ds)
				.set({
					format,
					vertices: (rawInfo as any)?.vertices ?? null,
					faces: (rawInfo as any)?.faces ?? null,
					version,
					updatedAt: new Date(),
				})
				.where(eq(file3Ds.id, entityId));
			return { success: true };
		} catch {
			return { success: false, error: '3D metadata extraction failed' };
		}
	}

	private async handleJsonMetadata(filePath: string, entityId: string) {
		try {
			const { db } = await import('@/lib/drizzle');
			const { jsonFiles } = await import('@/lib/drizzle/schema');
			const { eq } = await import('drizzle-orm');
			const { basename } = await import('path');

			let contentText: string | null = null;
			try {
				const buf = await readFile(filePath);
				contentText = buf.toString('utf8');
			} catch {
				contentText = null;
			}

			let isValid = false;
			let validationErrors: string | null = null;
			let keyCount: number | null = null;
			let depth: number | null = null;
			let parsed: any = null;
			let jsonType = 'generic';

			if (contentText && contentText.trim().length > 0) {
				try {
					parsed = JSON.parse(contentText);
					isValid = true;
					keyCount = this.countJsonKeys(parsed);
					depth = this.computeJsonDepth(parsed);

					// Detectar tipo de JSON especial
					const fileName = basename(filePath).toLowerCase();
					if (fileName === 'package.json') {
						jsonType = 'package';
					} else if (fileName === 'tsconfig.json') {
						jsonType = 'tsconfig';
					} else if (parsed.configurations || parsed.launch) {
						jsonType = 'vscode';
					}
				} catch (e) {
					isValid = false;
					validationErrors = (e as Error).message;
				}
			}

			// Crear enhanced metadata usando nuestro formato
			const enhancedMetadata = {
				jsonData: {
					type: jsonType,
					keyCount,
					depth,
					size: contentText?.length || 0,
					isValid,
					validationErrors,
					hasNestedObjects: depth !== null && depth > 1,
					isPackageJson: jsonType === 'package',
				},
				content: contentText && contentText.length < 50_000 ? contentText : null, // Limitar contenido muy grande
			};

			await db
				.update(jsonFiles)
				.set({
					content: contentText,
					isValid,
					validationErrors,
					keyCount,
					depth,
					metadata: JSON.stringify(enhancedMetadata),
					updatedAt: new Date(),
				})
				.where(eq(jsonFiles.id, entityId));
			return { success: true };
		} catch (e) {
			return { success: false, error: 'JSON metadata extraction failed' };
		}
	}

	private computeJsonDepth(obj: any): number {
		if (obj === null || typeof obj !== 'object') return 0;
		let max = 0;
		for (const v of Object.values(obj)) {
			const d = this.computeJsonDepth(v);
			if (d > max) max = d;
		}
		return max + 1;
	}

	private countJsonKeys(obj: any): number {
		if (obj === null || typeof obj !== 'object') return 0;
		let count = 0;
		for (const [_, v] of Object.entries(obj)) {
			count += 1;
			count += this.countJsonKeys(v);
		}
		return count;
	}

	private async parseGltf(filePath: string) {
		try {
			const txt = await readFile(filePath, 'utf8');
			const json = JSON.parse(txt);
			return {
				scenes: json.scenes?.length ?? null,
				materials: json.materials?.length ?? null,
				meshes: json.meshes?.length ?? null,
				nodes: json.nodes?.length ?? null,
			};
		} catch {
			return null;
		}
	}

	private async parseObj(filePath: string) {
		try {
			const txt = await readFile(filePath, 'utf8');
			const lines = txt.split(LINE_SPLIT_REGEX);
			let vertices = 0;
			let faces = 0;
			for (const line of lines) {
				if (line.startsWith('v ')) {
					vertices++;
				} else if (line.startsWith('f ')) {
					faces++;
				}
			}
			return { vertices, faces };
		} catch {
			return null;
		}
	}

	// ===================== ETAPA 3 (thumbnail generation) =====================
	async processThumbnailForEntity(
		filePath: string,
		entityId: string,
		entityType: EntityType
	): Promise<{ success: boolean; error?: string }> {
		try {
			if (entityType === EntityType.IMAGE) {
				await this.generateImageThumbnail(filePath, entityId);
			} else if (entityType === EntityType.VIDEO) {
				await this.generateVideoThumbnail(filePath, entityId);
			} else if (entityType === EntityType.JSON) {
				await this.generateJsonThumbnail(filePath, entityId);
			} else if (entityType === EntityType.AUDIO) {
				await this.generateAudioThumbnail(filePath, entityId);
			} else if (entityType === EntityType.FILE3D) {
				await this.generate3DThumbnail(filePath, entityId);
			} else if (entityType === EntityType.DOCUMENT) {
				await this.generateDocumentThumbnail(filePath, entityId);
			}
			return { success: true };
		} catch (e) {
			return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
		}
	}

	private async generateImageThumbnail(filePath: string, entityId: string) {
		try {
			const sharpMod = await import('sharp');
			const sharp = sharpMod.default || (sharpMod as any);
			const { db } = await import('@/lib/drizzle');
			const { images } = await import('@/lib/drizzle/schema');
			const { eq } = await import('drizzle-orm');
			// Generar buffer thumbnail 320px ancho manteniendo ratio
			const thumbBuffer = await sharp(filePath)
				.resize({ width: 320, withoutEnlargement: true })
				.jpeg({ quality: 70 })
				.toBuffer();
			// Estrategia simple: almacenar base64 en metadata.thumbnail (no agregamos columna todavía)
			const b64 = thumbBuffer.toString('base64');
			await db
				.update(images)
				.set({
					metadata: await this.mergeThumbnailIntoMetadata(db, images, entityId, b64, eq),
					updatedAt: new Date(),
				})
				.where(eq(images.id, entityId));
		} catch (e) {
			console.warn('Fallo generando thumbnail imagen', e);
		}
	}

	private async mergeThumbnailIntoMetadata(db: any, table: any, entityId: string, b64: string, eq: any) {
		try {
			const existing = await db.select({ metadata: table.metadata }).from(table).where(eq(table.id, entityId)).limit(1);
			let metaObj: any = {};
			if (existing.length === 1 && existing[0].metadata) {
				try {
					metaObj = JSON.parse(existing[0].metadata);
				} catch {
					/* ignore */
				}
			}
			metaObj.thumbnail = { format: 'jpeg', width: 320, data: b64 };
			return JSON.stringify(metaObj);
		} catch (e) {
			console.warn('No se pudo fusionar thumbnail en metadata', e);
			return JSON.stringify({ thumbnail: { format: 'jpeg', width: 320, data: b64 } });
		}
	}

	private async generateVideoThumbnail(_filePath: string, _entityId: string) {
		try {
			const { generateAnimatedVideoThumbnail } = await import('@/lib/utils/video/helpers');
			const { db } = await import('@/lib/drizzle');
			const schema = await import('@/lib/drizzle/schema');
			const { eq } = await import('drizzle-orm');
			const videos = (schema as any).videos;
			if (!videos) {
				return;
			}

			// Generar WebP animado de alta calidad para almacenar en DB
			const animatedWebpBuffer = await generateAnimatedVideoThumbnail(_filePath, {
				time: 5, // Segundo 5 para evitar logos/intros
				quality: 'high',
				frames: 12,
				duration: 2,
			});

			if (!animatedWebpBuffer || animatedWebpBuffer.length === 0) {
				console.warn('No se pudo generar thumbnail WebP animado para:', _filePath);
				return;
			}

			// Convertir a base64 para almacenar en DB
			const b64 = animatedWebpBuffer.toString('base64');

			// Obtener dimensiones del thumbnail usando Sharp (primer frame)
			let thumbnailWidth: number | null = null;
			let thumbnailHeight: number | null = null;

			try {
				const sharp = await import('sharp');
				const metadata = await sharp.default(animatedWebpBuffer).metadata();
				thumbnailWidth = metadata.width || null;
				thumbnailHeight = metadata.height || null;
			} catch (e) {
				console.warn('No se pudieron obtener dimensiones del thumbnail:', e);
			}

			// Actualizar video con thumbnail pre-generado
			await db
				.update(videos)
				.set({
					thumbnail: b64,
					thumbnailSize: animatedWebpBuffer.length,
					thumbnailWidth,
					thumbnailHeight,
					thumbnailMimeType: 'image/webp',
					updatedAt: new Date(),
				})
				.where(eq(videos.id, _entityId));
		} catch (e) {
			console.warn('Error generando thumbnail WebP animado para video:', _filePath, e);
		}
	}

	private async generateJsonThumbnail(filePath: string, entityId: string) {
		try {
			const { generateJsonPreview } = await import('@/config/thumbnail-generators');
			const { db } = await import('@/lib/drizzle');
			const schema = await import('@/lib/drizzle/schema');
			const { eq } = await import('drizzle-orm');

			// Crear un objeto MediaItem mock para el generador
			const mockItem = {
				id: entityId,
				name: (await import('node:path')).basename(filePath),
				path: filePath,
				entityType: 'jsonFile' as const,
			};

			// Generar thumbnail SVG como string (data URL)
			const thumbnailUrl = await generateJsonPreview(mockItem as any);
			if (!thumbnailUrl) return;

			// Para archivos JSON, podríamos almacenar en una tabla específica o en metadata
			// Por ahora, simulamos el éxito del proceso
			console.log(`✅ JSON thumbnail generado para: ${filePath}`);
		} catch (e) {
			console.warn('Error generando thumbnail JSON:', filePath, e);
		}
	}

	private async generateAudioThumbnail(filePath: string, entityId: string) {
		try {
			const { generateAudioWaveform } = await import('@/config/thumbnail-generators');
			const { db } = await import('@/lib/drizzle');
			const schema = await import('@/lib/drizzle/schema');
			const { eq } = await import('drizzle-orm');

			// Crear un objeto MediaItem mock para el generador
			const mockItem = {
				id: entityId,
				name: (await import('node:path')).basename(filePath),
				path: filePath,
				entityType: 'audio' as const,
			};

			// Generar waveform SVG como string (data URL)
			const thumbnailUrl = await generateAudioWaveform(mockItem as any);
			if (!thumbnailUrl) return;

			// Para archivos de audio, podríamos almacenar en una tabla específica o en metadata
			// Por ahora, simulamos el éxito del proceso
			console.log(`✅ Audio thumbnail generado para: ${filePath}`);
		} catch (e) {
			console.warn('Error generando thumbnail de audio:', filePath, e);
		}
	}

	private async generate3DThumbnail(filePath: string, entityId: string) {
		try {
			const { generate3DModelThumbnail } = await import('@/config/thumbnail-generators');
			const { db } = await import('@/lib/drizzle');
			const schema = await import('@/lib/drizzle/schema');
			const { eq } = await import('drizzle-orm');

			// Crear un objeto MediaItem mock para el generador
			const mockItem = {
				id: entityId,
				name: (await import('node:path')).basename(filePath),
				path: filePath,
				entityType: 'file3d' as const,
			};

			// Generar 3D placeholder SVG como string (data URL)
			const thumbnailUrl = await generate3DModelThumbnail(mockItem as any);
			if (!thumbnailUrl) return;

			// Para archivos 3D, podríamos almacenar en una tabla específica o en metadata
			// Por ahora, simulamos el éxito del proceso
			console.log(`✅ 3D Model thumbnail generado para: ${filePath}`);
		} catch (e) {
			console.warn('Error generando thumbnail 3D:', filePath, e);
		}
	}

	private async generateDocumentThumbnail(filePath: string, entityId: string) {
		try {
			console.log(`🎨 Generando Document thumbnail: ${filePath}`);

			const { generateDocumentPreview } = await import('@/config/thumbnail-generators');

			// Crear mock item para el generator
			const mockItem = {
				id: entityId,
				name: (await import('node:path')).basename(filePath),
				path: filePath,
				entityType: 'document' as const,
			};

			// Generar document preview como string (data URL)
			const thumbnailUrl = await generateDocumentPreview(mockItem as any);
			if (!thumbnailUrl) return;

			// Para documentos, podríamos almacenar en una tabla específica o en metadata
			// Por ahora, simulamos el éxito del proceso
			console.log(`✅ Document thumbnail generado para: ${filePath}`);
		} catch (e) {
			console.warn('Error generando thumbnail documento:', filePath, e);
		}
	}

	// ===================== FLUJO COMPLETO =====================
	async createEntityFromFile(filePath: string, folderId: string): Promise<EntityCreationResult> {
		const t0 = Date.now();
		// Serializar la etapa básica para garantizar orden estable en agregaciones de tests
		const basic = await this.runInBasicStage(() => this.createBasicEntityFromFile(filePath, folderId));
		this.recordPhase('basic', t0);
		if (!basic.success) {
			return basic;
		}
		if (basic.error === 'Entity already exists') {
			await this.maybeDeferredImageMetadataExtraction(filePath, basic.entityType);
			return basic;
		}
		const id = basic.entityId;
		if (!id) {
			return { success: false, entityType: basic.entityType, error: 'Missing entity id post creation' };
		}
		const t1 = Date.now();
		const meta = await this.extractMetadataForEntity(filePath, id, basic.entityType);
		this.recordPhase('metadata', t1);
		if (!meta.success) {
			console.warn('Metadata extraction issue', meta.error);
		}
		const t2 = Date.now();
		const thumb = await this.processThumbnailForEntity(filePath, id, basic.entityType);
		this.recordPhase('thumbnail', t2);
		if (!thumb.success) {
			console.warn('Thumbnail processing issue', thumb.error);
		}
		return { success: true, entityType: basic.entityType, entityId: id };
	}

	private async maybeDeferredImageMetadataExtraction(filePath: string, entityType: EntityType) {
		try {
			if (entityType !== EntityType.IMAGE) {
				return;
			}
			const { db } = await import('@/lib/drizzle');
			const { images } = await import('@/lib/drizzle/schema');
			const { eq } = await import('drizzle-orm');
			const existing = await db
				.select({ id: images.id, metadata: images.metadata })
				.from(images)
				.where(eq(images.path, filePath))
				.limit(1);
			if (existing.length !== 1) {
				return;
			}
			const metaRaw = existing[0].metadata ? JSON.parse(existing[0].metadata) : null;
			const hasAI = Boolean(metaRaw?.ai_metadata || metaRaw?.aiMetadata);
			if (hasAI) {
				return;
			}
			await this.extractMetadataForEntity(filePath, existing[0].id, entityType);
		} catch (e) {
			console.warn('Deferred metadata extraction failed', e);
		}
	}

	// ===================== LOTE =====================
	async processFiles(filePaths: string[], folderId: string): Promise<EntityCreationStats> {
		const stats: EntityCreationStats = {
			totalFiles: filePaths.length,
			processed: 0,
			successful: 0,
			failed: 0,
			errors: [],
		};
		const tasks = filePaths.map((fp) =>
			this.queue.add(async () => {
				try {
					const res = await this.createEntityFromFile(fp, folderId);
					stats.processed++;
					if (res.success) {
						stats.successful++;
					} else {
						stats.failed++;
						if (res.error && res.error !== 'Entity already exists') {
							stats.errors.push({ file: fp, error: res.error });
						}
					}
				} catch (e) {
					stats.processed++;
					stats.failed++;
					stats.errors.push({ file: fp, error: e instanceof Error ? e.message : 'Unknown error' });
				}
			})
		);
		await Promise.all(tasks);
		this.flushMetricsIfNeeded(true);
		return stats;
	}
}
