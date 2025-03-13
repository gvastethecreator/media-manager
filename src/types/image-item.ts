/**
 * Interfaz que define un elemento de imagen
 */
export interface ImageItem {
	id: string;
	name: string;
	path?: string;
	url?: string;
	metadata?: string;
	fileSize?: number;
	width?: number;
	height?: number;
	tags?: string[];
	createdAt?: Date;
	updatedAt?: Date;
}
