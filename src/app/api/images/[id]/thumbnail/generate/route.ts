import { existsSync } from 'fs';
import { createReadStream } from 'fs';
import { pipeline } from 'node:stream/promises';
import { THUMBNAIL_QUALITY_CONFIG, ThumbnailQuality, normalizeQuality } from '@/lib/config/thumbnail.config';
import { prisma } from '@/lib/prisma';
import { type NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
	try {
		// Esperar a que los parámetros estén disponibles
		const dynParams = await params;
		const id = dynParams.id;

		const { quality: requestedQuality = 'medium', force = false } = await request.json();

		// Usar la función normalizeQuality para validar la calidad
		const quality = normalizeQuality(requestedQuality);

		// Verificar si la imagen existe
		const image = await prisma.image.findUnique({
			where: { id },
		});

		if (!image) {
			return NextResponse.json({ error: 'Image not found' }, { status: 404 });
		}

		// Verificar que el archivo existe
		if (!existsSync(image.path)) {
			await prisma.image.update({
				where: { id },
				data: {
					thumbnailError: 'Original file not found',
					thumbnailErrorAt: new Date(),
				},
			});
			return NextResponse.json({ error: 'Original file not found' }, { status: 404 });
		}

		// Si force es false y ya tiene thumbnail, no regenerar
		if (!force && image.thumbnail) {
			return NextResponse.json({ status: 'skipped', message: 'Thumbnail already exists' });
		}

		try {
			// Verificar tamaño del archivo
			const metadata = await sharp(image.path).metadata();
			if (metadata.size && metadata.size > MAX_FILE_SIZE) {
				throw new Error(`File size exceeds maximum allowed (${MAX_FILE_SIZE} bytes)`);
			}

			// Procesar imagen en streaming
			const transformer = sharp()
				.resize(THUMBNAIL_QUALITY_CONFIG[quality].width, THUMBNAIL_QUALITY_CONFIG[quality].height, {
					fit: 'inside',
					withoutEnlargement: true,
				})
				.webp({ quality: THUMBNAIL_QUALITY_CONFIG[quality].quality });

			const chunks: Buffer[] = [];
			transformer.on('data', (chunk) => chunks.push(chunk));

			await pipeline(createReadStream(image.path), transformer);

			const thumbnailBuffer = Buffer.concat(chunks);

			// Actualizar en base de datos
			await prisma.image.update({
				where: { id },
				data: {
					thumbnail: thumbnailBuffer,
					thumbnailSize: thumbnailBuffer.length,
					thumbnailWidth: metadata.width ? Math.min(metadata.width, THUMBNAIL_QUALITY_CONFIG[quality].width) : null,
					thumbnailHeight: metadata.height ? Math.min(metadata.height, THUMBNAIL_QUALITY_CONFIG[quality].height) : null,
					thumbnailError: null,
					thumbnailErrorAt: null,
					updatedAt: new Date(),
				},
			});

			return NextResponse.json({
				status: 'success',
				size: thumbnailBuffer.length,
				quality,
			});
		} catch (error) {
			console.error('Error processing thumbnail:', error);

			// Actualizar error en base de datos
			await prisma.image.update({
				where: { id },
				data: {
					thumbnailError: error instanceof Error ? error.message : 'Unknown error',
					thumbnailErrorAt: new Date(),
				},
			});

			return NextResponse.json({ error: 'Error generating thumbnail' }, { status: 500 });
		}
	} catch (error) {
		console.error('Error in thumbnail generation:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
