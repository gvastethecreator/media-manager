import { describe, expect, it } from 'bun:test';
import {
	detectEntityTypeFromExtension,
	generateEntityThumbnail,
	getAllEntityTypes,
	getEntityTypeColor,
	getEntityTypeConfig,
	getEntityTypeDisplayName,
	getEntityTypeEmoji,
	getEntityTypeSupportedOperations,
	isFormatSupported,
} from '@/config/entity-type-configs';
import { EntityStatsType } from '@/types/file-browser/entity-stats';

const baseEntity = { id: '1', name: 'X', description: null, createdAt: new Date(), updatedAt: new Date() } as const;

describe('entity-type-configs', () => {
	it('retorna config válida para IMAGE', () => {
		const cfg = getEntityTypeConfig(EntityStatsType.IMAGE);
		expect(cfg?.displayName).toBe('Imagen');
		expect(getEntityTypeColor(EntityStatsType.IMAGE)).toMatch(/^#/);
		expect(getEntityTypeDisplayName(EntityStatsType.IMAGE)).toBe('Imagen');
		expect(getEntityTypeDisplayName(EntityStatsType.IMAGE, true)).toBe('Imágenes');
		expect(getEntityTypeEmoji(EntityStatsType.IMAGE)).toBeTruthy();
		expect(getEntityTypeSupportedOperations(EntityStatsType.IMAGE).length).toBeGreaterThan(0);
	});

	it('thumbnail generator de IMAGE devuelve URL', async () => {
		const url = await generateEntityThumbnail({ ...baseEntity, entityType: 'image', thumbnailUrl: '/t.jpg' } as any);
		expect(url).toBe('/t.jpg');
	});

	it('detecta tipos por extensión', () => {
		expect(detectEntityTypeFromExtension('foto.JPG')).toBe(EntityStatsType.IMAGE);
		expect(detectEntityTypeFromExtension('video.mp4')).toBe(EntityStatsType.VIDEO);
		expect(detectEntityTypeFromExtension('audio.MP3')).toBe(EntityStatsType.AUDIO);
		expect(detectEntityTypeFromExtension('doc.pdf')).toBe(EntityStatsType.DOCUMENT);
		expect(detectEntityTypeFromExtension('unknown.bin')).toBeNull();
	});

	it('isFormatSupported respeta lista', () => {
		expect(isFormatSupported(EntityStatsType.IMAGE, 'file.png')).toBe(true);
		expect(isFormatSupported(EntityStatsType.IMAGE, 'file.xxx')).toBe(false);
	});

	it('getAllEntityTypes retorna lista ordenada', () => {
		const all = getAllEntityTypes();
		expect(Array.isArray(all)).toBe(true);
		expect(all.length).toBeGreaterThan(5);
	});
});
