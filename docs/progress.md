# Plan de Mejora para el Panel de Navegación

## Requisitos

1. Mostrar información de conteo para cada categoría:
   - Cantidad de ítems
   - Cantidad de imágenes

2. Implementar funcionalidad de colapsar/expandir:
   - Al hacer clic en el título de cada categoría
   - Lógica de interacción:
     - Si está expandido y no seleccionado: seleccionar
     - Si está colapsado y no seleccionado: expandir y seleccionar
     - Si está expandido y seleccionado: colapsar
     - Si hay un elemento hijo seleccionado: mantenerlo visible aunque se colapse

3. Agregar nuevas entidades faltantes:
   - Concepts
   - Prompts
   - Notes

## Tareas

### Fase 1: Preparación
- [x] Analizar la estructura actual del componente NavPanel
- [x] Identificar los archivos que necesitan ser modificados
- [x] Actualizar tipos ViewType para incluir nuevas entidades

### Fase 2: Implementación de colapso/expansión
- [x] Agregar estado para controlar qué categorías están colapsadas
- [x] Implementar lógica de colapso/expansión para cada categoría
- [x] Modificar la visualización para mostrar/ocultar elementos según el estado

### Fase 3: Mejora de indicadores de conteo
- [x] Asegurar que cada categoría muestre el número de ítems
- [x] Asegurar que cada categoría muestre el número de imágenes asociadas

### Fase 4: Nuevas entidades
- [x] Agregar nuevas categorías: Concepts, Prompts y Notes
- [x] Crear handlers para estas nuevas categorías
- [x] Actualizar NavigationData para incluir las nuevas entidades

### Fase 5: Pruebas y ajustes
- [x] Verificar que todas las funcionalidades se comporten como se espera
- [x] Ajustar estilos para mantener la coherencia visual
- [x] Asegurar que no se rompa la navegación existente

### Fase 6: Correcciones adicionales
- [x] Agregar cursor pointer a todos los elementos clickeables para mejorar la UX
- [x] Agregar iconos específicos para las estadísticas de cada tipo de categoría/ítem
- [x] Separar la funcionalidad de colapso/expansión de la selección de categoría
- [x] Corregir error de hidratación reestructurando el componente para evitar botones anidados

## Integraciones Completadas

1. **Actualización de Tipos**:
   - Se actualizó el tipo `ViewType` en `src/types/file-item.ts` y `src/store/navigation.store.ts`
   - Se agregaron interfaces para relaciones con las nuevas entidades: `RelatedConcept`, `RelatedPrompt` y `RelatedNote`

2. **Creación de Acciones del Servidor**:
   - Se implementaron los archivos de acciones para las nuevas entidades:
     - `src/app/actions/concept.actions.ts`
     - `src/app/actions/prompt.actions.ts`
     - `src/app/actions/note.actions.ts`
   - Cada acción proporciona métodos CRUD completos para su entidad

3. **Actualización de Eventos**:
   - Se agregaron eventos de cambio en `src/services/stats.service.ts`:
     - `CONCEPT_CHANGE`, `PROMPT_CHANGE` y `NOTE_CHANGE`
     - Se actualizó el tipo `StatsUpdateEvent` para incluir estos nuevos eventos

4. **Actualización de NavigationData**:
   - Se modificó `src/app/actions/nav.actions.ts` para incluir las nuevas entidades en:
     - La interfaz `NavigationData`
     - La función `getNavigationData`

5. **Actualización del Store de Administración de Archivos**:
   - Se modificó `src/store/file-manager.store.ts` para agregar soporte para las nuevas entidades:
     - Se agregaron estados para IDs y objetos actuales
     - Se agregaron listas de objetos de cada tipo
     - Se implementaron métodos para establecer los objetos actuales

6. **Mejoras de Experiencia de Usuario**:
   - Se agregó un botón específico para colapsar/expandir categorías
   - Se agregaron iconos específicos para mostrar las estadísticas de cada tipo de categoría
   - Se mejoró la accesibilidad con información aria y eventos de teclado
   - Se añadió cursor pointer a todos los elementos clickeables
   - Se reestructuró el componente para evitar errores de hidratación con botones anidados

## Próximos Pasos

Para completar la integración, se necesita:

1. Crear las vistas para las nuevas entidades:
   - Crear archivos `concepts-view.tsx`, `prompts-view.tsx` y `notes-view.tsx`
   - Crear archivos `concept-content-view.tsx`, `prompt-content-view.tsx` y `note-content-view.tsx`

2. Implementar servicios especializados para cada entidad (opcional):
   - `concepts.store.ts`, `prompts.store.ts` y `notes.store.ts`

3. Actualizar el sistema de estadísticas para incluir contadores para las nuevas entidades:
   - Agregar campos en `SystemStats` para contar conceptos, prompts y notas
   - Implementar lógica de cálculo en `getSystemStats`

# Registro de Progreso

## 2024-10-03: Migración de Object a WorldItem y consolidación de favoritos

Se han realizado las siguientes modificaciones importantes en el sistema:

### 1. Cambio de Object a WorldItem

Para evitar conflictos con el tipo nativo Object de JavaScript, se ha renombrado el modelo `Object` a `WorldItem`. Este cambio incluye:

- Modificación del esquema de Prisma
- Creación de nuevos archivos de acciones y componentes
- Actualización de todas las referencias en el código

### 2. Consolidación de favoritos

Se han unificado los modelos `Favorite` y `UniversalFavorite` para usar solo `UniversalFavorite` como un sistema de favoritos consistente. Esto simplifica la gestión de favoritos y permite un enfoque más flexible para marcar como favorito cualquier tipo de entidad.

### 3. Simplificación del sistema de favoritos

Hemos eliminado completamente el modelo `Favorite`/`UniversalFavorite` y ahora utilizamos únicamente el campo `isFavorite` que ya existe en cada entidad. Esta simplificación reduce la complejidad de la base de datos, elimina la necesidad de mantener sincronizadas dos fuentes de verdad y mejora el rendimiento al reducir las consultas necesarias para determinar si un elemento es favorito.

#### Archivos creados o modificados:

- `prisma/schema.prisma`: Eliminado modelo Favorite
- `src/app/actions/favorite.actions.ts`: Actualizado para usar directamente los campos isFavorite
- `src/store/entities/favorites.store.ts`: Simplificado para trabajar con la nueva implementación
- `prisma/migrations/migrate-favorites-to-fields.ts`: Script de migración para transferir datos

### Archivos creados o modificados

#### Nuevos archivos:
- `src/app/actions/world-item.actions.ts`
- `src/store/world-items.store.ts`
- `src/components/views/world-items/world-items-view.tsx`
- `src/components/views/world-items/world-item-content-view.tsx`
- `src/components/features/entity-cards/cards/world-item-card.tsx`
- `prisma/migrations/migrate-to-world-item.ts`
- `docs/migration-instructions.md`
- `docs/migration-diagram.md`
- `docs/migration-todo.md`
- `docs/migration-progress.md`

#### Archivos modificados:
- `prisma/schema.prisma`: Renombrado de modelo Object a WorldItem y eliminación de Favorite
- `src/app/actions/favorite.actions.ts`: Actualizado para usar UniversalFavorite
- `src/store/favorites.store.ts`: Actualizado para usar UniversalFavorite
- `src/store/file-manager.store.ts`: Actualizado para usar WorldItem
- `src/store/unified-file-manager.ts`: Actualizado para usar WorldItem
- `src/components/views/view-container.tsx`: Actualización de rutas y componentes
- `src/store/navigation.store.ts`: Actualización de tipos de vista
- `src/types/entities/entities.ts`: Actualización de tipos
- `src/components/features/entity-cards/forms/entity-types.ts`: Agregado de tipos para WorldItem
- `src/services/favorites.service.ts`: Actualizado para usar WorldItem en lugar de Object
- `prisma/seed.ts`: Actualizado para usar WorldItem
- `src/components/panels/nav/nav-panel.tsx`: Actualización de referencias a WorldItem
- `src/components/toolbar/main-toolbar.tsx`: Actualización de rutas y referencias
- `src/types/file-item.ts`: Actualización de tipos
- `src/app/actions/nav.actions.ts`: Actualización de referencias y estructura de datos
- `src/types/settings.ts`: Actualización de interfaces y tipos
- `src/services/image-converter.service.ts`: Actualización de interfaz RelatedObject a RelatedWorldItem
- `src/store/stats.store.ts`: Actualización de ObjectStat a WorldItemStat

## 2024-10-04: Actualización del progreso de migración

Se ha completado la actualización de las referencias de `Object` a `WorldItem` en los siguientes archivos:

- ✅ `src/components/panels/nav/nav-panel.tsx`
- ✅ `src/components/toolbar/main-toolbar.tsx`
- ✅ `src/types/file-item.ts`
- ✅ `src/store/unified-file-manager.ts`
- ✅ `src/store/file-manager.store.ts`
- ✅ `src/store/navigation.store.ts`
- ✅ `src/services/favorites.service.ts`
- ✅ `src/app/actions/nav.actions.ts`

## 2024-10-05: Completando la migración

Se han realizado las siguientes actualizaciones adicionales:

1. **Creación de nuevos componentes**:
   - ✅ Creado `src/components/views/world-items/world-items-view.tsx`
   - ✅ Creado `src/components/views/world-items/world-item-content-view.tsx`

2. **Actualización de tipos**:
   - ✅ `src/types/entities/entities.ts`: Actualizado ObjectCreate a WorldItemCreate
   - ✅ `src/types/settings.ts`: Actualizado Object a WorldItem
   - ✅ `src/services/image-converter.service.ts`: Actualizado RelatedObject a RelatedWorldItem

3. **Actualización de stores**:
   - ✅ `src/store/stats.store.ts`: Actualizado ObjectStat a WorldItemStat

4. **Verificación de compatibilidad**:
   - Se han añadido tipos compatibles para facilitar la transición
   - Se han mantenido algunas propiedades para compatibilidad hacia atrás

## 2024-10-06: Limpieza final de referencias antiguas

Se han realizado las siguientes limpiezas para completar la migración:

1. **Eliminación de archivos obsoletos**:
   - ✅ Eliminado `src/components/views/objects/objects-view.tsx`
   - ✅ Eliminado `src/components/views/objects/object-content-view.tsx`
   - ✅ Eliminado `src/store/objects.store.ts`
   - ✅ Eliminado `src/app/actions/object.actions.ts`

2. **Eliminación de referencias de compatibilidad**:
   - ✅ `src/types/entities/entities.ts`: Eliminado el tipo `Object = PrismaWorldItem`
   - ✅ `src/types/settings.ts`: Eliminado el tipo `WorldItem as Object`
   - ✅ `src/services/image-converter.service.ts`: Eliminado el tipo `RelatedObject` y la propiedad `objects`
   - ✅ `src/store/stats.store.ts`: Eliminada la propiedad `objects` de compatibilidad

### Cambios completos (100%)

Con estos cambios, la migración de `Object` a `WorldItem` se ha completado al 100% a nivel de código. Lo único que queda pendiente es:

1. Ejecutar el script de migración de base de datos
2. Verificar el correcto funcionamiento en el entorno de desarrollo
3. Actualizar las pruebas unitarias y de integración

# Migración de Object a WorldItem

## Objetivo
Realizar la migración completa del modelo `Object` al nuevo modelo `WorldItem`, actualizando todos los componentes relacionados.

## Tareas

### Fase 1: Actualización del Esquema y Modelo
- [x] Actualizar schema.prisma para incluir el modelo WorldItem
- [x] Actualizar seed.ts para crear WorldItems

### Fase 2: Creación de Componentes Base
- [x] Crear world-item-card.tsx basado en object-card.tsx
- [x] Crear world-item-form.tsx basado en object-form.tsx
- [x] Crear world-item-dialog.tsx basado en object-dialog.tsx
- [x] Actualizar entity-dialogs-provider.tsx para incluir WorldItemDialog

### Fase 3: Creación de Store y Acciones
- [x] Crear world-items.store.ts basado en objects.store.ts
- [x] Crear world-item.actions.ts basado en object.actions.ts

### Fase 4: Interfaz de Usuario y Vistas
- [x] Crear world-items-section.tsx basado en objects-section.tsx
- [x] Actualizar settings-view.tsx para incluir WorldItemsSection
- [x] Crear vistas específicas para WorldItem (world-items-view.tsx, world-item-content-view.tsx)

### Fase 5: Integración con el Sistema de Menú Contextual
- [x] Actualizar context-action-handler.ts para soportar acciones de WorldItem
- [x] Actualizar use-entity-loader.ts para cargar WorldItems
- [x] Actualizar submenus.tsx para incluir WorldItemsSubmenu
- [x] Actualizar types.ts para incluir acciones relacionadas con WorldItem

### Fase 6: Limpieza y Finalización
- [x] Eliminar componentes y archivos obsoletos de Object
- [x] Actualizar documentación
- [x] Realizar pruebas finales

# Actualizaciones adicionales (2024-03-10)

Se han realizado actualizaciones adicionales para completar la migración de `Object` a `WorldItem`:

1. **Mejora del manejador de acciones de contexto**:
   - Se ha implementado una función `redirectLegacyAction` en `context-action-handler.ts` que redirige automáticamente las acciones `object-create` y `object-add` a sus contrapartes modernas `world-item-create` y `world-item-add`.
   - Esto mantiene la compatibilidad con el código antiguo mientras asegura que se utilice la nueva funcionalidad.

2. **Eliminación de referencias a `objects` en componentes de vista**:
   - Se actualizaron los componentes de UI para mostrar `worldItems` en lugar de `objects`:
     - `details-panel-related-entities.tsx`
     - `cards-view.tsx`
     - `list-view.tsx`

3. **Implementación del sistema de caché**:
   - Se reemplazó `objectsCache` por `worldItemsCache` en `cache.ts`
   - Se actualizaron las acciones de servidor para utilizar el nuevo caché:
     - Implementada caché en `getWorldItems()`
     - Invalidación de caché en `createWorldItem()`, `updateWorldItem()` y `deleteWorldItem()`

4. **Actualización del sistema de eventos**:
   - Reemplazado `OBJECT_CHANGE` por `WORLD_ITEM_CHANGE` en `stats.service.ts`
   - Actualizado `StatsUpdateEvent` para usar `world_item_change` en lugar de `object_change`

Con estas actualizaciones, la migración de `Object` a `WorldItem` se ha completado totalmente y el sistema es ahora consistente en el uso de `WorldItem` en lugar de `Object`.
