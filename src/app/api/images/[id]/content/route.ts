import { existsSync } from 'fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import type { FileMetadata } from '@/types/file-item';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

const apiLogger = logger.withContext('ImageAPI');

export async function GET(_request: Request, context: { params: { id: string } }) {
	const headers = new Headers();
	// Esperar a que los parámetros estén disponibles
	const params = await context.params;
	const id = params.id;

	try {
		const image = await prisma.image.findUnique({
			where: { id },
			select: {
				id: true,
				path: true,
				metadata: true,
			},
		});

		if (!image) {
			apiLogger.warn('Image not found:', id);
			return new Response('Image not found', { status: 404 });
		}

		// Verificar que el archivo existe
		if (!existsSync(image.path)) {
			return new Response('Archivo no encontrado', { status: 404 });
		}

		// Obtener metadata
		let metadata: FileMetadata = {};
		try {
			metadata = JSON.parse(image.metadata || '{}') as FileMetadata;
		} catch (error) {
			apiLogger.warn('Error parsing metadata:', error);
		}

		// Leer el archivo
		const buffer = await readFile(image.path);

		// Procesar la imagen si es necesario
		const processedBuffer = await sharp(buffer)
			.rotate() // Auto-rotate based on EXIF
			.withMetadata() // Preserve metadata
			.toBuffer();

		// Determinar el tipo MIME
		const mimeType = metadata.mimeType || 'image/jpeg';

		// Configurar headers
		headers.set('Content-Type', mimeType);
		headers.set('Content-Length', processedBuffer.length.toString());
		headers.set('Cache-Control', 'public, max-age=31536000'); // 1 año
		headers.set('ETag', `"${image.id}"`);

		// Registrar actividad
		await prisma.activity.create({
			data: {
				type: 'IMAGE_VIEW',
				description: 'Image viewed',
				imageId: image.id,
			},
		});

		return new Response(processedBuffer, {
			headers,
		});
	} catch (error) {
		console.error('Error serving image:', error);
		return new Response('Error serving image', { status: 500 });
	}
}
