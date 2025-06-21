/**
 * @file Tipos unificados para el panel de detalles.
 * @module components/features/file-browser/details/details-panel-types
 * @description Define las props para los componentes del panel de detalles,
 * utilizando el tipo unificado `AnyFileItem`.
 */

import type { AnyFileItem } from '@/types/files';
import type { MediaMetadata } from '@/types/metadata.types';
import type * as React from 'react';

/**
 * Props para el componente InfoItem que muestra una línea de información.
 */
export interface InfoItemProps {
	icon?: React.ReactNode;
	label: string;
	value: React.ReactNode;
	className?: string;
}

/**
 * Props para el componente DetailsPanel principal.
 */
export interface DetailsPanelProps {
	selectedItems: AnyFileItem[];
}

/**
 * Props genéricas para cualquier sub-componente del panel de detalles que renderiza un solo item.
 */
export interface ItemComponentProps {
	item: AnyFileItem;
	metadata?: MediaMetadata | null; // Opcional, no todos los items tienen metadatos de medios.
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
