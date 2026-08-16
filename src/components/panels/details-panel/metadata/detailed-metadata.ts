import type { AnyEntityWithStats } from '@/types/entities';
import type { MetadataField } from '../types';

const buildFallbackMetadata = (item: AnyEntityWithStats): MetadataField[] => {
	const fallback: MetadataField[] = [];

	if ('hash' in item && typeof item.hash === 'string') {
		fallback.push({
			key: 'Hash',
			value: `${item.hash.substring(0, 16)}...`,
			category: 'technical',
		});
	}

	fallback.push({
		key: 'Status',
		value: 'Metadata unavailable',
		category: 'technical',
	});

	return fallback;
};

export const getDetailedMetadata = (item: AnyEntityWithStats, enhancedMetadata: MetadataField[]): MetadataField[] => {
	if (enhancedMetadata.length > 0) {
		return enhancedMetadata;
	}

	return buildFallbackMetadata(item);
};
