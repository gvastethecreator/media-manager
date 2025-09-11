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
import type { EntityType } from '@/types/file-entity-mapper';

/**
 * 🖼️ Factory para crear imágenes de test
 */
export function createTestImage(overrides: Partial<Image> = {}): Image {
	return {
		id: 'test-image-1',
		name: 'test-image.jpg',
		description: null,
		path: '/test/test-image.jpg',
		filename: 'test-image.jpg',
		extension: 'jpg',
		size: 1_024_000,
		mimeType: 'image/jpeg',
		width: 1920,
		height: 1080,
		aspectRatio: 1.78,
		dominantColor: '#3b82f6',
		averageColor: '#60a5fa',
		blurHash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj',
		isAnimated: false,
		frameCount: 1,
		duration: null,
		bitrate: null,
		colorDepth: 24,
		quality: 0.85,
		compression: 'jpeg',
		metadata: null,
		aiDescription: null,
		aiTags: null,
		aiGenerated: false,
		folderId: 'test-folder-1',
		createdAt: new Date('2024-01-01T00:00:00Z'),
		updatedAt: new Date('2024-01-01T00:00:00Z'),
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
export function createTestFolder(overrides: any = {}) {
	return {
		id: 'test-folder-1',
		name: 'Test Folder',
		path: '/test-folder',
		entityType: 'folder' as EntityType,
		createdAt: new Date('2024-01-01T00:00:00Z'),
		updatedAt: new Date('2024-01-01T00:00:00Z'),
		...overrides,
	};
}

/**
 * 🎭 Factory para crear mocks de FileEntityMapperService
 */
export function createMockFileEntityMapper() {
	// Crear objeto mock compatible con Jest/Bun
	const mockFn = (name: string) => {
		const fn = (...args: any[]) => fn.mockReturnValue;
		fn.mockResolvedValue = (value: any) => {
			fn.mockReturnValue = Promise.resolve(value);
			return fn;
		};
		fn.mockReturnValue = undefined;
		fn.calls = [];
		return fn;
	};

	const mapper = {
		processEntityExtraction: mockFn('processEntityExtraction'),
		parseMetadata: mockFn('parseMetadata'),
		generateThumbnail: mockFn('generateThumbnail'),
		processDocumentText: mockFn('processDocumentText'),
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
	return {
		select: jest.fn().mockReturnThis(),
		from: jest.fn().mockReturnThis(),
		where: jest.fn().mockReturnThis(),
		limit: jest.fn().mockReturnThis(),
		orderBy: jest.fn().mockReturnThis(),
		insert: jest.fn().mockReturnThis(),
		values: jest.fn().mockReturnThis(),
		returning: jest.fn().mockReturnThis(),
		update: jest.fn().mockReturnThis(),
		set: jest.fn().mockReturnThis(),
		delete: jest.fn().mockReturnThis(),
		execute: jest.fn(),
		query: {
			images: {
				findFirst: jest.fn(),
				findMany: jest.fn(),
			},
		},
	};
}

/**
 * 📡 Factory para crear mocks de EventStore
 */
export function createMockEventStore() {
	return {
		emit: jest.fn(),
		emitEvent: jest.fn(),
		subscribe: jest.fn(),
		unsubscribe: jest.fn(),
	};
}

/**
 * 🎯 Factory para arrays de items de test
 */
export function createTestItems(count: number, type: EntityType = 'image') {
	return Array.from({ length: count }, (_, index) => {
		switch (type) {
			case 'image':
				return createTestImage({
					id: `test-image-${index + 1}`,
					name: `test-image-${index + 1}.jpg`,
				});
			case 'video':
				return createTestVideo({
					id: `test-video-${index + 1}`,
					name: `test-video-${index + 1}.mp4`,
				});
			case 'folder':
				return createTestFolder({
					id: `test-folder-${index + 1}`,
					name: `Test Folder ${index + 1}`,
				});
			default:
				return createTestImage({
					id: `test-item-${index + 1}`,
					name: `test-item-${index + 1}`,
				});
		}
	});
}
