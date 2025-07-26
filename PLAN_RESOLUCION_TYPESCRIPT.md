# Plan de Resolución de Errores TypeScript

## Análisis de Errores por Archivo (Priorizado)

Basado en el análisis de los logs de TypeScript del 26 de julio de 2025, he identificado los archivos con más errores que requieren atención inmediata:

### Archivos de Alta Prioridad (5+ errores)

1. **src/transformers/wildcard/v2/mappers.ts** - 8 errores
   - TS2305: Múltiples tipos no exportados (CreateWildcardData, UpdateWildcardData, etc.)
   - TS2724: WildcardSearchFilters no existe (sugerir WildcardFilters)
   - TS2698: Spread types error

2. **src/transformers/prompt/mappers.ts** - 7 errores
   - TS2339: Propiedades faltantes en tipos (tags, groups, properties, etc.)
   - TS2741: Propiedad 'purpose' faltante
   - TS2345: Tipos de argumentos no asignables
   - TS7006: Tipo implícito 'any'
   - TS2551: Propiedades inexistentes

3. **src/transformers/wildcard/serializers.ts** - 6 errores
   - TS2339: Propiedad 'stats' no existe en WildcardWithStats

4. **src/transformers/note/note-adapter.ts** - 5 errores
   - TS2353: Propiedades desconocidas en object literal
   - TS2352: Conversión puede ser un error
   - TS1361: Importación de tipo usada como valor

5. **src/transformers/note/transformer.ts** - 5 errores
   - TS1361: NoteCategory y NotePriority importados como tipo pero usados como valor

### Archivos de Media Prioridad (3-4 errores)

6. **src/transformers/place/mappers.ts** - 4 errores
7. **src/transformers/place/serializers.ts** - 4 errores
8. **src/transformers/profile/mappers.ts** - 4 errores
9. **src/transformers/settings/index.ts** - 3 errores
10. **src/transformers/settings/mappers.ts** - 3 errores
11. **src/transformers/settings/serializers.ts** - 3 errores
12. **src/transformers/thumbnail/schema.ts** - 3 errores
13. **src/transformers/workflow/serializers.ts** - 3 errores

## Estado de las Tareas

### Fase 1: Corrección de Errores Críticos

```markdown
- [x] 1. Corregir src/transformers/wildcard/v2/mappers.ts (8 errores)
  - [x] 1.1. Verificar y corregir tipos exportados en @/types/entities/wildcard
  - [x] 1.2. Corregir WildcardSearchFilters → WildcardFilters
  - [x] 1.3. Solucionar error de spread types

- [x] 2. Corregir src/transformers/prompt/mappers.ts (7 errores)
  - [x] 2.1. Verificar tipos PromptCreateInput y PromptUpdateInput
  - [x] 2.2. Agregar propiedades faltantes (tags, groups, properties, etc.)
  - [x] 2.3. Corregir tipo de parámetro 't' (TS7006)
  - [x] 2.4. Solucionar propiedades inexistentes (categories → category)

- [x] 3. Corregir src/transformers/wildcard/serializers.ts (6 errores)
  - [x] 3.1. Verificar estructura de WildcardWithStats
  - [x] 3.2. Corregir acceso a propiedad 'stats'

- [x] 4. Corregir src/transformers/note/note-adapter.ts (5 errores)
  - [x] 4.1. Corregir importaciones de tipo vs valor
  - [x] 4.2. Solucionar object literal properties
  - [x] 4.3. Corregir acceso a propiedades de NoteComplete y NoteWithStats
  - [x] 4.4. Actualizar estructura de NoteStatistics

- [x] 5. Corregir src/transformers/note/transformer.ts (5 errores)
  - [x] 5.1. Cambiar import type a import regular para NoteCategory y NotePriority
  - [x] 5.2. Agregar verificaciones de null/undefined en calculateCompletionScore
  - [x] 5.3. Actualizar tipos de parámetros en funciones helper
  - [x] 5.4. Corregir accesos a propiedades opcionales con verificaciones de null
```

### Fase 2: Corrección de Errores de Media Prioridad

```markdown
- [x] 6. Corregir archivos de transformers/place/ (8 errores combinados)
  - [x] 6.1. Corregir src/transformers/place/mappers.ts - Actualizar toPlaceWithStats para coincidir con PlaceWithStats
  - [x] 6.2. Corregir src/transformers/place/serializers.ts - Usar propiedades correctas del tipo Place
- [x] 7. Corregir archivos de transformers/profile/ (4 errores)
  - [x] 7.1. Corregir src/transformers/profile/mappers.ts - Actualizar propiedades para coincidir con ProfileBase
- [x] 8. Corregir archivos de transformers/settings/ (9 errores combinados)
  - [x] 8.1. Corregir src/transformers/settings/mappers.ts - Agregar propiedades faltantes (version, lastUpdate, system)
  - [x] 8.2. Corregir src/transformers/settings/serializers.ts - Actualizar mergeSettingsData con propiedades completas
- [x] 9. Corregir src/transformers/thumbnail/schema.ts (3 errores)
  - [x] 9.1. Corregir importación de ThumbnailQuality desde base.ts
- [x] 10. Corregir src/transformers/workflow/serializers.ts (3 errores)
  - [x] 10.1. Verificado - tipos WorkflowBase y WorkflowWithStats correctamente definidos
```

### Fase 3: Corrección de Errores Restantes

```markdown
- [x] 11. Revisar y corregir errores en store/ (múltiples archivos)
  - [x] 11.1. Corregir src/store/entities/task/index.ts - Agregado tipo explícito any[]
  - [x] 11.2. Corregir src/store/entities/video/slices/filters.ts - Corregidos valores del enum VideoSortCriteria
  - [x] 11.3. Corregir src/store/entities/video/slices/ui.ts - Corregida importación de VideoViewMode
- [ ] 12. Corregir errores en transformers restantes
- [ ] 13. Verificación final con tsc
```

## Estrategia de Resolución

### Principios
1. **Priorizar por cantidad de errores**: Atacar primero los archivos con más errores
2. **Correcciones mínimas**: Hacer cambios precisos sin romper funcionalidad
3. **Verificación incremental**: Verificar tipos después de cada corrección mayor
4. **Consistencia**: Mantener patrones existentes en el código

### Tipos de Errores Más Comunes
1. **TS2305/TS2724**: Tipos no exportados o mal nombrados
2. **TS2339**: Propiedades que no existen en tipos
3. **TS1361**: Importaciones de tipo usadas como valor
4. **TS2322/TS2345**: Tipos no asignables
5. **TS2353**: Propiedades desconocidas en object literals

## Próximos Pasos

1. Comenzar con `src/transformers/wildcard/v2/mappers.ts` (mayor cantidad de errores)
2. Verificar definiciones de tipos en `@/types/entities/wildcard`
3. Aplicar correcciones sistemáticas
4. Continuar con el siguiente archivo en prioridad

---

**Última actualización**: 26 de julio de 2025
**Total de errores identificados**: 150+ errores distribuidos en ~50 archivos
**Estado**: Iniciando Fase 1 - Corrección de Errores Críticos