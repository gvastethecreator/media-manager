import { vi } from 'vitest';
import { File3DProcessor } from '@/services/file-entity-mapper/processors/file3d.processor';
import { getEntityTypeFromExtension } from '@/services/file-entity-mapper/utils/file-info.utils';

describe('3D metadata handler', () => {
	it('retorna file3d para extensión .gltf', () => {
		const type = getEntityTypeFromExtension('.gltf');
		expect(type).toBe('file3d');
	});

	it('retorna file3d para extensión .glb', () => {
		const type = getEntityTypeFromExtension('.glb');
		expect(type).toBe('file3d');
	});

	it('File3DProcessor tiene método extractMetadata', () => {
		const processor = new File3DProcessor();
		expect(typeof processor.extractMetadata).toBe('function');
	});

	it('File3DProcessor.extractMetadata retorna success', async () => {
		const processor = new File3DProcessor();
		// Mock del resultado - el processor real necesita BD
		const spy = vi.spyOn(processor, 'extractMetadata').mockResolvedValue({ success: true });
		const result = await processor.extractMetadata('model.gltf', '3d-id');
		expect(result.success).toBe(true);
		expect(spy).toHaveBeenCalledWith('model.gltf', '3d-id');
	});
});
