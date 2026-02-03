/**
 * @file Tipos para el panel de detalles
 * @module components/panels/details-panel/types
 */

import type { AnyEntityWithStats } from '@/types/entities';

export interface DetailsPanelProps {
	selectedItems: AnyEntityWithStats[];
	className?: string;
}

export interface MetadataField {
	key: string;
	value: string;
	category?: string;
}

export interface BasicMetadataField {
	key: string;
	value: string;
	icon: React.ComponentType<any>;
}

export interface RelatedEntity {
	type: string;
	count: number;
	icon: React.ComponentType<any>;
	color: string;
}

export interface DisplayData {
	type: 'empty' | 'single' | 'multiple';
	item?: AnyEntityWithStats;
	items?: AnyEntityWithStats[];
}

export interface EnhancedMetadataOptions {
	includeExif?: boolean;
	includeIptc?: boolean;
	includeXmp?: boolean;
	detectAIOrigin?: boolean;
}

export interface EnhancedMetadataResult {
	success: boolean;
	error?: string;
	metadata?: {
		aiMetadata?: any;
		exifData?: any;
		iptcData?: any;
		xmpData?: any;
		videoData?: any; // Metadatos de video (duración, resolución, códec, etc.)
		audioData?: any; // Metadatos de audio (duración, bitrate, artista, álbum, etc.)
		jsonData?: any; // Metadatos de JSON (estructura, contenido, tipo, etc.)
		documentData?: any; // Metadatos de documentos (palabras, líneas, frontmatter, etc.)
		origin?: {
			engine: string;
			confidence?: number;
		};
	};
}
