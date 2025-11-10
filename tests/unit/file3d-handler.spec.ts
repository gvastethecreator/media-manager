import { describe, expect, it } from 'vitest';
import { FileEntityMapperService } from '@/services/file-entity-mapper/file-entity-mapper.service';
import { EntityType } from '@/types/file-entity-mapper';

function buildSpyMapper3D(ext: string) {
	const mapper: any = new (FileEntityMapperService as any)();
	mapper.handleFile3DMetadata = (p: string, id: string) => {
		mapper.calls.push({ p, id });
		return { success: true };
	};
	mapper.getEntityTypeFromExtension = () => EntityType.FILE3D;
	mapper.getFileInfo = async (p: string, folderId: string) => ({
		name: p,
		path: p,
		size: 1,
		extension: ext,
		hash: p,
		lastModified: new Date(),
		folderId,
	});
	mapper.checkExistingEntity = async () => false;
	mapper.createBasicEntity = async () => '3d-id';
	mapper.extractMetadataForEntity = FileEntityMapperService.prototype.extractMetadataForEntity;
	mapper.calls = [] as Array<{ p: string; id: string }>;
	return mapper as FileEntityMapperService & { calls: Array<{ p: string; id: string }> };
}

describe('3D metadata handler', () => {
	it('invoca handleFile3DMetadata para gltf', async () => {
		const m = buildSpyMapper3D('.gltf');
		await (m as any).createEntityFromFile('model.gltf', 'folder');
		expect(m.calls.length).toBe(1);
	});
});
