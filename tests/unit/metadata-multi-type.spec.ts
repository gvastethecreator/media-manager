import { getEntityTypeFromExtension } from '@/services/file-entity-mapper/utils/file-info.utils';
import { EntityType } from '@/types/file-entity-mapper';

describe('metadata multi tipo', () => {
	it('detecta tipo IMAGE para .png', () => {
		expect(getEntityTypeFromExtension('.png')).toBe(EntityType.IMAGE);
	});

	it('detecta tipo VIDEO para .mp4', () => {
		expect(getEntityTypeFromExtension('.mp4')).toBe(EntityType.VIDEO);
	});

	it('detecta tipo AUDIO para .mp3', () => {
		expect(getEntityTypeFromExtension('.mp3')).toBe(EntityType.AUDIO);
	});

	it('detecta tipo DOCUMENT para .pdf', () => {
		expect(getEntityTypeFromExtension('.pdf')).toBe(EntityType.DOCUMENT);
	});

	it('detecta tipo FILE3D para .gltf', () => {
		expect(getEntityTypeFromExtension('.gltf')).toBe(EntityType.FILE3D);
	});

	it('detecta tipo UNKNOWN para extensión no soportada', () => {
		expect(getEntityTypeFromExtension('.xyz')).toBe(EntityType.UNKNOWN);
	});

	it('mapea correctamente múltiples extensiones', () => {
		const extensions = ['.png', '.mp4', '.mp3'];
		const types = extensions.map((ext) => getEntityTypeFromExtension(ext));
		expect(types).toEqual([EntityType.IMAGE, EntityType.VIDEO, EntityType.AUDIO]);
	});
});
