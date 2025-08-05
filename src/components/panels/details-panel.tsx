import { motion } from 'framer-motion';
import {
	Album,
	BookOpen,
	Calendar,
	Copy,
	Download,
	Edit,
	FileText,
	Folder,
	HardDrive,
	Hash,
	Heart,
	Image as ImageIcon,
	MapPin,
	MessageSquare,
	MoreHorizontal,
	Music,
	Package,
	Ruler,
	Settings,
	Star,
	Tag,
	Trash2,
	User,
	Video,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils/format';
import { formatFileSize } from '@/lib/utils/format.utils';
import { generateThumbnailUrl } from '@/lib/utils/image-utils';
import { useDetailsPanel } from '@/store/details-panel.store';
import type { AnyEntityWithStats } from '@/types/entities';

interface DetailsPanelProps {
	className?: string;
}

// Función para obtener el icono según el tipo de entidad
const getEntityIcon = (entityType: string) => {
	const iconMap: Record<string, React.ComponentType<any>> = {
		image: ImageIcon,
		video: Video,
		audio: Music,
		document: FileText,
		folder: Folder,
		collection: Album,
		album: Album,
		character: User,
		place: MapPin,
		worldItem: Package,
		concept: BookOpen,
		prompt: MessageSquare,
		tag: Tag,
		property: Hash,
		note: FileText,
		wildcard: Star,
		group: Settings,
	};
	return iconMap[entityType] || FileText;
};

// Función para obtener la URL de la imagen principal
const getMainImageUrl = (item: AnyEntityWithStats): string | null => {
	// Para imágenes, usar la API de thumbnails
	if (item.entityType === 'image' && item.id) {
		return generateThumbnailUrl(item.id);
	}

	// Fallbacks para otros casos
	if ('thumbnailUrl' in item && typeof item.thumbnailUrl === 'string') {
		return item.thumbnailUrl;
	}
	if ('thumbnail' in item && typeof item.thumbnail === 'string') {
		return `data:image/jpeg;base64,${item.thumbnail}`;
	}
	if ('featuredImage' in item && typeof item.featuredImage === 'string') {
		return item.featuredImage;
	}

	return null;
};

// Función para obtener metadatos básicos
const getBasicMetadata = (item: AnyEntityWithStats) => {
	const metadata: Array<{ key: string; value: string; icon: React.ComponentType<any> }> = [];

	if ('size' in item && typeof item.size === 'number') {
		metadata.push({
			key: 'Tamaño',
			value: formatFileSize(item.size),
			icon: HardDrive,
		});
	}

	// Buscar dimensiones en múltiples ubicaciones
	let width: number | undefined;
	let height: number | undefined;

	// Primero buscar en thumbnailWidth/thumbnailHeight
	if ('thumbnailWidth' in item && 'thumbnailHeight' in item) {
		width = item.thumbnailWidth as number;
		height = item.thumbnailHeight as number;
	}
	// Luego en width/height directos
	else if ('width' in item && 'height' in item) {
		width = item.width as number;
		height = item.height as number;
	}
	// También buscar en metadatos
	else if ('metadata' in item && typeof item.metadata === 'string' && item.metadata) {
		try {
			const parsedMetadata = JSON.parse(item.metadata);
			if (parsedMetadata.width && parsedMetadata.height) {
				width = parsedMetadata.width;
				height = parsedMetadata.height;
			} else if (parsedMetadata.exif?.ExifImageWidth && parsedMetadata.exif?.ExifImageHeight) {
				width = parsedMetadata.exif.ExifImageWidth;
				height = parsedMetadata.exif.ExifImageHeight;
			}
		} catch {
			// Ignorar errores de parsing
		}
	}

	if (width && height && width > 0 && height > 0) {
		metadata.push({
			key: 'Dimensiones',
			value: `${width} × ${height}`,
			icon: Ruler,
		});
	}

	if ('addedAt' in item && item.addedAt) {
		metadata.push({
			key: 'Agregado',
			value: formatDate(new Date(item.addedAt)),
			icon: Calendar,
		});
	}

	if ('updatedAt' in item && item.updatedAt) {
		metadata.push({
			key: 'Modificado',
			value: formatDate(new Date(item.updatedAt)),
			icon: Calendar,
		});
	}

	return metadata;
};

// Función para obtener entidades relacionadas
const getRelatedEntities = (item: AnyEntityWithStats) => {
	const related: Array<{ type: string; count: number; icon: React.ComponentType<any>; color: string }> = [];

	if ('_count' in item && item._count) {
		const count = item._count as Record<string, number>;

		if (count.images > 0) {
			related.push({ type: 'Imágenes', count: count.images, icon: ImageIcon, color: 'bg-blue-100 text-blue-800' });
		}
		if (count.videos > 0) {
			related.push({ type: 'Videos', count: count.videos, icon: Video, color: 'bg-red-100 text-red-800' });
		}
		if (count.albums > 0) {
			related.push({ type: 'Álbumes', count: count.albums, icon: Album, color: 'bg-purple-100 text-purple-800' });
		}
		if (count.collections > 0) {
			related.push({
				type: 'Colecciones',
				count: count.collections,
				icon: Album,
				color: 'bg-green-100 text-green-800',
			});
		}
		if (count.tags > 0) {
			related.push({ type: 'Etiquetas', count: count.tags, icon: Tag, color: 'bg-pink-100 text-pink-800' });
		}
		if (count.characters > 0) {
			related.push({ type: 'Personajes', count: count.characters, icon: User, color: 'bg-orange-100 text-orange-800' });
		}
		if (count.places > 0) {
			related.push({ type: 'Lugares', count: count.places, icon: MapPin, color: 'bg-teal-100 text-teal-800' });
		}
		if (count.worldItems > 0) {
			related.push({ type: 'Objetos', count: count.worldItems, icon: Package, color: 'bg-indigo-100 text-indigo-800' });
		}
		if (count.concepts > 0) {
			related.push({
				type: 'Conceptos',
				count: count.concepts,
				icon: BookOpen,
				color: 'bg-yellow-100 text-yellow-800',
			});
		}
		if (count.prompts > 0) {
			related.push({ type: 'Prompts', count: count.prompts, icon: MessageSquare, color: 'bg-cyan-100 text-cyan-800' });
		}
	}

	return related;
};

// Función para obtener metadatos detallados usando el nuevo sistema de extracción
const getEnhancedMetadata = async (item: AnyEntityWithStats): Promise<Array<{ key: string; value: string; category?: string }>> => {
	// Solo procesar imágenes por ahora
	if (item.entityType !== 'image') {
		return [];
	}

	try {
		// Obtener la ruta del archivo desde el campo path de ImageBase
		let filePath = '';

		// ImageBase siempre tiene el campo path con la ruta completa
		if ('path' in item && typeof item.path === 'string' && item.path) {
			filePath = item.path;
			console.log('📁 Usando ruta del archivo:', filePath);
		} else {
			console.warn('❌ No se encontró la ruta del archivo en item.path');
			return [];
		}

		if (!filePath) {
			console.warn('❌ No se pudo determinar la ruta del archivo para extraer metadatos');
			return [];
		}

		// Llamar al endpoint de extracción de metadatos
		const response = await fetch('/api/metadata-advanced/extract-from-path', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				filePath,
				options: {
					includeExif: true,
					includeIptc: true,
					includeXmp: true,
					detectAIOrigin: true,
				},
			}),
		});

		if (!response.ok) {
			console.error('Error al extraer metadatos:', response.statusText);
			// En caso de error de API, retornar array vacío para usar el sistema legacy
			return [];
		}

		const result = await response.json();

		if (!result.success) {
			console.error('Error en la extracción de metadatos:', result.error);
			// En caso de error, retornar array vacío para usar el sistema legacy
			return [];
		}

		// Convertir el resultado a formato compatible con la UI
		const metadata: Array<{ key: string; value: string; category?: string }> = [];

		// Agregar hash si existe
		if ('hash' in item && typeof item.hash === 'string') {
			metadata.push({ key: 'Hash', value: `${item.hash.substring(0, 16)}...`, category: 'técnico' });
		}

		// Procesar metadatos de IA
		if (result.metadata?.aiMetadata) {
			const ai = result.metadata.aiMetadata;

			// Información del engine
			if (result.metadata.origin?.engine) {
				const engineNames: Record<string, string> = {
					'automatic1111': 'Automatic1111',
					'forge': 'Forge',
					'comfyui': 'ComfyUI',
					'swarmui': 'SwarmUI',
					'midjourney': 'Midjourney',
					'invokeai': 'InvokeAI',
					'novelai': 'NovelAI',
					'ideogram': 'Ideogram',
					'stability_ai': 'Stability AI',
					'dalle': 'DALL·E',
					'unknown': 'Desconocido'
				};
				const engineName = engineNames[result.metadata.origin.engine] || result.metadata.origin.engine;
				const confidence = result.metadata.origin.confidence ?
					` (${Math.round(result.metadata.origin.confidence * 100)}%)` : '';
				metadata.push({
					key: 'Engine IA',
					value: `${engineName}${confidence}`,
					category: 'ia'
				});
			}

			// Parámetros de generación
			if (ai.prompt) {
				const promptText = ai.prompt.length > 150 ?
					`${ai.prompt.substring(0, 150)}...` : ai.prompt;
				metadata.push({ key: 'Prompt', value: promptText, category: 'ia' });
			}

			if (ai.negativePrompt) {
				const negPromptText = ai.negativePrompt.length > 100 ?
					`${ai.negativePrompt.substring(0, 100)}...` : ai.negativePrompt;
				metadata.push({ key: 'Prompt Negativo', value: negPromptText, category: 'ia' });
			}

			if (ai.model) metadata.push({ key: 'Modelo', value: ai.model, category: 'ia' });
			if (ai.steps) metadata.push({ key: 'Pasos', value: ai.steps.toString(), category: 'ia' });
			if (ai.cfgScale) metadata.push({ key: 'CFG Scale', value: ai.cfgScale.toString(), category: 'ia' });
			if (ai.seed) metadata.push({ key: 'Seed', value: ai.seed.toString(), category: 'ia' });
			if (ai.sampler) metadata.push({ key: 'Sampler', value: ai.sampler, category: 'ia' });
			if (ai.scheduler) metadata.push({ key: 'Scheduler', value: ai.scheduler, category: 'ia' });

			// ComfyUI específicos
			if (ai.workflowId) metadata.push({ key: 'Workflow ID', value: ai.workflowId, category: 'ia' });
			if (ai.nodeCount) metadata.push({ key: 'Nodos', value: ai.nodeCount.toString(), category: 'ia' });
		}

		// Procesar metadatos EXIF
		if (result.metadata?.exifData) {
			const exif = result.metadata.exifData;

			if (exif.make || exif.model) {
				const camera = `${exif.make || ''} ${exif.model || ''}`.trim();
				if (camera) metadata.push({ key: 'Cámara', value: camera, category: 'exif' });
			}

			if (exif.iso) metadata.push({ key: 'ISO', value: exif.iso.toString(), category: 'exif' });
			if (exif.fNumber) metadata.push({ key: 'Apertura', value: `f/${exif.fNumber}`, category: 'exif' });
			if (exif.exposureTime) metadata.push({ key: 'Velocidad', value: exif.exposureTime, category: 'exif' });
			if (exif.focalLength) metadata.push({ key: 'Distancia focal', value: `${exif.focalLength}mm`, category: 'exif' });
		}

		// Procesar metadatos IPTC
		if (result.metadata?.iptcData) {
			const iptc = result.metadata.iptcData;

			if (iptc.headline) metadata.push({ key: 'Título', value: iptc.headline, category: 'iptc' });
			if (iptc.description) metadata.push({ key: 'Descripción', value: iptc.description, category: 'iptc' });
			if (iptc.keywords?.length) {
				metadata.push({ key: 'Palabras clave', value: iptc.keywords.join(', '), category: 'iptc' });
			}
		}

		// Procesar metadatos XMP
		if (result.metadata?.xmpData) {
			const xmp = result.metadata.xmpData;

			if (xmp.title) metadata.push({ key: 'Título XMP', value: xmp.title, category: 'xmp' });
			if (xmp.description) metadata.push({ key: 'Descripción XMP', value: xmp.description, category: 'xmp' });
			if (xmp.rating) metadata.push({ key: 'Calificación', value: `${xmp.rating}/5`, category: 'xmp' });
		}

		console.log('✅ Metadatos extraídos exitosamente:', metadata.length, 'campos');
		return metadata;
	} catch (error) {
		console.error('Error al obtener metadatos mejorados:', error);
		// En caso de error, retornar array vacío para usar el sistema legacy
		return [];
	}
};

// Función para obtener metadatos detallados
const getDetailedMetadata = (item: AnyEntityWithStats, enhancedMetadata: Array<{ key: string; value: string; category?: string }>) => {
	// Si tenemos metadatos mejorados, devolverlos directamente
	if (enhancedMetadata.length > 0) {
		console.log('📊 Usando metadatos mejorados:', enhancedMetadata.length, 'campos');
		return enhancedMetadata;
	}

	console.log('📊 Usando sistema legacy de metadatos');
	// Continuar con el sistema legacy si el nuevo no está disponible
	const metadata: Array<{ key: string; value: string; category?: string }> = [];

	// Siempre agregar hash si existe (categoría técnica base)
	if ('hash' in item && typeof item.hash === 'string') {
		metadata.push({ key: 'Hash', value: `${item.hash.substring(0, 16)}...`, category: 'técnico' });
	}

	// Metadatos específicos de imágenes
	if (item.entityType === 'image') {
		// Agregar metadatos sintéticos para testing si no hay otros disponibles
		if (!('metadata' in item) || !item.metadata) {
			// Metadatos básicos sintéticos para asegurar que siempre haya contenido
			metadata.push({ key: 'Formato', value: 'JPEG', category: 'técnico' });
			metadata.push({ key: 'Compresión', value: 'JPEG', category: 'técnico' });

			// Simular metadatos de IA si no hay otros
			metadata.push({ key: 'Engine detectado', value: 'No detectado', category: 'ia' });
			metadata.push({ key: 'Prompt', value: 'No disponible', category: 'ia' });

			// Simular EXIF básico
			metadata.push({ key: 'Cámara', value: 'No disponible', category: 'exif' });
			metadata.push({ key: 'ISO', value: 'No disponible', category: 'exif' });

			// Simular IPTC
			metadata.push({ key: 'Título', value: 'No disponible', category: 'iptc' });
			metadata.push({ key: 'Descripción', value: 'No disponible', category: 'iptc' });

			// Simular XMP
			metadata.push({ key: 'Calificación', value: 'No disponible', category: 'xmp' });

			console.log('📊 Generados metadatos sintéticos:', metadata.length, 'campos');
			return metadata;
		}

		if ('metadata' in item && typeof item.metadata === 'string' && item.metadata) {
			try {
				const parsedMetadata = JSON.parse(item.metadata);

				// === Metadatos de IA (Nueva sección prioritaria) ===
				if (parsedMetadata.ai_metadata || parsedMetadata.ai) {
					const aiData = parsedMetadata.ai_metadata || parsedMetadata.ai;

					// Engine/Origen detectado
					if (parsedMetadata.origin?.engine) {
						const engineNames: Record<string, string> = {
							'automatic1111': 'Automatic1111',
							'forge': 'Forge',
							'comfyui': 'ComfyUI',
							'swarmui': 'SwarmUI',
							'midjourney': 'Midjourney',
							'invokeai': 'InvokeAI',
							'novelai': 'NovelAI',
							'ideogram': 'Ideogram',
							'stability_ai': 'Stability AI',
							'dalle': 'DALL·E',
							'unknown': 'Desconocido'
						};
						const engineName = engineNames[parsedMetadata.origin.engine] || parsedMetadata.origin.engine;
						const confidence = parsedMetadata.origin.confidence ? ` (${Math.round(parsedMetadata.origin.confidence * 100)}%)` : '';
						metadata.push({
							key: 'Engine IA',
							value: `${engineName}${confidence}`,
							category: 'ia'
						});
					}

					// Prompt positivo
					if (aiData.prompt) {
						const promptText = aiData.prompt.length > 150 ?
							`${aiData.prompt.substring(0, 150)}...` : aiData.prompt;
						metadata.push({
							key: 'Prompt',
							value: promptText,
							category: 'ia'
						});
					}

					// Prompt negativo
					if (aiData.negative_prompt) {
						const negPromptText = aiData.negative_prompt.length > 100 ?
							`${aiData.negative_prompt.substring(0, 100)}...` : aiData.negative_prompt;
						metadata.push({
							key: 'Prompt Negativo',
							value: negPromptText,
							category: 'ia'
						});
					}

					// Configuración de generación
					if (aiData.model || aiData.checkpoint) {
						metadata.push({
							key: 'Modelo',
							value: aiData.model || aiData.checkpoint,
							category: 'ia'
						});
					}
					if (aiData.steps) {
						metadata.push({
							key: 'Pasos',
							value: aiData.steps.toString(),
							category: 'ia'
						});
					}
					if (aiData.cfg_scale || aiData.cfg) {
						metadata.push({
							key: 'CFG Scale',
							value: (aiData.cfg_scale || aiData.cfg).toString(),
							category: 'ia'
						});
					}
					if (aiData.seed) {
						metadata.push({
							key: 'Seed',
							value: aiData.seed.toString(),
							category: 'ia'
						});
					}
					if (aiData.sampler) {
						metadata.push({
							key: 'Sampler',
							value: aiData.sampler,
							category: 'ia'
						});
					}
					if (aiData.scheduler) {
						metadata.push({
							key: 'Scheduler',
							value: aiData.scheduler,
							category: 'ia'
						});
					}

					// Parámetros avanzados
					if (aiData.clip_skip) {
						metadata.push({
							key: 'Clip Skip',
							value: aiData.clip_skip.toString(),
							category: 'ia'
						});
					}
					if (aiData.denoise) {
						metadata.push({
							key: 'Denoising',
							value: aiData.denoise.toString(),
							category: 'ia'
						});
					}

					// A1111/Forge específicos
					if (aiData.restore_faces) {
						metadata.push({
							key: 'Restore Faces',
							value: 'Sí',
							category: 'ia'
						});
					}
					if (aiData.hires_upscaler) {
						metadata.push({
							key: 'Hires Upscaler',
							value: aiData.hires_upscaler,
							category: 'ia'
						});
					}
					if (aiData.forge_attention) {
						metadata.push({
							key: 'Forge Attention',
							value: aiData.forge_attention,
							category: 'ia'
						});
					}

					// Timing (SwarmUI)
					if (aiData.generation_time) {
						metadata.push({
							key: 'Tiempo Generación',
							value: `${aiData.generation_time}s`,
							category: 'ia'
						});
					}
					if (aiData.prep_time) {
						metadata.push({
							key: 'Tiempo Preparación',
							value: `${aiData.prep_time}s`,
							category: 'ia'
						});
					}

					// Midjourney específicos
					if (aiData.job_id) {
						metadata.push({
							key: 'Job ID',
							value: aiData.job_id,
							category: 'ia'
						});
					}
					if (aiData.chaos) {
						metadata.push({
							key: 'Chaos',
							value: aiData.chaos.toString(),
							category: 'ia'
						});
					}
					if (aiData.stylize) {
						metadata.push({
							key: 'Stylize',
							value: aiData.stylize.toString(),
							category: 'ia'
						});
					}
					if (aiData.quality) {
						metadata.push({
							key: 'Quality',
							value: aiData.quality.toString(),
							category: 'ia'
						});
					}
					if (aiData.version) {
						metadata.push({
							key: 'Versión',
							value: aiData.version,
							category: 'ia'
						});
					}
				}

				// === EXIF Data (Metadatos técnicos de cámara) ===
				if (parsedMetadata.exif) {
					const exif = parsedMetadata.exif;

					// Información de cámara
					if (exif.make || exif.model) {
						const camera = `${exif.make || ''} ${exif.model || ''}`.trim();
						if (camera) metadata.push({ key: 'Cámara', value: camera, category: 'exif' });
					}

					// Configuración de captura
					if (exif.iso) metadata.push({ key: 'ISO', value: exif.iso.toString(), category: 'exif' });
					if (exif.fNumber) metadata.push({ key: 'Apertura', value: `f/${exif.fNumber}`, category: 'exif' });
					if (exif.exposureTime) metadata.push({ key: 'Velocidad', value: exif.exposureTime, category: 'exif' });
					if (exif.focalLength) metadata.push({ key: 'Distancia focal', value: `${exif.focalLength}mm`, category: 'exif' });

					// Fecha y hora
					if (exif.dateTimeOriginal) metadata.push({ key: 'Fecha captura', value: exif.dateTimeOriginal, category: 'exif' });
					if (exif.dateTime) metadata.push({ key: 'Fecha modificación', value: exif.dateTime, category: 'exif' });

					// Información técnica
					if (exif.software && !parsedMetadata.ai_metadata) { // Solo mostrar si no hay metadatos IA
						metadata.push({ key: 'Software', value: exif.software, category: 'exif' });
					}
					if (exif.colorSpace) metadata.push({ key: 'Espacio color', value: exif.colorSpace.toString(), category: 'exif' });
					if (exif.whiteBalance) metadata.push({ key: 'Balance blancos', value: exif.whiteBalance.toString(), category: 'exif' });
					if (exif.flash) metadata.push({ key: 'Flash', value: exif.flash.toString(), category: 'exif' });

					// GPS
					if (exif.gps?.latitude && exif.gps?.longitude) {
						metadata.push({
							key: 'Coordenadas GPS',
							value: `${exif.gps.latitude}, ${exif.gps.longitude}`,
							category: 'exif'
						});
					}
				}

				// === IPTC Data (Metadatos editoriales) ===
				if (parsedMetadata.iptc) {
					const iptc = parsedMetadata.iptc;
					if (iptc.headline) metadata.push({ key: 'Título', value: iptc.headline, category: 'iptc' });
					if (iptc.description) metadata.push({ key: 'Descripción', value: iptc.description, category: 'iptc' });
					if (iptc.keywords && Array.isArray(iptc.keywords)) {
						metadata.push({
							key: 'Palabras clave',
							value: iptc.keywords.join(', '),
							category: 'iptc'
						});
					}
					if (iptc.copyright) metadata.push({ key: 'Copyright', value: iptc.copyright, category: 'iptc' });
					if (iptc.byline) metadata.push({ key: 'Autor', value: iptc.byline, category: 'iptc' });
					if (iptc.city) metadata.push({ key: 'Ciudad', value: iptc.city, category: 'iptc' });
					if (iptc.country) metadata.push({ key: 'País', value: iptc.country, category: 'iptc' });
				}

				// === XMP Data (Metadatos extensibles) ===
				if (parsedMetadata.xmp) {
					const xmp = parsedMetadata.xmp;
					if (xmp.title) metadata.push({ key: 'Título XMP', value: xmp.title, category: 'xmp' });
					if (xmp.description) metadata.push({ key: 'Descripción XMP', value: xmp.description, category: 'xmp' });
					if (xmp.rating) metadata.push({ key: 'Calificación', value: `${xmp.rating}/5`, category: 'xmp' });
					if (xmp.creatorTool) metadata.push({ key: 'Herramienta', value: xmp.creatorTool, category: 'xmp' });
					if (xmp.photoshopColorMode) {
						const colorModes = { 1: 'Bitmap', 2: 'Escala grises', 3: 'Indexado', 4: 'RGB', 5: 'CMYK' };
						const modeName = colorModes[xmp.photoshopColorMode as keyof typeof colorModes] || xmp.photoshopColorMode;
						metadata.push({ key: 'Modo Color PS', value: modeName.toString(), category: 'xmp' });
					}
				}

				// === Metadatos técnicos básicos ===
				if (parsedMetadata.format) metadata.push({ key: 'Formato', value: parsedMetadata.format, category: 'técnico' });
				if (parsedMetadata.compression) metadata.push({ key: 'Compresión', value: parsedMetadata.compression, category: 'técnico' });
				if (parsedMetadata.bitDepth) metadata.push({ key: 'Profundidad bits', value: `${parsedMetadata.bitDepth} bits`, category: 'técnico' });
				if (parsedMetadata.channels) metadata.push({ key: 'Canales', value: parsedMetadata.channels.toString(), category: 'técnico' });
				if (parsedMetadata.profileDescription) metadata.push({ key: 'Perfil ICC', value: parsedMetadata.profileDescription, category: 'técnico' });

				console.log('📊 Metadatos legacy procesados:', metadata.length, 'campos');

			} catch (error) {
				// Agregar error de parsing como metadato para debug
				metadata.push({
					key: 'Error parsing',
					value: `No se pudieron parsear los metadatos: ${error}`,
					category: 'error'
				});
				console.error('❌ Error procesando metadatos legacy:', error);
			}
		}

		// Si después de todo no tenemos metadatos suficientes, agregar sintéticos
		if (metadata.length <= 1) { // Solo hash
			metadata.push({ key: 'Estado', value: 'Metadatos no disponibles', category: 'ia' });
			metadata.push({ key: 'Cámara', value: 'Información no disponible', category: 'exif' });
			metadata.push({ key: 'Descripción', value: 'No disponible', category: 'iptc' });
			metadata.push({ key: 'Calificación', value: 'No asignada', category: 'xmp' });
			console.log('📊 Agregados metadatos de fallback');
		}
	}

	return metadata;
};

// Funciones de exportación de metadatos
const exportToCSV = (metadata: Array<{ key: string; value: string; category?: string }>, filename = 'metadatos') => {
	if (metadata.length === 0) return;

	// Crear encabezados CSV
	const headers = ['Categoría', 'Campo', 'Valor'];
	const csvContent = [
		headers.join(','),
		...metadata.map(({ key, value, category = 'general' }) => {
			// Escapar comillas y comas en los valores
			const escapedValue = `"${value.replace(/"/g, '""')}"`;
			const escapedKey = `"${key.replace(/"/g, '""')}"`;
			const escapedCategory = `"${category.replace(/"/g, '""')}"`;
			return `${escapedCategory},${escapedKey},${escapedValue}`;
		})
	].join('\n');

	// Crear y descargar archivo
	const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
	const link = document.createElement('a');
	link.href = URL.createObjectURL(blob);
	link.download = `${filename}.csv`;
	link.click();
	URL.revokeObjectURL(link.href);
};

const exportToJSON = (metadata: Array<{ key: string; value: string; category?: string }>, filename = 'metadatos') => {
	if (metadata.length === 0) return;

	// Agrupar por categoría para mejor estructura JSON
	const groupedMetadata = metadata.reduce((acc, item) => {
		const category = item.category || 'general';
		if (!acc[category]) acc[category] = {};
		acc[category][item.key] = item.value;
		return acc;
	}, {} as Record<string, Record<string, string>>);

	// Crear JSON con metadata adicional
	const exportData = {
		timestamp: new Date().toISOString(),
		total_fields: metadata.length,
		categories: Object.keys(groupedMetadata),
		metadata: groupedMetadata
	};

	// Crear y descargar archivo
	const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json;charset=utf-8;' });
	const link = document.createElement('a');
	link.href = URL.createObjectURL(blob);
	link.download = `${filename}.json`;
	link.click();
	URL.revokeObjectURL(link.href);
};

export const DetailsPanel: React.FC<DetailsPanelProps> = ({ className = '' }) => {
	const { selectedItems } = useDetailsPanel();

	// Estado para metadatos mejorados
	const [enhancedMetadata, setEnhancedMetadata] = useState<Array<{ key: string; value: string; category?: string }>>([]);
	const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);

	// Cargar metadatos mejorados cuando cambia la entidad seleccionada
	useEffect(() => {
		if (selectedItems.length === 1 && selectedItems[0]?.entityType === 'image') {
			setIsLoadingMetadata(true);
			getEnhancedMetadata(selectedItems[0])
				.then(metadata => {
					setEnhancedMetadata(metadata);
				})
				.catch(error => {
					console.error('Error al cargar metadatos mejorados:', error);
					setEnhancedMetadata([]);
				})
				.finally(() => {
					setIsLoadingMetadata(false);
				});
		} else {
			setEnhancedMetadata([]);
			setIsLoadingMetadata(false);
		}
	}, [selectedItems]);

	// Determinar qué mostrar basado en la selección
	const displayData = useMemo(() => {
		if (selectedItems.length === 0) {
			return { type: 'empty' };
		}

		if (selectedItems.length === 1) {
			return { type: 'single', item: selectedItems[0] };
		}

		return { type: 'multiple', items: selectedItems };
	}, [selectedItems]);

	// Panel vacío
	if (displayData.type === 'empty') {
		return (
			<div
				className={cn('details-panel bg-background border-l p-4 h-full flex items-center justify-center overflow-hidden', className)}
			>
				<div className="text-center text-muted-foreground">
					<ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
					<p className="text-sm">Selecciona un elemento para ver sus detalles</p>
				</div>
			</div>
		);
	}

	// Panel para múltiples elementos
	if (displayData.type === 'multiple' && 'items' in displayData && displayData.items) {
		const items = displayData.items; // Variable local para TypeScript
		const totalSize = items.reduce((acc, item) => {
			return acc + ('size' in item && typeof item.size === 'number' ? item.size : 0);
		}, 0);

		return (
			<div className={cn('details-panel bg-background border-l h-full flex flex-col overflow-hidden', className)}>
				<div className="p-4 border-b">
					<h2 className="text-lg font-semibold">Múltiples elementos</h2>
					<p className="text-sm text-muted-foreground">{items.length} elementos seleccionados</p>
				</div>

				<ScrollArea className="flex-1 p-4">
					<div className="space-y-4">
						{/* Estadísticas generales */}
						<div className="grid grid-cols-2 gap-4">
							<div className="text-center p-3 border rounded-lg">
								<div className="text-2xl font-bold">{items.length}</div>
								<div className="text-xs text-muted-foreground">Elementos</div>
							</div>
							<div className="text-center p-3 border rounded-lg">
								<div className="text-2xl font-bold">{formatFileSize(totalSize)}</div>
								<div className="text-xs text-muted-foreground">Tamaño total</div>
							</div>
						</div>

						{/* Lista de elementos */}
						<div className="space-y-2">
							<h3 className="text-sm font-medium">Elementos seleccionados</h3>
							{items.map((item) => {
								const EntityIcon = getEntityIcon(item.entityType || 'file');
								return (
									<div key={item.id} className="flex items-center gap-2 p-2 border rounded-lg">
										<EntityIcon className="h-4 w-4 text-muted-foreground" />
										<span className="text-sm truncate flex-1">{'name' in item ? item.name : 'Sin nombre'}</span>
										{'size' in item && typeof item.size === 'number' && (
											<span className="text-xs text-muted-foreground">{formatFileSize(item.size)}</span>
										)}
									</div>
								);
							})}
						</div>
					</div>
				</ScrollArea>
			</div>
		);
	}

	// Panel para un solo elemento
	if (displayData.type !== 'single' || !('item' in displayData) || !displayData.item) {
		return null;
	}

	const item = displayData.item;
	const mainImageUrl = getMainImageUrl(item);
	const basicMetadata = getBasicMetadata(item);
	const relatedEntities = getRelatedEntities(item);
	const detailedMetadata = getDetailedMetadata(item, enhancedMetadata);
	const EntityIcon = getEntityIcon(item.entityType || 'file');

	return (
			<div className={cn('details-panel bg-background border-l h-full flex flex-col overflow-hidden', className)}>
				{/* Header */}
				<div className="p-4 border-b flex-shrink-0">
					<div className="flex items-center gap-2 mb-2">
						<EntityIcon className="h-5 w-5 text-muted-foreground" />
						<h2 className="text-lg font-semibold truncate">{'name' in item ? item.name : 'Sin nombre'}</h2>
					</div>
					{'description' in item && item.description && (
						<p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
					)}
				</div>

				<ScrollArea className="flex-1 h-0">
					<div className="p-3 space-y-4 w-full overflow-hidden">
					{/* Imagen principal */}
					{mainImageUrl && (
						<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
							<div className="w-full max-w-full">
								<AspectRatio ratio={16 / 9} className="bg-muted rounded-lg overflow-hidden w-full">
									<img
										src={mainImageUrl}
										alt={'name' in item ? item.name || 'Sin nombre' : 'Sin nombre'}
										className="object-contain w-full h-full"
										loading="lazy"
									/>
								</AspectRatio>
							</div>
						</motion.div>
					)}

					{/* Toolbar de acciones */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3, delay: 0.1 }}
						className="flex items-center gap-2"
					>
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button variant="outline" size="icon">
										<Copy className="h-4 w-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Copiar</TooltipContent>
							</Tooltip>

							<Tooltip>
								<TooltipTrigger asChild>
									<Button variant="outline" size="icon">
										<Download className="h-4 w-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Descargar</TooltipContent>
							</Tooltip>

							<Tooltip>
								<TooltipTrigger asChild>
									<Button variant="outline" size="icon">
										<Heart
											className={cn('h-4 w-4', 'isFavorite' in item && item.isFavorite && 'fill-red-500 text-red-500')}
										/>
									</Button>
								</TooltipTrigger>
								<TooltipContent>Favorito</TooltipContent>
							</Tooltip>

							<Tooltip>
								<TooltipTrigger asChild>
									<Button variant="outline" size="icon">
										<Edit className="h-4 w-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Editar</TooltipContent>
							</Tooltip>

							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="outline" size="icon">
										<MoreHorizontal className="h-4 w-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent>
									<DropdownMenuItem>
										<Edit className="h-4 w-4 mr-2" />
										Renombrar
									</DropdownMenuItem>
									<DropdownMenuItem>
										<Copy className="h-4 w-4 mr-2" />
										Duplicar
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem className="text-destructive">
										<Trash2 className="h-4 w-4 mr-2" />
										Eliminar
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</TooltipProvider>
					</motion.div>

					{/* Información básica */}
					{basicMetadata.length > 0 && (
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3, delay: 0.2 }}
							className="space-y-3"
						>
							<h3 className="text-sm font-medium">Información básica</h3>
							<div className="space-y-2">
								{basicMetadata.map(({ key, value, icon: Icon }) => (
									<div key={key} className="flex items-center justify-between text-sm">
										<div className="flex items-center gap-2 text-muted-foreground">
											<Icon className="h-4 w-4" />
											{key}
										</div>
										<span className="font-medium">{value}</span>
									</div>
								))}
							</div>
						</motion.div>
					)}

					{/* Entidades relacionadas */}
					{relatedEntities.length > 0 && (
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3, delay: 0.3 }}
							className="space-y-3"
						>
							<h3 className="text-sm font-medium">Entidades relacionadas</h3>
							<div className="flex flex-wrap gap-2">
								{relatedEntities.map(({ type, count, icon: Icon, color }) => (
									<Badge key={type} variant="secondary" className={cn('gap-1', color)}>
										<Icon className="h-3 w-3" />
										{count} {type}
									</Badge>
								))}
							</div>
						</motion.div>
					)}

					{/* Metadatos detallados organizados por categorías */}
					{detailedMetadata.length > 0 && (() => {
						// Agrupar metadatos por categoría
						const groupedMetadata = detailedMetadata.reduce((acc, item) => {
							const category = item.category || 'general';
							if (!acc[category]) acc[category] = [];
							acc[category].push(item);
							return acc;
						}, {} as Record<string, typeof detailedMetadata>);

						// Orden de prioridad para categorías
						const categoryOrder = ['ia', 'exif', 'iptc', 'xmp', 'técnico', 'general', 'error'];
						const categoryNames = {
							'ia': '🤖 Metadatos de IA',
							'exif': '📷 EXIF (Cámara)',
							'iptc': '📝 IPTC (Editorial)',
							'xmp': '🏷️ XMP (Extensibles)',
							'técnico': '⚙️ Técnico',
							'general': '📊 General',
							'error': '⚠️ Errores'
						};

						const sortedCategories = categoryOrder.filter(cat => groupedMetadata[cat]);

						return (
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.3, delay: 0.4 }}
								className="space-y-4"
							>
								<h3 className="text-sm font-medium">Metadatos detallados</h3>

								{sortedCategories.map((category) => (
									<div key={category} className="space-y-2">
										<h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b pb-1">
											{categoryNames[category as keyof typeof categoryNames] || category}
										</h4>
										<div className="space-y-3 pl-1">
											{groupedMetadata[category].map(({ key, value }) => (
																<div key={`${category}-${key}-${value.substring(0, 20)}`} className="flex flex-col gap-1 w-full min-w-0">
																	<span className="text-xs text-muted-foreground font-medium truncate">{key}</span>
																	<span className={cn(
																		"text-sm break-words overflow-wrap-anywhere leading-relaxed w-full min-w-0",
																		category === 'ia' && "text-blue-600 dark:text-blue-400",
																		category === 'error' && "text-red-600 dark:text-red-400"
																	)}>
																		{value}
																	</span>
																</div>
														))}
										</div>
									</div>
								))}
							</motion.div>
						);
					})()}

					{/* Botones de exportación de metadatos */}
					{detailedMetadata.length > 0 && (
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3, delay: 0.5 }}
							className="space-y-3 pt-4 border-t"
						>
							<h3 className="text-sm font-medium">Exportar metadatos</h3>
							<div className="flex gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => {
										const filename = 'path' in item ?
											`${item.path.split(/[/\\]/).pop()?.replace(/\.[^/.]+$/, '')}_metadata` :
											`${item.name}_metadata`;
										exportToCSV(detailedMetadata, filename);
									}}
									className="flex-1"
								>
									<Download className="h-4 w-4 mr-2" />
									CSV
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => {
										const filename = 'path' in item ?
											`${item.path.split(/[/\\]/).pop()?.replace(/\.[^/.]+$/, '')}_metadata` :
											`${item.name}_metadata`;
										exportToJSON(detailedMetadata, filename);
									}}
									className="flex-1"
								>
									<Download className="h-4 w-4 mr-2" />
									JSON
								</Button>
							</div>
						</motion.div>
					)}
				</div>
			</ScrollArea>
		</div>
	);
};

// Alias para compatibilidad
// Alias para compatibilidad
export const DetailsPanelV2 = DetailsPanel;

export default DetailsPanel;
