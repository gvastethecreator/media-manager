/**
 * Type declarations for png-itxt module
 */
declare module 'png-itxt' {
	export interface PngChunk {
		type: string;
		data: Buffer;
		text?: string;
		keyword?: string;
		language?: string;
		translatedKeyword?: string;
	}

	export function readPngChunks(buffer: Buffer): PngChunk[];
}
