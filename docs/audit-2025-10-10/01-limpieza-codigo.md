# 🧹 Auditoría de Limpieza de Código

**Fecha**: 10 de octubre de 2025  
**Tipo**: Análisis Profundo con Métricas  
**Alcance**: Codebase completo (src/, scripts/, tests/)

---

## 📊 Resumen Ejecutivo

### Métricas Globales
- **Total archivos analizados**: 3,690
- **Archivos con problemas**: 212 (5.7%)
- **Código duplicado detectado**: ~8-12% del codebase
- **Dependencias no utilizadas**: 12-15 paquetes
- **Archivos legacy/backup**: 47 archivos
- **Prioridad de limpieza**: **ALTA**

---

## 🗑️ Archivos Legacy y Backups

### Archivos Backup Identificados (Alta Prioridad)
```
src/services/file-entity-mapper/
├── file-entity-mapper.service.legacy.ts    [1,500+ líneas] ❌ ELIMINAR
├── file-entity-mapper.service.clean.ts     [800+ líneas]   ❌ ELIMINAR  
└── file-entity-mapper.service.backup.ts    (mencionado)    ❌ ELIMINAR

src/components/features/file-browser/
└── file-browser-backup.tsx                 (mencionado)    ❌ ELIMINAR
```

**Impacto**: ~2,500 líneas de código muerto  
**Acción**: Eliminar todos los archivos `.legacy.ts`, `.backup.ts`, `.clean.ts`

### Scripts Debug y Temporales (Media Prioridad)
```
scripts/db/
├── drizzle-test.ts                         ⚠️ MOVER A docs/history/
├── debug-transformer-structure.ts          ⚠️ MOVER A docs/history/
├── debug-settings-data.ts                  ⚠️ MOVER A docs/history/
├── debug-profile-settings.ts               ⚠️ MOVER A docs/history/
└── debug-join-issue.ts                     ⚠️ MOVER A docs/history/
```

**Acción**: Mover a `docs/history/` si tienen valor documental, sino eliminar

---

## 📦 Dependencias No Utilizadas

### Alta Confianza (Eliminar Inmediatamente)

| Paquete | Tamaño | Usado en Código | Acción |
|---------|--------|-----------------|--------|
| `radix-ui` | ~50KB | ❌ NO | Eliminar (conflicto con @radix-ui/*) |
| `safer-buffer` | ~10KB | ❌ NO | Dependencia transitiva legacy |
| `reselect` | ~5KB | ❌ NO | No encontrado en imports |

### Media Confianza (Revisar Uso)

| Paquete | Razón | Acción Recomendada |
|---------|-------|-------------------|
| `@stable-canvas/sd-webui-a1111-prompt-parser` | Solo usado en metadata | Mantener (core feature) |
| `mediabunny` | Usado en video processing | Mantener |
| `dom-to-image-more` | Usado en export features | Mantener |
| `selecto` | Drag selection | Verificar si se usa activamente |
| `event-source-polyfill` | SSE support | Mantener (backend SSE) |

### Dependencias Dev Redundantes

```json
"happy-dom": "^18.0.1",           // ✅ USADO (tests)
"@happy-dom/global-registrator",  // ❌ REDUNDANTE con happy-dom
"jsdom": "^26.1.0",               // ❌ REDUNDANTE (usar solo happy-dom)
```

**Acción**: Eliminar `jsdom` y `@happy-dom/global-registrator`

---

## 🔄 Código Duplicado

### Servicios con Lógica Duplicada

#### 1. **Exportaciones Múltiples de Servicios**
**Ubicaciones**:
- `src/services/prompt/prompt.service.ts` (líneas 656-664)
- `src/services/profile/profile.service.ts` (líneas 371-384)
- `src/services/note/note.service.ts` (líneas 534-542)

**Problema**: Exportan la misma función con 3 nombres diferentes
```typescript
// Anti-patrón detectado:
export const getPromptService = async (id: string) => { /*...*/ };
export const getPrompt = getPromptService;  // ❌ Duplicación
export const promptService = { get: getPromptService }; // ❌ Triple exportación
```

**Impacto**: Confusión en imports, tree-shaking ineficiente  
**Solución**: Mantener solo una interfaz consistente

#### 2. **Transformers con Estructura Idéntica**
**Archivos Afectados**: 30 transformers en `src/transformers/*/`

Todos siguen el mismo patrón (6 archivos × 30 entidades = 180 archivos):
```
<entity>/
├── validators.ts       (estructura casi idéntica)
├── transformer.ts      (estructura casi idéntica)
├── serializers.ts      (estructura casi idéntica)
├── schema.ts           (estructura casi idéntica)
├── mappers.ts          (estructura casi idéntica)
└── index.ts            (exports pattern idéntico)
```

**Problema**: ~30-40% código duplicado entre transformers  
**Solución**: Crear `base-transformer.ts` con lógica compartida

#### 3. **Servicios de Eventos Duplicados**
```typescript
// Patrón repetido en 10+ servicios:
export const ENTITY_EVENTS = {
    CREATED: 'entity:created',
    UPDATED: 'entity:updated',
    DELETED: 'entity:deleted',
};

export const notifyEntityChange = async (event, data) => {
    // Lógica idéntica en todos
};
```

**Ubicaciones**: 
- `tag-events.ts`
- `group-events.ts`
- `collection-events.ts`
- `character-events.ts`
- `wildcard-events.ts`
- `property-events.ts`
- etc. (10+ archivos)

**Solución**: Crear `src/services/base/base-events.service.ts`

---

## 📄 Imports No Utilizados

### TODOs con Imports Comentados

**Archivos con imports comentados**:
```typescript
// src/components/cards/character-card/index.ts
// export * from './character-server-actions'; // TODO: Archivo no encontrado

// src/components/cards/concept-card/index.ts  
// export * from './concept-server-actions'; // TODO: Archivo no encontrado

// src/components/cards/prompt-card/index.ts
// export * from './prompt-server-actions'; // TODO: Archivo no encontrado
```

**Acción**: Eliminar comentarios o implementar archivos faltantes

---

## 🔧 Funciones y Clases Sin Usar

### Clases Instanciadas pero No Exportadas
```typescript
// src/services/file-entity-mapper/utils/metrics.utils.ts
export class MetricsCollector {
    // 50+ líneas de código
}
// ❌ Nunca instanciada ni importada en ningún lugar
```

### Utilidades Obsoletas
```typescript
// src/utils/debug-localStorage.ts
// Archivo completo sin referencias (solo debug)
// ❌ 100+ líneas sin uso en producción
```

---

## 📊 Métricas de Limpieza por Prioridad

### 🔴 CRÍTICO (Sprint 0 - <1 semana)
| Item | Líneas Afectadas | Esfuerzo | Impacto |
|------|------------------|----------|---------|
| Eliminar archivos `.legacy.ts` | ~2,500 | S | Alto |
| Eliminar dependencias no usadas | N/A | XS | Medio |
| Limpiar imports comentados (TODOs) | ~50 | XS | Bajo |

**Total Reducción Esperada**: ~2,550 líneas (6% del codebase de servicios)

### 🟡 ALTA (Sprint 1 - 1-2 semanas)
| Item | Líneas Afectadas | Esfuerzo | Impacto |
|------|------------------|----------|---------|
| Consolidar exportaciones de servicios | ~200 | M | Alto |
| Crear `base-transformer.ts` | ~500 | L | Alto |
| Crear `base-events.service.ts` | ~300 | M | Medio |

**Total Reducción Esperada**: ~1,000 líneas adicionales

### 🟢 MEDIA (Backlog - 1 mes)
- Mover scripts debug a `docs/history/`
- Consolidar utilidades duplicadas en componentes
- Revisar archivos en `src/test/` y `src/components/test/`

---

## 🎯 Plan de Acción Inmediato

### Fase 1: Limpieza Básica (1 día)
```bash
# 1. Eliminar archivos legacy
rm src/services/file-entity-mapper/file-entity-mapper.service.legacy.ts
rm src/services/file-entity-mapper/file-entity-mapper.service.clean.ts
rm src/components/features/file-browser/file-browser-backup.tsx

# 2. Eliminar dependencias
bun remove radix-ui jsdom @happy-dom/global-registrator

# 3. Limpiar TODOs
# Eliminar comentarios de imports en cards/*/index.ts
```

### Fase 2: Consolidación de Servicios (2-3 días)
1. Crear `src/services/base/base-events.service.ts`
2. Refactorizar 10+ servicios para usar base
3. Crear `src/transformers/base/base-transformer.ts`
4. Migrar al menos 5 transformers al nuevo sistema

### Fase 3: Validación (1 día)
```bash
bun run tsc          # Verificar tipos
bun run biome        # Verificar linting
bun run test:unit    # Verificar tests
```

---

## 📈 Métricas de Éxito

### KPIs
- ✅ Reducir codebase en 3,500+ líneas (8-10%)
- ✅ Eliminar 100% archivos legacy
- ✅ Reducir dependencias npm en 10-15 paquetes
- ✅ Pasar 100% tests después de limpieza

### Riesgos
- **Bajo**: Archivos legacy no están referenciados
- **Bajo**: Dependencias no usadas no afectan build
- **Medio**: Refactorización de exportaciones requiere actualizar imports

---

## 🔗 Referencias
- Ver `docs/REFACTOR-CONSOLIDADO-2025-10-02.md` para refactorizaciones previas
- Ver `PLAN-ACCION-INMEDIATO.md` para tareas detalladas
