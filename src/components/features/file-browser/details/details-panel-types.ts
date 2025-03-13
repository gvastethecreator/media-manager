import type { FileItem } from '@/types/file-item';
import type { ImageItem } from '@/types/image-item';
import type { FileMetadata } from '@/types/metadata.types';
import type * as React from 'react';

/**
 * Props para el componente InfoItem que muestra información en formato etiqueta-valor
 */
export interface InfoItemProps {
	icon: React.ReactNode;
	label: string;
	value: string | number | boolean | undefined | null | Record<string, unknown>;
}

/**
 * Props para el componente DetailsPanel principal
 */
export interface DetailsPanelProps {
	selectedItems: ImageItem[];
}

/**
 * Props para componentes que muestran metadatos específicos
 */
export interface MetadataComponentProps {
	metadata: FileMetadata | null;
}

/**
 * Props para componentes que requieren tanto el item como los metadatos
 */
export interface ItemWithMetadataProps {
	item: FileItem;
	metadata: FileMetadata | null;
}

/**
 * Props para componentes que requieren solo el item
 */
export interface ItemComponentProps {
	item: FileItem;
}

/**
 * Propiedades para componentes que muestran información básica
 */
export interface BasicInfoProps {
	item: ImageItem;
	metadata: FileMetadata | null;
}
