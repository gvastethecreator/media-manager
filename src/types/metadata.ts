/**
 * @file Tipos para metadatos de archivos
 * @module types/metadata
 */

/**
 * 📸 Datos EXIF básicos
 */
export interface EXIFData {
	artist?: string;
	copyright?: string;
	dateTime?: string;
	dateTimeDigitized?: string;
	dateTimeOriginal?: string;
	exposureTime?: string;
	flash?: string;
	fNumber?: number;
	focalLength?: string;
	gps?: {
		latitude?: number;
		longitude?: number;
		altitude?: number;
	};
	iso?: number;
	lensModel?: string;
	make?: string;
	model?: string;
	software?: string;
	whiteBalance?: string;
}

/**
 * 🤖 Metadatos de IA para imágenes generadas
 */
export interface AIGenerationInfo {
	cfg?: number;
	cfg_scale?: number;
	clip_skip?: number;
	created_at?: string;
	extra_params?: Record<string, unknown>;
	model?: string;
	negative_prompt?: string;
	prompt?: string;
	sampler?: string;
	seed?: number;
	steps?: number;
	type?: string;
	workflow?: string;
	[key: string]: unknown; // Index signature para propiedades adicionales
}

/**
 * 🤖 Metadatos de IA para imágenes generadas
 */
export interface AIMetadata {
	cfgScale?: number;
	extraParameters?: Record<string, unknown>;
	model?: string;
	negativePrompt?: string;
	prompt?: string;
	samplingMethod?: string;
	samplingSteps?: number;
	seed?: number;
}

/**
 * 📊 Metadatos generales de archivos
 */
export interface FileMetadata {
	// Metadatos de AI
	ai?: AIMetadata;

	// Análisis automatizado
	analysis?: {
		dominantColors?: string[];
		averageBrightness?: number;
		contrast?: number;
		sharpness?: number;
		noise?: number;
		faces?: number;
		objects?: string[];
		scenes?: string[];
		emotions?: string[];
		text?: string[];
		landmarks?: string[];
		celebrities?: string[];
		brands?: string[];
		safetyRating?: 'safe' | 'moderate' | 'adult';
		confidenceScores?: Record<string, number>;
	};
	bitDepth?: number;
	colorProfile?: string;
	colorSpace?: string;
	compression?: string;
	customFields?: Record<string, unknown>;
	density?: number;
	dimensions?: { width: number; height: number };
	dpi?: {
		x: number;
		y: number;
	};
	duration?: number;
	encoding?: string;

	// Datos EXIF
	exif?: EXIFData;
	fileSize?: number;
	// Propiedades básicas del archivo
	format?: string;
	generation?: AIGenerationInfo;
	gps?: Record<string, unknown>; // Para datos GPS
	hasAlpha?: boolean;
	hash?: string;
	height?: number;
	icc?: Record<string, unknown>;

	// Otros metadatos estándar
	iptc?: Record<string, unknown>;
	isAnimated?: boolean;
	itemCount?: number;
	lastModified?: Date;
	mimeType?: string;
	orientation?: number;

	// Metadatos de procesamiento
	processing?: {
		extractedAt?: Date;
		extractorVersion?: string;
		processingTime?: number;
		errors?: string[];
		warnings?: string[];
	};
	sizeInBytes?: number;
	totalSize?: number;
	width?: number;
	xmp?: Record<string, unknown>;
}

/**
 * 📊 Metadatos extendidos con información adicional
 */
export interface ExtendedFileMetadata extends FileMetadata {
	created?: Date;
	// Información del archivo en el sistema
	filePath?: string;
	fileSize?: number;
	hashCalculated?: boolean;

	// Estado de validación
	isValid?: boolean;
	lastModified?: Date;
	metadataComplete?: boolean;

	// Información de procesamiento
	thumbnailGenerated?: boolean;
	validationErrors?: string[];
	validationWarnings?: string[];
}

/**
 * Alias de tipos para compatibilidad
 */
export type MediaMetadata = FileMetadata;
