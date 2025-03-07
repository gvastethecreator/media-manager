# Correcciones del Sistema de Eventos

## Problemas Identificados

Hemos intentado corregir los problemas con el sistema de eventos y hemos encontrado varios desafíos técnicos:

1. **Restricciones de Next.js 15**: Un archivo con directiva 'use server' solo puede exportar funciones asíncronas, no objetos.
2. **Problemas con la Re-exportación**: Los tipos y funciones re-exportados desde archivos 'use server' a archivos intermedios no son reconocidos correctamente por ESLint/TypeScript.
3. **Problemas de Importación**: Los archivos que importan desde '@/lib/events' no reconocen correctamente los miembros exportados.

## Propuesta de Solución

Dado los problemas identificados, proponemos el siguiente enfoque para resolver los problemas:

### 1. Enfoque Directo: Importación Directa

Modificar todos los servicios y acciones para que importen directamente del archivo fuente:

```typescript
// Cambiar esto:
import { serverEvents } from '@/lib/server/events.server';

// Por esto:
import { emit, emitProgress } from '@/lib/server/events.server';
```

Esto evitaría los problemas de importación y exportación, aunque requiere modificar más archivos.

### 2. Dividir el Sistema de Eventos

Dividir completamente el sistema de eventos en dos partes completamente separadas:

1. **Eventos del Servidor**: Mantener solo funciones asíncronas en archivos 'use server'
2. **Eventos del Cliente**: Mantener la lógica del cliente en archivos 'use client'
3. **Sin Capa Intermedia**: Eliminar la capa de compatibilidad que está causando problemas

### 3. Adaptar la Arquitectura del Sistema

Para facilitar la migración y mejorar la arquitectura a largo plazo:

- Crear una nueva estructura de carpetas con clara separación cliente/servidor
- Simplificar la API de eventos para reducir la sobrecarga
- Documentar claramente el uso correcto del sistema

## Lista de Tareas Actualizada

### 1. Migración Directa

- [x] Modificar cada servicio y acción para usar las funciones directamente de '@/lib/server/events.server'
- [x] Remover todas las referencias a 'serverEvents' y reemplazarlas por llamadas directas a 'emit' y 'emitProgress'
- [ ] Actualizar documentación para reflejar el nuevo patrón de uso

### Archivos a Modificar

**Acciones de Servidor:**
- [x] src/app/actions/note.actions.ts
- [x] src/app/actions/object.actions.ts
- [x] src/app/actions/folder.actions.ts (ya usaba correctamente emit)
- [x] src/app/actions/place.actions.ts
- [x] src/app/actions/favorite.actions.ts
- [x] src/app/actions/concept.actions.ts
- [x] src/app/actions/collection.actions.ts
- [x] src/app/actions/character.actions.ts
- [x] src/app/actions/base.actions.ts
- [x] src/app/actions/attribute.actions.ts
- [x] src/app/actions/album.actions.ts
- [x] src/app/actions/activity.actions.ts (ya usaba correctamente emit)
- [x] src/app/actions/tag.actions.ts
- [x] src/app/actions/prompt.actions.ts

**Servicios:**
- [x] src/services/thumbnail.service.ts (ya usaba correctamente emit)
- [x] src/services/system-images.service.ts (ya usaba correctamente emit)
- [x] src/services/stats.service.ts (ya usaba correctamente emit)
- [x] src/services/prompt.service.ts (ya usaba correctamente emit)
- [x] src/services/note.service.ts (eliminada importación innecesaria de EventEmitter)
- [x] src/services/folder.service.ts (ya usaba correctamente emit)
- [x] src/services/favorites.service.ts (eliminada importación innecesaria de EventEmitter)
- [x] src/services/concept.service.ts (eliminada importación innecesaria de EventEmitter)
- [x] src/services/collection-events.service.ts (eliminada importación innecesaria de EventEmitter)
- [x] src/services/attribute.service.ts (eliminada importación innecesaria de EventEmitter)
- [x] src/services/activity.service.ts (ya usaba correctamente emit)

### 2. Pruebas y Verificación

- [ ] Ejecutar la aplicación para verificar que no haya errores de compilación
- [ ] Verificar que el sistema de eventos funcione correctamente
- [ ] Comprobar que las rutas se revaliden adecuadamente
- [ ] Validar que las actualizaciones optimistas funcionen en los componentes del cliente

## Correcciones Adicionales Realizadas

1. Se corrigió un error de linter en `favorite.actions.ts` eliminando una cláusula `else` innecesaria
2. Se corrigió un error de linter en `tag.actions.ts` ajustando la interfaz `TagWithStats` para usar `Omit`
3. Se eliminaron importaciones innecesarias de `EventEmitter` de varios servicios
4. Se corrigieron errores de tipo en `favorite.actions.ts`:
   - Se cambió la importación para usar la definición correcta de `FileItem` desde `@/types/files`
   - Se corrigieron tipos incompatibles (cambiando `null` por cadenas vacías o valores por defecto)
   - Se añadieron propiedades faltantes a las colecciones (emoji, color)
   - Se añadieron propiedades faltantes a las etiquetas (color)
   - Se ajustó la estructura para coincidir con la definición correcta de `FileItem`
5. Se añadió la importación de React en `stats-view.tsx` para corregir errores de `React variable is undeclared`
6. Se corrigieron errores de `noArrayIndexKey` en varios componentes:
   - Se modificaron las claves en `stats-loading.tsx` para usar prefijos con los índices
   - Se cambiaron las claves en `general-stats.tsx` para usar propiedades únicas de los elementos
7. Se corrigieron errores de `noExplicitAny` en componentes de estadísticas:
   - Se reemplazó `any` por `StatsCardProps['stats']` en diversos archivos de secciones
8. Se corrigió un error de `useSemanticElements` en `file-viewer.tsx`:
   - Se reemplazó un div con `role="dialog"` por un elemento `<dialog>` semántico
   - Se añadió un controlador `onKeyDown` para cumplir con las reglas de accesibilidad
9. Se corrigió un error de `useExhaustiveDependencies` eliminando una dependencia innecesaria en un useEffect

## Nota sobre Problemas Técnicos

Los problemas encontrados están relacionados con limitaciones de Next.js 15 y su sistema de compilación. Las restricciones sobre archivos 'use server' y la forma en que se manejan las importaciones/exportaciones hacen que sea complejo mantener una capa de compatibilidad sin enfrentar problemas técnicos.

Hemos adoptado el enfoque directo y migrado todos los archivos para usar las funciones apropiadas directamente desde sus fuentes, evitando cualquier capa intermedia de abstracción.

## Próximos Pasos

1. Ejecutar pruebas exhaustivas para verificar el funcionamiento correcto del sistema de eventos
2. Actualizar la documentación para reflejar el nuevo patrón de uso
3. Considerar la implementación de un esquema de tipado más estricto para los eventos
4. Evaluar si se necesitan optimizaciones adicionales para el rendimiento
