/**
 * Script de prueba para migrar ImageService.getImages() de Prisma a Drizzle
 * Siguiendo el patrón establecido en ProfileService
 */

import { and, asc, count, desc, eq, like, or } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { folders, images } from '@/lib/drizzle/schema';
import { fromDrizzleImageWithCounts } from '@/transformers/image/transformer';
import type { ImageWithStats } from '@/types/entities/image/types';

// Tipos para el método getImages
type GetImagesOptions = {
	page?: number;
	pageSize?: number;
	sortBy?: string;
	sortOrder?: 'asc' | 'desc';
	folderId?: string;
	tagIds?: string[];
	collectionIds?: string[];
	isFavorite?: boolean;
	isPublic?: boolean;
	search?: string;
};

type GetImagesResult = {
	images: ImageWithStats[];
	pagination: {
		page: number;
		pageSize: number;
		total: number;
		totalPages: number;
		hasNext: boolean;
		hasPrev: boolean;
	};
};

/**
 * Migración de ImageService.getImages() a Drizzle
 * NOTA: Inicialmente sin las relaciones many-to-many para simplificar
 */
async function migrateGetImages(options: GetImagesOptions = {}): Promise<GetImagesResult> {
	try {
		const {
			search,
			folderId,
			tagIds,
			isFavorite,
			pageSize = 50,
			page = 1,
			sortBy = 'updatedAt',
			sortOrder = 'desc',
		} = options;

		// Construir filtros dinámicamente
		const conditions: any[] = [];

		// Filtro de búsqueda por texto
		if (search) {
			conditions.push(or(like(images.name, `%${search}%`), like(images.description, `%${search}%`)));
		}

		// Filtro por carpeta
		if (folderId) {
			conditions.push(eq(images.folderId, folderId));
		}

		// Filtro por favorito
		if (isFavorite !== undefined) {
			conditions.push(eq(images.isFavorite, isFavorite));
		}

		// TODO: Filtros por tagIds y collectionIds requieren JOINs con tablas de relación
		// Por ahora los omitimos para simplificar la primera migración

		// Determinar el ordenamiento
		const orderDirection = sortOrder === 'desc' ? desc : asc;
		let orderByField: any;

		switch (sortBy) {
			case 'name':
				orderByField = orderDirection(images.name);
				break;
			case 'createdAt':
				orderByField = orderDirection(images.createdAt);
				break;
			case 'size':
				orderByField = orderDirection(images.size);
				break;
			default:
				orderByField = orderDirection(images.updatedAt);
		}

		// Consulta principal con JOIN a folder (similar a Prisma include)
		const drizzleQuery = db
			.select({
				// Campos de la imagen
				id: images.id,
				name: images.name,
				description: images.description,
				path: images.path,
				hash: images.hash,
				size: images.size,
				width: images.width,
				height: images.height,
				metadata: images.metadata,
				thumbnail: images.thumbnail,
				thumbnailSize: images.thumbnailSize,
				thumbnailWidth: images.thumbnailWidth,
				thumbnailHeight: images.thumbnailHeight,
				thumbnailMimeType: images.thumbnailMimeType,
				thumbnailError: images.thumbnailError,
				thumbnailErrorAt: images.thumbnailErrorAt,
				thumbnailOptimizedAt: images.thumbnailOptimizedAt,
				isFavorite: images.isFavorite,
				folderId: images.folderId,
				noteId: images.noteId,
				createdAt: images.createdAt,
				updatedAt: images.updatedAt,
				addedAt: images.addedAt,
				// Campos del folder (JOIN)
				folderRealId: folders.id,
				folderName: folders.name,
				folderPath: folders.path,
			})
			.from(images)
			.leftJoin(folders, eq(images.folderId, folders.id));

		// Aplicar filtros si existen
		let queryWithFilters = drizzleQuery;
		if (conditions.length > 0) {
			queryWithFilters = drizzleQuery.where(and(...conditions));
		}

		// Aplicar ordenamiento y paginación
		const drizzleImages = await queryWithFilters
			.orderBy(orderByField)
			.limit(pageSize)
			.offset((page - 1) * pageSize);

		// Consulta de conteo total (con los mismos filtros)
		let countQuery = db.select({ count: count() }).from(images);

		if (conditions.length > 0) {
			countQuery = countQuery.where(and(...conditions));
		}

		const [{ count: total }] = await countQuery;

		// Transformar resultados de Drizzle a formato compatible con Prisma
		const transformedImages = drizzleImages.map((raw) => {
			// Restructurar para que sea compatible con fromDrizzleImageWithCounts
			const drizzleResult = {
				id: raw.id,
				name: raw.name,
				description: raw.description,
				path: raw.path,
				hash: raw.hash,
				size: raw.size,
				width: raw.width,
				height: raw.height,
				metadata: raw.metadata ? JSON.parse(raw.metadata) : null,
				thumbnail: raw.thumbnail,
				thumbnailSize: raw.thumbnailSize,
				thumbnailWidth: raw.thumbnailWidth,
				thumbnailHeight: raw.thumbnailHeight,
				thumbnailMimeType: raw.thumbnailMimeType,
				thumbnailError: raw.thumbnailError,
				thumbnailErrorAt: raw.thumbnailErrorAt,
				thumbnailOptimizedAt: raw.thumbnailOptimizedAt,
				isFavorite: Boolean(raw.isFavorite),
				folderId: raw.folderId,
				noteId: raw.noteId,
				createdAt: raw.createdAt,
				updatedAt: raw.updatedAt,
				addedAt: raw.addedAt,
				// Folder como objeto anidado (como en Prisma)
				folder: raw.folderRealId
					? {
							id: raw.folderRealId,
							name: raw.folderName!,
							path: raw.folderPath!,
						}
					: null,
				// Relaciones vacías por ahora (TODO: implementar JOINs)
				tags: [],
				albums: [],
				collections: [],
				characters: [],
				places: [],
				worldItems: [],
				concepts: [],
				prompts: [],
				notes: [],
				wildcards: [],
				properties: [],
				groups: [],
				// Counts vacíos por ahora (TODO: implementar subqueries)
				_count: {
					tags: 0,
					albums: 0,
					collections: 0,
					characters: 0,
					places: 0,
					worldItems: 0,
					concepts: 0,
					prompts: 0,
					notes: 0,
					wildcards: 0,
					properties: 0,
					groups: 0,
				},
			};

			return fromDrizzleImageWithCounts(drizzleResult as any);
		});

		return {
			images: transformedImages,
			pagination: {
				page,
				pageSize,
				total,
				totalPages: Math.ceil(total / pageSize),
				hasNext: page * pageSize < total,
				hasPrev: page > 1,
			},
		};
	} catch (error) {
		console.error('❌ Error en migración de getImages:', error);
		throw error;
	}
}

/**
 * Función de prueba que compara Drizzle vs Prisma
 */
async function testImageMigration() {
	console.log('🧪 === PRUEBA DE MIGRACIÓN: ImageService.getImages() ===\n');

	const testCases = [
		{ name: 'Sin filtros (página 1)', options: {} },
		{ name: 'Con búsqueda', options: { search: 'test' } },
		{ name: 'Solo favoritos', options: { isFavorite: true } },
		{ name: 'Ordenado por nombre ASC', options: { sortBy: 'name', sortOrder: 'asc' as const } },
		{ name: 'Página 2 con 10 elementos', options: { page: 2, pageSize: 10 } },
	];

	for (const testCase of testCases) {
		console.log(`📋 Probando: ${testCase.name}`);
		console.log('   Opciones:', testCase.options);

		try {
			// Prueba con Drizzle
			const startDrizzle = Date.now();
			const drizzleResult = await migrateGetImages(testCase.options);
			const drizzleTime = Date.now() - startDrizzle;

			console.log(`   ✅ Drizzle: ${drizzleTime}ms`);
			console.log(`      - Total: ${drizzleResult.pagination.total}`);
			console.log(`      - Imágenes: ${drizzleResult.images.length}`);
			console.log(`      - Página: ${drizzleResult.pagination.page}/${drizzleResult.pagination.totalPages}`);

			if (drizzleResult.images.length > 0) {
				const firstImage = drizzleResult.images[0];
				console.log(`      - Primera imagen: ${firstImage.name} (${firstImage.folder?.name || 'Sin carpeta'})`);
			}

			// TODO: Comparar con Prisma cuando tengamos el método original funcionando
			// const prismaResult = await originalGetImages(testCase.options);
			// console.log(`   📊 Prisma: ${prismaTime}ms`);
		} catch (error) {
			console.error('   ❌ Error:', error instanceof Error ? error.message : error);
		}

		console.log('');
	}

	console.log('🏁 Prueba completada');
}

// Ejecutar automáticamente
testImageMigration()
	.then(() => {
		console.log('✅ Script completado exitosamente');
		process.exit(0);
	})
	.catch((error) => {
		console.error('❌ Error en el script:', error);
		process.exit(1);
	});

export { migrateGetImages, testImageMigration };
