# 🔧 Plan de Refactorización: Tipos Legacy a Tipos Canónicos

## 📊 Estado Actual

### Tipos Legacy en Uso

1. **FileItem** - Unión de tipos `Complete` importados desde Prisma
   - Usado en 40+ archivos
   - Principal problema: No optimizado, incluye relaciones completas

2. **AnyEntity** - Tipo con discriminador manual
   - Usado en FileBrowser y EntityCard
   - Problema: Discriminador manual en lugar de usar tipos específicos

3. **DisplayableEntity** - Similar a AnyEntity
   - Problema: Duplicación innecesaria

### Tipos Canónicos Disponibles

- `ImageWithStats`, `AlbumWithStats`, `FolderWithStats`, etc.
- Optimizados con estadísticas pre-calculadas
- Patrón Record para mejor rendimiento

## 🎯 Objetivos

1. **Eliminar FileItem** y reemplazar con tipos WithStats específicos
2. **Eliminar AnyEntity** y usar tipos específicos con type guards
3. **Actualizar todos los componentes** para usar tipos canónicos
4. **Sincronizar transformadores** con los nuevos tipos

## 📋 Plan de Migración

### Fase 1: Crear tipos de transición

```typescript
// types/migration.ts
export type EntityWithStats =
  | ImageWithStats
  | AlbumWithStats
  | FolderWithStats
  | VideoWithStats
  // ... etc

export function isImageWithStats(entity: EntityWithStats): entity is ImageWithStats {
  return 'statistics' in entity && 'width' in entity && 'height' in entity;
}
```

### Fase 2: Actualizar componentes críticos

1. **EntityCard** - Crear versión que use EntityWithStats
2. **FileBrowser** - Refactorizar para usar tipos específicos
3. **Vistas** - Actualizar una por una

### Fase 3: Migrar server actions

- Actualizar actions para devolver tipos WithStats
- Usar transformadores existentes

### Fase 4: Eliminar tipos legacy

- Remover FileItem, AnyEntity, DisplayableEntity
- Actualizar imports

## 🔍 Componentes Afectados

### Alta Prioridad

- `/components/features/file-browser/**`
- `/components/cards/entity-card.tsx`
- `/components/views/base/**`

### Media Prioridad

- `/store/files/**`
- `/services/image-converter.service.ts`
- `/app/actions/**`

### Baja Prioridad

- Tests
- Documentación

## ⚠️ Riesgos y Mitigación

1. **Breaking changes** - Usar tipos de transición temporales
2. **Performance** - Los tipos WithStats son más eficientes
3. **Type safety** - Implementar type guards robustos

## 📅 Timeline Estimado

- Fase 1: 2 horas
- Fase 2: 4 horas
- Fase 3: 6 horas
- Fase 4: 2 horas

Total: ~14 horas de trabajo
