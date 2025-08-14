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
import { LRUCache } from 'lru-cache';
import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { basename, extname } from 'node:path';
import PQueue from 'p-queue';

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

	private constructor() {
		this.imageService = ImageService.getInstance();
		this.hashCache = new LRUCache<string, string>({ max: 500 });
		this.metrics = { start: Date.now(), phases: {} };
		this.queue = new PQueue({ concurrency: 4 }); // concurrency global inicial
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
		const hash = createHash('md5').update(fileBuffer).digest('hex');
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
			const quickStats = await stat(filePath);
			const extension = extname(filePath).toLowerCase();
			const entityType = this.getEntityTypeFromExtension(extension);
			if (entityType === EntityType.UNKNOWN) {
				return { success: false, entityType, error: `Unsupported file type: ${extension}` };
			}
			if (entityType === EntityType.IMAGE && shouldSkipImageBySize(quickStats.size)) {
				console.warn(
					'[skip][image-size]',
					JSON.stringify({
						path: filePath,
						sizeBytes: quickStats.size,
						sizeMB: (quickStats.size / (1024 * 1024)).toFixed(2),
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
				entityType: EntityType.UNKNOWN,
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
				const imageData: CreateImageInput = {
					name: fileInfo.name,
					path: fileInfo.path,
					size: fileInfo.size,
					width: 0,
					height: 0,
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
			const probe = await videoProbeService.probe(filePath);
			await db
				.update(videos)
				.set({
					duration: probe.duration ? Math.round(probe.duration * 1000) : 0,
					width: probe.width ?? null,
					height: probe.height ?? null,
					metadata: JSON.stringify({
						codec: probe.codec,
						format: probe.format,
						bitRate: probe.bitRate,
						raw: probe.raw,
					}),
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
			const meta = await audioMetadataService.extract(filePath);
			const baseFields = this.mapAudioTechnical(meta);
			const tagFields = this.mapAudioTags(meta.tags);
			await db
				.update(audios)
				.set({
					...baseFields,
					...tagFields,
					metadata: JSON.stringify({ raw: meta.raw }),
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
			if (ext === '.pdf') {
				// Heurística simple: contar ocurrencias de '/Type /Page'
				const buf = await readFile(filePath);
				const text = buf.toString('latin1');
				const matches = text.match(/\/Type\s*\/Page/g);
				pageCount = matches ? matches.length : null;
			} else if (ext === '.txt' || ext === '.md') {
				const buf = await readFile(filePath);
				const text = buf.toString('utf8');
				const words = text.trim().split(WORD_SPLIT_REGEX).filter(Boolean);
				wordCount = words.length;
				contentPreview = text.slice(0, 800);
			}
			await db
				.update(documents)
				.set({
					pageCount,
					wordCount,
					metadata: JSON.stringify({ preview: contentPreview }),
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
			// Nombre de tabla 3D: intentar file3d(s). Ajustar según schema real.
			const schema = await import('@/lib/drizzle/schema');
			const table = (schema as any).file3d || (schema as any).files3d;
			if (!table) {
				return { success: false, error: '3D table missing in schema' };
			}
			const { eq } = await import('drizzle-orm');
			let format: string | null = null;
			let rawInfo: Record<string, any> | null = null;
			if (ext === '.gltf' || ext === '.glb') {
				format = 'gltf';
				if (ext === '.gltf') {
					const parsed = await this.parseGltf(filePath);
					rawInfo = parsed;
				}
			} else if (ext === '.obj') {
				format = 'obj';
				rawInfo = await this.parseObj(filePath);
			}
			await db
				.update(table)
				.set({
					format,
					metadata: rawInfo ? JSON.stringify(rawInfo) : null,
					updatedAt: new Date(),
				})
				.where(eq(table.id, entityId));
			return { success: true };
		} catch {
			return { success: false, error: '3D metadata extraction failed' };
		}
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

	// ===================== ETAPA 3 (placeholder thumbnail) =====================
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
			const { spawn } = await import('node:child_process');
			const { db } = await import('@/lib/drizzle');
			const schema = await import('@/lib/drizzle/schema');
			const { eq } = await import('drizzle-orm');
			const videos = (schema as any).videos;
			if (!videos) {
				return;
			}
			// Generar frame medio (segundo 1) a JPEG buffer en memoria: usamos salida a stdout si ffmpeg soporta.
			// Fallback: no error si ffmpeg no disponible.
			const args = ['-ss', '1', '-i', _filePath, '-frames:v', '1', '-f', 'mjpeg', '-q:v', '4', 'pipe:1'];
			const proc = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'ignore'] });
			const chunks: Buffer[] = [];
			await new Promise<void>((resolve) => {
				proc.stdout?.on('data', (c) => chunks.push(c));
				proc.on('close', () => resolve());
				proc.on('error', () => resolve());
			});
			if (chunks.length === 0) {
				return;
			}
			const b64 = Buffer.concat(chunks).toString('base64');
			// Leer metadata existente y fusionar thumbnail
			const existing = await db
				.select({ metadata: videos.metadata })
				.from(videos)
				.where(eq(videos.id, _entityId))
				.limit(1);
			let metaObj: any = {};
			if (existing.length === 1 && existing[0].metadata) {
				try {
					metaObj = JSON.parse(existing[0].metadata);
				} catch {
					/* ignore */
				}
			}
			metaObj.thumbnail = { format: 'jpeg', width: null, data: b64 };
			await db
				.update(videos)
				.set({ metadata: JSON.stringify(metaObj), updatedAt: new Date() })
				.where(eq(videos.id, _entityId));
		} catch {
			// silencioso
		}
	}

	// ===================== FLUJO COMPLETO =====================
	async createEntityFromFile(filePath: string, folderId: string): Promise<EntityCreationResult> {
		const t0 = Date.now();
		const basic = await this.createBasicEntityFromFile(filePath, folderId);
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
