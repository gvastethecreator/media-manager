# Correcciones de Settings del File Browser - Resumen

## ✅ Problemas Corregidos

### 1. Sincronización de itemSize ✅

**Problema:** El `itemSize` global no se sincronizaba con `views.*.itemSize`, causando inconsistencias entre el slider del toolbar y el input en settings.

**Solución:** Modificado `setItemSize` en `view-options.slice.ts` para que sincronice automáticamente:

```typescript
setItemSize: (size: number) =>
  set((state: ViewOptionsState) => {
    const viewKey = state.viewMode as ViewKey;
    const currentView = state.views[viewKey];
    const updates: Partial<ViewOptionsState> = { itemSize: size };

    if (currentView && 'itemSize' in currentView) {
      updates.views = {
        ...state.views,
        [viewKey]: { ...currentView, itemSize: size } as PerViewConfig,
      };
    }

    return updates;
  }),
```

**Archivo:** `src/store/ui/view-options.slice.ts`

---

### 2. resetLocalStorage Re-persistía Inmediatamente ✅

**Problema:** Al llamar `resetLocalStorage()`, primero se eliminaba el localStorage pero luego `set(DEFAULT_STATE)` volvía a persistir los valores por defecto.

**Solución:** Cambiado para recargar la página en lugar de setear el estado:

```typescript
resetLocalStorage: () => {
  localStorage.removeItem('view-options-storage');
  window.location.reload();
},
```

**Archivo:** `src/store/ui/view-options.slice.ts`

---

### 3. Settings Visuales Faltantes ✅

**Problema:** Los settings `showThumbnails`, `showMetadata`, `showTags`, `showStats`, `enableAnimations` y `animationDuration` estaban declarados en tipos pero no implementados.

**Solución:** Agregados al store `view-options.slice.ts`:

#### Interface ViewOptionsState:
```typescript
showThumbnails: boolean;
showMetadata: boolean;
showTags: boolean;
showStats: boolean;
enableAnimations: boolean;
animationDuration: number;
```

#### Funciones agregadas:
- `setShowThumbnails` / `toggleShowThumbnails`
- `setShowMetadata` / `toggleShowMetadata`
- `setShowTags` / `toggleShowTags`
- `setShowStats` / `toggleShowStats`
- `setEnableAnimations` / `toggleEnableAnimations`
- `setAnimationDuration`

#### Valores por defecto:
```typescript
showThumbnails: true,
showMetadata: true,
showTags: true,
showStats: true,
enableAnimations: true,
animationDuration: 300,
```

#### Merge para compatibilidad:
```typescript
merged.showThumbnails ??= DEFAULT_STATE.showThumbnails;
merged.showMetadata ??= DEFAULT_STATE.showMetadata;
merged.showTags ??= DEFAULT_STATE.showTags;
merged.showStats ??= DEFAULT_STATE.showStats;
merged.enableAnimations ??= DEFAULT_STATE.enableAnimations;
merged.animationDuration ??= DEFAULT_STATE.animationDuration;
```

**Archivo:** `src/store/ui/view-options.slice.ts`

---

### 4. UI para Settings Visuales ✅

**Problema:** No había UI para controlar los nuevos settings visuales.

**Solución:** 

1. **Actualizado `settings.hooks.tsx`:**
   - Agregados todos los exports de los nuevos settings

2. **Actualizado `file-browser-settings.tsx`:**
   - Nueva sección "VISUALIZACIÓN" en el Accordion
   - Toggles para: Thumbnails, Metadata, Tags, Stats
   - Toggle para activar/desactivar animaciones
   - Input numérico para duración de animaciones
   - Cambiado Accordion a `type="multiple"` para permitir múltiples secciones abiertas

```tsx
{/* 3. VISUALIZACIÓN */}
<AccordionItem className="border-border/40" value="visual">
  <AccordionTrigger className="py-3 hover:no-underline">
    <div className="flex items-center gap-2.5">
      <Eye className="h-4 w-4" style={{ color: 'var(--dt-warning-500)' }} />
      <span className="font-semibold text-sm">Visualización</span>
    </div>
  </AccordionTrigger>
  <AccordionContent className="space-y-3 pb-4">
    {/* Elementos a mostrar */}
    <div className="space-y-3">
      <Row>
        <Label className="font-medium text-muted-foreground text-xs">Mostrar thumbnails</Label>
        <Switch checked={showThumbnails} onCheckedChange={toggleShowThumbnails} />
      </Row>
      {/* ... más toggles ... */}
    </div>
    
    {/* Animaciones */}
    <div className="space-y-3 pt-2">
      <Row>
        <Label className="font-medium text-muted-foreground text-xs">Activar animaciones</Label>
        <Switch checked={enableAnimations} onCheckedChange={toggleEnableAnimations} />
      </Row>
      <Row>
        <Label className="font-medium text-muted-foreground text-xs">Duración (ms)</Label>
        <Input
          disabled={!enableAnimations}
          value={animationDuration}
          onChange={(e) => setAnimationDuration(Number(e.target.value))}
        />
      </Row>
    </div>
  </AccordionContent>
</AccordionItem>
```

**Archivos:**
- `src/components/features/file-browser-new/components/settings/settings.hooks.tsx`
- `src/components/features/file-browser-new/components/settings/file-browser-settings.tsx`

---

### 5. includeSubfolders - Verificación ✅

**Estado:** ✅ **YA IMPLEMENTADO CORRECTAMENTE**

El setting `includeSubfolders` ya estaba completamente funcional:

1. **En el store:** Sí existe con persistencia
2. **En el hook use-data-source:** Recibe el parámetro y usa el store como fallback
3. **En la API:** Se pasa como query param `includeSubfolders=true/false`
4. **Invalidación:** TanStack Query invalida automáticamente al cambiar

**Flujo de datos:**
```
useViewOptionsStore.includeSubfolders 
  → useDataSource hook 
    → useFolderFilesPaginated 
      → GET /api/folders/{id}/files?includeSubfolders={bool}
```

**Query Key:**
```typescript
['folder-files', folderId, { includeSubfolders, limit, offset, search, sortBy, sortOrder }]
```

---

## 📊 Estado de Settings - Antes vs Después

| Setting | Estado Anterior | Estado Actual |
|---------|----------------|---------------|
| `itemSize` | ❌ No sincronizado | ✅ Sincronizado con views.* |
| `resetLocalStorage` | ❌ Re-persistía | ✅ Recarga página |
| `showThumbnails` | ❌ No existía | ✅ Implementado + UI |
| `showMetadata` | ❌ No existía | ✅ Implementado + UI |
| `showTags` | ❌ No existía | ✅ Implementado + UI |
| `showStats` | ❌ No existía | ✅ Implementado + UI |
| `enableAnimations` | ❌ No existía | ✅ Implementado + UI |
| `animationDuration` | ❌ No existía | ✅ Implementado + UI |
| `includeSubfolders` | ✅ Funcionaba | ✅ Verificado OK |

---

## 🎯 Próximos Pasos (Opcionales)

### Prioridad Media
1. **Aplicar settings visuales en las vistas:**
   - Usar `showThumbnails` para mostrar/ocultar thumbnails
   - Usar `showMetadata` para mostrar/ocultar metadatos en cards
   - Usar `showTags` para mostrar/ocultar badges de tags
   - Usar `showStats` para mostrar/ocultar barra de estadísticas
   - Usar `enableAnimations` y `animationDuration` en motion.div

2. **Configuración de columnas para tabla:**
   - Implementar UI para seleccionar qué columnas mostrar
   - Persistir preferencias de columnas
   - Permitir reordenar columnas

### Prioridad Baja
3. **Settings por tipo de entidad:**
   - Configuraciones diferentes para images vs videos vs documents

4. **Presets de configuración:**
   - Guardar/cargar configuraciones predefinidas

---

## 📦 Archivos Modificados

1. `src/store/ui/view-options.slice.ts` - Store principal con fixes
2. `src/components/features/file-browser-new/components/settings/settings.hooks.tsx` - Exports
3. `src/components/features/file-browser-new/components/settings/file-browser-settings.tsx` - UI

---

## ✅ Estado Final

**Todos los problemas críticos han sido corregidos.**

- ✅ Sincronización de settings: **CORREGIDO**
- ✅ Persistencia: **FUNCIONANDO**
- ✅ UI de settings: **COMPLETA**
- ✅ Settings visuales: **IMPLEMENTADOS**
- ✅ includeSubfolders: **VERIFICADO**

**Nota:** Los settings visuales ahora están disponibles en la UI y persisten correctamente, pero aún **falta conectarlos** a los componentes visuales reales (mostrar/ocultar thumbnails, metadata, etc.). Esto es una tarea adicional de integración visual.

---

**Fecha:** 2026-01-30  
**Versión:** 2.1.0  
**Estado:** ✅ Listo para usar
