import type { UploadedImageMetadata, UploadedImageProcessingOptions } from '@/types/uploaded-images';
import * as path from 'path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

const UPLOADS_DIR = process.env.UPLOADS_DIR || 'public/uploads';

export async function processImage(
	sourcePath: string,
	options: UploadedImageProcessingOptions
): Promise<{ path: string; metadata: UploadedImageMetadata }> {
	try {
		const {
			width,
			height,
			quality = 80,
			format = 'webp',
			fit = 'cover',
			position = 'center',
			background = { r: 255, g: 255, b: 255, alpha: 1 },
		} = options;

		// Obtener información de la imagen original
		const originalImage = sharp(sourcePath);
		const originalMetadata = await originalImage.metadata();

		// Preparar el pipeline de procesamiento
		let pipeline = originalImage;

		// Redimensionar si se especifican dimensiones
		if (width || height) {
			pipeline = pipeline.resize(width, height, {
				fit,
				position,
				background,
			});
		}

		// Convertir formato si es necesario
		switch (format.toLowerCase()) {
			case 'jpeg':
			case 'jpg':
				pipeline = pipeline.jpeg({ quality });
				break;
			case 'png':
				pipeline = pipeline.png({ quality });
				break;
			case 'webp':
				pipeline = pipeline.webp({ quality });
				break;
			case 'avif':
				pipeline = pipeline.avif({ quality });
				break;
			default:
				pipeline = pipeline.webp({ quality });
		}

		// Generar nombre de archivo único
		const fileName = `${uuidv4()}.${format}`;
		const outputPath = path.join(UPLOADS_DIR, fileName);

		// Procesar y guardar imagen
		await pipeline.toFile(outputPath);

		// Obtener metadata de la imagen procesada
		const _processedMetadata = await sharp(outputPath).metadata();

		// Preparar metadata
		const metadata: UploadedImageMetadata = {
			mimeType: `image/${format}`,
			format,
			quality,
			compression: 1,
			originalName: path.basename(sourcePath),
			originalPath: sourcePath,
			originalSize: originalMetadata.size,
			originalWidth: originalMetadata.width,
			originalHeight: originalMetadata.height,
			processingOptions: options,
		};

		return {
			path: outputPath,
			metadata,
		};
	} catch (error) {
		console.error('Error processing image:', error);
		throw new Error('Error al procesar imagen');
	}
}

export async function deleteImage(_imagePath: string): Promise<void> {
	// TODO: Implementar eliminación de archivo
	// Cuando se implemente, usar esta estructura:
	// try {
	//     // Código para eliminar el archivo
	// } catch (error) {
	//     console.error('Error deleting image:', error);
	//     throw new Error('Error al eliminar imagen');
	// }
}

export async function getImageDimensions(imagePath: string): Promise<{ width: number; height: number }> {
	try {
		const metadata = await sharp(imagePath).metadata();
		return {
			width: metadata.width || 0,
			height: metadata.height || 0,
		};
	} catch (error) {
		console.error('Error getting image dimensions:', error);
		throw new Error('Error al obtener dimensiones de imagen');
	}
}

export async function getImageMetadata(imagePath: string): Promise<UploadedImageMetadata> {
	try {
		const metadata = await sharp(imagePath).metadata();
		return {
			mimeType: metadata.format ? `image/${metadata.format}` : undefined,
			format: metadata.format,
			quality: undefined,
			compression: 1,
			originalName: path.basename(imagePath),
			originalPath: imagePath,
			originalSize: metadata.size,
			originalWidth: metadata.width,
			originalHeight: metadata.height,
		};
	} catch (error) {
		console.error('Error getting image metadata:', error);
		throw new Error('Error al obtener metadata de imagen');
	}
}
