/**
 * Servicio completo para extraer metadatos usando ExifR
 * Extrae EXIF, IPTC, XMP y metadatos de IA de forma completa
 */

import exifr from 'exifr';
import { serverLogger } from '@/lib/logger/server-logger';
import type { ExifData, IptcData, TechnicalMetadata, XmpData } from '@/types/metadata-origin.types';

const logger = serverLogger.withContext('ExifRService');

/**
 * Opciones completas para extracción de metadatos
 */
const EXTRACTION_OPTIONS = {
	// Tipos de metadatos a extraer
	exif: true,
	iptc: true,
	xmp: true,
	tiff: true,
	icc: true,
	jfif: true,
	ihdr: true, // PNG headers

	// PNG text chunks específicos para metadatos de IA
	png: true,
	text: true, // PNG tEXt chunks
	ztxt: true, // PNG zTXt chunks (compressed)
	itxt: true, // PNG iTXt chunks (international)

	// Asegurar que se extraigan campos que pueden contener metadatos de IA
	userComment: true,
	comment: true,
	description: true,

	// Configuración adicional
	translateKeys: false, // Mantener nombres originales de campos
	translateValues: false,
	reviveValues: false,
	sanitize: false, // No sanitizar para mantener datos de IA
	mergeOutput: false, // Mantener separados EXIF/IPTC/XMP
	silentErrors: true,
};

/**
 * Extrae metadatos completos de un archivo de imagen
 */
export async function extractMetadata(buffer: Buffer): Promise<TechnicalMetadata | null> {
	try {
		logger.info('🔧 EXIFR PARSER: Iniciando extracción de metadatos', { bufferSize: buffer.length });

		// Extraer todos los tipos de metadatos
		const rawMetadata = await exifr.parse(buffer, EXTRACTION_OPTIONS);

		logger.info('🔧 EXIFR PARSER: Resultado de exifr.parse', {
			hasData: !!rawMetadata,
			type: typeof rawMetadata,
			keys: rawMetadata ? Object.keys(rawMetadata) : 'null',
		});

		if (!rawMetadata) {
			logger.warn('🔧 EXIFR PARSER: No se encontraron metadatos - retornando null');
			return null;
		}

		logger.info('🔧 EXIFR PARSER: Metadatos raw extraídos', {
			keys: Object.keys(rawMetadata),
			hasExif: !!rawMetadata.exif,
			hasIptc: !!rawMetadata.iptc,
			hasXmp: !!rawMetadata.xmp,
			firstFewFields: Object.keys(rawMetadata).slice(0, 10),
		});

		// Procesar EXIF
		logger.info('🔧 EXIFR PARSER: Procesando EXIF...');
		const exifData = extractExifData(rawMetadata);
		logger.info('🔧 EXIFR PARSER: EXIF procesado', { fields: Object.keys(exifData).length });

		// Procesar IPTC
		logger.info('🔧 EXIFR PARSER: Procesando IPTC...');
		const iptcData = extractIptcData(rawMetadata);
		logger.info('🔧 EXIFR PARSER: IPTC procesado', { fields: Object.keys(iptcData).length });

		// Procesar XMP
		logger.info('🔧 EXIFR PARSER: Procesando XMP...');
		const xmpData = extractXmpData(rawMetadata);
		logger.info('🔧 EXIFR PARSER: XMP procesado', { fields: Object.keys(xmpData).length });

		const result: TechnicalMetadata = {
			exif: Object.keys(exifData).length > 0 ? exifData : undefined,
			iptc: Object.keys(iptcData).length > 0 ? iptcData : undefined,
			xmp: Object.keys(xmpData).length > 0 ? xmpData : undefined,
			rawTags: rawMetadata, // Mantener datos raw para análisis de IA
		};

		logger.info('🔧 EXIFR PARSER: Metadatos extraídos exitosamente', {
			hasExif: !!result.exif,
			hasIptc: !!result.iptc,
			hasXmp: !!result.xmp,
			exifFields: result.exif ? Object.keys(result.exif).length : 0,
			iptcFields: result.iptc ? Object.keys(result.iptc).length : 0,
			xmpFields: result.xmp ? Object.keys(result.xmp).length : 0,
			resultType: typeof result,
			resultKeys: Object.keys(result),
		});

		return result;
	} catch (error) {
		logger.error('🔧 EXIFR PARSER: Error extrayendo metadatos', {
			error,
			stack: error instanceof Error ? error.stack : undefined,
		});
		return null;
	}
}

/**
 * Extrae y procesa datos EXIF incluyendo PNG text chunks
 */
function extractExifData(rawMetadata: any): Partial<ExifData> {
	const data: Partial<ExifData> = {};

	// Extraer PNG text chunks si están disponibles
	if (rawMetadata.png || rawMetadata.text || rawMetadata.ztxt || rawMetadata.itxt) {
		logger.info('🔧 EXIFR PARSER: Detectados PNG text chunks', {
			hasPng: !!rawMetadata.png,
			hasText: !!rawMetadata.text,
			hasZtxt: !!rawMetadata.ztxt,
			hasItxt: !!rawMetadata.itxt
		});

		// Extraer chunks de texto PNG que pueden contener metadatos de IA
		const pngChunks = {
			...rawMetadata.png,
			...rawMetadata.text,
			...rawMetadata.ztxt,
			...rawMetadata.itxt
		};

		// Buscar campos específicos de IA en PNG chunks
		const aiFields = ['parameters', 'Parameters', 'prompt', 'Prompt', 'workflow', 'Workflow', 'Comment', 'Description'];
		for (const field of aiFields) {
			if (pngChunks[field]) {
				(data as any)[field] = pngChunks[field];
				logger.info(`🔧 EXIFR PARSER: PNG chunk encontrado: ${field}`, {
					value: typeof pngChunks[field] === 'string' ? pngChunks[field].substring(0, 100) + '...' : pngChunks[field]
				});
			}
		}

		// Agregar todos los chunks PNG como campos adicionales
		Object.keys(pngChunks).forEach(key => {
			if (!aiFields.includes(key)) {
				(data as any)[`png_${key}`] = pngChunks[key];
			}
		});
	}

	// Información básica de la imagen
	if (rawMetadata.ImageWidth) data.imageWidth = rawMetadata.ImageWidth;
	if (rawMetadata.ExifImageWidth) data.imageWidth = rawMetadata.ExifImageWidth;
	if (rawMetadata.ImageHeight) data.imageHeight = rawMetadata.ImageHeight;
	if (rawMetadata.ExifImageHeight) data.imageHeight = rawMetadata.ExifImageHeight;
	if (rawMetadata.Orientation) data.orientation = rawMetadata.Orientation;

	// Información de la cámara
	if (rawMetadata.Make) data.make = rawMetadata.Make;
	if (rawMetadata.Model) data.model = rawMetadata.Model;
	if (rawMetadata.Software) data.software = rawMetadata.Software;

	// Configuración de captura
	if (rawMetadata.ExposureTime) data.exposureTime = rawMetadata.ExposureTime;
	if (rawMetadata.FNumber) data.fNumber = rawMetadata.FNumber;
	if (rawMetadata.ISO || rawMetadata.ISOSpeedRatings) data.iso = rawMetadata.ISO || rawMetadata.ISOSpeedRatings;
	if (rawMetadata.FocalLength) data.focalLength = rawMetadata.FocalLength;

	// Fechas
	if (rawMetadata.DateTime) data.dateTime = rawMetadata.DateTime;
	if (rawMetadata.DateTimeOriginal) data.dateTimeOriginal = rawMetadata.DateTimeOriginal;
	if (rawMetadata.DateTimeDigitized) data.dateTimeDigitized = rawMetadata.DateTimeDigitized;

	// Información técnica
	if (rawMetadata.ColorSpace) data.colorSpace = rawMetadata.ColorSpace;
	if (rawMetadata.WhiteBalance) data.whiteBalance = rawMetadata.WhiteBalance;
	if (rawMetadata.Flash) data.flash = rawMetadata.Flash;
	if (rawMetadata.MeteringMode) data.meteringMode = rawMetadata.MeteringMode;

	// GPS si está disponible
	if (rawMetadata.latitude && rawMetadata.longitude) {
		data.gps = {
			latitude: rawMetadata.latitude,
			longitude: rawMetadata.longitude,
			altitude: rawMetadata.GPSAltitude,
			latitudeRef: rawMetadata.GPSLatitudeRef,
			longitudeRef: rawMetadata.GPSLongitudeRef,
			altitudeRef: rawMetadata.GPSAltitudeRef,
			timestamp: rawMetadata.GPSTimeStamp,
			datestamp: rawMetadata.GPSDateStamp,
		};
	}

	// Información de archivo
	if (rawMetadata.Compression) data.compression = rawMetadata.Compression;
	if (rawMetadata.XResolution) data.xResolution = rawMetadata.XResolution;
	if (rawMetadata.YResolution) data.yResolution = rawMetadata.YResolution;
	if (rawMetadata.ResolutionUnit) data.resolutionUnit = rawMetadata.ResolutionUnit;

	return data;
}

/**
 * Extrae y procesa datos IPTC
 */
function extractIptcData(rawMetadata: any): Partial<IptcData> {
	const data: Partial<IptcData> = {};
	const iptc = rawMetadata.iptc || rawMetadata;

	// Información de identificación
	if (iptc.ObjectName || iptc.Title) data.title = iptc.ObjectName || iptc.Title;
	if (iptc.Caption || iptc.Description) data.description = iptc.Caption || iptc.Description;
	if (iptc.Keywords) {
		data.keywords = Array.isArray(iptc.Keywords) ? iptc.Keywords : [iptc.Keywords];
	}

	// Información de autoría
	if (iptc.Byline || iptc.Author) data.byline = iptc.Byline || iptc.Author;
	if (iptc.BylineTitle) data.bylineTitle = iptc.BylineTitle;
	if (iptc.Credit) data.credit = iptc.Credit;
	if (iptc.Source) data.source = iptc.Source;
	if (iptc.Copyright || iptc.CopyrightNotice) data.copyright = iptc.Copyright || iptc.CopyrightNotice;

	// Información editorial
	if (iptc.Headline) data.headline = iptc.Headline;
	if (iptc.Urgency) data.urgency = iptc.Urgency;
	if (iptc.Category) data.category = iptc.Category;
	if (iptc.SupplementalCategories) {
		data.supplementalCategories = Array.isArray(iptc.SupplementalCategories)
			? iptc.SupplementalCategories
			: [iptc.SupplementalCategories];
	}

	// Información de fecha y ubicación
	if (iptc.DateCreated) data.dateCreated = iptc.DateCreated;
	if (iptc.TimeCreated) data.timeCreated = iptc.TimeCreated;
	if (iptc.City) data.city = iptc.City;
	if (iptc.State || iptc.Province) data.state = iptc.State || iptc.Province;
	if (iptc.Country) data.country = iptc.Country;
	if (iptc.CountryCode) data.countryCode = iptc.CountryCode;

	return data;
}

/**
 * Extrae y procesa datos XMP
 */
function extractXmpData(rawMetadata: any): Partial<XmpData> {
	const data: Partial<XmpData> = {};
	const xmp = rawMetadata.xmp || rawMetadata;

	// Dublin Core
	if (xmp.title || xmp.Title) data.title = xmp.title || xmp.Title;
	if (xmp.description || xmp.Description) data.description = xmp.description || xmp.Description;
	if (xmp.subject || xmp.Subject) {
		data.subject = Array.isArray(xmp.subject || xmp.Subject)
			? xmp.subject || xmp.Subject
			: [xmp.subject || xmp.Subject];
	}
	if (xmp.creator || xmp.Creator) {
		data.creator = Array.isArray(xmp.creator || xmp.Creator)
			? xmp.creator || xmp.Creator
			: [xmp.creator || xmp.Creator];
	}
	if (xmp.rights || xmp.Rights) data.rights = xmp.rights || xmp.Rights;

	// Adobe XMP
	if (xmp.Rating) data.rating = xmp.Rating;
	if (xmp.CreateDate) data.createDate = xmp.CreateDate;
	if (xmp.ModifyDate) data.modifyDate = xmp.ModifyDate;
	if (xmp.CreatorTool) data.creatorTool = xmp.CreatorTool;

	// Adobe Photoshop
	if (xmp.ColorMode) data.photoshopColorMode = xmp.ColorMode;
	if (xmp.ICCProfile) data.photoshopICCProfile = xmp.ICCProfile;
	if (xmp.History) data.photoshopHistory = xmp.History;

	// Metadatos personalizados (incluyendo posibles metadatos de IA)
	const customFields: Record<string, any> = {};

	// Buscar campos que pueden contener metadatos de IA
	const aiFields = [
		'parameters',
		'Parameters',
		'Comment',
		'UserComment',
		'Description',
		'Software',
		'ImageDescription',
		'prompt',
		'Prompt',
		'workflow',
		'Workflow',
		'steps',
		'Steps',
		'cfg_scale',
		'cfg',
		'CFG',
		'sampler',
		'Sampler',
	];

	for (const field of aiFields) {
		if (xmp[field] !== undefined) {
			customFields[field] = xmp[field];
		}
	}

	if (Object.keys(customFields).length > 0) {
		data.customFields = customFields;
	}

	return data;
}

/**
 * Función auxiliar para detección rápida de metadatos
 */
export async function hasMetadata(buffer: Buffer): Promise<boolean> {
	try {
		const metadata = await exifr.parse(buffer, EXTRACTION_OPTIONS);
		return !!metadata && Object.keys(metadata).length > 0;
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
	try {
		const customOptions = {
			...EXTRACTION_OPTIONS,
			exif: options.exif ?? true,
			iptc: options.iptc ?? true,
			xmp: options.xmp ?? true,
		};

		const rawMetadata = await exifr.parse(buffer, customOptions);

		if (!rawMetadata) {
			return {};
		}

		const result: Partial<TechnicalMetadata> = {};

		if (options.exif !== false) {
			const exifData = extractExifData(rawMetadata);
			if (Object.keys(exifData).length > 0) {
				result.exif = exifData;
			}
		}

		if (options.iptc !== false) {
			const iptcData = extractIptcData(rawMetadata);
			if (Object.keys(iptcData).length > 0) {
				result.iptc = iptcData;
			}
		}

		if (options.xmp !== false) {
			const xmpData = extractXmpData(rawMetadata);
			if (Object.keys(xmpData).length > 0) {
				result.xmp = xmpData;
			}
		}

		return result;
	} catch (error) {
		logger.error('Error en extracción específica de metadatos', { error });
		return {};
	}
}

/**
 * Función para extraer solo campos que pueden contener metadatos de IA
 */
export async function extractAIRelevantFields(buffer: Buffer): Promise<Record<string, any>> {
	try {
		logger.debug('Extrayendo campos relevantes para IA');

		const rawMetadata = await exifr.parse(buffer, EXTRACTION_OPTIONS);

		if (!rawMetadata) {
			return {};
		}

		const aiFields: Record<string, any> = {};

		// Campos EXIF que pueden contener datos de IA
		const exifAIFields = [
			'Software',
			'UserComment',
			'ImageDescription',
			'Comment',
			'Make',
			'Model',
			'Artist',
			'Copyright',
		];

		for (const field of exifAIFields) {
			if (rawMetadata[field]) {
				aiFields[field] = rawMetadata[field];
			}
		}

		// Campos IPTC que pueden contener datos de IA
		if (rawMetadata.iptc) {
			const iptcAIFields = [
				'Caption',
				'Description',
				'Keywords',
				'Title',
				'ObjectName',
				'Byline',
				'Credit',
				'Source',
				'Copyright',
			];

			for (const field of iptcAIFields) {
				if (rawMetadata.iptc[field]) {
					aiFields[`iptc:${field}`] = rawMetadata.iptc[field];
				}
			}
		}

		// Campos XMP que pueden contener datos de IA
		if (rawMetadata.xmp) {
			const xmpAIFields = [
				'description',
				'Description',
				'title',
				'Title',
				'subject',
				'Subject',
				'creator',
				'Creator',
				'CreatorTool',
				'parameters',
				'Parameters',
				'prompt',
				'Prompt',
				'workflow',
				'Workflow',
			];

			for (const field of xmpAIFields) {
				if (rawMetadata.xmp[field]) {
					aiFields[`xmp:${field}`] = rawMetadata.xmp[field];
				}
			}
		}

		logger.debug('Campos AI extraídos', {
			fieldCount: Object.keys(aiFields).length,
			fields: Object.keys(aiFields),
		});

		return aiFields;
	} catch (error) {
		logger.error('Error extrayendo campos AI', { error });
		return {};
	}
}
