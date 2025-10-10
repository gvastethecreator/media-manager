# Plan de Refactorización: Tag Service

**Fecha**: 2025-10-02  
**Archivo**: `src/services/tag/tag.service.ts`  
**Líneas actuales**: 661

## 📊 Análisis Inicial

### Estructura del Archivo
```typescript
// Líneas 1-25: Imports y configuración
// Líneas 27-34: TAG_EVENTS constants
// Líneas 36-48: Interfaces (GetTagsOptions, GetTagsResult)
// Líneas 52-61: TagServiceError class
// Líneas 66-102: notifyTagChange function
// Líneas 104-691: Funciones del servicio (getTags, getTagById, createTag, etc.)
// Líneas 692-770: TagService class (singleton wrapper)
```

### Componentes Identificados

#### 1. **`tag-errors.ts`** (~30 líneas)
**Contenido**:
- `TagServiceError` class
- Error handling utilities

**Beneficio**: Centralizar manejo de errores

#### 2. **`tag-events.ts`** (~60 líneas)
**Contenido**:
- `TAG_EVENTS` constants (5 eventos)
- `notifyTagChange()` function
- Integración con sistema de eventos y stats

**Beneficio**: Separar lógica de eventos

#### 3. **`tag-types.ts`** (~25 líneas)
**Contenido**:
- `GetTagsOptions` interface
- `GetTagsResult` interface
- Tipos auxiliares

**Beneficio**: Centralizar tipos compartidos

#### 4. Mantener en Main File
- Funciones CRUD principales
- TagService class singleton
- Lógica de negocio core

## 🎯 Estimación de Reducción

| Componente | Líneas | Descripción |
|------------|--------|-------------|
| **Original** | 661 | Archivo actual |
| tag-errors.ts | -30 | Error handling |
| tag-events.ts | -60 | Event system |
| tag-types.ts | -25 | Type definitions |
| **Subtotal extraído** | -115 | |
| Imports/re-exports | +15 | Overhead de módulos |
| **Archivo final estimado** | **~561** | Reducción de **15%** |

**Nota**: Reducción menor que group.service porque tag.service tiene menos funciones complejas para extraer.

## 🔄 Plan de Ejecución

### Fase 1: Extracción Básica (20 min)
- [ ] Crear `tag-errors.ts`
- [ ] Crear `tag-events.ts`
- [ ] Crear `tag-types.ts`

### Fase 2: Refactorización Main File (15 min)
- [ ] Actualizar imports
- [ ] Eliminar código duplicado
- [ ] Crear re-exports

### Fase 3: Validación (10 min)
- [ ] TypeScript compilation
- [ ] Biome linting/formatting
- [ ] Verificar API pública

**Tiempo total estimado**: ~45 minutos

## 📝 Notas

1. **Archivo más simple que group.service**: No tiene funciones complejas como searchService o relationsService
2. **Clase Singleton**: TagService class al final es un wrapper, no requiere extracción
3. **Reducción modesta**: ~15% vs 27% de group.service (por estructura más simple)
4. **Valor**: Consistencia de patrón y mantenibilidad

## ✅ Decisión

**Proceder con refactorización** para mantener consistencia del patrón, aunque la reducción sea menor.

**Alternativas consideradas**:
- ❌ Skip por baja reducción → Pierde consistencia de patrón
- ✅ **Proceder** → Mantiene patrón, mejora mantenibilidad
- ⏸️ Buscar archivo con más reducción potencial → Aún no evaluado
