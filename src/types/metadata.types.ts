/**
 * @file Tipos de metadatos
 * @module types/metadata.types
 */

export interface MediaMetadata {
	dimensions?: {
		width: number;
		height: number;
	};
	format?: string;
	fileSize?: number;
	created?: Date;
	modified?: Date;
	exif?: Record<string, unknown>;
	[key: string]: unknown;
}

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
