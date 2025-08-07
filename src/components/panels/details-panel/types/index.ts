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
		origin?: {
			engine: string;
			confidence?: number;
		};
	};
}
