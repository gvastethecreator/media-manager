# Migración de ServerLogger a ClientLogger en archivos de Store

Este documento proporciona instrucciones para realizar la migración masiva de `serverLogger` a `clientLogger` en archivos de store y componentes del lado del cliente.

## Problema

El uso de `serverLogger` en archivos del lado del cliente, como los stores de Zustand, está causando errores en tiempo de ejecución:

```
Error: _lib_logger_server_logger__WEBPACK_IMPORTED_MODULE_0__.serverLogger.child is not a function
```

Esto ocurre porque `serverLogger` está diseñado para ejecutarse en el servidor y utiliza características que no están disponibles en el navegador.

## Solución

Reemplazar todas las importaciones y usos de `serverLogger` por `clientLogger` en archivos del cliente.

## Pasos para la migración manual

Para cada archivo que use `serverLogger`:

1. Cambiar la importación:
   ```typescript
   // De
   import { serverLogger } from '@/lib/logger/server-logger';

   // A
   import { clientLogger } from '@/lib/logger/client-logger';
   ```

2. Cambiar todas las referencias a `serverLogger` por `clientLogger`:
   ```typescript
   // De
   const logger = serverLogger.withContext('StoreName');

   // A
   const logger = clientLogger.withContext('StoreName');
   ```

## Lista de archivos a actualizar

Los siguientes archivos necesitan ser actualizados:

### Archivo principal de Store
- `src/store/entities/wildcard/slices/filters.ts`
- `src/store/entities/wildcard/slices/ui.ts`
- `src/store/entities/wildcard/slices/core.ts`
- `src/store/entities/tag/slices/core.slice.ts`
- `src/store/entities/property/slices/ui.ts`
- `src/store/entities/property/slices/filters.ts`
- `src/store/entities/queue-job/slices/filters.ts`
- `src/store/entities/queue-job/slices/ui.ts`
- `src/store/entities/queue-job/slices/core.ts`
- `src/store/entities/queue-job/queue-job-store.ts`
- `src/store/entities/property/slices/core.ts`
- `src/store/entities/prompt/store.ts`
- `src/store/entities/concept/store.ts`
- `src/store/entities/prompt/slices/ui.ts`
- `src/store/entities/note/index.ts`
- `src/store/entities/prompt/slices/relations.ts`
- `src/store/entities/note/slices/filters.ts`
- `src/store/entities/note/slices/selection.ts`
- `src/store/entities/note/slices/ui.ts`
- `src/store/entities/note/slices/relations.ts`
- `src/store/entities/note/slices/core.ts`
- `src/store/entities/prompt/slices/filters.ts`
- `src/store/entities/prompt/slices/execution.ts`
- `src/store/entities/prompt/slices/core.ts`
- `src/store/entities/concept/slices/ui.ts`
- `src/store/entities/concept/slices/relations.ts`
- `src/store/entities/concept/slices/filters.ts`
- `src/store/entities/concept/slices/core.ts`
- `src/store/entities/group/slices/ui.ts`
- `src/store/entities/group/slices/filters.ts`
- `src/store/entities/group/slices/core.ts`
- `src/store/files/file-manager.store.ts`
- `src/store/entities/activity/index.ts`

## Validación

Después de actualizar todos los archivos, ejecuta la aplicación con `pnpm dev` y verifica que no hay errores relacionados con `serverLogger`.

## Consideraciones adicionales

- Asegúrate de que el código del `clientLogger` no incluye funcionalidades específicas del servidor.
- Este cambio no afecta a los archivos que se ejecutan en el servidor, donde `serverLogger` sigue siendo la opción adecuada.
- Si un archivo puede ejecutarse tanto en el cliente como en el servidor, considera importar el logger adecuado condicionalmente.

## Automatización

El script `scripts/replace-server-logger.js` puede ayudar a automatizar esta migración:

```javascript
const fs = require('fs');
const path = require('path');

function findFiles(dir, pattern) {
  let results = [];
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      results = results.concat(findFiles(filePath, pattern));
    } else if (pattern.test(file)) {
      results.push(filePath);
    }
  }

  return results;
}

function replaceInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  // Reemplazar importaciones
  const newContent = content
    .replace(/import\s*{\s*serverLogger\s*}\s*from\s*['"][@/\w-]+\/server-logger['"]/g,
             "import { clientLogger } from '@/lib/logger/client-logger'")
    // Reemplazar usos
    .replace(/serverLogger/g, 'clientLogger');

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated: ${filePath}`);
    return true;
  }

  return false;
}

// Buscar archivos en directorio store
const storeDir = path.join(__dirname, '..', 'src', 'store');
const files = findFiles(storeDir, /\.tsx?$/);

// Procesar cada archivo
let updateCount = 0;
for (const file of files) {
  if (replaceInFile(file)) {
    updateCount++;
  }
}

console.log(`Migration complete. Updated ${updateCount} files.`);
```