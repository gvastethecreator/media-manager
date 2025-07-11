# TODO: DIVISIÓN DEL ESQUEMA DRIZZLE EN MÚLTIPLES ARCHIVOS

## 📋 ANÁLISIS DEL ESTADO ACTUAL

### Archivo Actual: `src/lib/drizzle/schema.ts`
- **Tamaño**: 1,213 líneas
- **Tablas**: ~30 tablas principales + ~25 tablas de relaciones
- **Problema**: Archivo monolítico difícil de mantener
- **Configuración actual**: `drizzle.config.ts` apunta a un solo archivo

### Estructura Actual Identificada:
1. **Sistema Core** (QueueJobs, Profiles, Settings)
2. **Gestión de Archivos** (Folders, Images, Videos, UploadedImages)
3. **Metadatos** (ImageStats, Activity)
4. **Organización** (Groups, Albums, Collections)
5. **Taxonomía** (Tags, Properties, Wildcards, Characters)
6. **Contenido** (Places, WorldItems, Concepts, Prompts, Notes)
7. **Sistema** (Favorites, Files)
8. **Relaciones Many-to-Many** (~25 tablas de relación)

## 🎯 PLAN DE DIVISIÓN

### □ Fase 1: Crear Estructura de Directorios
□ Crear directorio `src/lib/drizzle/schemas/`
□ Crear subdirectorios por dominio:
  - `core/` - Sistema base
  - `media/` - Archivos multimedia
  - `organization/` - Organización y agrupación
  - `taxonomy/` - Clasificación y etiquetado
  - `content/` - Contenido y metadatos
  - `relations/` - Tablas de relaciones

### □ Fase 2: Dividir Tablas por Dominio
□ **Core Domain** (`schemas/core/`):
  - `queue-jobs.schema.ts` - Sistema de colas
  - `profiles.schema.ts` - Perfiles de usuario
  - `settings.schema.ts` - Configuraciones
  - `index.ts` - Exportaciones del dominio

□ **Media Domain** (`schemas/media/`):
  - `folders.schema.ts` - Gestión de carpetas
  - `images.schema.ts` - Imágenes
  - `videos.schema.ts` - Videos
  - `uploaded-images.schema.ts` - Imágenes subidas
  - `files.schema.ts` - Sistema de archivos
  - `index.ts` - Exportaciones del dominio

□ **Organization Domain** (`schemas/organization/`):
  - `groups.schema.ts` - Grupos
  - `albums.schema.ts` - Álbumes
  - `collections.schema.ts` - Colecciones
  - `favorites.schema.ts` - Favoritos
  - `index.ts` - Exportaciones del dominio

□ **Taxonomy Domain** (`schemas/taxonomy/`):
  - `tags.schema.ts` - Etiquetas
  - `properties.schema.ts` - Propiedades
  - `wildcards.schema.ts` - Comodines
  - `characters.schema.ts` - Personajes
  - `index.ts` - Exportaciones del dominio

□ **Content Domain** (`schemas/content/`):
  - `places.schema.ts` - Lugares
  - `world-items.schema.ts` - Elementos del mundo
  - `concepts.schema.ts` - Conceptos
  - `prompts.schema.ts` - Prompts
  - `notes.schema.ts` - Notas
  - `activity.schema.ts` - Actividad
  - `image-stats.schema.ts` - Estadísticas
  - `index.ts` - Exportaciones del dominio

□ **Relations Domain** (`schemas/relations/`):
  - `image-relations.schema.ts` - Relaciones de imágenes
  - `video-relations.schema.ts` - Relaciones de videos
  - `group-relations.schema.ts` - Relaciones de grupos
  - `album-relations.schema.ts` - Relaciones de álbumes
  - `index.ts` - Exportaciones del dominio

### □ Fase 3: Crear Archivo Principal de Esquema
□ Crear `src/lib/drizzle/schema/index.ts` que:
  - Importe todos los dominios
  - Re-exporte todas las tablas
  - Mantenga compatibilidad con imports existentes

### □ Fase 4: Actualizar Configuración
□ Modificar `drizzle.config.ts` para usar:
  - `schema: './src/lib/drizzle/schema/index.ts'` O
  - `schema: './src/lib/drizzle/schema/**/*.schema.ts'`

□ Actualizar `src/lib/drizzle/index.ts`:
  - Cambiar import de schema
  - Verificar que todas las exportaciones funcionen

### □ Fase 5: Actualizar Relations
□ Dividir `src/lib/drizzle/relations.ts` en archivos por dominio
□ Crear `src/lib/drizzle/relations/` con estructura similar
□ Actualizar imports en el archivo principal

### □ Fase 6: Validación y Testing
□ Ejecutar `bun run lint` para verificar sintaxis
□ Ejecutar `bun run test` para verificar funcionalidad
□ Probar generación de migraciones con `drizzle-kit`
□ Verificar que todos los imports existentes funcionen
□ Probar conexión a base de datos

### □ Fase 7: Actualizar Documentación
□ Actualizar documentación en `docs/migration-drizzle/`
□ Crear guía de organización del esquema
□ Documentar convenciones de naming

## 🔧 IMPLEMENTACIÓN TÉCNICA

### Estructura de Archivos Propuesta:
```
src/lib/drizzle/
├── schema/
│   ├── index.ts                 # Exportación principal
│   ├── core/
│   │   ├── index.ts
│   │   ├── queue-jobs.schema.ts
│   │   ├── profiles.schema.ts
│   │   └── settings.schema.ts
│   ├── media/
│   │   ├── index.ts
│   │   ├── folders.schema.ts
│   │   ├── images.schema.ts
│   │   ├── videos.schema.ts
│   │   ├── uploaded-images.schema.ts
│   │   └── files.schema.ts
│   ├── organization/
│   │   ├── index.ts
│   │   ├── groups.schema.ts
│   │   ├── albums.schema.ts
│   │   ├── collections.schema.ts
│   │   └── favorites.schema.ts
│   ├── taxonomy/
│   │   ├── index.ts
│   │   ├── tags.schema.ts
│   │   ├── properties.schema.ts
│   │   ├── wildcards.schema.ts
│   │   └── characters.schema.ts
│   ├── content/
│   │   ├── index.ts
│   │   ├── places.schema.ts
│   │   ├── world-items.schema.ts
│   │   ├── concepts.schema.ts
│   │   ├── prompts.schema.ts
│   │   ├── notes.schema.ts
│   │   ├── activity.schema.ts
│   │   └── image-stats.schema.ts
│   └── relations/
│       ├── index.ts
│       ├── image-relations.schema.ts
│       ├── video-relations.schema.ts
│       ├── group-relations.schema.ts
│       └── album-relations.schema.ts
├── relations/
│   ├── index.ts                 # Exportación principal de relaciones
│   ├── core.relations.ts
│   ├── media.relations.ts
│   ├── organization.relations.ts
│   ├── taxonomy.relations.ts
│   └── content.relations.ts
├── constraints.ts               # Mantener como está
├── index.ts                     # Actualizar imports
└── migrations/                  # Mantener como está
```

### Template para Archivos de Schema:
```typescript
import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

/**
 * =================================================================================
 * [DOMAIN] SCHEMA - DRIZZLE ORM
 * =================================================================================
 * Definiciones de tablas para el dominio [domain]
 * 
 * Tablas incluidas:
 * - [lista de tablas]
 * =================================================================================
 */

// Definiciones de tablas...

// Exportaciones
export {
  // lista de exportaciones
};
```

### Template para index.ts de Dominio:
```typescript
/**
 * [DOMAIN] Domain Schema Exports
 */

export * from './table1.schema.js';
export * from './table2.schema.js';
// ... más exportaciones
```

### Archivo Principal schema/index.ts:
```typescript
/**
 * =================================================================================
 * DRIZZLE SCHEMA - EXPORTACIÓN PRINCIPAL
 * =================================================================================
 * Este archivo re-exporta todas las tablas de todos los dominios
 * manteniendo compatibilidad con imports existentes.
 * =================================================================================
 */

// Core Domain
export * from './core/index.js';

// Media Domain  
export * from './media/index.js';

// Organization Domain
export * from './organization/index.js';

// Taxonomy Domain
export * from './taxonomy/index.js';

// Content Domain
export * from './content/index.js';

// Relations Domain
export * from './relations/index.js';
```

## 🎯 CRITERIOS DE ACEPTACIÓN

### ✅ Funcionalidad
- [ ] Todos los imports existentes siguen funcionando
- [ ] Drizzle Kit puede generar migraciones correctamente
- [ ] La conexión a base de datos funciona sin cambios
- [ ] Los tests pasan sin modificaciones

### ✅ Organización
- [ ] Cada dominio tiene máximo 8 archivos
- [ ] Cada archivo tiene máximo 200 líneas
- [ ] Naming conventions consistentes
- [ ] Documentación clara en cada archivo

### ✅ Mantenibilidad
- [ ] Estructura lógica por dominio funcional
- [ ] Fácil localización de tablas específicas
- [ ] Imports claros y organizados
- [ ] Compatibilidad hacia atrás mantenida

### ✅ Performance
- [ ] Sin impacto en tiempo de build
- [ ] Sin impacto en tiempo de ejecución
- [ ] Tree-shaking funciona correctamente

## 🚨 CONSIDERACIONES IMPORTANTES

### Compatibilidad
- **CRÍTICO**: Mantener todos los exports existentes
- **CRÍTICO**: No romper imports en servicios existentes
- **IMPORTANTE**: Verificar que Drizzle Kit funcione correctamente

### Riesgos
- Imports circulares entre dominios
- Problemas con tree-shaking
- Configuración incorrecta de Drizzle Kit
- Breaking changes en servicios existentes

### Mitigación
- Crear backup del archivo original
- Implementar por fases con validación
- Mantener archivo original hasta validación completa
- Testing exhaustivo en cada fase

CONTEXT_REQUIRED: 
- `src/lib/drizzle/schema.ts` (archivo actual)
- `src/lib/drizzle/relations.ts` 
- `src/lib/drizzle/index.ts`
- `drizzle.config.ts`
- Servicios que importan desde schema

ACCEPTANCE: 
- Esquema dividido en archivos organizados por dominio
- Todos los imports existentes funcionan
- Drizzle Kit genera migraciones correctamente
- Tests pasan sin modificaciones
- Documentación actualizada

STATUS: PENDING