# Plan de Migración Sistemática: Server Actions → API Calls

## 🎯 OBJETIVO PRINCIPAL

Migrar completamente de Next.js Server Actions a sistema de API Express + React Query para compatibilidad total con Vite.

## 📊 AUDITORÍA COMPLETADA

### ✅ Estado Actual

- **Servidor Express**: ✅ Funcionando con 25+ rutas API
- **MainLayout**: ✅ Funcionando con datos mock
- **API Client**: ✅ Implementado con React Query
- **Stores Zustand**: ✅ Básicos funcionando

### ❌ Problemas Identificados

1. **Server Actions**: 35+ directorios con server actions activos
2. **Card Components**: 15+ cards usando `*-server-actions.ts`
3. **Views**: 20+ vistas con dependencias de server actions
4. **Navigation**: Hooks usando server actions comentados
5. **Providers**: ProfileProvider usando server actions
6. **File Browser**: Detalles panel usando server actions

## 🗂️ ESTRUCTURA DE MIGRACIÓN

### FASE 1: FUNDAMENTOS CRÍTICOS [HIGH][BIG]

**Objetivo**: Migrar componentes críticos del MainLayout

#### 1.1 Navigation System

- [ ] `src/components/navigation/hooks/` → Migrar a API calls
- [ ] `src/components/navigation/actions/` → Eliminar server actions
- [ ] `src/store/navigation.store.ts` → Actualizar para API calls

#### 1.2 Providers Core

- [ ] `src/providers/profile-provider.tsx` → Migrar `getActiveProfile`
- [ ] `src/lib/contexts/file-context.tsx` → Migrar `logActivity`

#### 1.3 Stats System

- [ ] `src/components/panels/stats/` → Migrar todas las stats actions
- [ ] `src/store/stats.store.ts` → Actualizar para API calls

### FASE 2: CARD COMPONENTS [HIGH][MEDIUM]

**Objetivo**: Migrar todos los componentes de tarjetas

#### 2.1 Server Actions en Cards (15 archivos)

```
src/components/cards/*/
├─ album-card/album-server-actions.ts
├─ character-card/character-server-actions.ts
├─ collection-card/collection-server-actions.ts
├─ concept-card/concept-server-actions.ts
├─ folder-card/folder-server-actions.ts
├─ group-card/group-server-actions.ts
├─ image-card/image-server-actions.ts
├─ note-card/note-server-actions.ts
├─ place-card/place-server-actions.ts
├─ prompt-card/prompt-server-actions.ts
├─ property-card/property-server-actions.ts
├─ tag-card/tag-server-actions.ts
├─ wildcard-card/wildcard-server-actions.ts
└─ world-item-card/world-item-server-actions.ts
```

#### 2.2 Estrategia de Migración Cards

1. **Crear API hooks** en `src/lib/api/[entity].ts`
2. **Reemplazar imports** de server actions por hooks
3. **Actualizar componentes** para usar React Query
4. **Eliminar archivos** `*-server-actions.ts`

### FASE 3: VIEWS SYSTEM [HIGH][BIG]

**Objetivo**: Migrar todas las vistas principales

#### 3.1 Views con Server Actions (20+ archivos)

```
src/components/views/*/
├─ albums/albums-view.tsx
├─ characters/characters-view.tsx
├─ collections/collections-view.tsx
├─ concepts/concepts-view.tsx
├─ folders/folder-content-view.tsx
├─ groups/groups-view.tsx
├─ notes/notes-view.tsx
├─ places/places-view.tsx
├─ prompts/prompts-view.tsx
├─ properties/properties-view.tsx
├─ tags/tag-content-view.tsx
├─ wildcards/wildcards-view.tsx
└─ world-items/world-items-view.tsx
```

#### 3.2 File Browser System

- [ ] `src/components/features/file-browser/details/` → 5 archivos con server actions
- [ ] `src/components/features/file-viewer/` → Migrar `getImageUrl`

### FASE 4: STORES ZUSTAND [MEDIUM][MEDIUM]

**Objetivo**: Actualizar todos los stores para trabajar con API calls

#### 4.1 Entity Stores (28 directorios)

```
src/store/entities/*/
├─ album/ → Actualizar slices para API calls
├─ character/ → Actualizar slices para API calls
├─ collection/ → Actualizar slices para API calls
├─ concept/ → Actualizar slices para API calls
├─ folder/ → Actualizar slices para API calls
├─ group/ → Actualizar slices para API calls
├─ image/ → Actualizar slices para API calls
├─ note/ → Actualizar slices para API calls
├─ place/ → Actualizar slices para API calls
├─ prompt/ → Actualizar slices para API calls
├─ property/ → Actualizar slices para API calls
├─ tag/ → Actualizar slices para API calls
├─ wildcard/ → Actualizar slices para API calls
└─ world-item/ → Actualizar slices para API calls
```

### FASE 5: SETTINGS SYSTEM [MEDIUM][MEDIUM]

**Objetivo**: Migrar todo el sistema de configuración

#### 5.1 Settings Components (25+ archivos)

```
src/components/settings/*/
├─ albums/albums-settings.tsx
├─ characters/characters-settings.tsx
├─ collections/collections-settings.tsx
├─ concepts/concepts-settings.tsx
├─ folders/folders-settings.tsx
├─ groups/groups-settings.tsx
├─ notes/notes-settings.tsx
├─ places/places-settings.tsx
├─ prompts/prompts-settings.tsx
├─ properties/properties-settings.tsx
├─ tags/tags-settings.tsx
├─ wildcards/wildcards-settings.tsx
└─ world-items/world-items-settings.tsx
```

### FASE 6: SERVER ACTIONS CLEANUP [LOW][SMALL]

**Objetivo**: Eliminar archivos obsoletos

#### 6.1 Directorios a Eliminar

```
src/app/actions/ (35+ directorios)
├─ activity/
├─ albums/
├─ audio/
├─ characters/
├─ collections/
├─ concepts/
├─ debug/
├─ document/
├─ favorites/
├─ file3d/
├─ files/
├─ folders/
├─ groups/
├─ images/
├─ json-file/
├─ metadata/
├─ notes/
├─ places/
├─ presets/
├─ profiles/
├─ prompts/
├─ properties/
├─ queue/
├─ search/
├─ stats/
├─ system/
├─ tags/
├─ tasks/
├─ thumbnails/
├─ uploaded-images/
├─ videos/
├─ wildcards/
└─ world-items/
```

## 🔧 ESTRATEGIA TÉCNICA

### Patrón de Migración Estándar

#### 1. Server Action Original

```typescript
// src/app/actions/[entity]/[entity].actions.ts
'use server';
export async function getEntity(id: string) {
  // lógica server action
}
```

#### 2. API Route (Ya existente)

```typescript
// src/server/routes/[entity].ts
router.get('/:id', async (req, res) => {
  // lógica API endpoint
});
```

#### 3. API Hook (Crear/Actualizar)

```typescript
// src/lib/api/[entity].ts
export function useEntity(id: string) {
  return useQuery({
    queryKey: ['entity', id],
    queryFn: () => api.get(`/entities/${id}`)
  });
}
```

#### 4. Component Update

```typescript
// Antes
import { getEntity } from '@/app/actions/[entity]';

// Después
import { useEntity } from '@/lib/api/[entity]';
```

### Herramientas de Migración

#### Script de Búsqueda y Reemplazo

```bash
# Encontrar todos los server actions
pnpm grep:server-actions

# Encontrar imports específicos
pnpm grep:imports-actions

# Validar migración
pnpm check:migration
```

## 📅 CRONOGRAMA ESTIMADO

### Semana 1: Fundamentos

- **Día 1-2**: Navigation System
- **Día 3-4**: Providers Core
- **Día 5**: Stats System

### Semana 2: Components

- **Día 1-3**: Card Components (15 archivos)
- **Día 4-5**: Views System (inicio)

### Semana 3: Views & Stores

- **Día 1-3**: Views System (completar)
- **Día 4-5**: Stores Zustand

### Semana 4: Settings & Cleanup

- **Día 1-3**: Settings System
- **Día 4**: Testing integral
- **Día 5**: Cleanup final

## 🚨 RIESGOS Y MITIGACIONES

### Riesgos Altos

1. **Ruptura de funcionalidad** → Testing incremental
2. **Pérdida de datos** → Backup antes de cambios
3. **Performance degradation** → Optimización React Query

### Riesgos Medios

1. **Inconsistencias de tipos** → Validación TypeScript
2. **Caching issues** → Configuración React Query
3. **Error handling** → Implementación robusta

## 🎯 CRITERIOS DE ÉXITO

### Funcionalidad

- [ ] MainLayout completamente funcional
- [ ] Todas las vistas cargan datos correctamente
- [ ] Navigation funciona sin errores
- [ ] CRUD operations funcionando

### Técnico

- [ ] 0 imports de server actions
- [ ] 0 errores TypeScript
- [ ] 0 errores de runtime
- [ ] Todos los tests pasando

### Performance

- [ ] Tiempo de carga ≤ 3 segundos
- [ ] Navegación fluida
- [ ] Caching efectivo
- [ ] Bundle size optimizado

## 📋 CHECKLIST DE VALIDACIÓN

### Pre-migración

- [ ] Backup completo del código
- [ ] Servidor API funcionando
- [ ] React Query configurado
- [ ] Tests base funcionando

### Durante migración

- [ ] Testing incremental por fase
- [ ] Validación TypeScript continua
- [ ] Monitoring de errores
- [ ] Documentación de cambios

### Post-migración

- [ ] Testing end-to-end completo
- [ ] Performance testing
- [ ] Cleanup de archivos obsoletos
- [ ] Documentación actualizada

---

## 🚀 PRÓXIMOS PASOS

1. **Iniciar Fase 1**: Navigation System
2. **Configurar herramientas** de migración
3. **Establecer workflow** de testing
4. **Comenzar migración** sistemática

**¡Vamos a convertir este proyecto en una aplicación Vite completamente funcional!** 🎉
