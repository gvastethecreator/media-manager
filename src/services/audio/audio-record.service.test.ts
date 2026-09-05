import { describe, expect, it } from 'vitest';
import { getAudioRecordById } from './audio-record.service';

describe('getAudioRecordById', () => {
	it('returns null when the audio id is not in the isolated database', async () => {
		expect(await getAudioRecordById('missing-audio-id')).toBeNull();
	});
});
