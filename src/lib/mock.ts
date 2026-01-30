/**
 * @file Datos mock para desarrollo y testing
 * @module lib/mock
 * ✅ MIGRADO A DRIZZLE - Sin dependencias de Prisma
 */

// Tipos locales para mock (equivalentes a Drizzle)
interface MockImage {
	id: string;
	name: string | null;
	path: string;
	size: number;
	width: number | null;
	height: number | null;
	metadata: string | null;
	thumbnail: Buffer | null;
	thumbnailSize: number | null;
	thumbnailWidth: number | null;
	thumbnailHeight: number | null;
	thumbnailError: string | null;
	thumbnailErrorAt: Date | null;
	thumbnailOptimizedAt: Date | null;
	isFavorite: boolean;
	folderId: string | null;
	addedAt: Date;
	createdAt: Date;
	updatedAt: Date;
}

interface MockTag {
	id: string;
	name: string;
	description: string | null;
	emoji: string | null;
	color: string | null;
	category: string | null;
	shortcut: string | null;
	featuredImage: string | null;
	isFavorite: boolean;
	createdAt: Date;
	updatedAt: Date;
}

interface MockCollection {
	id: string;
	name: string;
	description: string | null;
	emoji: string | null;
	color: string | null;
	isPrivate: boolean;
	isFavorite: boolean;
	featuredImage: string | null;
	userId: string | null;
	createdAt: Date;
	updatedAt: Date;
}

interface MockAlbum {
	id: string;
	name: string;
	description: string | null;
	emoji: string | null;
	color: string | null;
	isPrivate: boolean;
	isFavorite: boolean;
	featuredImage: string | null;
	userId: string | null;
	createdAt: Date;
	updatedAt: Date;
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
		description: 'Imágenes de paisajes naturales',
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
		description: 'Fotografías de retratos',
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
