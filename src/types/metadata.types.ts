/**
 * @file Tipos de metadatos
 * @module types/metadata.types
 */

export interface MediaMetadata {
	created?: Date;
	dimensions?: {
		width: number;
		height: number;
	};
	exif?: Record<string, unknown>;
	fileSize?: number;
	format?: string;
	modified?: Date;
	[key: string]: unknown;
}

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
