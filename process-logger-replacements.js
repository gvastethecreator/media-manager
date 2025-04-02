/**
 * Script para generar los comandos de reemplazo de serverLogger por clientLogger
 * Este es un script temporal que genera los comandos para hacer los reemplazos
 */

// Lista de archivos donde reemplazar (obtenida de la búsqueda grep)
const files = [
  'src/store/settings.store.ts',
  'src/store/thumbnails.store.ts',
  'src/store/ui.store.ts',
  'src/store/store.factory.ts',
  'src/store/stats.store.ts',
  'src/store/image-viewer.store.ts',
  'src/store/image-resources.store.ts',
  'src/store/files/files.store.ts',
  'src/store/entities/world-item/index.ts',
  'src/store/entities/wildcard/slices/core.ts',
  'src/store/entities/wildcard/slices/filters.ts',
  'src/store/entities/wildcard/slices/ui.ts',
  'src/store/entities/note/slices/filters.ts',
  'src/store/entities/note/slices/selection.ts',
  'src/store/entities/note/slices/relations.ts',
  'src/store/entities/note/slices/ui.ts',
  'src/store/entities/note/slices/core.ts',
  'src/store/entities/note/index.ts',
  'src/store/entities/queue-job/queue-job-store.ts',
  'src/store/entities/queue-job/slices/ui.ts',
  'src/store/entities/tag/slices/core.slice.ts',
  'src/store/entities/queue-job/slices/core.ts',
  'src/store/entities/queue-job/slices/filters.ts',
  'src/store/entities/prompt/store.ts',
  'src/store/entities/property/slices/ui.ts',
  'src/store/entities/prompt/slices/ui.ts',
  'src/store/entities/prompt/slices/relations.ts',
  'src/store/entities/prompt/slices/filters.ts',
  'src/store/entities/property/slices/filters.ts',
  'src/store/entities/prompt/slices/execution.ts',
  'src/store/entities/property/slices/core.ts',
  'src/store/entities/prompt/slices/core.ts',
  'src/store/entities/place/index.ts',
  'src/store/entities/group/slices/filters.ts',
  'src/store/entities/group/slices/core.ts',
  'src/store/entities/group/slices/ui.ts',
  'src/store/entities/concept/store.ts',
  'src/store/entities/concept/slices/relations.ts',
  'src/store/entities/concept/slices/ui.ts',
  'src/store/entities/concept/slices/filters.ts',
  'src/store/entities/concept/slices/core.ts',
  'src/store/entities/activity/index.ts',
  'src/store/files/file-manager.store.ts'
];

// Para cada archivo, generar el comando para:
// 1. Cambiar la importación de serverLogger a clientLogger
// 2. Cambiar el uso de serverLogger por clientLogger
console.log('# Comandos para actualizar las importaciones y usos de logger:');
console.log('');

files.forEach(file => {
  console.log(`# Actualizando ${file}`);
  console.log(`sed -i 's/import { serverLogger } from \\'@\\/lib\\/logger\\/server-logger\\'/import { clientLogger } from \\'@\\/lib\\/logger\\/client-logger\\'/' ${file}`);
  console.log(`sed -i 's/import { serverLogger } from \\'.\\.\\/.\\.\\/lib\\/logger\\/server-logger\\'/import { clientLogger } from \\'.\\.\\/.\\.\\/lib\\/logger\\/client-logger\\'/' ${file}`);
  console.log(`sed -i 's/import { serverLogger } from \\'\\.\\.\\/.\\.\\/.\\.\\/.\\.\\/lib\\/logger\\/server-logger\\'/import { clientLogger } from \\'\\.\\.\\/.\\.\\/.\\.\\/.\\.\\/lib\\/logger\\/client-logger\\'/' ${file}`);
  console.log(`sed -i 's/serverLogger/clientLogger/g' ${file}`);
  console.log('');
});

console.log('# Arreglar archivo store.factory.ts (caso especial)');
console.log(`sed -i 's/logger?: typeof serverLogger;/logger?: typeof clientLogger;/' src/store/store.factory.ts`);