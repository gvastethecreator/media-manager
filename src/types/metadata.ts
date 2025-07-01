/**
 * @file Tipos para metadatos de archivos
 * @module types/metadata
 */

/**
 * 📸 Datos EXIF básicos
 */
export interface EXIFData {
	make?: string;
	model?: string;
	software?: string;
	dateTime?: string;
	dateTimeOriginal?: string;
	dateTimeDigitized?: string;
	exposureTime?: string;
	fNumber?: number;
	iso?: number;
	focalLength?: string;
	lensModel?: string;
	flash?: string;
	whiteBalance?: string;
	gps?: {
		latitude?: number;
		longitude?: number;
		altitude?: number;
	};
	artist?: string;
	copyright?: string;
}

/**
 * 🤖 Metadatos de IA para imágenes generadas
 */
export interface AIMetadata {
	model?: string;
	prompt?: string;
	negativePrompt?: string;
	seed?: number;
	samplingSteps?: number;
	cfgScale?: number;
	samplingMethod?: string;
	extraParameters?: Record<string, unknown>;
}

/**
 * 📊 Metadatos generales de archivos
 */
export interface FileMetadata {
	// Propiedades básicas del archivo
	format?: string;
	compression?: string;
	colorSpace?: string;
	bitDepth?: number;
	hasAlpha?: boolean;
	orientation?: number;
	width?: number;
	height?: number;
	totalSize?: number;
	mimeType?: string;
	itemCount?: number;
	lastModified?: Date;
	fileSize?: number;
	gps?: Record<string, unknown>; // Para datos GPS
	colorProfile?: string;
	density?: number;
	isAnimated?: boolean;
	sizeInBytes?: number;
	dimensions?: { width: number; height: number };
	duration?: number;
	encoding?: string;
	hash?: string;
	customFields?: Record<string, unknown>;
	dpi?: {
		x: number;
		y: number;
	};

	// Datos EXIF
	exif?: EXIFData;

	// Otros metadatos estándar
	iptc?: Record<string, unknown>;
	xmp?: Record<string, unknown>;
	icc?: Record<string, unknown>;

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

	// Metadatos de procesamiento
	processing?: {
		extractedAt?: Date;
		extractorVersion?: string;
		processingTime?: number;
		errors?: string[];
		warnings?: string[];
	};
}

/**
 * 📊 Metadatos extendidos con información adicional
 */
export interface ExtendedFileMetadata extends FileMetadata {
	// Información del archivo en el sistema
	filePath?: string;
	fileSize?: number;
	lastModified?: Date;
	created?: Date;

	// Información de procesamiento
	thumbnailGenerated?: boolean;
	hashCalculated?: boolean;
	metadataComplete?: boolean;

	// Estado de validación
	isValid?: boolean;
	validationErrors?: string[];
	validationWarnings?: string[];
}

/**
 * Alias de tipos para compatibilidad
 */
export type MediaMetadata = FileMetadata;
