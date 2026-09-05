import { describe, expect, it } from 'vitest';
import { getFile3dMetadataById } from './file3d-metadata.service';

describe('getFile3dMetadataById', () => {
	it('returns null when the 3D model id is not in the isolated database', async () => {
		expect(await getFile3dMetadataById('missing-file3d-id')).toBeNull();
	});
});
