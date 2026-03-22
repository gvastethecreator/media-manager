/**
 * @file Tipos para el panel de detalles
 * @module components/panels/details-panel/types
 */

import type { AnyEntityWithStats } from '@/types/entities';

export interface DetailsPanelProps {
	className?: string;
	selectedItems: AnyEntityWithStats[];
}

export interface MetadataField {
	category?: string;
	key: string;
	value: string;
}

export interface BasicMetadataField {
	icon: React.ComponentType<any>;
	key: string;
	value: string;
}

export interface RelatedEntity {
	color: string;
	count: number;
	icon: React.ComponentType<any>;
	type: string;
}

export interface DisplayData {
	item?: AnyEntityWithStats;
	items?: AnyEntityWithStats[];
	type: 'empty' | 'single' | 'multiple';
}

export interface EnhancedMetadataOptions {
	detectAIOrigin?: boolean;
	includeExif?: boolean;
	includeIptc?: boolean;
	includeXmp?: boolean;
}

export interface EnhancedMetadataResult {
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
	success: boolean;
}
