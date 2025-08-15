import { type IAudioMetadata, parseBuffer } from 'music-metadata';
import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';

export interface AudioMetadataExtract {
	duration: number | null;
	bitrate: number | null;
	sampleRate: number | null;
	channels: number | null;
	format: string | null;
	codec: string | null;
	tags: Record<string, any> | null;
	raw?: any;
}

export class AudioMetadataService {
	private static instance: AudioMetadataService;

	static getInstance(): AudioMetadataService {
		if (!AudioMetadataService.instance) {
			AudioMetadataService.instance = new AudioMetadataService();
		}
		return AudioMetadataService.instance;
	}

	async extract(filePath: string): Promise<AudioMetadataExtract> {
		try {
			const buffer = await readFile(filePath);
			const metadata: IAudioMetadata = await parseBuffer(buffer, { path: filePath }, { duration: true });
			const f = metadata.format;
			const common = metadata.common || {};
			return {
				duration: f.duration ?? null,
				bitrate: f.bitrate ? Math.round(f.bitrate) : null,
				sampleRate: f.sampleRate ?? null,
				channels: f.numberOfChannels ?? null,
				format: f.container ?? null,
				codec: f.codec ?? null,
				tags: {
					title: common.title,
					artist: common.artist,
					album: common.album,
					year: common.year,
					genre: common.genre?.[0],
					track: common.track?.no,
					disc: common.disk?.no,
					albumArtist: common.albumartist,
					composer: common.composer,
					comment: common.comment?.[0],
					lyrics: common.lyrics?.join('\n'),
					bpm: common.bpm,
					key: common.key,
					mood: common.mood,
				},
				raw: {
					format: metadata.format,
					common: metadata.common,
					native: metadata.native,
				},
			};
		} catch (error) {
			console.warn('AudioMetadataService: fallo extrayendo metadata para', basename(filePath), error);
			return { duration: null, bitrate: null, sampleRate: null, channels: null, format: null, codec: null, tags: null };
		}
	}
}

export const audioMetadataService = AudioMetadataService.getInstance();
