# Análisis de Archivos Grandes - Candidatos para Refactorización

**Fecha**: 2025-10-02  
**Fase**: Análisis

## 📊 Top 10 Archivos Más Grandes

| Archivo | Líneas | KB | Prioridad | Tipo |
|---------|--------|-----|-----------|------|
| `file-entity-mapper.service.legacy.ts` | 1,186 | 39.6 | 🔴 **CRÍTICA** | Servicio Legacy |
| `unified-file-manager.store.ts` | 940 | 30.1 | 🔴 **ALTA** | Store Zustand |
| `group.service.ts` | 928 | 29.8 | 🔴 **ALTA** | Servicio |
| `image.service.ts` | 850 | 27.1 | ✅ **COMPLETADO** | Servicio |
| `file-viewer.tsx` | 830 | 26.7 | 🟡 **MEDIA** | Componente |
| `folder-stats.ts` | 792 | 28.2 | 🟡 **MEDIA** | Lib/Utilidad |
| `albums.ts` | 778 | 24.1 | 🟡 **MEDIA** | Ruta Express |
| `folder-reindex.service.ts` | 745 | 25.7 | 🟡 **MEDIA** | Servicio |
| `file-canvas.tsx` | 738 | 27.2 | 🟡 **MEDIA** | Componente |
| `file-browser-settings.tsx` | 727 | 26.4 | 🟡 **MEDIA** | Componente |

## 🎯 Candidato Seleccionado: `group.service.ts`

### Razones de Selección

1. **Tamaño**: 928 líneas (segundo más grande de servicios activos)
2. **Patrón Similar**: Estructura idéntica a `image.service.ts` recién refactorizado
3. **Impacto**: Servicio core del sistema con múltiples responsabilidades
4. **Precedente**: Ya tenemos experiencia exitosa con refactorización de servicios

### Estructura Actual

```typescript
// Líneas 1-35: Imports y tipos
// Líneas 36-46: Error handling (createGroupError, GroupErrorCode)
// Líneas 48-56: Constantes de eventos (GROUP_EVENTS)
// Líneas 58-77: Emisión de eventos (notifyGroupChange)
// Líneas 80-113: getGroupService
// Líneas 114-187: getGroupsByIdsService
// Líneas 188-313: searchGroupsService (COMPLEJO - 125 líneas)
// Líneas 314-389: createGroupService
// Líneas 390-510: updateGroupService
// Líneas 511-546: deleteGroupService
// Líneas 547-575: getGroupStatsService
// Líneas 576-635: addItemToGroupService
// Líneas 636-693: removeItemFromGroupService
// Líneas 694-928: Objeto groupService + helpers
```

### Componentes Identificados para Extracción

#### 1. **`group-errors.ts`** (~30 líneas)
**Contenido**:
- `GroupErrorCode` enum
- `createGroupError()` function
- Error handling utilities

**Beneficio**: Centralizar manejo de errores, reutilizable en otros módulos

#### 2. **`group-events.ts`** (~50 líneas)
**Contenido**:
- `GROUP_EVENTS` constants
- `notifyGroupChange()` function
- Event emission logic con statsEventEmitter

**Beneficio**: Separar lógica de eventos, similar a `image-events.ts`

#### 3. **`group-search.service.ts`** (~150 líneas)
**Contenido**:
- `searchGroupsService()` function completa (125 líneas)
- Query builders complejos
- Filtros y ordenamiento
- Paginación

**Beneficio**: Encapsular búsqueda compleja, mejora testabilidad

#### 4. **`group-relations.service.ts`** (~180 líneas)
**Contenido**:
- `addItemToGroupService()` (60 líneas)
- `removeItemFromGroupService()` (60 líneas)
- `getGroupRelations()` helper
- Lógica de relaciones con images/videos/albums/tags

**Beneficio**: Separar manejo de relaciones N:N, simplificar main file

### Estimación de Reducción

| Componente | Líneas | Descripción |
|------------|--------|-------------|
| **Original** | 928 | Archivo actual |
| group-errors.ts | -30 | Error handling |
| group-events.ts | -50 | Event system |
| group-search.service.ts | -150 | Search logic |
| group-relations.service.ts | -180 | Relations management |
| **Subtotal extraído** | -410 | |
| Imports/re-exports | +20 | Overhead de módulos |
| **Archivo final estimado** | **~538** | Reducción de **42%** |

## 🔄 Plan de Refactorización

### Fase 1: Preparación (15 min)
- [x] Analizar estructura actual
- [ ] Identificar dependencias
- [ ] Verificar exports públicos
- [ ] Crear documento de plan

### Fase 2: Extracción de Módulos (45 min)
- [ ] Crear `group-errors.ts`
- [ ] Crear `group-events.ts`
- [ ] Crear `group-search.service.ts`
- [ ] Crear `group-relations.service.ts`

### Fase 3: Refactorización Main File (30 min)
- [ ] Actualizar imports
- [ ] Eliminar código duplicado
- [ ] Delegar a nuevos módulos
- [ ] Crear re-exports

### Fase 4: Validación (15 min)
- [ ] TypeScript compilation
- [ ] Biome linting/formatting
- [ ] Verificar API pública intacta
- [ ] Documentar métricas

**Tiempo total estimado**: ~2 horas

## 🚀 Alternativas Consideradas

### Opción B: `unified-file-manager.store.ts` (940 líneas)
**Pros**:
- Más grande que group.service.ts
- Store Zustand complejo con múltiples responsabilidades

**Contras**:
- Más riesgo (UI state management)
- Menos precedente (no hemos refactorizado stores)
- Requiere más testing manual

**Decisión**: Posponer para siguiente fase

### Opción C: `file-entity-mapper.service.legacy.ts` (1,186 líneas)
**Pros**:
- Archivo más grande del proyecto
- Marcado como "legacy"

**Contras**:
- Nombre sugiere deprecación planificada
- Posible candidato para eliminación completa
- No vale la pena refactorizar código legacy

**Decisión**: Evaluar para eliminación, no refactorización

## 📝 Notas de Implementación

### Patrón a Seguir (Basado en image.service.ts)

1. **Crear módulos con exports públicos**
   - Utilidades/constantes primero
   - Eventos segundo
   - Lógica compleja después

2. **Mantener API pública intacta**
   - Re-exports desde main file
   - Sin breaking changes
   - Tipos compartidos centralizados

3. **Validación estricta**
   - TypeScript sin nuevos errores
   - Biome auto-fix
   - Tests funcionales (si existen)

4. **Documentación**
   - Comentarios JSDoc en módulos
   - Métricas de reducción
   - Plan de migración

## ✅ Próximos Pasos

1. **Confirmar selección**: `group.service.ts` como candidato
2. **Crear branch**: `refactor/group-service-modules`
3. **Ejecutar plan**: Fase 1 → Fase 4
4. **Documentar resultados**: Métricas y aprendizajes

---

**¿Procedemos con `group.service.ts`?**
