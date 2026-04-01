/**
 * @file Rutas para generación de waveforms de archivos de audio
 * @module server/routes/audio-waveforms
 */

import { eq } from 'drizzle-orm';
import express from 'express';
import { db } from '@/lib/drizzle/index.js';
import { audios } from '@/lib/drizzle/schema/index.js';
import { serverLogger } from '@/lib/logger/server-logger';

const router = express.Router();
const logger = serverLogger.withContext('AudioWaveformRoute');

/**
 * 🎵 Interfaz para opciones de generación de waveform
 */
interface AudioWaveformOptions {
	backgroundColor?: string;
	bars?: number;
	color?: string;
	height?: number;
	showAxis?: boolean;
	style?: 'bars' | 'curve' | 'filled';
	width?: number;
}

/**
 * 🗂️ Caché en memoria para waveforms generados (con límite de tamaño)
 * Key: `${audioId}:${width}:${height}:${bars}:${color}`
 */
const waveformCache = new Map<string, { svg: string; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas
const MAX_WAVEFORM_CACHE_SIZE = 200; // Límite para evitar memory leaks

/**
 * 📊 Interfaz para información de audio
 */
interface AudioInfo {
	bitRate?: number;
	channels: number;
	duration: number;
	format: string;
	sampleRate: number;
}

/**
 * 🎵 Genera SVG de waveform
 */
function generateWaveformSVG(waveformData: number[], options: AudioWaveformOptions): string {
	const {
		width = 300,
		height = 100,
		color = 'var(--dt-primary-500)',
		backgroundColor = 'var(--background)',
		style = 'bars',
		showAxis = false,
	} = options;

	const centerY = height / 2;
	const barWidth = width / waveformData.length;

	// Usar el color proporcionado o un color SVG válido
	const svgColor = color?.startsWith('var(') ? '#3b82f6' : color;

	let pathData = '';
	let elements = '';

	// Background
	elements += `<rect width="100%" height="100%" fill="${backgroundColor}"/>`;

	// Axis line (opcional)
	if (showAxis) {
		elements += `<line x1="0" y1="${centerY}" x2="${width}" y2="${centerY}" stroke="#e5e7eb" stroke-width="1"/>`;
	}

	switch (style) {
		case 'bars': {
			// Estilo barras verticales
			for (let i = 0; i < waveformData.length; i++) {
				const x = i * barWidth;
				const amplitude = Math.abs(waveformData[i]);
				const barHeight = amplitude * centerY;

				elements += `<rect x="${x}" y="${centerY - barHeight}" width="${barWidth * 0.8}" height="${barHeight * 2}" fill="${svgColor}" opacity="0.8"/>`;
			}
			break;
		}

		case 'filled': {
			// Estilo área rellena
			pathData = `M 0 ${centerY}`;

			for (let i = 0; i < waveformData.length; i++) {
				const x = i * barWidth;
				const y = centerY - waveformData[i] * centerY * 0.8;
				pathData += ` L ${x} ${y}`;
			}

			pathData += ` L ${width} ${centerY} Z`;
			elements += `<path d="${pathData}" fill="${svgColor}" opacity="0.6"/>`;

			// Línea superior
			let topPath = `M 0 ${centerY}`;
			for (let i = 0; i < waveformData.length; i++) {
				const x = i * barWidth;
				const y = centerY - waveformData[i] * centerY * 0.8;
				topPath += ` L ${x} ${y}`;
			}
			elements += `<path d="${topPath}" stroke="${svgColor}" stroke-width="2" fill="none"/>`;
			break;
		}

		default: {
			// Estilo curva suave
			pathData = `M 0 ${centerY - waveformData[0] * centerY * 0.8}`;

			for (let i = 1; i < waveformData.length; i++) {
				const x = i * barWidth;
				const y = centerY - waveformData[i] * centerY * 0.8;
				pathData += ` L ${x} ${y}`;
			}

			elements += `<path d="${pathData}" stroke="${svgColor}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
			break;
		}
	}

	return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  ${elements}
</svg>`;
}

/**
 * 📊 Genera SVG con información de audio
 */
function generateAudioInfoSVG(audioInfo: AudioInfo | null, options: AudioWaveformOptions): string {
	const { width = 300, height = 100, backgroundColor = 'var(--background)' } = options;

	const textColor = backgroundColor === 'var(--background)' ? '#1f2937' : '#f9fafb';
	const accentColor = 'var(--dt-success-500)';

	if (!audioInfo) {
		return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${backgroundColor}"/>
  <g transform="translate(${width / 2},${height / 2})">
    <text text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="${textColor}">
      🎵 Audio File
    </text>
  </g>
</svg>`;
	}

	const minutes = Math.floor(audioInfo.duration / 60);
	const seconds = Math.floor(audioInfo.duration % 60);
	const durationText = `${minutes}:${seconds.toString().padStart(2, '0')}`;

	return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${backgroundColor}"/>
  
  <!-- Waveform placeholder -->
  <g transform="translate(20, ${height / 2})">
    <path d="M 0 0 Q 30 -15 60 0 Q 90 15 120 0 Q 150 -10 180 0 Q 210 8 240 0" 
          stroke="${accentColor}" stroke-width="2" fill="none"/>
  </g>
  
  <!-- Información -->
  <g transform="translate(10, ${height - 25})">
    <text font-family="monospace" font-size="9" fill="${textColor}">
      ${durationText} • ${audioInfo.channels}ch • ${Math.round(audioInfo.sampleRate / 1000)}kHz
    </text>
  </g>
</svg>`;
}

/**
 * 🏗️ Analiza archivo de audio usando metadata disponible
 */
async function analyzeAudioFile(audioPath: string): Promise<AudioInfo | null> {
	try {
		const extension = audioPath.substring(audioPath.lastIndexOf('.')).toLowerCase();
		const supportedFormats = ['.mp3', '.wav', '.m4a', '.ogg', '.flac', '.aac'];

		if (!supportedFormats.includes(extension)) {
			serverLogger.warn(`Formato de audio no soportado: ${extension}`);
			return null;
		}

		serverLogger.info(
			'Análisis de audio solicitado sin metadata precalculada; devolviendo null para evitar datos inventados',
			{
				audioPath,
				extension,
			}
		);
		return null;
	} catch (error) {
		serverLogger.error('Error analizando archivo de audio:', error);
		return null;
	}
}

/**
 * 🎵 Procesa archivo de audio y extrae waveform (placeholder)
 */
async function extractWaveformFromAudio(audioPath: string, samples: number): Promise<number[] | null> {
	try {
		serverLogger.info('Waveform solicitado sin extractor real disponible; devolviendo null para usar fallback visual', {
			audioPath,
			samples,
		});
		return null;
	} catch (error) {
		serverLogger.error('Error extrayendo waveform:', error);
		return null;
	}
}

/**
 * GET /audio/:id/waveform - Generar waveform de archivo de audio
 */
router.get('/:id/waveform', async (req, res) => {
	try {
		const { id } = req.params;
		const options: AudioWaveformOptions = {
			width: Math.min(Number.parseInt(req.query.width as string, 10) || 300, 2000),
			height: Math.min(Number.parseInt(req.query.height as string, 10) || 100, 1000),
			color: (req.query.color as string) || '#3b82f6',
			backgroundColor: (req.query.backgroundColor as string) || 'transparent',
			bars: Math.min(Number.parseInt(req.query.bars as string, 10) || 50, 500),
			style: (req.query.style as 'bars' | 'curve' | 'filled') || 'bars',
			showAxis: req.query.showAxis === 'true',
		};

		// Obtener audio de la base de datos
		const audioRecords = await db.select({ metadata: audios.metadata }).from(audios).where(eq(audios.id, id));

		if (audioRecords.length === 0) {
			res.status(404).json({ error: 'Audio not found' });
			return;
		}

		const audio = audioRecords[0];
		let metadata: any = null;

		// Parsear metadata si existe
		if (audio.metadata) {
			try {
				metadata = JSON.parse(audio.metadata);
			} catch (e) {
				serverLogger.warn(`Error parsing metadata for audio ${id}:`, e);
			}
		}

		// Si ya tiene waveform generado en metadata
		if (metadata?.waveform) {
			const waveformSvg = metadata.waveform;
			res.setHeader('Content-Type', 'image/svg+xml');
			res.setHeader('Cache-Control', 'public, max-age=3600');
			res.send(waveformSvg);
			return;
		}

		// Fallback: generar placeholder con info básica
		const errorSVG = generateAudioInfoSVG(null, options);

		res.setHeader('Content-Type', 'image/svg+xml');
		res.setHeader('Cache-Control', 'public, max-age=60');
		res.send(errorSVG);
	} catch (error) {
		serverLogger.error('Error generando waveform:', error);

		// Error fallback
		const errorSVG = generateAudioInfoSVG(null, {
			width: 300,
			height: 100,
			backgroundColor: '#fee2e2',
		});

		res.setHeader('Content-Type', 'image/svg+xml');
		res.status(500).send(errorSVG);
	}
});

/**
 * GET /audio/:id/info - Obtener información del archivo de audio
 */
router.get('/:id/info', async (req, res) => {
	try {
		const { id } = req.params;

		// Obtener audio de la base de datos
		const audioRecords = await db
			.select({ path: audios.path, metadata: audios.metadata })
			.from(audios)
			.where(eq(audios.id, id));

		if (audioRecords.length === 0) {
			res.status(404).json({ error: 'Audio file not found' });
			return;
		}

		const audio = audioRecords[0];

		// Intentar extraer info de metadata cacheada
		if (audio.metadata) {
			try {
				const metadata = JSON.parse(audio.metadata);
				if (metadata.audioInfo) {
					res.json({ id, ...metadata.audioInfo });
					return;
				}
			} catch {
				// Metadata inválida, continuar con análisis
			}
		}

		const audioInfo = await analyzeAudioFile(audio.path);

		if (!audioInfo) {
			res.status(404).json({ error: 'Audio file not found or unsupported format' });
			return;
		}

		res.json({
			id,
			...audioInfo,
		});
	} catch (error) {
		serverLogger.error('Error obteniendo información del audio:', error);
		res.status(500).json({ error: 'Error analyzing audio file' });
	}
});

/**
 * GET /audio/:id/waveform/preview - Preview rápido del waveform (menos muestras)
 */
router.get('/:id/waveform/preview', async (req, res) => {
	try {
		const { id } = req.params;

		// Configuración optimizada para preview rápido
		const options: AudioWaveformOptions = {
			width: 150,
			height: 50,
			color: '#10b981',
			backgroundColor: 'transparent',
			bars: 30,
			style: 'bars',
			showAxis: false,
		};

		const audioRecords = await db
			.select({ path: audios.path, metadata: audios.metadata })
			.from(audios)
			.where(eq(audios.id, id));

		if (audioRecords.length === 0) {
			res.status(404).json({ error: 'Audio not found' });
			return;
		}

		const audio = audioRecords[0];
		const waveformData = await extractWaveformFromAudio(audio.path, 50);

		if (waveformData) {
			const previewSVG = generateWaveformSVG(waveformData, options);
			res.setHeader('Content-Type', 'image/svg+xml');
			res.setHeader('Cache-Control', 'public, max-age=7200'); // Cache más largo para previews
			res.send(previewSVG);
		} else {
			// Mini placeholder
			const miniSVG = `
<svg width="150" height="50" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="transparent"/>
  <path d="M 10 25 Q 40 15 70 25 Q 100 35 130 25" stroke="var(--dt-success-500)" stroke-width="2" fill="none"/>
</svg>`;

			res.setHeader('Content-Type', 'image/svg+xml');
			res.send(miniSVG);
		}
	} catch (error) {
		serverLogger.error('Error generando preview de waveform:', error);
		res.status(500).json({ error: 'Error generating waveform preview' });
	}
});

export default router;
