/**
 * @file Tipos unificados para el panel de detalles.
 * @module components/features/file-browser/details/details-panel-types
 * @description Define las props para los componentes del panel de detalles,
 * utilizando el tipo unificado `FileItem`.
 */

import type * as React from 'react';
import type { FileItem } from '@/types/files';
import type { MediaMetadata } from '@/types/metadata';

/**
 * Props para el componente InfoItem que muestra una línea de información.
 */
export interface InfoItemProps {
	icon?: React.ReactNode;
	label: string;
	value: React.ReactNode;
	className?: string;
	maxLength?: number; // Añadido para el truncateText
}

/**
 * Props para el componente DetailsPanel principal.
 */
export interface DetailsPanelProps {
	selectedItems: FileItem[];
}

/**
 * Props genéricas para cualquier sub-componente del panel de detalles que renderiza un solo item.
 */
export interface ItemComponentProps {
	item: FileItem;
	metadata?: MediaMetadata | null; // Opcional, no todos los items tienen metadatos de medios.
}

/**
 * Props para el componente BasicInfo
 */
export interface BasicInfoProps extends ItemComponentProps {
	// Hereda item y metadata de ItemComponentProps
}

/**
 * Props para el componente MetadataSections
 */
export interface MetadataSectionsProps extends ItemComponentProps {
	// Hereda item y metadata de ItemComponentProps
}

/**
 * Estructura de datos para definir un item de información a ser renderizado dinámicamente.
 */
export interface InfoItemData {
	label: string;
	value: React.ReactNode;
	icon: React.ReactNode;
	condition?: boolean;
}
