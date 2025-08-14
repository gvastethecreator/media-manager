/**
 * Tipos para detección de origen y extracción de metadata de imágenes y videos generados por IA
 * Soporta: Automatic1111, Forge, ComfyUI, SwarmUI, Midjourney, Video files (MP4, MOV, AVI, WebM)
 */

// ===== Tipos Base =====

export interface BaseMetadata {
	// Propiedades técnicas básicas
	dimensions?: {
		width: number;
		height: number;
		megapixels?: number;
		aspectRatio?: string;
	};

	// Información del archivo
	file?: {
		size: number;
		format: string;
		mimeType: string;
		filename: string;
	};

	// Propiedades de color/imagen
	color?: {
		colorType?: string;
		bitDepth?: number;
		compression?: string;
		hasAlpha?: boolean;
	};

	// Para PNG específicos
	png?: {
		filterMethod?: string;
		interlacing?: boolean;
	};
}

// ===== Metadata de Generación IA =====

export interface AIGenerationParameters {
	// Prompts
	prompt?: string;
	negative_prompt?: string;

	// Configuración de generación
	steps?: number;
	cfg_scale?: number;
	cfg?: number; // Alias para cfg_scale
	sampler?: string;
	scheduler?: string;

	// Información del modelo
	model?: string;
	checkpoint?: string;
	vae?: string;
	engine?: string;

	// Seeds y control
	seed?: number | string;
	subseed?: number;
	subseed_strength?: number;
	denoise?: number;

	// Configuración avanzada
	clip_skip?: number;
	eta?: number;

	// Timing (SwarmUI)
	generation_time?: number;
	prep_time?: number;

	// Midjourney específico
	job_id?: string;
	chaos?: number;
	stylize?: number;
	quality?: number;
	version?: string;

	// Workflow datos (ComfyUI)
	workflow?: string;
	workflow_json?: Record<string, unknown>;

	// Parámetros adicionales
	extra_params?: Record<string, unknown>;
}

// ===== Detección de Origen =====

export enum AIEngine {
	AUTOMATIC1111 = 'automatic1111',
	FORGE = 'forge',
	COMFYUI = 'comfyui',
	SWARMUI = 'swarmui',
	MIDJOURNEY = 'midjourney',
	INVOKEAI = 'invokeai',
	NOVELAI = 'novelai',
	IDEOGRAM = 'ideogram',
	STABILITY_AI = 'stability_ai',
	DALLE = 'dalle',
	UNKNOWN = 'unknown',
}

export interface OriginDetectionResult {
	engine: AIEngine;
	confidence: number; // 0-1
	evidence: string[]; // Lista de evidencias encontradas
	version?: string; // Versión del engine si se puede detectar
}

// ===== Metadatos Técnicos (EXIF/IPTC/XMP) =====

export interface TechnicalMetadata {
	exif?: ExifData;
	iptc?: IptcData;
	xmp?: XmpData;
	rawTags?: Record<string, unknown>;
}

export interface ExifData {
	// Información básica de la imagen
	imageWidth?: number;
	imageHeight?: number;
	orientation?: number;

	// Información de la cámara
	make?: string;
	model?: string;
	software?: string;

	// Configuración de captura
	exposureTime?: string;
	fNumber?: number;
	iso?: number;
	focalLength?: number;

	// Fechas
	dateTime?: string;
	dateTimeOriginal?: string;
	dateTimeDigitized?: string;

	// Información técnica
	colorSpace?: number;
	whiteBalance?: number;
	flash?: number;
	meteringMode?: number;

	// GPS si está disponible
	gps?: {
		latitude?: number;
		longitude?: number;
		altitude?: number;
		latitudeRef?: string;
		longitudeRef?: string;
		altitudeRef?: number;
		timestamp?: string;
		datestamp?: string;
	};

	// Información de archivo
	compression?: number;
	xResolution?: number;
	yResolution?: number;
	resolutionUnit?: number;
}

export interface IptcData {
	// Información de identificación
	title?: string;
	description?: string;
	keywords?: string[];

	// Información de autoría
	byline?: string;
	bylineTitle?: string;
	credit?: string;
	source?: string;
	copyright?: string;

	// Información editorial
	headline?: string;
	urgency?: number;
	category?: string;
	supplementalCategories?: string[];

	// Información de fecha y ubicación
	dateCreated?: string;
	timeCreated?: string;
	city?: string;
	state?: string;
	country?: string;
	countryCode?: string;

	// Información técnica
	editorialUpdate?: string;
	fixture?: string;
	languageIdentifier?: string;
}

export interface XmpData {
	// Dublin Core
	title?: string;
	description?: string;
	subject?: string[];
	creator?: string[];
	rights?: string;

	// Adobe XMP
	rating?: number;
	createDate?: string;
	modifyDate?: string;
	creatorTool?: string;

	// Adobe Photoshop
	photoshopColorMode?: number;
	photoshopICCProfile?: string;
	photoshopHistory?: string;

	// Camera Raw (si está disponible)
	cameraRawSettings?: Record<string, any>;

	// Metadatos personalizados
	customFields?: Record<string, any>;
}

// ===== Metadata Específicos por Engine =====

export interface Automatic1111Metadata extends AIGenerationParameters {
	engine: AIEngine.AUTOMATIC1111;

	// A1111 específicos
	restore_faces?: boolean;
	tiling?: boolean;
	hires_upscaler?: string;
	hires_steps?: number;
	hires_denoising_strength?: number;

	// Forge extensiones
	forge_attention?: string;
	forge_memory?: string;
}

export interface ComfyUIMetadata extends AIGenerationParameters {
	engine: AIEngine.COMFYUI;

	// Workflow completo
	workflow_nodes?: Record<string, unknown>;
	workflow_links?: unknown[];

	// Nodos específicos
	text_encode_nodes?: string[];
	checkpoint_loader?: string;
	vae_loader?: string;
}

export interface SwarmUIMetadata extends AIGenerationParameters {
	engine: AIEngine.SWARMUI;

	// SwarmUI específicos
	aspect_ratio?: string;
	total_time?: number;
	gpu_memory?: number;

	// Configuración de batching
	batch_size?: number;
	batch_count?: number;
}

export interface MidjourneyMetadata extends AIGenerationParameters {
	engine: AIEngine.MIDJOURNEY;

	// Midjourney específicos
	author?: string;
	job_type?: string;
	aspect_ratio?: string;
	reference_image?: string;
	style_reference?: string;
	character_reference?: string;

	// Parámetros de comando
	command_params?: Record<string, unknown>;
}

export interface IdeogramMetadata extends AIGenerationParameters {
	engine: AIEngine.IDEOGRAM;

	// Ideogram específicos detectados via EXIF
	exif_engine_hint?: string;
}

// ===== Metadata para Video =====

export interface VideoMetadata extends BaseMetadata {
	// Propiedades de video
	duration?: number;
	frame_rate?: number;
	bitrate?: number;

	// Codec información
	video_codec?: string;
	audio_codec?: string;

	// Contenedores
	container_format?: string;

	// Metadata de generación si es video generado por IA
	ai_generation?: AIGenerationParameters;
}

// ===== Resultado Final =====

export interface MetadataExtractionResult {
	success: boolean;

	// Metadata base
	base: BaseMetadata;

	// EXIF/IPTC tradicional
	exif?: Record<string, unknown>;
	iptc?: Record<string, unknown>;
	xmp?: Record<string, unknown>;

	// C2PA (Content Credentials)
	c2pa?: Record<string, unknown>;

	// Detección de origen
	origin?: OriginDetectionResult;

	// Metadata de IA específico por engine
	ai_metadata?:
		| StructuredAIMetadata
		| Automatic1111Metadata
		| ComfyUIMetadata
		| SwarmUIMetadata
		| MidjourneyMetadata
		| IdeogramMetadata
		| AIGenerationParameters; // Fallback genérico

	// Para videos
	video_metadata?: VideoMetadata;

	// Errores durante extracción
	errors: string[];
	warnings: string[];

	// Info de procesamiento
	parser_used?: string;
	processing_time?: number;
}

// ===== Opciones de Configuración =====

export interface MetadataExtractionOptions {
	// Control de qué extraer
	extract_exif?: boolean;
	extract_iptc?: boolean;
	extract_xmp?: boolean;
	extract_c2pa?: boolean;
	extract_ai_metadata?: boolean;
	extract_video_metadata?: boolean;

	// Control de procesamiento
	timeout?: number; // milliseconds
	max_file_size?: number; // bytes

	// Específico para video
	extract_thumbnail?: boolean;
	thumbnail_time?: number; // segundo en el video

	// Debug
	debug?: boolean;
	include_raw_data?: boolean;
}

// ===== Tipos para Parsers =====

export interface ParserResult {
	detected: boolean;
	confidence: number;
	data?: AIGenerationParameters;
	errors?: string[];
}

export interface MetadataParser {
	name: string;
	engine: AIEngine;
	canParse(metadata: Record<string, unknown>): Promise<boolean>;
	parse(metadata: Record<string, unknown>): Promise<ParserResult>;
}

// ===== Interfaz Modular de Parsers de Engine =====
export interface AIEngineParser {
	name: string;
	engines: AIEngine[];
	priority?: number;
	matches(metadata: Record<string, unknown>): Promise<boolean> | boolean;
	parse(metadata: Record<string, unknown>): Promise<StructuredAIMetadata | null>;
}

// ===== Metadata Estructurado Unificado =====
export interface StructuredAIMetadataCommon extends AIGenerationParameters {
	engine: AIEngine;
	confidence?: number;
	evidence?: string[];
}

export interface StructuredAIMetadata {
	engine: AIEngine;
	common: StructuredAIMetadataCommon;
	automatic1111?: Automatic1111Metadata;
	comfyui?: ComfyUIMetadata;
	swarmui?: SwarmUIMetadata;
	midjourney?: MidjourneyMetadata;
	ideogram?: IdeogramMetadata;
	legacy_flat: AIGenerationParameters;
	errors?: string[];
	warnings?: string[];
}

// ===== Exportaciones de Utilidad =====

export type SupportedEngine =
	| AIEngine.AUTOMATIC1111
	| AIEngine.FORGE
	| AIEngine.COMFYUI
	| AIEngine.SWARMUI
	| AIEngine.MIDJOURNEY
	| AIEngine.INVOKEAI
	| AIEngine.NOVELAI
	| AIEngine.IDEOGRAM;

export type VideoFormat = 'mp4' | 'mov' | 'avi' | 'webm' | 'mkv' | 'wmv' | 'flv';
export type ImageFormat = 'png' | 'jpg' | 'jpeg' | 'webp' | 'gif' | 'bmp' | 'tiff';

export type SupportedFormat = VideoFormat | ImageFormat;
