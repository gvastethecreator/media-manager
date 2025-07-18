# TODO: ENTITYSTATSTYPE-FIX - Resolver Error de Importación EntityStatsType

**STATUS:** COMPLETADO
**PRIORIDAD:** ALTA

## PROBLEMA IDENTIFICADO
- Error: `ReferenceError: EntityStatsType is not defined` en status-bar.tsx:21:5
- El enum EntityStatsType está definido en `/src/types/migration.ts` pero no se está importando correctamente
- La importación `import type { EntityStatsType } from '@/types/migration';` falla en tiempo de ejecución

## SUBTASKS:
- [✅] [CHECKPOINT_1] Verificar configuración de alias de TypeScript
- [✅] [CHECKPOINT_2] Revisar si hay conflictos de importación circular
- [✅] [CHECKPOINT_3] Corregir la importación en status-bar.tsx
- [✅] [CHECKPOINT_4] Validar que el error se resuelve

## CRITERIOS DE ACEPTACIÓN:
- [✅] EntityStatsType se importa correctamente en status-bar.tsx
- [✅] No hay errores de ReferenceError en la consola del navegador
- [✅] El componente StatusBar funciona sin errores
- [✅] La aplicación se ejecuta sin errores de compilación

## VALIDACIÓN:
- [✅] Código compila sin errores de TypeScript
- [✅] Tests pasan (si existen)
- [✅] No hay errores en la consola del navegador
- [✅] El componente StatusBar renderiza correctamente

## SOLUCIÓN IMPLEMENTADA:
El problema se debía a que `EntityStatsType` se importaba como `import type` pero se usaba como valor en tiempo de ejecución en el objeto `names` del componente StatusBar. La solución fue cambiar la importación de:
```typescript
import type { EntityStatsType } from '@/types/migration';
```
a:
```typescript
import { EntityStatsType } from '@/types/migration';
```

Esto permite que el enum esté disponible como valor en tiempo de ejecución, no solo como tipo en tiempo de compilación.

## ARCHIVOS INVOLUCRADOS:
- `src/components/features/file-browser/toolbar/status-bar.tsx`
- `src/types/migration.ts`
- `tsconfig.json` (configuración de paths)
- `vite.config.ts` (configuración de alias)