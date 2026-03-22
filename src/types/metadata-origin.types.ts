/**
 * Tipos para detección de origen y extracción de metadata de imágenes y videos generados por IA
 * Soporta: Automatic1111, Forge, ComfyUI, SwarmUI, Midjourney, Video files (MP4, MOV, AVI, WebM)
 */

// ===== Tipos Base =====

export interface BaseMetadata {
	// Propiedades de color/imagen
	color?: {
		colorType?: string;
		bitDepth?: number;
		compression?: string;
		hasAlpha?: boolean;
	};
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

	// Para PNG específicos
	png?: {
		filterMethod?: string;
		interlacing?: boolean;
	};
}

// ===== Metadata de Generación IA =====

export interface AIGenerationParameters {
	cfg?: number; // Alias para cfg_scale
	cfg_scale?: number;
	chaos?: number;
	checkpoint?: string;

	// Configuración avanzada
	clip_skip?: number;
	denoise?: number;
	engine?: string;
	eta?: number;

	// Parámetros adicionales
	extra_params?: Record<string, unknown>;

	// Timing (SwarmUI)
	generation_time?: number;

	// Midjourney específico
	job_id?: string;

	// Información del modelo
	model?: string;
	negative_prompt?: string;
	prep_time?: number;
	// Prompts
	prompt?: string;
	quality?: number;
	sampler?: string;
	scheduler?: string;

	// Seeds y control
	seed?: number | string;

	// Configuración de generación
	steps?: number;
	stylize?: number;
	subseed?: number;
	subseed_strength?: number;
	vae?: string;
	version?: string;

	// Workflow datos (ComfyUI)
	workflow?: string;
	workflow_json?: Record<string, unknown>;
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
	confidence: number; // 0-1
	engine: AIEngine;
	evidence: string[]; // Lista de evidencias encontradas
	version?: string; // Versión del engine si se puede detectar
}

// ===== Metadatos Técnicos (EXIF/IPTC/XMP) =====

export interface TechnicalMetadata {
	exif?: ExifData;
	iptc?: IptcData;
	rawTags?: Record<string, unknown>;
	xmp?: XmpData;
}

export interface ExifData {
	// Información técnica
	colorSpace?: number;

	// Información de archivo
	compression?: number;

	// Fechas
	dateTime?: string;
	dateTimeDigitized?: string;
	dateTimeOriginal?: string;

	// Configuración de captura
	exposureTime?: string;
	flash?: number;
	fNumber?: number;
	focalLength?: number;

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
	imageHeight?: number;
	// Información básica de la imagen
	imageWidth?: number;
	iso?: number;

	// Información de la cámara
	make?: string;
	meteringMode?: number;
	model?: string;
	orientation?: number;
	resolutionUnit?: number;
	software?: string;
	whiteBalance?: number;
	xResolution?: number;
	yResolution?: number;
}

export interface IptcData {
	// Información de autoría
	byline?: string;
	bylineTitle?: string;
	category?: string;
	city?: string;
	copyright?: string;
	country?: string;
	countryCode?: string;
	credit?: string;

	// Información de fecha y ubicación
	dateCreated?: string;
	description?: string;

	// Información técnica
	editorialUpdate?: string;
	fixture?: string;

	// Información editorial
	headline?: string;
	keywords?: string[];
	languageIdentifier?: string;
	source?: string;
	state?: string;
	supplementalCategories?: string[];
	timeCreated?: string;
	// Información de identificación
	title?: string;
	urgency?: number;
}

export interface XmpData {
	// Camera Raw (si está disponible)
	cameraRawSettings?: Record<string, any>;
	createDate?: string;
	creator?: string[];
	creatorTool?: string;

	// Metadatos personalizados
	customFields?: Record<string, any>;
	description?: string;
	modifyDate?: string;

	// Adobe Photoshop
	photoshopColorMode?: number;
	photoshopHistory?: string;
	photoshopICCProfile?: string;

	// Adobe XMP
	rating?: number;
	rights?: string;
	subject?: string[];
	// Dublin Core
	title?: string;
}

// ===== Metadata Específicos por Engine =====

export interface Automatic1111Metadata extends AIGenerationParameters {
	engine: AIEngine.AUTOMATIC1111;

	// Forge extensiones
	forge_attention?: string;
	forge_memory?: string;
	hires_denoising_strength?: number;
	hires_steps?: number;
	hires_upscaler?: string;

	// A1111 específicos
	restore_faces?: boolean;
	tiling?: boolean;
}

export interface ComfyUIMetadata extends AIGenerationParameters {
	checkpoint_loader?: string;
	engine: AIEngine.COMFYUI;

	// Nodos específicos
	text_encode_nodes?: string[];
	vae_loader?: string;
	workflow_links?: unknown[];

	// Workflow completo
	workflow_nodes?: Record<string, unknown>;
}

export interface SwarmUIMetadata extends AIGenerationParameters {
	// SwarmUI específicos
	aspect_ratio?: string;
	batch_count?: number;

	// Configuración de batching
	batch_size?: number;
	engine: AIEngine.SWARMUI;
	gpu_memory?: number;
	total_time?: number;
}

export interface MidjourneyMetadata extends AIGenerationParameters {
	aspect_ratio?: string;

	// Midjourney específicos
	author?: string;
	character_reference?: string;

	// Parámetros de comando
	command_params?: Record<string, unknown>;
	engine: AIEngine.MIDJOURNEY;
	job_type?: string;
	reference_image?: string;
	style_reference?: string;
}

export interface IdeogramMetadata extends AIGenerationParameters {
	engine: AIEngine.IDEOGRAM;

	// Ideogram específicos detectados via EXIF
	exif_engine_hint?: string;
}

// ===== Metadata para Video =====

export interface VideoMetadata extends BaseMetadata {
	// Metadata de generación si es video generado por IA
	ai_generation?: AIGenerationParameters;
	aiMetadata?: Record<string, any>; // Para metadatos de IA extraídos
	audio_codec?: string;
	audioChannels?: number;
	audioCodec?: string; // Alias para compatibilidad
	audioSampleRate?: number;
	bitrate?: number;
	container?: string; // Alias para compatibilidad

	// Contenedores
	container_format?: string;

	// Timestamps
	createdAt?: string;

	// Propiedades de video
	duration?: number;
	// Propiedades básicas
	filename?: string;
	format?: string;
	frame_rate?: number;
	frameRate?: number; // Alias para compatibilidad
	height?: number;
	modifiedAt?: string;
	resolution?: string;
	size?: number;

	// Codec información
	video_codec?: string;
	videoCodec?: string; // Alias para compatibilidad
	videoProfile?: string;

	// Dimensiones
	width?: number;
}

// ===== Resultado Final =====

export interface MetadataExtractionResult {
	// Metadata de IA específico por engine
	ai_metadata?:
		| StructuredAIMetadata
		| Automatic1111Metadata
		| ComfyUIMetadata
		| SwarmUIMetadata
		| MidjourneyMetadata
		| IdeogramMetadata
		| AIGenerationParameters; // Fallback genérico

	// Metadata base
	base: BaseMetadata;

	// C2PA (Content Credentials)
	c2pa?: Record<string, unknown>;

	// Errores durante extracción
	errors: string[];

	// EXIF/IPTC tradicional
	exif?: Record<string, unknown>;
	iptc?: Record<string, unknown>;

	// Detección de origen
	origin?: OriginDetectionResult;

	// Info de procesamiento
	parser_used?: string;
	processing_time?: number;
	success: boolean;

	// Para videos
	video_metadata?: VideoMetadata;
	warnings: string[];
	xmp?: Record<string, unknown>;
}

// ===== Opciones de Configuración =====

export interface MetadataExtractionOptions {
	// Debug
	debug?: boolean;
	extract_ai_metadata?: boolean;
	extract_c2pa?: boolean;
	// Control de qué extraer
	extract_exif?: boolean;
	extract_iptc?: boolean;

	// Específico para video
	extract_thumbnail?: boolean;
	extract_video_metadata?: boolean;
	extract_xmp?: boolean;
	include_raw_data?: boolean;
	max_file_size?: number; // bytes
	thumbnail_time?: number; // segundo en el video

	// Control de procesamiento
	timeout?: number; // milliseconds
}

// ===== Tipos para Parsers =====

export interface ParserResult {
	confidence: number;
	data?: AIGenerationParameters;
	detected: boolean;
	errors?: string[];
}

export interface MetadataParser {
	canParse(metadata: Record<string, unknown>): Promise<boolean>;
	engine: AIEngine;
	name: string;
	parse(metadata: Record<string, unknown>): Promise<ParserResult>;
}

// ===== Interfaz Modular de Parsers de Engine =====
export interface AIEngineParser {
	engines: AIEngine[];
	matches(metadata: Record<string, unknown>): Promise<boolean> | boolean;
	name: string;
	parse(metadata: Record<string, unknown>): Promise<StructuredAIMetadata | null>;
	priority?: number;
}

// ===== Metadata Estructurado Unificado =====
export interface StructuredAIMetadataCommon extends AIGenerationParameters {
	confidence?: number;
	engine: AIEngine;
	evidence?: string[];
}

export interface StructuredAIMetadata {
	automatic1111?: Automatic1111Metadata;
	comfyui?: ComfyUIMetadata;
	common: StructuredAIMetadataCommon;
	engine: AIEngine;
	errors?: string[];
	ideogram?: IdeogramMetadata;
	legacy_flat: AIGenerationParameters;
	midjourney?: MidjourneyMetadata;
	swarmui?: SwarmUIMetadata;
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
