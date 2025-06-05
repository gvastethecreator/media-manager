import { folderResponseCache } from '../folder-cache';

// 🗂️ Pruebas unitarias del cache de respuestas de carpetas

describe('📂 folderResponseCache', () => {
  it('almacena y recupera valores con política LRU', () => {
    const cache = folderResponseCache;
    cache.clear();
    cache.set('a', 1);
    cache.set('b', 2);
    expect(cache.get('a')).toBe(1);
    expect(cache.get('b')).toBe(2);
  });

  it('clear con patrón elimina claves coincidentes', () => {
    const cache = folderResponseCache;
    cache.clear();
    cache.set('folder:1', { id: 1 });
    cache.set('folder:2', { id: 2 });
    cache.clear('folder:1');
    expect(cache.get('folder:1')).toBeUndefined();
    expect(cache.get('folder:2')).toBeDefined();
  });
});
