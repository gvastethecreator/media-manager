# Proceso de Refactorización y Optimización

## Objetivo

Mejorar la calidad del código, eliminar redundancias y preparar la transición a server actions en Next.js 15.

## Stack Tecnológico

- Next.js 15
- Prisma (ORM)
- TypeScript
- Server Actions (objetivo futuro)

## Archivos Afectados

1. Stores Base y Específicos:

   - base.store.ts
   - characters.store.ts
   - albums.store.ts
   - collections.store.ts

2. Componentes de Sección:

   - places-section.tsx
   - objects-section.tsx
   - collections-section.tsx
   - albums-section.tsx

3. Componentes Core:
   - context-menu.tsx
   - file-viewer.tsx

## Plan de Acción

### Fase 1: Corrección de Errores de Linting

- [ ] base.store.ts

  - [ ] Tipos explícitos para parámetros
  - [ ] Interfaces robustas
  - [ ] Corrección de tipos de estado

- [ ] Stores específicos

  - [ ] characters.store.ts
  - [ ] albums.store.ts
  - [ ] collections.store.ts

- [ ] Componentes de sección

  - [ ] places-section.tsx
  - [ ] objects-section.tsx
  - [ ] collections-section.tsx
  - [ ] albums-section.tsx

- [ ] Componentes core
  - [ ] context-menu.tsx
  - [ ] file-viewer.tsx

### Fase 2: Eliminación de Código Duplicado

- [ ] Identificar patrones comunes en stores
- [ ] Unificar lógica CRUD
- [ ] Crear componentes reutilizables para UI
- [ ] Optimizar manejo de estado

### Fase 3: Preparación para Server Actions

- [ ] Identificar endpoints actuales
- [ ] Planear migración a server actions
- [ ] Crear estructura para nuevas acciones
- [ ] Preparar tipos y validaciones

### 2024-03-XX: Corrección de Errores de Lint en Componentes y Base Actions

1. Problemas Identificados:

   - Errores de tipo en componentes de sección (\_count y totalSize)
   - Problemas con tipos implícitos en parámetros
   - Errores en base.actions.ts con acceso a prisma y constructor
   - Necesidad de mejorar tipos en la interacción con Prisma

2. Plan de Acción:

   - Corregir base.actions.ts primero (es la base del sistema)
   - Actualizar tipos en componentes de sección
   - Implementar interfaces comunes para reducir duplicación
   - Asegurar compatibilidad con el modelo de Prisma

3. Archivos Afectados:
   - base.actions.ts
   - albums-section.tsx
   - collections-section.tsx
   - objects-section.tsx
   - places-section.tsx

## Progreso

### 2024-03-XX: Inicio del Proceso

1. Análisis inicial del código
2. Identificación de problemas principales:
   - Errores de tipo en stores
   - Código duplicado en componentes de sección
   - Inconsistencias en manejo de estado
   - Necesidad de migración a server actions

### 2024-03-XX: Corrección de base.store.ts

1. Implementación de tipos explícitos:
   - Agregadas interfaces SetState y GetState
   - Tipado explícito para parámetros de funciones
   - Mejorada la interfaz StoreOptions
2. Correcciones de tipo:
   - Añadido tipo genérico T para BaseEntity en funciones de estado
   - Corregida la tipación de callbacks en métodos de estado
   - Mejorado el manejo de tipos en acciones CRUD
3. Mejoras en la estructura:
   - Separación clara de interfaces
   - Mejor organización del código
   - Documentación de tipos mejorada

### 2024-03-XX: Corrección de characters.store.ts

1. Problemas identificados:
   - Incompatibilidad entre tipos Prisma y tipos personalizados
   - Problemas con tipos nulos vs undefined
   - Incompatibilidad en tipos de acciones CRUD
   - Problemas con el tipado de funciones de estado
2. Acciones necesarias:
   - Alinear tipos de Character con el modelo Prisma
   - Corregir manejo de tipos nulos/undefined
   - Ajustar tipos de acciones CRUD
   - Mejorar tipado de funciones de estado
3. Consideraciones:
   - Mantener compatibilidad con BaseStore
   - Asegurar tipo correcto para datos de Prisma
   - Manejar correctamente estados opcionales

### 2024-03-XX: Mejoras en el Sistema de Tipos

1. Actualización de base.store.ts:

   - Mejorada la definición de PrismaModels para mejor inferencia de tipos
   - Agregado segundo parámetro de tipo para modelo específico de Prisma
   - Actualizada la firma de createBaseStore para mayor type safety

2. Correcciones en characters.store.ts:

   - Alineados tipos con el modelo de Prisma
   - Implementadas acciones faltantes
   - Mejorado el manejo de estado
   - Corregidos problemas con tipos nulos/undefined

3. Problemas Pendientes:
   - Verificar compatibilidad con otros stores
   - Implementar pruebas para nuevas funcionalidades
   - Documentar cambios en la API

### 2024-03-XX: Actualización de albums.store.ts

1. Implementación de nuevos tipos:
   - Alineación con el modelo de Prisma
   - Separación de interfaces State y Actions
   - Tipado estricto para operaciones CRUD
2. Mejoras funcionales:
   - Implementación completa de BaseActions
   - Manejo mejorado de estado
   - Mejor gestión de errores
3. Problemas pendientes:
   - Error en createBaseStore: necesita segundo argumento
   - Verificar compatibilidad con tipos de Prisma
   - Revisar manejo de tipos nulos/undefined

### 2024-03-XX: Refactorización del Sistema de Tipos

1. Mejoras en base.store.ts:
   - Definición mejorada de PrismaModelName
   - Documentación clara de tipos y propósitos
   - Mejor organización del código
2. Cambios en la estructura:
   - Separación clara de responsabilidades
   - Mejor tipado para modelos de Prisma
   - Documentación inline mejorada
3. Problemas resueltos:
   - Incompatibilidad de tipos con Prisma
   - Problemas de tipado en stores específicos
   - Documentación incompleta

### 2024-03-XX: Actualización de collections.store.ts

### Cambios Realizados

1. Refactorización completa del store para usar la nueva estructura base

   - Implementación de interfaces específicas: `Collection`, `CollectionState`, `CollectionActions`
   - Integración con `BaseEntity`, `BaseState`, y `BaseActions`
   - Mejora en el manejo de tipos para las acciones CRUD

2. Mejoras Funcionales

   - Implementación completa de BaseActions
   - Manejo mejorado de errores con tipos específicos
   - Mejor gestión del estado de carga y errores
   - Implementación de paginación y carga incremental
   - Mejora en la gestión de selección de items

3. Problemas Pendientes
   - Error en tipos exportados de collection.actions
   - Error en argumentos de createBaseStore
   - Necesidad de revisar la exportación de tipos en el módulo de acciones

### Próximos Pasos

1. Corregir los errores de tipos en collection.actions
2. Ajustar la implementación de createBaseStore
3. Continuar con la actualización de los componentes que usan el store
4. Implementar pruebas para validar el funcionamiento

### Notas Técnicas

1. Estructura de Tipos:

   ```typescript
   // Tipo base para modelos Prisma
   type PrismaModelName = Lowercase<keyof {
     [K in keyof PrismaClient as PrismaClient[K] extends { findMany: any } ? K : never]: true
   }>

   // Store base y tipos relacionados
   interface BaseEntity { ... }
   interface BaseState<T> { ... }
   interface BaseActions<T> { ... }
   type BaseStore<T> = BaseState<T> & BaseActions<T>
   ```

2. Uso en Stores Específicos:
   ```typescript
   // Ejemplo de implementación
   interface CustomEntity extends BaseEntity { ... }
   interface CustomState extends BaseState<CustomEntity> { ... }
   interface CustomActions extends BaseActions<CustomEntity> { ... }
   type CustomStore = CustomState & CustomActions
   ```

## Notas Importantes

- Mantener funcionalidad existente
- Pruebas después de cada cambio
- Documentar cambios significativos
- Considerar impacto en rendimiento

### 2024-03-XX: Corrección de base.actions.ts

1. Mejoras en el Sistema de Tipos:

   - Implementado tipo PrismaModelName para validación estática de modelos
   - Mejorado el tipado de retorno para incluir BaseStats
   - Agregadas anotaciones de tipo para parámetros implícitos
   - Corregido el manejo de tipos en operaciones con Prisma

2. Cambios Estructurales:

   - Movida la inicialización del logger a método initLogger
   - Agregado type assertion seguro para operaciones de Prisma
   - Mejorada la estructura de herencia para BaseActions
   - Implementada mejor gestión de tipos genéricos

3. Próximos Pasos:
   - Actualizar las clases que heredan de BaseActions
   - Implementar initLogger en las clases hijas
   - Verificar la compatibilidad con los tipos existentes
   - Actualizar los componentes que usan estas acciones

### 2024-03-XX: Implementación de Interfaces Comunes

1. Creación de BaseEntityWithStats:

   - Extiende BaseEntity con propiedades de estadísticas
   - Agrega soporte para conteo de imágenes y tamaño total
   - Proporciona una base común para todas las entidades

2. Interfaces Específicas:

   - Album: Propiedades para tipo y estadísticas
   - Collection: Manejo especial de filters como array
   - Object: Propiedades para tipo, rareza y estadísticas
   - Place: Propiedades para clima, población y gobierno

3. Mejoras de Tipo:

   - Uso de Omit para manejar incompatibilidades
   - Tipos más específicos para cada entidad
   - Mejor integración con BaseEntity

4. Próximos Pasos:
   - Actualizar los componentes para usar las nuevas interfaces
   - Verificar la compatibilidad con las acciones existentes
   - Implementar validaciones basadas en los nuevos tipos

### 2024-03-XX: Actualización de albums-section.tsx

1. Correcciones de Tipo:

   - Reemplazado PrismaAlbum por la nueva interfaz Album
   - Mejorado el manejo de propiedades opcionales
   - Corregida la actualización de álbumes para excluir propiedades no actualizables
   - Agregadas verificaciones de nulidad para \_count

2. Mejoras de Código:

   - Renombrado Album a AlbumIcon para evitar conflictos
   - Mejorada la estructura del formulario de edición
   - Optimizado el manejo de estados
   - Implementada mejor gestión de errores

3. Próximos Pasos:
   - Aplicar cambios similares a los otros componentes de sección
   - Verificar la integración con las acciones del servidor
   - Implementar mejoras de UX basadas en los nuevos tipos
   - Agregar validaciones adicionales

### 2024-03-XX: Corrección de Componentes de Sección Restantes

1. Plan de Corrección:

   - collections-section.tsx: Migrar de store a acciones directas
   - objects-section.tsx: Implementar manejo de tipos específicos
   - places-section.tsx: Corregir tipos y validaciones

2. Pasos para collections-section.tsx:

   - Reemplazar useCollectionsStore por acciones directas
   - Implementar manejo de filters como array
   - Corregir tipos implícitos
   - Agregar validaciones de nulidad

3. Pasos para objects-section.tsx y places-section.tsx:

   - Aplicar patrón de verificación de \_count
   - Implementar manejo de tipos específicos
   - Mejorar validaciones de datos
   - Optimizar manejo de estado

4. Objetivos Comunes:
   - Mantener consistencia en el manejo de errores
   - Implementar verificaciones de tipo seguras
   - Mejorar la experiencia del usuario
   - Reducir código duplicado

### 2024-03-XX: Actualización de Componentes de Sección

1. Componentes Actualizados:

   - collections-section.tsx
   - objects-section.tsx
   - places-section.tsx

2. Cambios Realizados:

   - Migración de stores a acciones del servidor
   - Mejora en el manejo de tipos con TypeScript
   - Implementación de interfaces específicas para cada entidad
   - Corrección de manejo de estados y formularios
   - Optimización de la carga y actualización de datos
   - Mejora en la validación de datos
   - Implementación de manejo de errores consistente
   - Actualización de la interfaz de usuario para mejor UX

3. Mejoras Específicas:

   - Uso de BaseStats para conteo de imágenes y tamaño total
   - Implementación de tipos específicos para cada entidad
   - Manejo mejorado de estados de carga y errores
   - Validaciones robustas en formularios
   - Mejor manejo de tipos nulos y opcionales
   - Implementación de revalidación de rutas

4. Próximos Pasos:

   - Revisar y actualizar pruebas unitarias
   - Implementar validaciones adicionales si es necesario
   - Optimizar el rendimiento de las operaciones CRUD
   - Considerar la implementación de caché para mejorar el rendimiento

5. Notas Técnicas:
   - Se mantiene la compatibilidad con el modelo de Prisma
   - Se implementa el manejo de errores con tipos específicos
   - Se mejora la experiencia del usuario con feedback visual
   - Se optimiza el manejo de estado con React.useState y useCallback

### 2024-03-XX: Implementación de BaseContentView

#### Objetivo

Crear un componente base reutilizable para todas las vistas de contenido (albums, collections, characters, etc.)

#### Plan de Implementación

1. Fase 1: Componente Base ✅

   - [x] Crear BaseContentView
   - [x] Implementar ContentViewProvider
   - [x] Definir interfaces y tipos
   - [x] Documentar componente

2. Fase 2: Migración 🚧

   - [x] Migrar folder-content-view a nuevo sistema
     - [x] Implementación básica
     - [x] Integración con FileGrid
     - [x] Soporte para reindexado de carpetas
     - [x] Estado vacío personalizado
   - [x] Migrar collection-content-view a nuevo sistema
     - [x] Implementación básica
     - [x] Carga de imágenes
     - [x] Manejo de selección
     - [x] Acciones específicas de colección
   - [x] Migrar all-images-view a nuevo sistema
     - [x] Implementación básica
     - [x] Integración con FileContext
     - [x] Manejo de eventos
   - [x] Migrar favorites-view a nuevo sistema
     - [x] Implementación básica
     - [x] Filtrado de favoritos
     - [x] Manejo de eventos específicos
   - [x] Migrar character-content-view a nuevo sistema
     - [x] Implementación básica
     - [x] Carga de imágenes por personaje
     - [x] Manejo de errores mejorado
   - [ ] Probar funcionalidad
   - [x] Documentar proceso de migración

3. Fase 3: Rollout (Pendiente)
   - [ ] Migrar vistas restantes:
     - [ ] albums-content-view
     - [ ] places-content-view
     - [ ] objects-content-view
     - [ ] tags-content-view
   - [ ] Pruebas de integración
   - [ ] Optimización y ajustes finales

#### Archivos Creados/Modificados

- ✅ src/components/views/base/base-content-view.tsx
  - Agregado manejo de errores
  - Mejorada la tipografía de errores
- ✅ src/components/views/base/content-view-provider.tsx
  - Actualizado para incluir manejo de errores
- ✅ src/components/views/base/types.ts
  - Agregado tipo de error
  - Actualizado tipo de icono para compatibilidad con Lucide
- ✅ src/components/views/all-images/all-images-view.tsx
  - Migrado a nuevo sistema base
  - Integrado con FileContext
- ✅ src/components/views/favorites/favorites-view.tsx
  - Migrado a nuevo sistema base
  - Mantenido filtrado de favoritos
  - Integrado sistema de eventos
- ✅ src/components/views/characters/character-content-view.tsx
  - Migrado a nuevo sistema base
  - Mejorado manejo de errores
  - Integrado con API de personajes

#### Cambios Realizados

1. Sistema Base Mejorado

   - Implementación de manejo de errores
   - Actualización de tipos para mejor compatibilidad
   - Mejora en la visualización de estados de error

2. Migración de Vistas Adicionales

   - All Images View:
     - Integración con FileContext
     - Manejo de eventos del sistema
   - Favorites View:
     - Mantenimiento de filtrado
     - Sistema de eventos específicos
   - Character Content View:
     - Integración con API
     - Manejo de errores mejorado

3. Mejoras Generales
   - Mejor tipado con Lucide Icons
   - Sistema de errores consistente
   - Manejo de eventos unificado

#### Próximos Pasos

1. Completar pruebas de las vistas migradas
2. Iniciar migración de vistas restantes
3. Implementar optimizaciones de rendimiento
4. Agregar tests unitarios

#### Consideraciones Técnicas

- Mantener compatibilidad con Next.js 15 Server Components ✅
- Asegurar que la lógica principal se ejecute en el servidor ✅
- Mantener la funcionalidad existente del file-grid ✅
- Sistema de tipos robusto implementado ✅
- Manejo de errores mejorado ✅
- Integración con servicios existentes ✅
