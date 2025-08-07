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
		const exifData = await exifr.parse(buffer, {
			// EXIF básico
			ifd0: true,
			ifd1: true,
			exif: true,
			gps: true,
			interop: true,
		});

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

			// Metadatos técnicos adicionales
			colorSpace: exifData.ColorSpace || undefined,
			compression: exifData.Compression || undefined,
			photometricInterpretation: exifData.PhotometricInterpretation || undefined,
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
		const iptcData = await exifr.parse(buffer, {
			iptc: true,
		});

		if (!(iptcData && iptcData.iptc)) {
			return null;
		}

		const iptc = iptcData.iptc;

		return {
			// Información del objeto
			headline: iptc.Headline || undefined,
			caption: iptc.Caption || iptc['Caption-Abstract'] || undefined,
			keywords: iptc.Keywords || undefined,

			// Creador
			byline: iptc.Byline || iptc['By-line'] || undefined,
			bylineTitle: iptc.BylineTitle || iptc['By-line Title'] || undefined,
			credit: iptc.Credit || undefined,
			source: iptc.Source || undefined,

			// Copyright
			copyrightNotice: iptc.CopyrightNotice || iptc['Copyright Notice'] || undefined,

			// Fechas
			dateCreated: iptc.DateCreated || iptc['Date Created'] || undefined,
			timeCreated: iptc.TimeCreated || iptc['Time Created'] || undefined,

			// Ubicación
			city: iptc.City || undefined,
			provinceState: iptc.ProvinceState || iptc['Province-State'] || undefined,
			countryName: iptc.CountryName || iptc['Country-Primary Location Name'] || undefined,
			countryCode: iptc.CountryCode || iptc['Country-Primary Location Code'] || undefined,

			// Categorización
			category: iptc.Category || undefined,
			supplementalCategories: iptc.SupplementalCategories || iptc['Supplemental Categories'] || undefined,
			urgency: iptc.Urgency || undefined,

			// Identificación
			objectName: iptc.ObjectName || iptc['Object Name'] || undefined,
			specialInstructions: iptc.SpecialInstructions || iptc['Special Instructions'] || undefined,
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
		const xmpData = await exifr.parse(buffer, {
			xmp: true,
		});

		if (!(xmpData && xmpData.xmp)) {
			return null;
		}

		const xmp = xmpData.xmp;

		return {
			// Dublin Core
			title: xmp.title || xmp['dc:title'] || undefined,
			description: xmp.description || xmp['dc:description'] || undefined,
			subject: xmp.subject || xmp['dc:subject'] || undefined,
			creator: xmp.creator || xmp['dc:creator'] || undefined,
			rights: xmp.rights || xmp['dc:rights'] || undefined,

			// XMP Rights Management
			marked: xmp.marked || xmp['xmpRights:Marked'] || undefined,
			webStatement: xmp.webStatement || xmp['xmpRights:WebStatement'] || undefined,

			// Photoshop
			instructions: xmp.instructions || xmp['photoshop:Instructions'] || undefined,
			headline: xmp.headline || xmp['photoshop:Headline'] || undefined,
			captionWriter: xmp.captionWriter || xmp['photoshop:CaptionWriter'] || undefined,

			// Camera Raw
			rawFileName: xmp.rawFileName || xmp['crs:RawFileName'] || undefined,
			version: xmp.version || xmp['crs:Version'] || undefined,

			// Metadatos específicos de IA (pueden estar en XMP)
			aiMetadata: extractAIMetadataFromXmp(xmp),
		};
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
		const hasExif = await exifr.parse(buffer, { ifd0: true, exif: true });
		const hasIptc = await exifr.parse(buffer, { iptc: true });
		const hasXmp = await exifr.parse(buffer, { xmp: true });

		return !!(hasExif || hasIptc || hasXmp);
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
			result.exif = await extractExifData(buffer);
		}

		if (options.iptc) {
			result.iptc = await extractIptcData(buffer);
		}

		if (options.xmp) {
			result.xmp = await extractXmpData(buffer);
		}
	} catch (error) {
		logger.error('Error en extracción específica de metadatos', { error });
	}

	return result;
}
