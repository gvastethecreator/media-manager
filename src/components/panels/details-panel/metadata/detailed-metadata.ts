import type { AnyEntityWithStats } from '@/types/entities';
import type { MetadataField } from '../types';

const buildFallbackMetadata = (item: AnyEntityWithStats): MetadataField[] => {
	const fallback: MetadataField[] = [];

	if ('hash' in item && typeof item.hash === 'string') {
		fallback.push({
			key: 'Hash',
			value: `${item.hash.substring(0, 16)}...`,
			category: 'técnico',
		});
	}

	fallback.push({
		key: 'Estado',
		value: 'Metadatos no disponibles',
		category: 'técnico',
	});

	return fallback;
};

export const getDetailedMetadata = (item: AnyEntityWithStats, enhancedMetadata: MetadataField[]): MetadataField[] => {
	if (enhancedMetadata.length > 0) {
		return enhancedMetadata;
	}

	return buildFallbackMetadata(item);
};
