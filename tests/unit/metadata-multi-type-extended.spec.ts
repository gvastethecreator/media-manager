import { getEntityTypeFromExtension } from '@/services/file-entity-mapper/utils/file-info.utils';
import { EntityType } from '@/types/file-entity-mapper';

describe('metadata multi tipo extendido', () => {
	it('detecta correctamente tipos para múltiples extensiones incluyendo unknown', () => {
		const extensions = ['.png', '.mp4', '.mp3', '.bin'];
		const types = extensions.map((ext) => getEntityTypeFromExtension(ext));
		expect(types).toEqual([EntityType.IMAGE, EntityType.VIDEO, EntityType.AUDIO, EntityType.UNKNOWN]);
	});

	it('detecta imagen para variantes comunes', () => {
		const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
		for (const ext of imageExtensions) {
			expect(getEntityTypeFromExtension(ext)).toBe(EntityType.IMAGE);
		}
	});

	it('detecta video para variantes comunes', () => {
		const videoExtensions = ['.mp4', '.webm', '.mkv', '.avi'];
		for (const ext of videoExtensions) {
			expect(getEntityTypeFromExtension(ext)).toBe(EntityType.VIDEO);
		}
	});

	it('detecta audio para variantes comunes', () => {
		const audioExtensions = ['.mp3', '.wav', '.flac', '.ogg'];
		for (const ext of audioExtensions) {
			expect(getEntityTypeFromExtension(ext)).toBe(EntityType.AUDIO);
		}
	});

	it('detecta document para variantes comunes', () => {
		const docExtensions = ['.pdf', '.doc', '.docx', '.txt'];
		for (const ext of docExtensions) {
			expect(getEntityTypeFromExtension(ext)).toBe(EntityType.DOCUMENT);
		}
	});
});
