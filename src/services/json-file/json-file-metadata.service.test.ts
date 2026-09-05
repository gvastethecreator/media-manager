import { describe, expect, it } from 'vitest';
import { getJsonFileMetadataById } from './json-file-metadata.service';

describe('getJsonFileMetadataById', () => {
	it('returns null when the JSON file id is not in the isolated database', async () => {
		expect(await getJsonFileMetadataById('missing-json-id')).toBeNull();
	});
});
