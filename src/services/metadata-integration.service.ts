/**
 * Servicio de integración de metadatos para la UI
 * Conecta el sistema de extracción de metadatos con los componentes de la interfaz
 */

import type { AIEngine, MetadataExtractionResult } from '../types/metadata-origin.types';

export interface UIMetadataResult {
	error?: string;
	formatted?: {
		origin?: {
			engine: string;
			engineName: string;
			confidence: string;
			version?: string;
		};
		technical?: Array<{ key: string; value: string; category: 'técnico' }>;
		ai?: Array<{ key: string; value: string; category: 'ia' }>;
		exif?: Array<{ key: string; value: string; category: 'exif' }>;
		iptc?: Array<{ key: string; value: string; category: 'iptc' }>;
		xmp?: Array<{ key: string; value: string; category: 'xmp' }>;
		video?: Array<{ key: string; value: string; category: 'video' }>;
	};
	metadata?: MetadataExtractionResult;
	success: boolean;
}

export class MetadataIntegrationService {
	private static instance: MetadataIntegrationService;

	private constructor() {
		// Inicialización sin dependencias por ahora
	}

	static getInstance(): MetadataIntegrationService {
		if (!MetadataIntegrationService.instance) {
			MetadataIntegrationService.instance = new MetadataIntegrationService();
		}
		return MetadataIntegrationService.instance;
	}

	/**
	 * Extrae metadatos de un archivo y los formatea para la UI
	 * Por ahora usa los metadatos existentes hasta que tengamos la integración completa
	 */
	async extractMetadataForUI(_filePath: string): Promise<UIMetadataResult> {
		// TODO: Integrar con unified-parser.service.ts cuando esté disponible
		// Por ahora retornamos un placeholder
		return {
			success: false,
			error: 'Integración pendiente con unified-parser.service.ts',
		};
	}

	/**
	 * Formatea los metadatos extraídos para mostrar en la UI
	 */
	formatMetadataForUI(metadata: MetadataExtractionResult) {
		const formatted: NonNullable<UIMetadataResult['formatted']> = {};

		// === Información del origen/engine ===
		if (metadata.origin) {
			const engineNames: Record<AIEngine, string> = {
				automatic1111: 'Automatic1111',
				forge: 'Forge',
				comfyui: 'ComfyUI',
				swarmui: 'SwarmUI',
				midjourney: 'Midjourney',
				invokeai: 'InvokeAI',
				novelai: 'NovelAI',
				ideogram: 'Ideogram',
				stability_ai: 'Stability AI',
				dalle: 'DALL·E',
				unknown: 'Desconocido',
			};

			formatted.origin = {
				engine: metadata.origin.engine,
				engineName: engineNames[metadata.origin.engine] || metadata.origin.engine,
				confidence: `${Math.round(metadata.origin.confidence * 100)}%`,
				version: metadata.origin.version,
			};
		}

		// === Metadatos técnicos básicos ===
		if (metadata.base) {
			formatted.technical = [];

			const base = metadata.base;
			if (base.file?.format) {
				formatted.technical.push({ key: 'Formato', value: base.file.format, category: 'técnico' });
			}
			if (base.file?.size) {
				formatted.technical.push({
					key: 'Tamaño archivo',
					value: this.formatFileSize(base.file.size),
					category: 'técnico',
				});
			}
			if (base.dimensions?.width && base.dimensions?.height) {
				formatted.technical.push({
					key: 'Dimensiones',
					value: `${base.dimensions.width} × ${base.dimensions.height}`,
					category: 'técnico',
				});
			}
			if (base.dimensions?.aspectRatio) {
				formatted.technical.push({ key: 'Aspect Ratio', value: base.dimensions.aspectRatio, category: 'técnico' });
			}
			if (base.color?.colorType) {
				formatted.technical.push({ key: 'Tipo Color', value: base.color.colorType, category: 'técnico' });
			}
			if (base.color?.bitDepth) {
				formatted.technical.push({
					key: 'Profundidad Bits',
					value: `${base.color.bitDepth} bits`,
					category: 'técnico',
				});
			}
			if (base.color?.compression) {
				formatted.technical.push({ key: 'Compresión', value: base.color.compression, category: 'técnico' });
			}
		}

		// === Metadatos EXIF ===
		if (metadata.exif) {
			formatted.exif = [];

			const exif = metadata.exif as Record<string, any>;

			// Información de cámara
			if (exif.Make || exif.Model) {
				const camera = `${exif.Make || ''} ${exif.Model || ''}`.trim();
				if (camera) {
					formatted.exif.push({ key: 'Cámara', value: camera, category: 'exif' });
				}
			}

			// Configuración de captura
			if (exif.ISOSpeedRatings || exif.ISO) {
				formatted.exif.push({ key: 'ISO', value: (exif.ISOSpeedRatings || exif.ISO).toString(), category: 'exif' });
			}
			if (exif.FNumber) {
				formatted.exif.push({ key: 'Apertura', value: `f/${exif.FNumber}`, category: 'exif' });
			}
			if (exif.ExposureTime) {
				formatted.exif.push({ key: 'Velocidad', value: exif.ExposureTime.toString(), category: 'exif' });
			}
			if (exif.FocalLength) {
				formatted.exif.push({ key: 'Distancia Focal', value: `${exif.FocalLength}mm`, category: 'exif' });
			}

			// Fechas
			if (exif.DateTimeOriginal) {
				formatted.exif.push({ key: 'Fecha Captura', value: exif.DateTimeOriginal.toString(), category: 'exif' });
			}
			if (exif.DateTime) {
				formatted.exif.push({ key: 'Fecha Modificación', value: exif.DateTime.toString(), category: 'exif' });
			}

			// GPS
			if (exif.GPSLatitude && exif.GPSLongitude) {
				formatted.exif.push({
					key: 'Coordenadas GPS',
					value: `${exif.GPSLatitude}, ${exif.GPSLongitude}`,
					category: 'exif',
				});
			}

			// Información técnica
			if (exif.Software && !metadata.ai_metadata) {
				// Solo mostrar si no hay metadatos IA
				formatted.exif.push({ key: 'Software', value: exif.Software.toString(), category: 'exif' });
			}
			if (exif.ColorSpace) {
				formatted.exif.push({ key: 'Espacio Color', value: exif.ColorSpace.toString(), category: 'exif' });
			}
		}

		// === Metadatos IPTC ===
		if (metadata.iptc) {
			formatted.iptc = [];

			const iptc = metadata.iptc as Record<string, any>;
			if (iptc.Headline) {
				formatted.iptc.push({ key: 'Título', value: iptc.Headline.toString(), category: 'iptc' });
			}
			if (iptc.Caption) {
				formatted.iptc.push({ key: 'Descripción', value: iptc.Caption.toString(), category: 'iptc' });
			}
			if (iptc.Keywords && Array.isArray(iptc.Keywords)) {
				formatted.iptc.push({
					key: 'Palabras Clave',
					value: iptc.Keywords.join(', '),
					category: 'iptc',
				});
			}
			if (iptc.Copyright) {
				formatted.iptc.push({ key: 'Copyright', value: iptc.Copyright.toString(), category: 'iptc' });
			}
			if (iptc.ByLine) {
				formatted.iptc.push({ key: 'Autor', value: iptc.ByLine.toString(), category: 'iptc' });
			}
			if (iptc.City) {
				formatted.iptc.push({ key: 'Ciudad', value: iptc.City.toString(), category: 'iptc' });
			}
			if (iptc.Country) {
				formatted.iptc.push({ key: 'País', value: iptc.Country.toString(), category: 'iptc' });
			}
		}

		// === Metadatos XMP ===
		if (metadata.xmp) {
			formatted.xmp = [];

			const xmp = metadata.xmp as Record<string, any>;
			if (xmp.Title) {
				formatted.xmp.push({ key: 'Título XMP', value: xmp.Title.toString(), category: 'xmp' });
			}
			if (xmp.Description) {
				formatted.xmp.push({ key: 'Descripción XMP', value: xmp.Description.toString(), category: 'xmp' });
			}
			if (xmp.Rating) {
				formatted.xmp.push({ key: 'Calificación', value: `${xmp.Rating}/5`, category: 'xmp' });
			}
			if (xmp.CreatorTool) {
				formatted.xmp.push({ key: 'Herramienta', value: xmp.CreatorTool.toString(), category: 'xmp' });
			}
		}

		// === Metadatos de IA ===
		if (metadata.ai_metadata) {
			formatted.ai = [];

			const ai = metadata.ai_metadata as Record<string, any>;

			// Información de generación
			if (ai.prompt) {
				const promptText =
					ai.prompt.toString().length > 150 ? `${ai.prompt.toString().substring(0, 150)}...` : ai.prompt.toString();
				formatted.ai.push({ key: 'Prompt', value: promptText, category: 'ia' });
			}
			if (ai.negative_prompt) {
				const negPromptText =
					ai.negative_prompt.toString().length > 100
						? `${ai.negative_prompt.toString().substring(0, 100)}...`
						: ai.negative_prompt.toString();
				formatted.ai.push({ key: 'Prompt Negativo', value: negPromptText, category: 'ia' });
			}

			// Configuración
			if (ai.model) {
				formatted.ai.push({ key: 'Modelo', value: ai.model.toString(), category: 'ia' });
			}
			if (ai.checkpoint) {
				formatted.ai.push({ key: 'Checkpoint', value: ai.checkpoint.toString(), category: 'ia' });
			}
			if (ai.steps) {
				formatted.ai.push({ key: 'Pasos', value: ai.steps.toString(), category: 'ia' });
			}
			if (ai.cfg_scale || ai.cfg) {
				formatted.ai.push({ key: 'CFG Scale', value: (ai.cfg_scale || ai.cfg).toString(), category: 'ia' });
			}
			if (ai.seed) {
				formatted.ai.push({ key: 'Seed', value: ai.seed.toString(), category: 'ia' });
			}
			if (ai.sampler) {
				formatted.ai.push({ key: 'Sampler', value: ai.sampler.toString(), category: 'ia' });
			}
			if (ai.scheduler) {
				formatted.ai.push({ key: 'Scheduler', value: ai.scheduler.toString(), category: 'ia' });
			}

			// Parámetros avanzados
			if (ai.clip_skip) {
				formatted.ai.push({ key: 'Clip Skip', value: ai.clip_skip.toString(), category: 'ia' });
			}
			if (ai.denoise) {
				formatted.ai.push({ key: 'Denoising', value: ai.denoise.toString(), category: 'ia' });
			}

			// Engine específicos
			if (ai.hires_upscaler) {
				formatted.ai.push({ key: 'Hires Upscaler', value: ai.hires_upscaler.toString(), category: 'ia' });
			}
			if (ai.restore_faces) {
				formatted.ai.push({ key: 'Restore Faces', value: 'Sí', category: 'ia' });
			}
			if (ai.generation_time) {
				formatted.ai.push({ key: 'Tiempo Generación', value: `${ai.generation_time}s`, category: 'ia' });
			}
			if (ai.prep_time) {
				formatted.ai.push({ key: 'Tiempo Prep', value: `${ai.prep_time}s`, category: 'ia' });
			}
			if (ai.chaos) {
				formatted.ai.push({ key: 'Chaos', value: ai.chaos.toString(), category: 'ia' });
			}
			if (ai.quality) {
				formatted.ai.push({ key: 'Quality', value: ai.quality.toString(), category: 'ia' });
			}
			if (ai.stylize) {
				formatted.ai.push({ key: 'Stylize', value: ai.stylize.toString(), category: 'ia' });
			}
			if (ai.version) {
				formatted.ai.push({ key: 'Versión', value: ai.version.toString(), category: 'ia' });
			}
			if (ai.job_id) {
				formatted.ai.push({ key: 'Job ID', value: ai.job_id.toString(), category: 'ia' });
			}
		}

		// === Metadatos de video ===
		if (metadata.video_metadata) {
			formatted.video = [];

			const video = metadata.video_metadata as Record<string, any>;
			if (video.duration) {
				formatted.video.push({ key: 'Duración', value: this.formatDuration(video.duration), category: 'video' });
			}
			if (video.framerate) {
				formatted.video.push({ key: 'FPS', value: video.framerate.toString(), category: 'video' });
			}
			if (video.bitrate) {
				formatted.video.push({ key: 'Bitrate', value: this.formatBitrate(video.bitrate), category: 'video' });
			}
			if (video.codec) {
				formatted.video.push({ key: 'Codec', value: video.codec.toString(), category: 'video' });
			}
			if (video.format) {
				formatted.video.push({ key: 'Formato Video', value: video.format.toString(), category: 'video' });
			}
		}

		return formatted;
	}

	/**
	 * Combina metadatos formateados en un array plano para la UI
	 */
	flattenMetadataForUI(
		formatted: NonNullable<UIMetadataResult['formatted']>
	): Array<{ key: string; value: string; category: string }> {
		const result: Array<{ key: string; value: string; category: string }> = [];

		// Agregar información del origen si existe
		if (formatted.origin) {
			result.push({
				key: 'Engine IA',
				value: `${formatted.origin.engineName} (${formatted.origin.confidence})`,
				category: 'ia',
			});
			if (formatted.origin.version) {
				result.push({
					key: 'Versión Engine',
					value: formatted.origin.version,
					category: 'ia',
				});
			}
		}

		// Agregar cada categoría
		if (formatted.ai) {
			result.push(...formatted.ai);
		}
		if (formatted.exif) {
			result.push(...formatted.exif);
		}
		if (formatted.iptc) {
			result.push(...formatted.iptc);
		}
		if (formatted.xmp) {
			result.push(...formatted.xmp);
		}
		if (formatted.technical) {
			result.push(...formatted.technical);
		}
		if (formatted.video) {
			result.push(...formatted.video);
		}

		return result;
	}

	// === Utilidades de formato ===

	private formatFileSize(bytes: number): string {
		const units = ['B', 'KB', 'MB', 'GB'];
		let size = bytes;
		let unitIndex = 0;

		while (size >= 1024 && unitIndex < units.length - 1) {
			size /= 1024;
			unitIndex++;
		}

		return `${size.toFixed(1)} ${units[unitIndex]}`;
	}

	private formatDuration(seconds: number): string {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = Math.floor(seconds % 60);

		if (hours > 0) {
			return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
		}
		return `${minutes}:${secs.toString().padStart(2, '0')}`;
	}

	private formatBitrate(bitrate: number): string {
		if (bitrate >= 1_000_000) {
			return `${(bitrate / 1_000_000).toFixed(1)} Mbps`;
		}
		if (bitrate >= 1000) {
			return `${(bitrate / 1000).toFixed(1)} kbps`;
		}
		return `${bitrate} bps`;
	}
}

// Instancia singleton
export const metadataIntegrationService = MetadataIntegrationService.getInstance();
