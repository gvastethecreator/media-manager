
import { join } from 'node:path';
import { generateStaticVideoThumbnailFFmpeg, isFFmpegAvailable } from '@/lib/utils/video/ffmpeg-thumbnails';
import { serverLogger } from '@/lib/logger/server-logger';

async function main() {
    console.log('🔍 Verifying FFmpeg availability...');
    const available = await isFFmpegAvailable();
    console.log(`FFmpeg available: ${available}`);

    if (!available) {
        console.error('❌ FFmpeg not found or not working');
        process.exit(1);
    }

    const videoPath = join(process.cwd(), 'test-files', 'test-video.mp4');
    console.log(`🎬 Generating thumbnail for: ${videoPath}`);

    try {
        const buffer = await generateStaticVideoThumbnailFFmpeg(videoPath, {
            time: 1,
            width: 320,
            height: 240,
            quality: 'medium'
        });

        if (buffer) {
            console.log(`✅ Success! Generated buffer size: ${buffer.length} bytes`);
        } else {
            console.error('❌ Failed to generate thumbnail (null buffer returned)');
        }
    } catch (error) {
        console.error('❌ Error during generation:', error);
    }
}

main().catch(console.error);
