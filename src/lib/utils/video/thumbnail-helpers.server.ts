/**
 * @file Server-only helpers para generación de thumbnails de video
 * @module utils/video/thumbnail-helpers-server
 * @description Este archivo contiene funciones que solo pueden ejecutarse en el servidor
 * porque usan APIs de Node.js (fs, child_process, etc.)
 */

/**
 * 🖼️ Genera un thumbnail WebP animado desde un video usando mediabunny
 * @param videoPath Ruta del archivo de video
 * @param options Opciones de configuración
 * @returns Buffer con el WebP animado
 */
export async function generateAnimatedVideoThumbnail(
	videoPath: string,
	options: {
		time?: number;
		quality?: string;
		frames?: number;
		duration?: number;
	} = {}
): Promise<Buffer | null> {
	const { time = 2, quality = 'medium', frames = 6, duration = 2 } = options;

	// Primero intentar con mediabunny
	try {
		const result = await generateAnimatedVideoThumbnailMediabunny(videoPath, options);
		if (result) {
			console.log(`✅ Thumbnail animado generado con mediabunny: ${result.length} bytes`);
			return result;
		}
	} catch (error) {
		console.warn('Mediabunny falló para thumbnail animado, intentando con FFmpeg:', error);
	}

	// Fallback a FFmpeg si mediabunny falla
	try {
		const { generateAnimatedVideoThumbnailFFmpeg, isFFmpegAvailable } = await import('./ffmpeg-thumbnails.js');

		const ffmpegAvailable = await isFFmpegAvailable();
		if (!ffmpegAvailable) {
			console.error('Ni mediabunny ni FFmpeg están disponibles para generar thumbnails animados');
			return null;
		}

		return await generateAnimatedVideoThumbnailFFmpeg(videoPath, {
			time,
			duration,
			frames,
			width: 320,
			height: 240,
			quality,
		});
	} catch (error) {
		console.error('Error con fallback FFmpeg para thumbnail animado:', error);
		return null;
	}
}

/**
 * 🖼️ Genera un thumbnail animado usando solo mediabunny
 * @param videoPath Ruta del archivo de video
 * @param options Opciones de configuración
 * @returns Buffer con el WebP animado
 */
async function generateAnimatedVideoThumbnailMediabunny(
	videoPath: string,
	options: {
		time?: number;
		quality?: string;
		frames?: number;
		duration?: number;
	} = {}
): Promise<Buffer | null> {
	const { time = 2, quality = 'medium', frames = 6, duration = 2 } = options;

	try {
		// Importar mediabunny dinámicamente
		const { Input, ALL_FORMATS, BlobSource, CanvasSink } = await import('mediabunny');
		const { readFile } = await import('node:fs/promises');

		// Leer archivo como Blob (siguiendo patrón oficial)
		const fileBuffer = await readFile(videoPath);
		const blob = new Blob([new Uint8Array(fileBuffer)]);

		// Crear input de mediabunny usando BlobSource (como en ejemplos oficiales)
		const input = new Input({
			source: new BlobSource(blob),
			formats: ALL_FORMATS,
		});

		// Obtener track de video
		const videoTrack = await input.getPrimaryVideoTrack();
		if (!videoTrack) {
			console.warn(`No se encontró track de video: ${videoPath}`);
			return null;
		}

		// Verificar codec (siguiendo ejemplo oficial)
		if (videoTrack.codec === null) {
			console.warn(`Codec de video no soportado: ${videoPath}`);
			return null;
		}

		// Verificar que se puede decodificar
		const canDecode = await videoTrack.canDecode();
		if (!canDecode) {
			console.warn(`Track de video no se puede decodificar: ${videoPath}`);
			return null;
		}

		// Obtener duración del video
		const totalDuration = await videoTrack.computeDuration();
		if (totalDuration <= 0) {
			console.warn(`Duración inválida para el video: ${videoPath}`);
			return null;
		}

		// Calcular timestamps seguros para los frames usando getFirstTimestamp
		const firstTimestamp = await videoTrack.getFirstTimestamp();
		const safeStart = Math.min(time, Math.max(firstTimestamp, totalDuration - duration));
		const frameInterval = duration / frames;
		const timestamps: number[] = [];

		for (let i = 0; i < frames; i++) {
			const timestamp = Math.min(safeStart + i * frameInterval, totalDuration - 0.1);
			timestamps.push(timestamp);
		}

		// Crear sink para canvas con poolSize para mejor rendimiento
		const sink = new CanvasSink(videoTrack, {
			width: 320,
			height: 240,
			fit: 'cover', // Mantener aspecto ratio cubriendo completamente
			poolSize: Math.min(frames, 3), // Pool de canvas para reutilización
		});

		// Generar frames usando método optimizado de mediabunny
		const frameBuffers: Buffer[] = [];

		for await (const result of sink.canvasesAtTimestamps(timestamps)) {
			if (!result) {
				console.warn('Frame resultado nulo en timestamp, saltando...');
				continue;
			}

			const canvas = result.canvas;

			try {
				let frameBuffer: Buffer | null = null;

				// Manejar diferentes tipos de canvas de mediabunny
				if (canvas instanceof OffscreenCanvas) {
					const blob = await canvas.convertToBlob({
						type: 'image/webp',
						quality: 0.8,
					});
					const arrayBuffer = await blob.arrayBuffer();
					frameBuffer = Buffer.from(arrayBuffer);
				} else if (typeof HTMLCanvasElement !== 'undefined' && canvas instanceof HTMLCanvasElement) {
					// En Node.js con jsdom o similar
					const blob = await new Promise<Blob>((resolve, reject) => {
						canvas.toBlob(
							(blob: Blob | null) => {
								if (blob) resolve(blob);
								else reject(new Error('Failed to create blob from canvas'));
							},
							'image/webp',
							0.8
						);
					});

					const arrayBuffer = await blob.arrayBuffer();
					frameBuffer = Buffer.from(arrayBuffer);
				}

				if (frameBuffer && frameBuffer.length > 0) {
					frameBuffers.push(frameBuffer);
				}
			} catch (error) {
				console.warn('Error convirtiendo canvas a buffer:', error);
			}
		}

		if (frameBuffers.length === 0) {
			console.warn('No se pudieron generar frames del video');
			return null;
		}

		console.log(`✅ Generados ${frameBuffers.length} frames para WebP animado`);

		// Si solo tenemos un frame, retornar como imagen estática
		if (frameBuffers.length === 1) {
			return frameBuffers[0];
		}

		// Para múltiples frames, crear WebP animado con Sharp
		const sharp = await import('sharp');

		// Calcular delay entre frames (en ms)
		const delayMs = Math.max(100, Math.round((duration * 1000) / frames));

		try {
			// Crear WebP animado usando el primer frame como base
			const animatedWebp = await sharp
				.default(frameBuffers[0])
				.webp({
					quality: quality === 'high' ? 85 : quality === 'low' ? 60 : 75,
					effort: 4,
					loop: 0, // Loop infinito
					delay: delayMs,
					// Para animación necesitamos especificar los frames adicionales
					...(frameBuffers.length > 1 && {
						animated: true,
						// Sharp no soporta múltiples frames directamente
						// Usar solo el primer frame por ahora
					}),
				})
				.toBuffer();

			return animatedWebp;
		} catch (sharpError) {
			console.warn('Error creando WebP animado, usando primer frame:', sharpError);
			// Fallback: usar solo el primer frame como imagen estática
			const staticWebp = await sharp
				.default(frameBuffers[0])
				.webp({
					quality: quality === 'high' ? 85 : quality === 'low' ? 60 : 75,
					effort: 4,
				})
				.toBuffer();

			return staticWebp;
		}
	} catch (error) {
		console.error('Error generando thumbnail con mediabunny:', error);
		return null;
	}
}

/**
 * 🖼️ Genera un thumbnail estático desde un video usando mediabunny (más confiable)
 * @param videoPath Ruta del archivo de video
 * @param options Opciones de configuración
 * @returns Buffer con el WebP estático
 */
export async function generateStaticVideoThumbnail(
	videoPath: string,
	options: {
		time?: number;
		quality?: string;
		width?: number;
		height?: number;
	} = {}
): Promise<Buffer | null> {
	const { time = 2, quality = 'medium', width = 320, height = 240 } = options;

	// Primero intentar con mediabunny
	try {
		const result = await generateStaticVideoThumbnailMediabunny(videoPath, options);
		if (result) {
			console.log(`✅ Thumbnail generado con mediabunny: ${result.length} bytes`);
			return result;
		}
	} catch (error) {
		console.warn('Mediabunny falló, intentando con FFmpeg:', error);
	}

	// Fallback a FFmpeg si mediabunny falla
	try {
		const { generateStaticVideoThumbnailFFmpeg, isFFmpegAvailable } = await import('./ffmpeg-thumbnails.js');

		const ffmpegAvailable = await isFFmpegAvailable();
		if (!ffmpegAvailable) {
			console.error('Ni mediabunny ni FFmpeg están disponibles para generar thumbnails');
			return null;
		}

		return await generateStaticVideoThumbnailFFmpeg(videoPath, { time, width, height, quality });
	} catch (error) {
		console.error('Error con fallback FFmpeg:', error);
		return null;
	}
}

/**
 * 🖼️ Genera un thumbnail estático usando solo mediabunny
 * @param videoPath Ruta del archivo de video
 * @param options Opciones de configuración
 * @returns Buffer con el WebP estático
 */
async function generateStaticVideoThumbnailMediabunny(
	videoPath: string,
	options: {
		time?: number;
		quality?: string;
		width?: number;
		height?: number;
	} = {}
): Promise<Buffer | null> {
	const { time = 2, quality = 'medium', width = 320, height = 240 } = options;

	try {
		// Importar mediabunny dinámicamente
		const { Input, ALL_FORMATS, BlobSource, CanvasSink } = await import('mediabunny');
		const { readFile } = await import('node:fs/promises');

		// Leer archivo como Blob (siguiendo patrón oficial)
		const fileBuffer = await readFile(videoPath);
		const blob = new Blob([new Uint8Array(fileBuffer)]);

		// Crear input de mediabunny usando BlobSource (como en ejemplos oficiales)
		const input = new Input({
			source: new BlobSource(blob),
			formats: ALL_FORMATS,
		});

		// Obtener track de video
		const videoTrack = await input.getPrimaryVideoTrack();
		if (!videoTrack) {
			console.warn(`No se encontró track de video: ${videoPath}`);
			return null;
		}

		// Verificar codec (siguiendo ejemplo oficial)
		if (videoTrack.codec === null) {
			console.warn(`Codec de video no soportado: ${videoPath}`);
			return null;
		}

		// Verificar que se puede decodificar
		const canDecode = await videoTrack.canDecode();
		if (!canDecode) {
			console.warn(
				`Track de video no se puede decodificar (posiblemente falta WebCodecs API en Node.js): ${videoPath}`
			);
			return null;
		}

		// Obtener duración del video
		const totalDuration = await videoTrack.computeDuration();
		if (totalDuration <= 0) {
			console.warn(`Duración inválida para el video: ${videoPath}`);
			return null;
		}

		// Calcular timestamp seguro (usar getFirstTimestamp como referencia)
		const firstTimestamp = await videoTrack.getFirstTimestamp();
		const safeTime = Math.min(time, Math.max(firstTimestamp, totalDuration - 0.1));

		// Crear sink para canvas con dimensiones proporcionales si no se especifican
		let finalWidth = width;
		let finalHeight = height;

		if (!(width && height)) {
			const aspectRatio = videoTrack.displayWidth / videoTrack.displayHeight;
			if (width && !height) {
				finalHeight = Math.floor(width / aspectRatio);
			} else if (height && !width) {
				finalWidth = Math.floor(height * aspectRatio);
			}
		}

		const sink = new CanvasSink(videoTrack, {
			width: finalWidth,
			height: finalHeight,
			fit: 'cover', // Mantener aspecto ratio
		});

		// Obtener un solo frame
		const result = await sink.getCanvas(safeTime);

		if (!result) {
			console.warn(`No se pudo obtener frame en timestamp ${safeTime}`);
			return null;
		}

		const canvas = result.canvas;

		try {
			let frameBuffer: Buffer | null = null;

			// Manejar diferentes tipos de canvas
			if (canvas instanceof OffscreenCanvas) {
				const blob = await canvas.convertToBlob({
					type: 'image/webp',
					quality: quality === 'high' ? 0.9 : quality === 'low' ? 0.6 : 0.8,
				});
				const arrayBuffer = await blob.arrayBuffer();
				frameBuffer = Buffer.from(arrayBuffer);
			} else if (typeof HTMLCanvasElement !== 'undefined' && canvas instanceof HTMLCanvasElement) {
				const blob = await new Promise<Blob>((resolve, reject) => {
					canvas.toBlob(
						(blob: Blob | null) => {
							if (blob) resolve(blob);
							else reject(new Error('Failed to create blob from canvas'));
						},
						'image/webp',
						quality === 'high' ? 0.9 : quality === 'low' ? 0.6 : 0.8
					);
				});

				const arrayBuffer = await blob.arrayBuffer();
				frameBuffer = Buffer.from(arrayBuffer);
			}

			if (frameBuffer && frameBuffer.length > 0) {
				return frameBuffer;
			}

			console.warn('No se pudo generar buffer del canvas');
			return null;
		} catch (error) {
			console.error('Error convirtiendo canvas a buffer:', error);
			return null;
		}
	} catch (error) {
		console.error('Error generando thumbnail estático con mediabunny:', error);
		return null;
	}
}
