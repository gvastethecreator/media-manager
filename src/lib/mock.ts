/**
 * @file Datos mock para desarrollo y testing
 * @module lib/mock
 * ✅ MIGRADO A DRIZZLE - Sin dependencias de Prisma
 */

// Tipos locales para mock (equivalentes a Drizzle)
interface MockImage {
	addedAt: Date;
	createdAt: Date;
	folderId: string | null;
	height: number | null;
	id: string;
	isFavorite: boolean;
	metadata: string | null;
	name: string | null;
	path: string;
	size: number;
	thumbnail: Buffer | null;
	thumbnailError: string | null;
	thumbnailErrorAt: Date | null;
	thumbnailHeight: number | null;
	thumbnailOptimizedAt: Date | null;
	thumbnailSize: number | null;
	thumbnailWidth: number | null;
	updatedAt: Date;
	width: number | null;
}

interface MockTag {
	category: string | null;
	color: string | null;
	createdAt: Date;
	description: string | null;
	emoji: string | null;
	featuredImage: string | null;
	id: string;
	isFavorite: boolean;
	name: string;
	shortcut: string | null;
	updatedAt: Date;
}

interface MockCollection {
	color: string | null;
	createdAt: Date;
	description: string | null;
	emoji: string | null;
	featuredImage: string | null;
	id: string;
	isFavorite: boolean;
	isPrivate: boolean;
	name: string;
	updatedAt: Date;
	userId: string | null;
}

interface MockAlbum {
	color: string | null;
	createdAt: Date;
	description: string | null;
	emoji: string | null;
	featuredImage: string | null;
	id: string;
	isFavorite: boolean;
	isPrivate: boolean;
	name: string;
	updatedAt: Date;
	userId: string | null;
}

/**
 * Datos mock para imágenes
 */
export const mockImages: Partial<MockImage>[] = [
	{
		id: 'mock-1',
		path: '/mock/image1.jpg',
		name: 'Imagen Mock 1',
		width: 1920,
		height: 1080,
		size: 2_048_000,
		metadata: JSON.stringify({ format: 'jpeg', quality: 95 }),
		isFavorite: false,
		folderId: null,
		addedAt: new Date('2024-01-01'),
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-01'),
	},
	{
		id: 'mock-2',
		path: '/mock/image2.png',
		name: 'Imagen Mock 2',
		width: 1280,
		height: 720,
		size: 1_024_000,
		metadata: JSON.stringify({ format: 'png', hasAlpha: true }),
		isFavorite: false,
		folderId: null,
		addedAt: new Date('2024-01-02'),
		createdAt: new Date('2024-01-02'),
		updatedAt: new Date('2024-01-02'),
	},
];

/**
 * Datos mock para tags
 */
export const mockTags: Partial<MockTag>[] = [
	{
		id: 'tag-1',
		name: 'Paisaje',
		description: 'Natural landscape images',
		emoji: '🏞️',
		color: 'var(--dt-success-500)',
		category: 'general',
		isFavorite: false,
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-01'),
	},
	{
		id: 'tag-2',
		name: 'Retrato',
		description: 'Portrait photography',
		emoji: '��',
		color: 'var(--dt-primary-500)',
		category: 'general',
		isFavorite: false,
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-01'),
	},
];

/**
 * Datos mock para colecciones
 */
export const mockCollections: Partial<MockCollection>[] = [
	{
		id: 'collection-1',
		name: 'Fotos de Vacaciones',
		description: 'Recuerdos de mis vacaciones',
		emoji: '🏖️',
		color: 'var(--dt-warning-500)',
		isPrivate: false,
		isFavorite: false,
		featuredImage: null,
		userId: null,
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-01'),
	},
];

/**
 * Datos mock para álbumes
 */
export const mockAlbums: Partial<MockAlbum>[] = [
	{
		id: 'album-1',
		name: 'Portfolio',
		description: 'Mis mejores trabajos',
		emoji: '📸',
		color: '#8b5cf6',
		isPrivate: false,
		isFavorite: false,
		featuredImage: null,
		userId: null,
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
