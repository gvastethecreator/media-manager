export * from './base';
export * from './extended';

// Tipos para operaciones
export type CreateMetadataData = {
  imageId: string;
  format: string;
  width: number;
  height: number;
  size: number;
  colorSpace?: string;
  hasAlpha?: boolean;
  orientation?: number;
};

export type UpdateMetadataData = Partial<CreateMetadataData>;