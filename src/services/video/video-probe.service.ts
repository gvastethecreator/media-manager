import { execFile } from 'node:child_process';
import { basename } from 'node:path';
import { promisify } from 'node:util';
import ffprobeStatic from 'ffprobe-static';

const execFileAsync = promisify(execFile);

export interface VideoProbeData {
	duration: number | null;
	width: number | null;
	height: number | null;
	codec: string | null;
	format: string | null;
	bitRate: number | null;
	raw?: any;
}

export class VideoProbeService {
	private static instance: VideoProbeService;

	static getInstance(): VideoProbeService {
		if (!VideoProbeService.instance) {
			VideoProbeService.instance = new VideoProbeService();
		}
		return VideoProbeService.instance;
	}

	async probe(filePath: string): Promise<VideoProbeData> {
		try {
			const args = ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', filePath];
			const { stdout } = await execFileAsync(ffprobeStatic.path, args, { maxBuffer: 10 * 1024 * 1024 });
			const parsed = JSON.parse(stdout);
			const videoStream = parsed.streams?.find((s: any) => s.codec_type === 'video');
			const duration = parsed.format?.duration
				? Number(parsed.format.duration)
				: videoStream?.duration
					? Number(videoStream.duration)
					: null;
			return {
				duration: Number.isFinite(duration) ? duration : null,
				width: videoStream?.width ?? null,
				height: videoStream?.height ?? null,
				codec: videoStream?.codec_name ?? null,
				format: parsed.format?.format_name ?? null,
				bitRate: parsed.format?.bit_rate ? Number(parsed.format.bit_rate) : null,
				raw: {
					format: parsed.format,
					streams: parsed.streams?.map((s: any) => ({
						index: s.index,
						codec_type: s.codec_type,
						codec_name: s.codec_name,
						width: s.width,
						height: s.height,
						duration: s.duration,
						bit_rate: s.bit_rate,
						avg_frame_rate: s.avg_frame_rate,
						r_frame_rate: s.r_frame_rate,
					})),
				},
			};
		} catch (error) {
			console.warn('VideoProbeService: fallo al ejecutar ffprobe para', basename(filePath), error);
			return { duration: null, width: null, height: null, codec: null, format: null, bitRate: null };
		}
	}
}

export const videoProbeService = VideoProbeService.getInstance();
