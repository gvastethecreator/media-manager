export * from './extended';
export * from './types';

// Tipos para operaciones
export interface CreateMetadataData {
	colorSpace?: string;
	format: string;
	hasAlpha?: boolean;
	height: number;
	imageId: string;
	orientation?: number;
	size: number;
	width: number;
}

export type UpdateMetadataData = Partial<CreateMetadataData>;
