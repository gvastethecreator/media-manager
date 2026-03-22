/**
 * Type declarations for png-itxt module
 */
declare module 'png-itxt' {
	export interface PngChunk {
		data: Buffer;
		keyword?: string;
		language?: string;
		text?: string;
		translatedKeyword?: string;
		type: string;
	}

	export function readPngChunks(buffer: Buffer): PngChunk[];
}
