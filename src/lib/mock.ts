/**
 * @file Datos mock para desarrollo y testing
 * @module lib/mock
 */

import type { Album, Collection, Image, Tag } from '@prisma/client';

/**
 * Datos mock para imágenes
 */
export const mockImages: Partial<Image>[] = [
	{
		id: 'mock-1',
		path: '/mock/image1.jpg',
		name: 'Imagen Mock 1',
		width: 1920,
		height: 1080,
		size: 2048000,
		mimeType: 'image/jpeg',
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-01'),
	},
	{
		id: 'mock-2',
		path: '/mock/image2.png',
		name: 'Imagen Mock 2',
		width: 1280,
		height: 720,
		size: 1024000,
		mimeType: 'image/png',
		createdAt: new Date('2024-01-02'),
		updatedAt: new Date('2024-01-02'),
	},
];

/**
 * Datos mock para tags
 */
export const mockTags: Partial<Tag>[] = [
	{
		id: 'tag-1',
		name: 'Paisaje',
		color: '#10b981',
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-01'),
	},
	{
		id: 'tag-2',
		name: 'Retrato',
		color: '#3b82f6',
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-01'),
	},
];

/**
 * Datos mock para colecciones
 */
export const mockCollections: Partial<Collection>[] = [
	{
		id: 'collection-1',
		name: 'Fotos de Vacaciones',
		description: 'Recuerdos de mis vacaciones',
		emoji: '🏖️',
		color: '#f59e0b',
		isPrivate: false,
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-01'),
	},
];

/**
 * Datos mock para álbumes
 */
export const mockAlbums: Partial<Album>[] = [
	{
		id: 'album-1',
		name: 'Portfolio',
		description: 'Mis mejores trabajos',
		emoji: '📸',
		color: '#8b5cf6',
		isPrivate: false,
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-01'),
	},
];

/**
 * Genera datos mock para testing
 */
export function generateMockData<T>(
	template: Partial<T>,
	count: number,
	overrides?: (index: number) => Partial<T>
): T[] {
	return Array.from({ length: count }, (_, index) => ({
		...template,
		id: `mock-${index + 1}`,
		...(overrides?.(index) || {}),
	})) as T[];
}

/**
 * Simula delay de red para testing
 */
export function mockDelay(ms = 1000): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Simula error aleatorio para testing
 */
export function mockRandomError(probability = 0.1): void {
	if (Math.random() < probability) {
		throw new Error('Error simulado para testing');
	}
}
