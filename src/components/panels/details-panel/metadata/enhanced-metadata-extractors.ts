import type { EnhancedMetadataResult, MetadataField } from '../types';

/**
 * Extrae metadatos de archivos de video
 */
export const extractVideoMetadata = (result: EnhancedMetadataResult, metadata: MetadataField[]): void => {
	if (!result.metadata?.videoData) {
		return;
	}

	const video = result.metadata.videoData;

	// Información básica del video
	if (video.duration) {
		const duration = typeof video.duration === 'number' ? video.duration : Number.parseFloat(video.duration);
		const hours = Math.floor(duration / 3600);
		const minutes = Math.floor((duration % 3600) / 60);
		const seconds = Math.floor(duration % 60);
		const formattedDuration =
			hours > 0
				? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
				: `${minutes}:${seconds.toString().padStart(2, '0')}`;
		metadata.push({ key: 'Duración', value: formattedDuration, category: 'video' });
	}

	if (video.width && video.height) {
		metadata.push({ key: 'Resolución', value: `${video.width}×${video.height}`, category: 'video' });
	}

	if (video.framerate || video.fps) {
		const fps = video.framerate || video.fps;
		metadata.push({ key: 'FPS', value: `${fps}`, category: 'video' });
	}

	if (video.bitrate) {
		const bitrate = typeof video.bitrate === 'number' ? video.bitrate : Number.parseInt(video.bitrate, 10);
		const bitrateInMbps = (bitrate / 1_000_000).toFixed(1);
		metadata.push({ key: 'Bitrate', value: `${bitrateInMbps} Mbps`, category: 'video' });
	}

	if (video.codec || video.videoCodec) {
		metadata.push({ key: 'Códec de Video', value: video.codec || video.videoCodec, category: 'video' });
	}

	if (video.audioCodec) {
		metadata.push({ key: 'Códec de Audio', value: video.audioCodec, category: 'video' });
	}

	if (video.format || video.container) {
		metadata.push({ key: 'Formato', value: video.format || video.container, category: 'video' });
	}
};

/**
 * Extrae metadatos de archivos de audio
 */
export const extractAudioMetadata = (result: EnhancedMetadataResult, metadata: MetadataField[]): void => {
	if (!result.metadata?.audioData) {
		return;
	}

	const audio = result.metadata.audioData;

	// Información básica del audio
	if (audio.duration) {
		const duration = typeof audio.duration === 'number' ? audio.duration : Number.parseFloat(audio.duration);
		const minutes = Math.floor(duration / 60);
		const seconds = Math.floor(duration % 60);
		metadata.push({ key: 'Duración', value: `${minutes}:${seconds.toString().padStart(2, '0')}`, category: 'audio' });
	}

	if (audio.bitrate) {
		const bitrate = typeof audio.bitrate === 'number' ? audio.bitrate : Number.parseInt(audio.bitrate, 10);
		metadata.push({ key: 'Bitrate', value: `${Math.round(bitrate / 1000)} kbps`, category: 'audio' });
	}

	if (audio.sampleRate) {
		const sampleRate = typeof audio.sampleRate === 'number' ? audio.sampleRate : Number.parseInt(audio.sampleRate, 10);
		metadata.push({ key: 'Sample Rate', value: `${Math.round(sampleRate / 1000)} kHz`, category: 'audio' });
	}

	if (audio.channels) {
		const channelNames: Record<number, string> = {
			1: 'Mono',
			2: 'Estéreo',
			6: '5.1 Surround',
			8: '7.1 Surround',
		};
		const channels = typeof audio.channels === 'number' ? audio.channels : Number.parseInt(audio.channels, 10);
		const channelName = channelNames[channels] || `${channels} canales`;
		metadata.push({ key: 'Canales', value: channelName, category: 'audio' });
	}

	if (audio.codec || audio.format) {
		metadata.push({ key: 'Códec', value: audio.codec || audio.format, category: 'audio' });
	}

	// Metadatos de etiquetas ID3/metadata
	if (audio.title) {
		metadata.push({ key: 'Título', value: audio.title, category: 'audio' });
	}

	if (audio.artist) {
		metadata.push({ key: 'Artista', value: audio.artist, category: 'audio' });
	}

	if (audio.album) {
		metadata.push({ key: 'Álbum', value: audio.album, category: 'audio' });
	}

	if (audio.year || audio.date) {
		metadata.push({ key: 'Año', value: audio.year || audio.date, category: 'audio' });
	}

	if (audio.genre) {
		metadata.push({ key: 'Género', value: audio.genre, category: 'audio' });
	}

	if (audio.track) {
		metadata.push({ key: 'Pista', value: audio.track.toString(), category: 'audio' });
	}
};

/**
 * Extrae metadatos de archivos JSON
 */
export const extractJSONMetadata = (result: EnhancedMetadataResult, metadata: MetadataField[]): void => {
	if (!result.metadata?.jsonData) {
		return;
	}

	const json = result.metadata.jsonData;

	// Información sobre la estructura del JSON
	if (json.size !== undefined) {
		metadata.push({ key: 'Tamaño del archivo', value: `${(json.size / 1024).toFixed(1)} KB`, category: 'json' });
	}

	if (json.objectCount !== undefined) {
		metadata.push({ key: 'Número de objetos', value: json.objectCount.toString(), category: 'json' });
	}

	if (json.arrayCount !== undefined) {
		metadata.push({ key: 'Número de arrays', value: json.arrayCount.toString(), category: 'json' });
	}

	if (json.depth !== undefined) {
		metadata.push({ key: 'Profundidad', value: json.depth.toString(), category: 'json' });
	}

	// Si tenemos el contenido JSON, mostrarlo formateado
	if (json.content) {
		let formattedContent: string;
		try {
			// Si es un string, parsearlo; si es objeto, serializarlo
			const jsonObject = typeof json.content === 'string' ? JSON.parse(json.content) : json.content;
			formattedContent = JSON.stringify(jsonObject, null, 2);
		} catch {
			formattedContent = typeof json.content === 'string' ? json.content : JSON.stringify(json.content, null, 2);
		}

		metadata.push({
			key: 'Contenido JSON',
			value: formattedContent,
			category: 'json_content', // Categoría especial para contenido JSON
		});
	}

	// Detectar si es un JSON de configuración específico
	if (json.type) {
		metadata.push({ key: 'Tipo de JSON', value: json.type, category: 'json' });
	}

	// Metadatos específicos si es un package.json
	if (json.isPackageJson) {
		if (json.packageName) {
			metadata.push({ key: 'Nombre del paquete', value: json.packageName, category: 'json' });
		}
		if (json.version) {
			metadata.push({ key: 'Versión', value: json.version, category: 'json' });
		}
		if (json.description) {
			metadata.push({ key: 'Descripción', value: json.description, category: 'json' });
		}
		if (json.dependencies) {
			metadata.push({ key: 'Dependencias', value: Object.keys(json.dependencies).length.toString(), category: 'json' });
		}
	}
};

/**
 * Extrae metadatos de documentos (Markdown, TXT, etc.)
 */
export const extractDocumentMetadata = (result: EnhancedMetadataResult, metadata: MetadataField[]): void => {
	if (!result.metadata?.documentData) {
		return;
	}

	const doc = result.metadata.documentData;

	// Información básica del documento
	if (doc.wordCount !== undefined) {
		metadata.push({ key: 'Palabras', value: doc.wordCount.toString(), category: 'document' });
	}

	if (doc.lineCount !== undefined) {
		metadata.push({ key: 'Líneas', value: doc.lineCount.toString(), category: 'document' });
	}

	if (doc.characterCount !== undefined) {
		metadata.push({ key: 'Caracteres', value: doc.characterCount.toString(), category: 'document' });
	}

	if (doc.size !== undefined) {
		metadata.push({ key: 'Tamaño', value: `${(doc.size / 1024).toFixed(1)} KB`, category: 'document' });
	}

	// Metadatos específicos de Markdown
	if (doc.isMarkdown) {
		if (doc.headingCount !== undefined) {
			metadata.push({ key: 'Encabezados', value: doc.headingCount.toString(), category: 'document' });
		}

		if (doc.linkCount !== undefined) {
			metadata.push({ key: 'Enlaces', value: doc.linkCount.toString(), category: 'document' });
		}

		if (doc.imageCount !== undefined) {
			metadata.push({ key: 'Imágenes', value: doc.imageCount.toString(), category: 'document' });
		}

		if (doc.codeBlockCount !== undefined) {
			metadata.push({ key: 'Bloques de código', value: doc.codeBlockCount.toString(), category: 'document' });
		}

		// Frontmatter de Markdown
		if (doc.frontmatter) {
			if (doc.frontmatter.title) {
				metadata.push({ key: 'Título', value: doc.frontmatter.title, category: 'document' });
			}

			if (doc.frontmatter.author) {
				metadata.push({ key: 'Autor', value: doc.frontmatter.author, category: 'document' });
			}

			if (doc.frontmatter.date) {
				metadata.push({ key: 'Fecha', value: doc.frontmatter.date, category: 'document' });
			}

			if (doc.frontmatter.tags) {
				const tags = Array.isArray(doc.frontmatter.tags) ? doc.frontmatter.tags.join(', ') : doc.frontmatter.tags;
				metadata.push({ key: 'Etiquetas', value: tags, category: 'document' });
			}
		}
	}

	// Encoding y formato
	if (doc.encoding) {
		metadata.push({ key: 'Codificación', value: doc.encoding, category: 'document' });
	}

	if (doc.format) {
		metadata.push({ key: 'Formato', value: doc.format, category: 'document' });
	}

	// Contenido para archivos pequeños
	if (doc.content && doc.size && doc.size < 10_240) {
		// Solo para archivos menores a 10KB
		metadata.push({
			key: 'Contenido',
			value: doc.content,
			category: 'document_content', // Categoría especial para contenido
		});
	}
};

/**
 * Extrae metadatos de IA del resultado de la API
 */
export const extractAIMetadata = (result: EnhancedMetadataResult, metadata: MetadataField[]): void => {
	// Logging de debug para ver qué datos llegan
	if (import.meta.env?.DEV) {
		console.debug('[extractAIMetadata] Datos recibidos:', {
			hasOrigin: !!result.metadata?.origin,
			hasAiMetadata: !!result.metadata?.aiMetadata,
			aiMetadataKeys: result.metadata?.aiMetadata ? Object.keys(result.metadata.aiMetadata) : [],
			originEngine: result.metadata?.origin?.engine,
			originConfidence: result.metadata?.origin?.confidence,
		});

		if (result.metadata?.aiMetadata) {
			console.debug('[extractAIMetadata] aiMetadata completa:', result.metadata.aiMetadata);
		}
	}

	// Información del engine (mostrar aunque no haya aiMetadata detallado)
	if (result.metadata?.origin?.engine) {
		const engineNames: Record<string, string> = {
			automatic1111: 'Automatic1111',
			forge: 'Forge',
			comfyui: 'ComfyUI',
			swarmui: 'SwarmUI',
			midjourney: 'Midjourney',
			invokeai: 'InvokeAI',
			novelai: 'NovelAI',
			ideogram: 'Ideogram',
			stability_ai: 'Stability AI',
			dalle: 'DALL·E',
			unknown: 'Desconocido',
		};
		const engineName = engineNames[result.metadata.origin.engine] || result.metadata.origin.engine;
		const confidence = result.metadata.origin.confidence
			? ` (${Math.round(result.metadata.origin.confidence * 100)}%)`
			: '';
		metadata.push({
			key: 'Engine IA',
			value: `${engineName}${confidence}`,
			category: 'ia',
		});
	}

	if (!result.metadata?.aiMetadata) {
		if (import.meta.env?.DEV) {
			console.debug('[extractAIMetadata] No aiMetadata encontrada, terminando early');
		}
		return; // no más campos
	}

	const ai = result.metadata.aiMetadata;

	if (import.meta.env?.DEV) {
		console.debug('[extractAIMetadata] Procesando aiMetadata:', ai);
	}

	// Los datos AI están estructurados de manera anidada:
	// - common: contiene datos comunes a todos los engines
	// - [engine]: contiene datos específicos del engine
	const commonData = ai.common || {};
	const engineSpecificData = ai[ai.engine] || {};

	// Combinar datos comunes y específicos del engine
	const combinedData = { ...commonData, ...engineSpecificData };

	if (import.meta.env?.DEV) {
		console.debug('[extractAIMetadata] Datos combinados:', {
			commonKeys: Object.keys(commonData),
			engineSpecificKeys: Object.keys(engineSpecificData),
			combinedKeys: Object.keys(combinedData),
		});
	}

	// Mapeo de campos para nombres amigables
	const fieldDisplayNames: Record<string, { key: string; maxLength?: number }> = {
		// No limitar prompts (se muestran completos en la UI)
		prompt: { key: 'Prompt' },
		negativePrompt: { key: 'Prompt Negativo' },
		negative_prompt: { key: 'Prompt Negativo' },
		model: { key: 'Modelo' },
		modelName: { key: 'Modelo' },
		model_name: { key: 'Modelo' },
		steps: { key: 'Pasos' },
		cfgScale: { key: 'CFG Scale' },
		cfg_scale: { key: 'CFG Scale' },
		guidance_scale: { key: 'Guidance Scale' },
		seed: { key: 'Seed' },
		sampler: { key: 'Sampler' },
		samplerName: { key: 'Sampler' },
		sampler_name: { key: 'Sampler' },
		scheduler: { key: 'Scheduler' },
		schedulerName: { key: 'Scheduler' },
		scheduler_name: { key: 'Scheduler' },
		width: { key: 'Ancho' },
		height: { key: 'Alto' },
		size: { key: 'Tamaño' },
		batch_size: { key: 'Batch Size' },
		batchSize: { key: 'Batch Size' },
		denoising_strength: { key: 'Denoising Strength' },
		denoisingStrength: { key: 'Denoising Strength' },
		clip_skip: { key: 'CLIP Skip' },
		clipSkip: { key: 'CLIP Skip' },
		eta: { key: 'ETA' },
		// Campos específicos de ComfyUI
		workflow_id: { key: 'Workflow ID' },
		workflowId: { key: 'Workflow ID' },
		node_id: { key: 'Node ID' },
		nodeId: { key: 'Node ID' },
		checkpoint: { key: 'Checkpoint' },
		lora: { key: 'LoRA' },
		loras: { key: 'LoRAs', maxLength: 100 },
		controlnet: { key: 'ControlNet' },
		vae: { key: 'VAE' },
		// Campos adicionales comunes
		creation_date: { key: 'Fecha Creación' },
		creationDate: { key: 'Fecha Creación' },
		created_at: { key: 'Fecha Creación' },
		software: { key: 'Software' },
		version: { key: 'Versión' },
		style: { key: 'Estilo' },
		quality: { key: 'Calidad' },
	};

	if (import.meta.env?.DEV) {
		console.debug('[extractAIMetadata] Procesando todos los campos disponibles...');
		console.debug('[extractAIMetadata] Campos disponibles:', Object.keys(combinedData));
	}

	// Procesar todos los campos disponibles en los datos combinados
	for (const [fieldName, fieldValue] of Object.entries(combinedData)) {
		// Saltar campos vacíos o que no son valores válidos
		if (!fieldValue || fieldValue === '' || fieldValue === null || fieldValue === undefined) {
			continue;
		}

		// Obtener configuración del campo (nombre amigable y límites)
		const fieldConfig = fieldDisplayNames[fieldName] || { key: fieldName };

		if (import.meta.env?.DEV) {
			console.debug(`[extractAIMetadata] Procesando campo ${fieldName}:`, {
				value: fieldValue,
				config: fieldConfig,
			});
		}

		// Convertir valor a string (serializar objetos/arrays como JSON legible)
		let displayValue: string;
		if (typeof fieldValue === 'object') {
			try {
				displayValue = JSON.stringify(fieldValue, null, 2);
			} catch {
				displayValue = String(fieldValue);
			}
		} else {
			displayValue = String(fieldValue);
		}

		// Aplicar límite de longitud solo a campos no críticos (no prompts ni JSON típicos)
		const noTruncateKeys = new Set(['prompt', 'negative_prompt', 'negativePrompt', 'workflow', 'workflow_json']);
		if (!noTruncateKeys.has(fieldName) && fieldConfig.maxLength && displayValue.length > fieldConfig.maxLength) {
			displayValue = `${displayValue.substring(0, fieldConfig.maxLength)}...`;
		}

		// Agregar el campo a los metadatos
		metadata.push({
			key: fieldConfig.key,
			value: displayValue,
			category: 'ia',
		});

		if (import.meta.env?.DEV) {
			console.debug(`[extractAIMetadata] Agregado campo ${fieldConfig.key}:`, displayValue);
		}
	}

	if (import.meta.env?.DEV) {
		const aiFields = metadata.filter((m) => m.category === 'ia');
		console.debug('[extractAIMetadata] Campos AI procesados:', aiFields.length);
		console.debug(
			'[extractAIMetadata] Lista de campos:',
			aiFields.map((m) => m.key)
		);
	}

	// ComfyUI específicos
	if (combinedData.workflowId) {
		metadata.push({
			key: 'Workflow ID',
			value: combinedData.workflowId,
			category: 'ia',
		});
	}

	if (combinedData.nodeCount) {
		metadata.push({
			key: 'Nodos',
			value: combinedData.nodeCount.toString(),
			category: 'ia',
		});
	}

	if (import.meta.env?.DEV) {
		const finalAiFields = metadata.filter((m) => m.category === 'ia');
		console.debug('[extractAIMetadata] Total final de campos AI:', finalAiFields.length);
	}
};

/**
 * Extrae metadatos EXIF del resultado de la API
 */
export const extractEXIFMetadata = (result: EnhancedMetadataResult, metadata: MetadataField[]): void => {
	if (!result.metadata?.exifData) {
		return;
	}

	const exif = result.metadata.exifData;

	// Información de cámara
	if (exif.make || exif.model) {
		const camera = `${exif.make || ''} ${exif.model || ''}`.trim();
		if (camera) {
			metadata.push({ key: 'Cámara', value: camera, category: 'exif' });
		}
	}

	// Configuraciones de captura
	const captureSettings = [
		{ field: 'iso', key: 'ISO' },
		{ field: 'fNumber', key: 'Apertura', format: (v: any) => `f/${v}` },
		{ field: 'exposureTime', key: 'Velocidad' },
		{ field: 'focalLength', key: 'Distancia focal', format: (v: any) => `${v}mm` },
	];

	for (const setting of captureSettings) {
		const value = exif[setting.field];
		if (value) {
			const displayValue = setting.format ? setting.format(value) : value.toString();
			metadata.push({
				key: setting.key,
				value: displayValue,
				category: 'exif',
			});
		}
	}
};

/**
 * Extrae metadatos IPTC del resultado de la API
 */
export const extractIPTCMetadata = (result: EnhancedMetadataResult, metadata: MetadataField[]): void => {
	if (!result.metadata?.iptcData) {
		return;
	}

	const iptc = result.metadata.iptcData;

	if (iptc.headline) {
		metadata.push({ key: 'Título', value: iptc.headline, category: 'iptc' });
	}

	if (iptc.description) {
		metadata.push({ key: 'Descripción', value: iptc.description, category: 'iptc' });
	}

	if (iptc.keywords?.length) {
		metadata.push({
			key: 'Palabras clave',
			value: iptc.keywords.join(', '),
			category: 'iptc',
		});
	}
};

/**
 * Extrae metadatos XMP del resultado de la API
 */
export const extractXMPMetadata = (result: EnhancedMetadataResult, metadata: MetadataField[]): void => {
	if (!result.metadata?.xmpData) {
		return;
	}

	const xmp = result.metadata.xmpData;

	if (xmp.title) {
		metadata.push({ key: 'Título XMP', value: xmp.title, category: 'xmp' });
	}

	if (xmp.description) {
		metadata.push({ key: 'Descripción XMP', value: xmp.description, category: 'xmp' });
	}

	if (xmp.rating) {
		metadata.push({ key: 'Calificación', value: `${xmp.rating}/5`, category: 'xmp' });
	}
};
