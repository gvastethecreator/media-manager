/**
 * @file Factory Functions para Tests
 * @module tests/factories
 * @description
 * Funciones factory para generar datos de test con tipos específicos
 * en lugar de usar 'any'. Mejora la type safety en tests.
 *
 * ✅ CREADO - Septiembre 2025
 */

import type { Image } from '@/lib/drizzle';
import { EntityType } from '@/types/file-entity-mapper';

// Utilidad ligera de spy (sin Jest) para Bun/Vitest o tests manuales
function createSpy<T extends (...args: any[]) => any>(implementation?: T) {
	const fn: any = (...args: any[]) => {
		fn.calls.push(args);
		if (fn._impl) return fn._impl(...args);
		return fn.mockReturnValue;
	};
	fn.calls = [] as any[];
	fn._impl = implementation;
	fn.mockReturnValue = undefined;
	fn.mockReturnThis = () => {
		fn._impl = () => fn;
		return fn;
	};
	fn.mockResolvedValue = (value: any) => {
		fn._impl = () => Promise.resolve(value);
		return fn;
	};
	fn.mockImplementation = (impl: T) => {
		fn._impl = impl;
		return fn;
	};
	return fn as T & {
		calls: any[];
		mockReturnValue: any;
		mockReturnThis: () => typeof fn;
		mockResolvedValue: (value: any) => typeof fn;
		mockImplementation: (impl: T) => typeof fn;
	};
}

/**
 * 🖼️ Factory para crear imágenes de test
 */
export function createTestImage(overrides: Partial<Image> = {}): Image {
	return {
		id: 'test-image-1',
		name: 'test-image.jpg',
		description: null,
		path: '/test/test-image.jpg',
		size: 1_024_000,
		hash: 'a'.repeat(64),
		width: 1920,
		height: 1080,
		metadata: null,
		thumbnail: null,
		thumbnailSize: null,
		thumbnailWidth: null,
		thumbnailHeight: null,
		thumbnailMimeType: null,
		thumbnailError: null,
		thumbnailErrorAt: null,
		thumbnailOptimizedAt: null,
		aiEngine: null,
		aiModel: null,
		aiOriginDetected: false,
		isFavorite: false,
		folderId: 'test-folder-1',
		noteId: null,
		createdAt: new Date('2024-01-01T00:00:00Z'),
		updatedAt: new Date('2024-01-01T00:00:00Z'),
		addedAt: new Date('2024-01-01T00:00:00Z'),
		...overrides,
	};
}

/**
 * 🎬 Factory para crear videos de test
 */
export function createTestVideo(overrides: any = {}) {
	return {
		id: 'test-video-1',
		name: 'test-video.mp4',
		entityType: 'video' as EntityType,
		createdAt: new Date('2024-01-01T00:00:00Z'),
		updatedAt: new Date('2024-01-01T00:00:00Z'),
		...overrides,
	};
}

/**
 * 📁 Factory para crear carpetas de test
 */
// Nota: No existe EntityType.FOLDER en enumeración canónica; si se necesita folder, usar mocks específicos en otro módulo.

/**
 * 🎭 Factory para crear mocks de FileEntityMapperService
 */
export function createMockFileEntityMapper() {
	// Crear objeto mock compatible con Jest/Bun
	const mapper = {
		processEntityExtraction: createSpy(),
		parseMetadata: createSpy(),
		generateThumbnail: createSpy(),
		processDocumentText: createSpy(),
	};

	// Mock implementations por defecto
	mapper.processEntityExtraction.mockResolvedValue({
		success: true,
		entities: [],
		metadata: {},
	});

	mapper.parseMetadata.mockReturnValue = {
		width: 1920,
		height: 1080,
		format: 'JPEG',
	};

	mapper.generateThumbnail.mockResolvedValue({
		success: true,
		thumbnailPath: '/thumbnails/test.jpg',
	});

	mapper.processDocumentText.mockResolvedValue({
		content: 'Test document content',
		wordCount: 3,
		language: 'en',
	});

	return mapper;
}

/**
 * 🗄️ Factory para crear mocks de Database
 */
export function createMockDb() {
	const chain = () => createSpy().mockReturnThis();
	return {
		select: chain(),
		from: chain(),
		where: chain(),
		limit: chain(),
		orderBy: chain(),
		insert: chain(),
		values: chain(),
		returning: chain(),
		update: chain(),
		set: chain(),
		delete: chain(),
		execute: createSpy(),
		query: {
			images: {
				findFirst: createSpy(),
				findMany: createSpy(),
			},
		},
	};
}

/**
 * 📡 Factory para crear mocks de EventStore
 */
export function createMockEventStore() {
	return {
		emit: createSpy(),
		emitEvent: createSpy(),
		subscribe: createSpy(),
		unsubscribe: createSpy(),
	};
}

/**
 * 🎯 Factory para arrays de items de test
 */
export function createTestItems(count: number, type: EntityType = EntityType.IMAGE) {
	return Array.from({ length: count }, (_, index) => {
		switch (type) {
			case EntityType.IMAGE:
				return createTestImage({
					id: `test-image-${index + 1}`,
					name: `test-image-${index + 1}.jpg`,
				});
			case EntityType.VIDEO:
				return createTestVideo({
					id: `test-video-${index + 1}`,
					name: `test-video-${index + 1}.mp4`,
				});
			default:
				return createTestImage({
					id: `test-item-${index + 1}`,
					name: `test-item-${index + 1}`,
				});
		}
	});
}
