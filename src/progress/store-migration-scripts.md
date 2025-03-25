# Scripts para la Migración de Stores

## Eliminación de `unified-file-manager.ts`

Ya que hemos confirmado que `src/store/unified-file-manager.ts` no está siendo importado en ninguna parte del código, podemos eliminarlo de forma segura.

```bash
# Eliminar archivo no utilizado
rm src/store/unified-file-manager.ts
```

## Script para crear adaptadores temporales

En algunos casos, puede ser útil crear adaptadores temporales que mantengan la API antigua mientras utilizan internamente los nuevos stores. Esto permite una migración más gradual.

### Adaptador para FileManager

Este ejemplo ilustra cómo crear un adaptador para `file-manager.store.ts`:

```typescript
// src/store/adapters/file-manager-adapter.ts
import { useAlbumStore } from '@/store/entities/album';
import { useCharacterStore } from '@/store/entities/character';
import { useCollectionStore } from '@/store/entities/collection';
import { useFolderStore } from '@/store/entities/folder';
import { useImageStore } from '@/store/entities/image';
import { useTagStore } from '@/store/entities/tag';
import { useEffect, useMemo } from 'react';

/**
 * Adaptador temporal que proporciona la API de useFileManager
 * pero internamente usa los nuevos stores específicos por entidad
 */
export function useAdaptedFileManager() {
  // Obtener estado de los nuevos stores
  const folders = useFolderStore(state => state.coreState.folders);
  const images = useImageStore(state => state.coreState.images);
  const collections = useCollectionStore(state => state.coreState.collections);
  const albums = useAlbumStore(state => state.coreState.albums);
  const tags = useTagStore(state => state.coreState.tags);

  // Acciones de los nuevos stores
  const loadFolders = useFolderStore(state => state.loadFolders);
  const loadImages = useImageStore(state => state.loadImages);

  // Calcular propiedades derivadas
  const currentItems = useMemo(() => {
    // Lógica para determinar qué items mostrar según el contexto actual
    return images;
  }, [images]);

  // Inicializar al montar
  useEffect(() => {
    loadFolders();
    loadImages();
  }, [loadFolders, loadImages]);

  // Exponer la misma API que useFileManager
  return {
    // Estado
    currentItems,
    displayedItems: currentItems.slice(0, 50),
    isLoading: useFolderStore(state => state.coreState.loading) ||
              useImageStore(state => state.coreState.loading),
    folders,
    collections,
    albums,
    tags,

    // Acciones adaptadas
    loadItems: loadImages,
    selectItem: (item: any) => useImageStore.getState().selectImage(item.id),
    // etc.
  };
}
```

## Script para analizar uso de stores antiguos

Este script busca todas las importaciones de stores antiguos y genera un informe:

```typescript
// scripts/analyze-store-usage.ts
import fs from 'fs';
import path from 'path';
import glob from 'glob';

// Lista de stores antiguos a analizar
const oldStores = [
  'file-manager.store',
  'collections.store',
  'tags.store',
  // etc.
];

// Patrón para buscar importaciones
const importPattern = /import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)\s+from\s+['"]@\/store\/([^/'"]*)['"];/g;

// Función para analizar un archivo
function analyzeFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const imports: Record<string, boolean> = {};

  let match;
  while ((match = importPattern.exec(content)) !== null) {
    const store = match[1];
    if (oldStores.includes(store)) {
      imports[store] = true;
    }
  }

  return Object.keys(imports);
}

// Buscar todos los archivos TypeScript/TSX
const files = glob.sync('src/**/*.{ts,tsx}', { ignore: ['**/node_modules/**', '**/.next/**'] });

// Analizar cada archivo
const usage: Record<string, string[]> = {};
for (const store of oldStores) {
  usage[store] = [];
}

for (const file of files) {
  const storesUsed = analyzeFile(file);

  for (const store of storesUsed) {
    usage[store].push(file);
  }
}

// Generar informe
console.log('# Análisis de uso de stores antiguos\n');
for (const store of oldStores) {
  console.log(`## ${store}`);
  console.log(`Utilizado en ${usage[store].length} archivos:\n`);

  for (const file of usage[store]) {
    console.log(`- \`${file}\``);
  }
  console.log('\n');
}
```

## Script para trasladar archivos sobrantes

Este script puede ayudar a trasladar los archivos redundantes a una carpeta de backup:

```bash
# Crear directorio de backup
mkdir -p src/store/_backup

# Mover archivos antiguos a backup
mv src/store/unified-file-manager.ts src/store/_backup/
mv src/store/file-manager.store.ts src/store/_backup/
# etc...
```