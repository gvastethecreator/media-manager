import {
	folderResponseCache,
	folderListCache,
	getFolderCacheKey,
	invalidateFolderCache,
	invalidateAllFolderCache,
} from '../folder-cache';

describe('folder cache invalidation', () => {
	beforeEach(() => {
		folderResponseCache.clear();
		folderListCache.clear();
	});

	it('invalidateFolderCache limpia entradas específicas', () => {
		folderResponseCache.set(getFolderCacheKey('1'), { id: '1' });
		folderResponseCache.set(getFolderCacheKey('1', 'metadata'), { meta: true });
		folderResponseCache.set(getFolderCacheKey('2'), { id: '2' });
		folderListCache.set('folders:list:all', []);

		invalidateFolderCache('1');

		expect(folderResponseCache.get(getFolderCacheKey('1'))).toBeUndefined();
		expect(folderResponseCache.get(getFolderCacheKey('1', 'metadata'))).toBeUndefined();
		expect(folderResponseCache.get(getFolderCacheKey('2'))).toBeDefined();
		expect(folderListCache.get('folders:list:all')).toBeUndefined();
	});

	it('invalidateAllFolderCache limpia todas las entradas', () => {
		folderResponseCache.set(getFolderCacheKey('1'), {});
		folderResponseCache.set(getFolderCacheKey('2'), {});
		folderListCache.set('folders:list:all', []);

		invalidateAllFolderCache();

		expect(folderResponseCache.get(getFolderCacheKey('1'))).toBeUndefined();
		expect(folderResponseCache.get(getFolderCacheKey('2'))).toBeUndefined();
		expect(folderListCache.get('folders:list:all')).toBeUndefined();
	});
});
