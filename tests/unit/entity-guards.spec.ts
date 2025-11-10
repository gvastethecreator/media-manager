import { describe, expect, it } from 'vitest';
import {
	getEntityStatsType,
	isAlbumWithStats,
	isAudioWithStats,
	isCharacterWithStats,
	isCollectionWithStats,
	isConceptWithStats,
	isDocumentWithStats,
	isFolderWithStats,
	isGroupWithStats,
	isImageWithStats,
	isNoteWithStats,
	isPlaceWithStats,
	isPromptWithStats,
	isPropertyWithStats,
	isTagWithStats,
	isUploadedImageWithStats,
	isVideoWithStats,
	isWildcardWithStats,
	isWorldItemWithStats,
} from '@/types/entity-guards';
import { EntityStatsType } from '@/types/file-browser/entity-stats';

describe('entity-guards', () => {
	const base = { id: '1', name: 'X', description: null, createdAt: new Date(), updatedAt: new Date() };

	it('detecta imágenes y videos', () => {
		const img = { ...base, entityType: 'image' as const };
		const vid = { ...base, entityType: 'video' as const };
		expect(isImageWithStats(img)).toBe(true);
		expect(isVideoWithStats(vid)).toBe(true);
	});

	it('detecta otras entidades', () => {
		expect(isFolderWithStats({ ...base, entityType: 'folder' })).toBe(true);
		expect(isTagWithStats({ ...base, entityType: 'tag' })).toBe(true);
		expect(isPlaceWithStats({ ...base, entityType: 'place' })).toBe(true);
		expect(isWorldItemWithStats({ ...base, entityType: 'world-item' })).toBe(true);
		expect(isNoteWithStats({ ...base, entityType: 'note' })).toBe(true);
		expect(isPropertyWithStats({ ...base, entityType: 'property' })).toBe(true);
		expect(isWildcardWithStats({ ...base, entityType: 'wildcard' })).toBe(true);
		expect(isAudioWithStats({ ...base, entityType: 'audio' })).toBe(true);
		expect(isDocumentWithStats({ ...base, entityType: 'document' })).toBe(true);
		expect(isCollectionWithStats({ ...base, entityType: 'collection' })).toBe(true);
		expect(isAlbumWithStats({ ...base, entityType: 'album' })).toBe(true);
		expect(isCharacterWithStats({ ...base, entityType: 'character' })).toBe(true);
		expect(isConceptWithStats({ ...base, entityType: 'concept' })).toBe(true);
		expect(isPromptWithStats({ ...base, entityType: 'prompt' })).toBe(true);
		expect(isGroupWithStats({ ...base, entityType: 'group' })).toBe(true);
		expect(isUploadedImageWithStats({ ...base, entityType: 'uploaded-image' })).toBe(true);
	});

	it('mapea getEntityStatsType correctamente', () => {
		expect(getEntityStatsType({ ...base, entityType: 'image' } as any)).toBe(EntityStatsType.IMAGE);
		expect(getEntityStatsType({ ...base, entityType: 'video' } as any)).toBe(EntityStatsType.VIDEO);
		expect(getEntityStatsType({ ...base, entityType: 'folder' } as any)).toBe(EntityStatsType.FOLDER);
		expect(getEntityStatsType({ ...base, entityType: 'tag' } as any)).toBe(EntityStatsType.TAG);
		expect(getEntityStatsType({ ...base, entityType: 'place' } as any)).toBe(EntityStatsType.PLACE);
		expect(getEntityStatsType({ ...base, entityType: 'world-item' } as any)).toBe(EntityStatsType.WORLD_ITEM);
		expect(getEntityStatsType({ ...base, entityType: 'note' } as any)).toBe(EntityStatsType.NOTE);
		expect(getEntityStatsType({ ...base, entityType: 'property' } as any)).toBe(EntityStatsType.PROPERTY);
		expect(getEntityStatsType({ ...base, entityType: 'wildcard' } as any)).toBe(EntityStatsType.WILDCARD);
		expect(getEntityStatsType({ ...base, entityType: 'audio' } as any)).toBe(EntityStatsType.AUDIO);
		expect(getEntityStatsType({ ...base, entityType: 'document' } as any)).toBe(EntityStatsType.DOCUMENT);
		expect(getEntityStatsType({ ...base, entityType: 'collection' } as any)).toBe(EntityStatsType.COLLECTION);
		expect(getEntityStatsType({ ...base, entityType: 'album' } as any)).toBe(EntityStatsType.ALBUM);
		expect(getEntityStatsType({ ...base, entityType: 'character' } as any)).toBe(EntityStatsType.CHARACTER);
		expect(getEntityStatsType({ ...base, entityType: 'concept' } as any)).toBe(EntityStatsType.CONCEPT);
		expect(getEntityStatsType({ ...base, entityType: 'prompt' } as any)).toBe(EntityStatsType.PROMPT);
		expect(getEntityStatsType({ ...base, entityType: 'group' } as any)).toBe(EntityStatsType.GROUP);
		expect(getEntityStatsType({ ...base, entityType: 'uploaded-image' } as any)).toBe(EntityStatsType.UPLOADED_IMAGE);
		expect(getEntityStatsType({ ...base } as any)).toBeNull();
	});
});
