import { describe, expect, it } from 'vitest';
import { getActiveAssetType } from './semantic-relation.service';

describe('getActiveAssetType', () => {
	it('returns null when the asset is missing or deleted', async () => {
		expect(await getActiveAssetType('missing-asset-id')).toBeNull();
	});
});
