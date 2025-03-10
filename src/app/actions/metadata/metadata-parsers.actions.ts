'use server';

import { logger } from '@/lib/logger';
import type { FileMetadata } from '@/types/metadata';
import ExifReader, { type ExpandedTags, type Tags } from 'exifreader';
import { MetadataError, MetadataErrorCode } from './metadata-errors.actions';
import type {
	ExifTags,
	ExtendedFileMetadata,
	ImageFormat,
	MetadataWithCamera,
	SharpColourspaceEnum,
} from './metadata-types.actions';
import { withRetry } from './metadata-utils.actions';

const parserLogger = logger.withContext('MetadataParsers');

// Tipo mejorado para los datos EXIF
interface ExifData {
	Image?: Record<string, { description: string; [key: string]: unknown }>;
	GPS?: {
		GPSLatitudeRef?: { description: string };
		GPSLongitudeRef?: { description: string };
		[key: string]: unknown;
	};
	GPSLatitude?: { description: string; [key: string]: unknown };
	GPSLongitude?: { description: string; [key: string]: unknown };
	GPSAltitude?: { description: string; [key: string]: unknown };
	DateTimeOriginal?: { description: string; [key: string]: unknown };
	[key: string]: unknown;
}

/**
 * Parsea los datos EXIF de una imagen
 */
export async function parseExifData(buffer: Buffer, path: string): Promise<Partial<FileMetadata>> {
	try {
		// Verificar si el buffer parece ser un archivo binario de imagen válido
		const signatureBytes = buffer.slice(0, 8);
		const hexSignature = signatureBytes.toString('hex');

		// Solo procesar formatos de imagen que normalmente contienen datos EXIF
		const hasExifSupport =
			hexSignature.startsWith('ffd8ff') || // JPEG
			hexSignature.startsWith('49492a00') || // TIFF
			hexSignature.startsWith('4d4d002a'); // TIFF (big endian)

		if (!hasExifSupport) {
			// Para formatos como PNG, GIF, etc. que no suelen tener datos EXIF tradicionales
			parserLogger.debug('Formato de imagen sin soporte EXIF tradicional:', path);
			return {
				exif: {},
				dimensions: {
					width: 0,
					height: 0,
				},
				fileSystem: {
					size: 0,
					created: new Date().toISOString(),
					modified: new Date().toISOString(),
				},
			};
		}

		// Extraer datos EXIF usando ExifReader con manejo de reintentos
		// Usamos conversión explícita para compatibilidad de tipos
		const exifData = (await withRetry<unknown>(() => ExifReader.load(buffer, { expanded: true }))) as ExifData;

		// Extraer información relevante de los datos EXIF
		const metadata: MetadataWithCamera = {
			exif: {},
			dimensions: {
				width: 0,
				height: 0,
			},
			fileSystem: {
				size: 0,
				created: new Date().toISOString(),
				modified: new Date().toISOString(),
			},
		};

		// Procesar datos básicos EXIF
		if (exifData && typeof exifData === 'object' && 'Image' in exifData && exifData.Image) {
			// Ya hemos definido el tipo apropiado en ExifData
			const imageData = exifData.Image;

			if (imageData.Make) {
				metadata.camera = {
					make: imageData.Make.description,
				};
			}

			if (imageData.Model) {
				if (!metadata.camera) {
					metadata.camera = {};
				}
				metadata.camera.model = imageData.Model.description;
			}

			// Dimensiones
			if (imageData.XResolution && imageData.YResolution) {
				metadata.dimensions = {
					width: Number.parseInt(imageData.ImageWidth?.description || '0', 10),
					height: Number.parseInt(imageData.ImageLength?.description || '0', 10),
				};
			}
		}

		// Procesamiento de datos GPS si están disponibles
		if (exifData && typeof exifData === 'object' && 'GPSLatitude' in exifData && 'GPSLongitude' in exifData) {
			try {
				// Ya hemos definido los tipos apropiados en ExifData
				const gpsLatitude = exifData.GPSLatitude?.description || '';
				const gpsLongitude = exifData.GPSLongitude?.description || '';

				// La referencia de latitud (N/S) podría estar en GPS.GPSLatitudeRef
				let gpsLatitudeRef: string | undefined = undefined;
				let gpsLongitudeRef: string | undefined = undefined;

				// Buscar en GPS.GPSLatitudeRef si existe
				if ('GPS' in exifData && exifData.GPS) {
					if (exifData.GPS.GPSLatitudeRef) {
						gpsLatitudeRef = exifData.GPS.GPSLatitudeRef.description;
					}
					if (exifData.GPS.GPSLongitudeRef) {
						gpsLongitudeRef = exifData.GPS.GPSLongitudeRef.description;
					}
				}

				// Alternativa: Intentar extraer de la propia descripción si contiene la referencia
				if (!gpsLatitudeRef && typeof gpsLatitude === 'string') {
					// La referencia suele estar al final, por ejemplo "12° 34' 56" N"
					if (gpsLatitude.endsWith('N') || gpsLatitude.endsWith('S')) {
						gpsLatitudeRef = gpsLatitude.slice(-1);
					}
				}

				if (!gpsLongitudeRef && typeof gpsLongitude === 'string') {
					if (gpsLongitude.endsWith('E') || gpsLongitude.endsWith('W')) {
						gpsLongitudeRef = gpsLongitude.slice(-1);
					}
				}

				const lat = convertDMSToDecimal(gpsLatitude, gpsLatitudeRef);
				const lng = convertDMSToDecimal(gpsLongitude, gpsLongitudeRef);

				metadata.location = { latitude: lat, longitude: lng };

				if ('GPSAltitude' in exifData && exifData.GPSAltitude) {
					const gpsAltitude = exifData.GPSAltitude.description;
					metadata.location.altitude = Number.parseFloat(gpsAltitude);
				}
			} catch (error) {
				parserLogger.warn('Error parseando datos GPS:', { path, error });
			}
		}

		// Fecha y hora
		if (exifData && typeof exifData === 'object' && 'DateTimeOriginal' in exifData && exifData.DateTimeOriginal) {
			const dateStr = exifData.DateTimeOriginal.description;
			try {
				// Formato EXIF: 'YYYY:MM:DD HH:MM:SS'
				const [datePart, timePart] = dateStr.split(' ');
				const [year, month, day] = datePart.split(':').map(Number);
				const [hour, minute, second] = timePart.split(':').map(Number);

				metadata.captureDate = new Date(year, month - 1, day, hour, minute, second).toISOString();
			} catch (error) {
				parserLogger.warn('Error parseando fecha EXIF:', { dateStr, error });
			}
		}

		return metadata;
	} catch (error) {
		parserLogger.error('Error parseando datos EXIF:', { path, error });
		throw new MetadataError('Error al procesar datos EXIF', path, MetadataErrorCode.INVALID_EXIF, {
			originalError: error instanceof Error ? error.message : String(error),
		});
	}
}

/**
 * Parsea los metadatos de Sharp
 */
export async function parseSharpMetadata(buffer: Buffer): Promise<Partial<FileMetadata>> {
	try {
		// Importar sharp dinámicamente para evitar problemas en entornos donde no esté disponible
		const { default: sharp } = await import('sharp');

		const metadata = await sharp(buffer).metadata();

		const result: ExtendedFileMetadata = {
			dimensions: {
				width: metadata.width || 0,
				height: metadata.height || 0,
			},
			colorSpace: metadata.space as string,
			hasAlpha: metadata.hasAlpha,
			isAnimated: metadata.pages ? metadata.pages > 1 : false,
		};

		// Mapear el formato de sharp a nuestro tipo ImageFormat
		if (metadata.format) {
			const format = metadata.format.toLowerCase();
			if (['jpeg', 'png', 'gif', 'webp', 'tiff', 'bmp', 'svg', 'avif', 'jpg', 'tif'].includes(format)) {
				result.format = format as ImageFormat;
			}
		}

		return result;
	} catch (error) {
		parserLogger.error('Error al procesar metadatos con Sharp:', { error });
		throw new MetadataError('Error al procesar metadatos con Sharp', 'unknown', 'SHARP_ERROR', {
			originalError: error instanceof Error ? error.message : String(error),
		});
	}
}

/**
 * Convierte coordenadas en formato DMS (grados, minutos, segundos) a formato decimal
 */
function convertDMSToDecimal(dmsValue: string, ref?: string): number {
	if (!dmsValue || dmsValue.trim() === '') {
		return 0;
	}

	try {
		// Formato típico: "27/1, 15/1, 1947/100"
		// Pero puede venir en diferentes formatos según la cámara/dispositivo

		// Primero intentamos dividir por comas si el formato es estándar
		let parts: number[] = [];

		if (dmsValue.includes(',')) {
			parts = dmsValue.split(',').map((part) => {
				const trimmedPart = part.trim();
				if (trimmedPart.includes('/')) {
					const [numerator, denominator] = trimmedPart.split('/').map(Number);
					if (!denominator || Number.isNaN(denominator) || Number.isNaN(numerator)) {
						return 0;
					}
					return numerator / denominator;
				}
				const num = Number.parseFloat(trimmedPart);
				return Number.isNaN(num) ? 0 : num;
			});
		} else if (dmsValue.includes('°') || dmsValue.includes("'") || dmsValue.includes('"')) {
			// Formato alternativo: 12° 34' 56" N
			// Eliminar la referencia del final si está presente
			const cleanDMS = dmsValue.replace(/[NSEW]$/i, '').trim();

			// Extraer grados
			const degreeMatch = cleanDMS.match(/(\d+)°/);
			const degrees = degreeMatch ? Number.parseFloat(degreeMatch[1]) : 0;

			// Extraer minutos
			const minuteMatch = cleanDMS.match(/(\d+)'/);
			const minutes = minuteMatch ? Number.parseFloat(minuteMatch[1]) : 0;

			// Extraer segundos
			const secondMatch = cleanDMS.match(/(\d+(\.\d+)?)\"/);
			const seconds = secondMatch ? Number.parseFloat(secondMatch[1]) : 0;

			parts = [degrees, minutes, seconds];
		} else {
			// Último intento: simplemente convertir a número
			const num = Number.parseFloat(dmsValue);
			if (!Number.isNaN(num)) {
				return num; // Ya está en formato decimal
			}
			// Si llegamos aquí, no pudimos parsearlo
			return 0;
		}

		// Asegurar que tenemos al menos un valor para los grados
		if (parts.length === 0) {
			return 0;
		}

		const degrees = parts[0] || 0;
		const minutes = (parts.length > 1 ? parts[1] : 0) / 60;
		const seconds = (parts.length > 2 ? parts[2] : 0) / 3600;

		let decimal = degrees + minutes + seconds;

		// Ajustar según referencia (S o W son negativas)
		if (ref === 'S' || ref === 'W' || dmsValue.trim().endsWith('S') || dmsValue.trim().endsWith('W')) {
			decimal = -decimal;
		}

		return decimal;
	} catch (error) {
		parserLogger.warn('Error al convertir coordenadas DMS a decimal:', { dmsValue, ref, error });
		return 0;
	}
}

/**
 * Parsea un string de metadatos
 */
export async function parseMetadataString(data: Buffer | string | null): Promise<FileMetadata | null> {
	if (!data) {
		return null;
	}

	try {
		// Caso: Es un buffer
		if (data instanceof Buffer) {
			// Verificar si el buffer comienza con bytes de firma comunes de formatos de imagen
			const signatureBytes = data.slice(0, 8);
			const hexSignature = signatureBytes.toString('hex');

			// Comprobar firmas comunes de formatos de imagen
			if (
				hexSignature.startsWith('ffd8ff') || // JPEG
				hexSignature.startsWith('89504e47') || // PNG
				hexSignature.startsWith('47494638') || // GIF
				hexSignature.startsWith('52494646') || // WEBP
				hexSignature.startsWith('49492a00') || // TIFF
				hexSignature.startsWith('4d4d002a') // TIFF (big endian)
			) {
				parserLogger.debug('Buffer detectado como imagen binaria, no se puede parsear como JSON');
				return null;
			}

			// Si no es una imagen binaria conocida, intentar convertir a texto
			const textData = data.toString('utf-8');
			return await parseJsonString(textData);
		}

		// Caso: Es un string
		if (typeof data === 'string') {
			return await parseJsonString(data);
		}

		// Caso: Es otro tipo (no debería ocurrir)
		parserLogger.warn('Tipo de datos no soportado en parseMetadataString:', typeof data);
		return null;
	} catch (error) {
		const errorMsg = error instanceof Error ? error.message : String(error);
		let preview = '';
		if (data instanceof Buffer) {
			preview = `<Buffer de ${data.length} bytes>`;
		} else if (typeof data === 'string') {
			preview = data.length > 100 ? `${data.substring(0, 100)}...` : data;
		} else {
			preview = String(data);
		}

		parserLogger.error('Error parseando string de metadatos:', {
			error: errorMsg,
			data: preview,
		});
		return null;
	}
}

/**
 * Función auxiliar para parsear un string como JSON
 */
async function parseJsonString(text: string): Promise<FileMetadata | null> {
	// Verificar si el string está vacío o solo contiene {}
	if (!text.trim() || text.trim() === '{}') {
		parserLogger.debug('String de metadatos vacío o solo contiene {}');
		return null;
	}

	// Verificar si el string parece ser JSON válido
	if (!text.trim().startsWith('{') && !text.trim().startsWith('[')) {
		parserLogger.debug('El contenido no parece ser JSON válido');
		return null;
	}

	// Intentar parsear el JSON
	return JSON.parse(text) as FileMetadata;
}
