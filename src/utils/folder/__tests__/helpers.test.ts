import {
	formatFolderSize,
	formatLastIndexed,
	generateSafeFolderPath,
	getFolderColor,
	getFolderEmoji,
	isFolderAncestor,
} from '../helpers';
jest.mock('@/types/entities/folder', () => ({
	FOLDER_DEFAULT_COLORS: { DEFAULT: '#000', FAVORITE: '#f00', SYSTEM: '#00f' },
	FOLDER_DEFAULT_EMOJIS: { DEFAULT: '📁', FAVORITE: '⭐', PHOTOS: '📸', VIDEOS: '🎞', DOWNLOADS: '⬇' },
}));

// 📂 Tests para helpers de carpetas con datos simulados

const baseFolder = { id: '1', name: 'Root', path: '/root' } as any;
const childFolder = { id: '2', name: 'Child', path: '/root/child', parentId: '1' } as any;
const grandChildFolder = { id: '3', name: 'Grand', path: '/root/child/grand', parentId: '2' } as any;

describe('📁 folder helpers', () => {
	describe('formatFolderSize', () => {
		it('formatea bytes a tamaño legible', () => {
			expect(formatFolderSize(1024)).toBe('1 KB');
		});
		it('retorna 0 Bytes cuando es indefinido', () => {
			expect(formatFolderSize(undefined)).toBe('0 Bytes');
		});
	});

	describe('formatLastIndexed', () => {
		it('devuelve "Nunca" si la fecha es nula', () => {
			expect(formatLastIndexed(null)).toBe('Nunca');
		});
		it('formatea una cadena de fecha', () => {
			const result = formatLastIndexed('2024-01-01T00:00:00Z');
			expect(typeof result).toBe('string');
		});
	});

	describe('generateSafeFolderPath', () => {
		it('sanealiza el nombre de la carpeta', () => {
			expect(generateSafeFolderPath('Mi Carpeta!')).toBe('mi-carpeta');
		});
		it('une con la ruta padre', () => {
			expect(generateSafeFolderPath('New', '/tmp')).toBe('/tmp/new');
		});
	});

	describe('getFolderColor', () => {
		it('devuelve el color de favorito', () => {
			expect(getFolderColor({ isFavorite: true } as any)).toBeDefined();
		});
	});

	describe('getFolderEmoji', () => {
		it('usa el emoji por defecto si no coincide', () => {
			expect(getFolderEmoji({} as any)).toBeDefined();
		});
	});

	describe('isFolderAncestor', () => {
		it('detecta relación de ancestro', () => {
			const folders = [baseFolder, childFolder, grandChildFolder];
			expect(isFolderAncestor(baseFolder, grandChildFolder, folders)).toBe(true);
		});
		it('retorna false cuando no es ancestro', () => {
			const folders = [baseFolder, childFolder, grandChildFolder];
			expect(isFolderAncestor(childFolder, baseFolder, folders)).toBe(false);
		});
	});
});
