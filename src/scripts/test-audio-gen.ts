import { join } from 'node:path';
import { generateAudioWaveformImageFFmpeg, isFFmpegAvailable } from '@/lib/utils/video/ffmpeg-thumbnails';

async function main() {
	console.log('🔍 Verifying FFmpeg availability for Audio...');
	const available = await isFFmpegAvailable();
	if (!available) {
		console.error('❌ FFmpeg not found');
		process.exit(1);
	}

	const audioFiles = ['test-audio.wav', 'test-mp3.mp3'];

	for (const file of audioFiles) {
		const audioPath = join(process.cwd(), 'test-files', file);
		console.log(`🎵 Generating waveform for: ${audioPath}`);

		try {
			const buffer = await generateAudioWaveformImageFFmpeg(audioPath, {
				width: 600,
				height: 200,
				color: '#10b981',
				backgroundColor: 'transparent',
			});

			if (buffer) {
				console.log(`✅ Success for ${file}! Buffer size: ${buffer.length} bytes`);
			} else {
				console.error(`❌ Failed to generate waveform for ${file}`);
			}
		} catch (error) {
			console.error(`❌ Error processing ${file}:`, error);
		}
	}
}

main().catch(console.error);
