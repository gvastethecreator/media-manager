export * from './extended';
export * from './types';

// Tipos para operaciones
export interface CreateMetadataData {
	imageId: string;
	format: string;
	width: number;
	height: number;
	size: number;
	colorSpace?: string;
	hasAlpha?: boolean;
	orientation?: number;
}

export type UpdateMetadataData = Partial<CreateMetadataData>;
