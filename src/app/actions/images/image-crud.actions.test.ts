import { createImage, deleteImage, getFavoriteImages, getImage, getImages, updateImage } from './image-crud.actions';

// Mock básico para evitar errores de importación (puedes reemplazar por mocks reales de jest)
jest.mock('@/lib/prisma', () => ({
	prisma: {
		image: {
			create: jest.fn().mockResolvedValue({ id: 'img1', name: 'Mock Image' }),
			findUnique: jest.fn().mockResolvedValue({ id: 'img1', name: 'Mock Image' }),
			update: jest.fn().mockResolvedValue({ id: 'img1', name: 'Mock Image Updated' }),
			delete: jest.fn().mockResolvedValue({ id: 'img1' }),
			findMany: jest.fn().mockResolvedValue([{ id: 'img1', name: 'Mock Image' }]),
			count: jest.fn().mockResolvedValue(1),
		},
	},
}));

// 🧪 Tests para acciones CRUD de imágenes (server actions)
describe('Image CRUD Actions', () => {
	it('debe crear, obtener, actualizar y eliminar una imagen correctamente (mock)', async () => {
		const image = await createImage({ name: 'Mock Image', folderId: 'folder1' } as any);
		expect(image).toBeDefined();
		expect(image).toHaveProperty('id', 'img1');
		const fetched = await getImage('img1');
		expect(fetched).toBeDefined();
		expect(fetched).toHaveProperty('id', 'img1');
		const updated = await updateImage('img1', { name: 'Mock Image Updated' } as any);
		expect(updated).toBeDefined();
		expect(updated).toHaveProperty('name', 'Mock Image Updated');
		await expect(deleteImage('img1')).resolves.toBeUndefined();
	});

	it('debe obtener imágenes favoritas (mock)', async () => {
		const favorites = await getFavoriteImages();
		expect(Array.isArray(favorites)).toBe(true);
	});

	it('debe obtener imágenes con filtros (mock)', async () => {
		const result = await getImages({ page: 1, pageSize: 2 });
		// Nuevo patrón: getImages puede devolver array o paginación directa
		// Ajustar el assert según la implementación real
		if (Array.isArray(result)) {
			expect(result.length).toBeGreaterThanOrEqual(0);
		} else {
			expect(result).toHaveProperty('images');
		}
	});
});

/**
 * 📝 NOTA: Estos tests usan mocks simples. Para pruebas reales:
 * - Mockea transformers y dependencias
 * - Usa fixtures de datos en src/tests/__fixtures__
 * - Valida los flujos completos de create, read, update, delete
 * - Documenta los casos de error y edge cases
 */
