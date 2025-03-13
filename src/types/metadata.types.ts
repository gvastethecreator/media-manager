import type { AIGenerationInfo } from '@/lib/parsers';

export interface Dimensions {
	width: number;
	height: number;
}

/**
 * Interfaz para información GPS
 */
export interface GPSData {
	latitude?: number;
	longitude?: number;
	altitude?: number;
}

/**
 * Interfaz para datos EXIF
 */
export interface ExifData {
	make?: string;
	model?: string;
	software?: string;
	dateTime?: string | Date;
	exposureTime?: string | number;
	fNumber?: number;
	iso?: number;
	focalLength?: number;
	lensModel?: string;
	lens?: string; // Para compatibilidad
	gps?: GPSData;
	copyright?: string;
	artist?: string;
	description?: string;
	// Otros campos EXIF relevantes
}

/**
 * Interfaz para datos IPTC
 */
export interface IPTCData {
	creator?: string[];
	copyright?: string;
	keywords?: string[];
	headline?: string;
	caption?: string;
	source?: string;
	// Otros campos IPTC relevantes
}

/**
 * Interfaz para datos XMP
 */
export interface XMPData {
	creator?: string;
	title?: string;
	description?: string;
	rights?: string;
	subject?: string[];
	rating?: number;
	toolkit?: string;
	rawData?: string | Record<string, unknown>;
}

/**
 * Tipo para los parámetros de generación por IA
 */
export interface AIGenerationParams {
	prompt?: string;
	negative_prompt?: string;
	seed?: number | string;
	width?: number;
	height?: number;
	steps?: number;
	cfg_scale?: number;
	sampler?: string;
	strength?: number;
	model?: string;
	[key: string]: string | number | boolean | undefined | null | string[] | number[]; // Para otros parámetros extra que puedan existir
}

/**
 * Interfaz para la información de generación por IA
 */
export interface AIGenerationMetadata {
	type?: string;
	model?: string;
	prompt?: string;
	negative_prompt?: string;
	seed?: number | string;
	extra_params?: AIGenerationParams;
	raw_info?: string | Record<string, unknown>;
}

/**
 * Interfaz que representa los metadatos extraídos de un archivo
 */
export interface FileMetadata {
	dimensions?: Dimensions;
	mimeType?: string;
	fileSize?: number;
	colorSpace?: string;
	hasAlpha?: boolean;
	isAnimated?: boolean;
	exif?: ExifData;
	iptc?: IPTCData;
	xmp?: XMPData;
	generation?: AIGenerationMetadata;
}
