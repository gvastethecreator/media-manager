/**
 * Script para generar thumbnails de audio que no los tienen
 * Uso: bun run scripts/generate-audio-thumbnails.ts
 */

import { eq } from 'drizzle-orm';
import { db } from '../src/lib/drizzle';
import { audios } from '../src/lib/drizzle/schema';

const BATCH_SIZE = 10;

interface AudioInfo {
	album?: string;
	artist?: string;
	bitrate?: number;
	duration?: number;
	format?: string;
	id: string;
	metadata?: string;
	name: string;
	path: string;
	sampleRate?: number;
}

/**
 * Genera datos de waveform basados en metadata
 */
function generateWaveformData(bars: number, duration: number, bitrate: number, sampleRate: number): number[] {
	const data: number[] = [];
	const seed = (duration + bitrate + sampleRate) % 1000;

	for (let i = 0; i < bars; i++) {
		const position = i / bars;
		const baseWave = Math.sin(position * Math.PI * 4 + seed) * 0.5;
		const envelope = Math.sin(position * Math.PI);
		const variation = Math.sin(position * Math.PI * 8 + seed * 0.1) * 0.3;
		const dynamics = 0.5 + 0.5 * Math.sin(position * Math.PI * 3);
		const amplitude = (baseWave + variation) * envelope * dynamics;
		data.push(Math.max(0.1, Math.min(1, Math.abs(amplitude))));
	}

	return data;
}

/**
 * Genera SVG de waveform
 */
function generateWaveformSVG(data: number[], width: number, height: number): string {
	const centerY = height / 2;
	const barWidth = width / data.length;
	const color = '#3b82f6';

	let elements = `<rect width="100%" height="100%" fill="transparent"/>`;

	for (let i = 0; i < data.length; i++) {
		const x = i * barWidth;
		const amplitude = data[i];
		const barHeight = amplitude * centerY * 0.9;
		elements += `<rect x="${x}" y="${centerY - barHeight}" width="${barWidth * 0.8}" height="${barHeight * 2}" fill="${color}" opacity="0.85" rx="1"/>`;
	}

	return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
  ${elements}
</svg>`;
}

async function generateMissingAudioThumbnails() {
	console.log('🔍 Buscando audios sin waveform...');

	const audiosWithoutThumbnail = await db
		.select({
			id: audios.id,
			name: audios.name,
			path: audios.path,
			duration: audios.duration,
			bitrate: audios.bitrate,
			sampleRate: audios.sampleRate,
			format: audios.format,
			artist: audios.artist,
			album: audios.album,
			metadata: audios.metadata,
		})
		.from(audios);

	// Filtrar los que no tienen waveform en metadata
	const audiosNeedingThumbnail: AudioInfo[] = [];
	for (const audio of audiosWithoutThumbnail) {
		let meta: any = null;
		if (audio.metadata) {
			try {
				meta = JSON.parse(audio.metadata);
			} catch {
				// ignore
			}
		}
		if (!meta?.waveform) {
			audiosNeedingThumbnail.push(audio as AudioInfo);
		}
	}

	console.log(`🎵 Encontrados ${audiosNeedingThumbnail.length} audios sin waveform`);

	if (audiosNeedingThumbnail.length === 0) {
		console.log('✅ Todos los audios ya tienen waveforms');
		return;
	}

	let processed = 0;
	let errors = 0;

	for (let i = 0; i < audiosNeedingThumbnail.length; i += BATCH_SIZE) {
		const batch = audiosNeedingThumbnail.slice(i, i + BATCH_SIZE);
		console.log(
			`\n📦 Procesando batch ${Math.floor(i / BATCH_SIZE) + 1} de ${Math.ceil(audiosNeedingThumbnail.length / BATCH_SIZE)}`
		);

		await Promise.all(
			batch.map(async (audio: AudioInfo) => {
				try {
					console.log(`  🎵 Generando waveform para: ${audio.name}`);

					const duration = audio.duration || 180;
					const bitrate = audio.bitrate || 128_000;
					const sampleRate = audio.sampleRate || 44_100;

					const waveformData = generateWaveformData(50, duration, bitrate, sampleRate);
					const waveformSvg = generateWaveformSVG(waveformData, 300, 100);

					// Actualizar metadata con el waveform
					let meta: any = {};
					try {
						if (audio.metadata) {
							meta = JSON.parse(audio.metadata);
						}
					} catch {
						// ignore
					}

					meta.waveform = waveformSvg;
					meta.hasWaveform = true;
					meta.waveformGeneratedAt = new Date().toISOString();

					await db
						.update(audios)
						.set({
							metadata: JSON.stringify(meta),
							updatedAt: new Date(),
						})
						.where(eq(audios.id, audio.id));

					console.log(`  ✅ Waveform generado: ${audio.name}`);
					processed++;
				} catch (error) {
					console.error(`  ❌ Error generando waveform para ${audio.name}:`, error);
					errors++;
				}
			})
		);

		if (i + BATCH_SIZE < audiosNeedingThumbnail.length) {
			console.log('⏳ Pausa de 500ms...');
			await new Promise((resolve) => setTimeout(resolve, 500));
		}
	}

	console.log('\n📊 Resumen:');
	console.log(`  ✅ Procesados exitosamente: ${processed}`);
	console.log(`  ❌ Errores: ${errors}`);
	console.log(`  📊 Total: ${audiosNeedingThumbnail.length}`);
}

console.log('🚀 Iniciando generación de waveforms para audios...\n');
generateMissingAudioThumbnails()
	.then(() => {
		console.log('\n✨ Script completado');
		process.exit(0);
	})
	.catch((error) => {
		console.error('\n💥 Error fatal:', error);
		process.exit(1);
	});
