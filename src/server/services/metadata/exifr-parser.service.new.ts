/**
 * Servicio para extraer metadatos EXIF, IPTC y XMP usando ExifR
 * Proporciona acceso a metadatos técnicos detallados de imágenes
 */

import exifr from 'exifr';
import { serverLogger } from '@/lib/logger/server-logger';
import type { ExifData, IptcData, TechnicalMetadata, XmpData } from '@/types/metadata-origin.types';

const logger = serverLogger.withContext('ExifRService');

/**
 * Extrae metadatos EXIF, IPTC y XMP de un archivo de imagen
 */
export async function extractMetadata(buffer: Buffer): Promise<TechnicalMetadata | null> {
	try {
		logger.debug('Extrayendo metadatos con ExifR', { bufferSize: buffer.length });

		// Extraer todos los tipos de metadatos en paralelo
		const [exifData, iptcData, xmpData] = await Promise.all([
			extractExifData(buffer),
			extractIptcData(buffer),
			extractXmpData(buffer),
		]);

		if (!(exifData || iptcData || xmpData)) {
			logger.debug('No se encontraron metadatos');
			return null;
		}

		logger.info('Metadatos extraídos exitosamente', {
			hasExif: !!exifData,
			hasIptc: !!iptcData,
			hasXmp: !!xmpData,
		});

		return {
			exif: exifData || undefined,
			iptc: iptcData || undefined,
			xmp: xmpData || undefined,
		};
	} catch (error) {
		logger.error('Error extrayendo metadatos', { error });
		return null;
	}
}

/**
 * Extrae datos EXIF específicos
 */
async function extractExifData(buffer: Buffer): Promise<ExifData | null> {
	try {
		// Obtener todos los tags disponibles y seleccionar los relevantes para nuestro ExifData
		const exifData = await exifr.parse(buffer);

		if (!exifData) {
			return null;
		}

		return {
			// Información básica
			make: exifData.Make || undefined,
			model: exifData.Model || undefined,
			software: exifData.Software || undefined,
			dateTime: exifData.DateTime || undefined,
			dateTimeOriginal: exifData.DateTimeOriginal || undefined,
			dateTimeDigitized: exifData.DateTimeDigitized || undefined,

			// Dimensiones
			imageWidth: exifData.ImageWidth || exifData.ExifImageWidth || undefined,
			imageHeight: exifData.ImageHeight || exifData.ExifImageHeight || undefined,

			// Configuración de cámara
			exposureTime: exifData.ExposureTime || undefined,
			fNumber: exifData.FNumber || undefined,
			iso: exifData.ISO || exifData.ISOSpeedRatings || undefined,
			focalLength: exifData.FocalLength || undefined,
			flash: exifData.Flash || undefined,
			whiteBalance: exifData.WhiteBalance || undefined,

			// Orientación
			orientation: exifData.Orientation || undefined,

			// GPS (si está disponible)
			gps:
				exifData.latitude && exifData.longitude
					? {
							latitude: exifData.latitude,
							longitude: exifData.longitude,
							altitude: exifData.GPSAltitude || undefined,
						}
					: undefined,

			// Metadatos técnicos adicionales compatibles con nuestros tipos
			colorSpace: exifData.ColorSpace || undefined,
			compression: exifData.Compression || undefined,
			xResolution: exifData.XResolution || undefined,
			yResolution: exifData.YResolution || undefined,
			resolutionUnit: exifData.ResolutionUnit || undefined,
		};
	} catch (error) {
		logger.debug('Error extrayendo datos EXIF', { error });
		return null;
	}
}

/**
 * Extrae datos IPTC específicos
 */
async function extractIptcData(buffer: Buffer): Promise<IptcData | null> {
	try {
		const iptcData = await exifr.parse(buffer);

		if (!(iptcData && (iptcData as any).iptc)) {
			return null;
		}

		const iptc = (iptcData as any).iptc;

		return {
			// Identificación y contenido
			title: iptc.ObjectName || iptc['Object Name'] || iptc.Headline || undefined,
			description: iptc.Caption || iptc['Caption-Abstract'] || undefined,
			keywords: iptc.Keywords || undefined,

			// Creador
			byline: iptc.Byline || iptc['By-line'] || undefined,
			bylineTitle: iptc.BylineTitle || iptc['By-line Title'] || undefined,
			credit: iptc.Credit || undefined,
			source: iptc.Source || undefined,
			copyright: iptc.CopyrightNotice || iptc['Copyright Notice'] || undefined,

			// Fechas y ubicación
			dateCreated: iptc.DateCreated || iptc['Date Created'] || undefined,
			timeCreated: iptc.TimeCreated || iptc['Time Created'] || undefined,
			city: iptc.City || undefined,
			state: iptc.ProvinceState || iptc['Province-State'] || undefined,
			country: iptc.CountryName || iptc['Country-Primary Location Name'] || undefined,
			countryCode: iptc.CountryCode || iptc['Country-Primary Location Code'] || undefined,

			// Categorización
			category: iptc.Category || undefined,
			supplementalCategories: iptc.SupplementalCategories || iptc['Supplemental Categories'] || undefined,
			urgency: iptc.Urgency || undefined,
		};
	} catch (error) {
		logger.debug('Error extrayendo datos IPTC', { error });
		return null;
	}
}

/**
 * Extrae datos XMP específicos
 */
async function extractXmpData(buffer: Buffer): Promise<XmpData | null> {
	try {
		const xmpData = await exifr.parse(buffer);

		if (!(xmpData && (xmpData as any).xmp)) {
			return null;
		}

		const xmp = (xmpData as any).xmp;

		const result: XmpData = {
			// Dublin Core
			title: xmp.title || xmp['dc:title'] || undefined,
			description: xmp.description || xmp['dc:description'] || undefined,
			subject: xmp.subject || xmp['dc:subject'] || undefined,
			creator: xmp.creator || xmp['dc:creator'] || undefined,
			rights: xmp.rights || xmp['dc:rights'] || undefined,

			// Adobe XMP
			creatorTool: xmp['xmp:CreatorTool'] || xmp.creatorTool || undefined,
			rating: xmp['xmp:Rating'] || xmp.rating || undefined,
			createDate: xmp['xmp:CreateDate'] || xmp.createDate || undefined,
			modifyDate: xmp['xmp:ModifyDate'] || xmp.modifyDate || undefined,

			// Adobe Photoshop
			photoshopColorMode: xmp['photoshop:ColorMode'] || undefined,
			photoshopICCProfile: xmp['photoshop:ICCProfile'] || undefined,
			photoshopHistory: xmp['photoshop:History'] || undefined,

			// Camera Raw
			cameraRawSettings: xmp['crs:Settings'] || undefined,

			// Metadatos personalizados
			customFields: {},
		};

		// Campos adicionales no modelados explícitamente
		const rightsMarked = xmp.marked || xmp['xmpRights:Marked'];
		const rightsWeb = xmp.webStatement || xmp['xmpRights:WebStatement'];
		const ai = extractAIMetadataFromXmp(xmp);
		if (rightsMarked !== undefined) {
			(result.customFields as any).rightsMarked = rightsMarked;
		}
		if (rightsWeb !== undefined) {
			(result.customFields as any).rightsWebStatement = rightsWeb;
		}
		if (ai) {
			(result.customFields as any).aiMetadata = ai;
		}

		return result;
	} catch (error) {
		logger.debug('Error extrayendo datos XMP', { error });
		return null;
	}
}

/**
 * Busca metadatos de IA en datos XMP
 */
function extractAIMetadataFromXmp(xmp: any): Record<string, any> | undefined {
	const aiFields: Record<string, any> = {};

	// Buscar campos comunes de IA en XMP
	const aiPatterns = [
		'parameters',
		'prompt',
		'negative_prompt',
		'steps',
		'cfg_scale',
		'seed',
		'sampler',
		'model',
		'workflow',
	];

	for (const [key, value] of Object.entries(xmp)) {
		const lowerKey = key.toLowerCase();
		if (aiPatterns.some((pattern) => lowerKey.includes(pattern))) {
			aiFields[key] = value;
		}
	}

	return Object.keys(aiFields).length > 0 ? aiFields : undefined;
}

/**
 * Función auxiliar para detección rápida de metadatos
 */
export async function hasMetadata(buffer: Buffer): Promise<boolean> {
	try {
		const data = await exifr.parse(buffer);
		return !!(data && (data.Make || (data as any).iptc || (data as any).xmp));
	} catch {
		return false;
	}
}

/**
 * Función para extraer solo metadatos específicos (para optimización)
 */
export async function extractSpecificMetadata(
	buffer: Buffer,
	options: {
		exif?: boolean;
		iptc?: boolean;
		xmp?: boolean;
	} = { exif: true, iptc: true, xmp: true }
): Promise<Partial<TechnicalMetadata>> {
	const result: Partial<TechnicalMetadata> = {};

	try {
		if (options.exif) {
			result.exif = (await extractExifData(buffer)) ?? undefined;
		}

		if (options.iptc) {
			result.iptc = (await extractIptcData(buffer)) ?? undefined;
		}

		if (options.xmp) {
			result.xmp = (await extractXmpData(buffer)) ?? undefined;
		}
	} catch (error) {
		logger.error('Error en extracción específica de metadatos', { error });
	}

	return result;
}
