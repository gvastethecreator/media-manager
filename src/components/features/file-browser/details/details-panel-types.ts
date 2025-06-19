import type { FileItem } from '@/types/files';
import type { ImageItem } from '@/types/image-item';
import type { MediaMetadata } from '@/types/metadata.types';
import type * as React from 'react';

/**
 * Props para el componente InfoItem que muestra información en formato etiqueta-valor
 */
export interface InfoItemProps {
	icon?: React.ReactNode;
	label: string;
	value: React.ReactNode;
	className?: string;
	maxLength?: number;
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
	metadata: MediaMetadata | null;
}

/**
 * Props para componentes que requieren tanto el item como los metadatos
 */
export interface ItemWithMetadataProps {
	item: FileItem;
	metadata: MediaMetadata | null;
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
	metadata: MediaMetadata | null;
}

/**
 * Estructura de datos para definir un item de información a ser renderizado.
 * Se utiliza para construir listas de metadatos de forma dinámica.
 */
export interface InfoItemData {
	label: string;
	value: React.ReactNode;
	icon: React.ReactNode;
	condition?: boolean;
}
