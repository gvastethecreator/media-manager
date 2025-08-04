import type { CardMetadataConfig } from '@/transformers/settings/schema';

const metadataKeyMap: Record<string, keyof Omit<CardMetadataConfig, 'maxTags'>> = {
	size: 'showSize',
	date: 'showDate',
	type: 'showType',
	dimensions: 'showDimensions',
	duration: 'showDuration',
	tags: 'showTags',
	collection: 'showCollection',
};

export const isMetadataKey = (key: string): key is keyof Omit<CardMetadataConfig, 'maxTags'> => key in metadataKeyMap;

export const getMetadataKey = (key: string): keyof Omit<CardMetadataConfig, 'maxTags'> => {
	if (isMetadataKey(key)) {
		return metadataKeyMap[key];
	}
	throw new Error(`Invalid metadata key: ${key}`);
};
