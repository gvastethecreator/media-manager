import { existsSync, writeFileSync } from 'fs';
import { generateFFmpegThumbnail } from './src/server/services/media/ffmpeg-thumbnail.service.ts';
import { generateVideoThumbnail } from './src/server/services/media/mediabunny-thumbnail.service.ts';

const testVideoPath = './test-files/test-video.mp4';

console.log('🧪 Testing video thumbnail generation');
console.log('📁 Test video path:', testVideoPath);
console.log('📂 File exists:', existsSync(testVideoPath));

if (!existsSync(testVideoPath)) {
	console.error('❌ Test video file not found');
	process.exit(1);
}

async function testThumbnails() {
	console.log('\n🔬 Testing mediabunny...');

	try {
		const mediabunnyResult = await generateVideoThumbnail(testVideoPath, 1, 320, 240);
		if (mediabunnyResult) {
			console.log('✅ Mediabunny succeeded:', `${Math.round(mediabunnyResult.length / 1024)} KB`);
			writeFileSync('./test-mediabunny-thumb.jpg', mediabunnyResult);
			console.log('💾 Saved as test-mediabunny-thumb.jpg');
		} else {
			console.log('❌ Mediabunny failed (returned null)');
		}
	} catch (error) {
		console.error('💥 Mediabunny error:', error.message);
	}

	console.log('\n🔧 Testing FFmpeg fallback...');

	try {
		const ffmpegResult = await generateFFmpegThumbnail(testVideoPath, {
			timestampSeconds: 1,
			width: 320,
			height: 240,
			quality: 15,
		});

		if (ffmpegResult) {
			console.log('✅ FFmpeg succeeded:', `${Math.round(ffmpegResult.length / 1024)} KB`);
			writeFileSync('./test-ffmpeg-thumb.jpg', ffmpegResult);
			console.log('💾 Saved as test-ffmpeg-thumb.jpg');
		} else {
			console.log('❌ FFmpeg failed (returned null)');
		}
	} catch (error) {
		console.error('💥 FFmpeg error:', error.message);
	}
}

testThumbnails().catch(console.error);
