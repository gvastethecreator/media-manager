# [002] Migración Completa de Components - FileItem → EntityWithStats

**[HIGH] [BIG]** - Migración arquitectural crítica para consolidar el sistema de tipos

## 📋 **CONTEXTO**

La carpeta `src/components` (136 directorios, 457 archivos) está en proceso de migración de la arquitectura legacy (`FileItem`, `AnyEntity`) al nuevo sistema optimizado (`EntityWithStats`). Se completó la fase inicial pero quedan componentes críticos pendientes.

### ✅ **COMPLETADO (29%)**

- `search-view.tsx` → Migrado a `FileBrowserV2`
- `base-content-view.tsx` → Migrado a `FileBrowserV2`
- `file-converters.ts` → Eliminado (utilidades legacy)
- `index.ts` → Reorganizado con exportaciones V2

### 🔄 **ESTADO ACTUAL**

- **Archivos V2 disponibles**: 7 componentes listos
- **Referencias legacy activas**: ~15 archivos
- **Componentes críticos pendientes**: 5 principales

## 🎯 **TAREAS ESPECÍFICAS**

### **FASE 1: Migración de Componentes Core [HIGH]**

#### **1.1 EntityCard Migration**

- [ ] **Verificar dependencias** de `entity-card.tsx`

  ```bash
  grep -r "EntityCard[^V2]" src/components --include="*.tsx" --include="*.ts"
  ```

- [ ] **Migrar importaciones** de `entity-card.tsx` → `entity-card-v2.tsx`
- [ ] **Eliminar** `entity-card.tsx` después de verificación
- [ ] **Actualizar exportaciones** en `src/components/cards/index.ts`

#### **1.2 File Browser Complete Migration**

- [ ] **Verificar referencias restantes** a `FileBrowser` (no V2)

  ```bash
  grep -r "import.*FileBrowser.*from" src --include="*.tsx" --exclude="*file-browser.tsx"
  ```

- [ ] **Migrar componentes dependientes** restantes
- [ ] **Eliminar** `file-browser.tsx` legacy
- [ ] **Limpiar funciones inline** temporales

#### **1.3 Details Panel Migration**

- [ ] **Analizar uso** de `details-panel.tsx` vs `details-panel-v2.tsx`
- [ ] **Migrar referencias** al panel V2
- [ ] **Verificar compatibilidad** con `EntityWithStats`
- [ ] **Eliminar** versión legacy

### **FASE 2: Migración de Vistas [MEDIUM]**

#### **2.1 Cards View**

- [ ] **Buscar referencias** a `CardsView` (no V2)
- [ ] **Migrar importaciones** → `CardsViewV2`
- [ ] **Verificar props compatibility** con `EntityWithStats`
- [ ] **Eliminar** `cards-view.tsx`

#### **2.2 List View**

- [ ] **Migrar** `ListView` → `ListViewV2`
- [ ] **Verificar formato de datos** con `EntityWithStats`
- [ ] **Eliminar** `list-view.tsx`

#### **2.3 Masonry View**

- [ ] **Migrar** `MasonryView` → `MasonryViewV2`
- [ ] **Verificar cálculos de layout** con nuevos tipos
- [ ] **Eliminar** `masonry-view.tsx`

#### **2.4 Simple Grid View**

- [ ] **Migrar** `SimpleGridView` → `SimpleGridViewV2`
- [ ] **Verificar responsive behavior**
- [ ] **Eliminar** `simple-grid-view.tsx`

### **FASE 3: Limpieza de Tipos Legacy [MEDIUM]**

#### **3.1 Eliminar Referencias AnyEntity**

- [ ] **Buscar todas las referencias**:

  ```bash
  grep -r "AnyEntity" src/components --include="*.tsx" --include="*.ts"
  ```

- [ ] **Reemplazar por** `EntityWithStats`
- [ ] **Actualizar imports** y type annotations

#### **3.2 Eliminar Referencias FileItem**

- [ ] **Buscar en components**:

  ```bash
  grep -r "FileItem" src/components --include="*.tsx" --include="*.ts"
  ```

- [ ] **Migrar a** `EntityWithStats`
- [ ] **Verificar compatibilidad** de props

### **FASE 4: Validación y Testing [HIGH]**

#### **4.1 Verificación de Compilación**

- [ ] **Ejecutar TypeScript check**:

  ```bash
  pnpm tsc --noEmit --project tsconfig.json
  ```

- [ ] **Resolver errores** de tipos
- [ ] **Verificar imports** faltantes

#### **4.2 Testing Funcional**

- [ ] **Probar FileBrowserV2** en diferentes contextos
- [ ] **Verificar navegación** entre vistas
- [ ] **Comprobar selección** de items
- [ ] **Validar panel de detalles**

### **FASE 5: Optimización Final [LOW]**

#### **5.1 Performance Review**

- [ ] **Analizar bundle size** después de eliminaciones
- [ ] **Verificar tree-shaking** de componentes eliminados
- [ ] **Optimizar imports** dinámicos si es necesario

#### **5.2 Documentación**

- [ ] **Actualizar README** de components
- [ ] **Documentar breaking changes**
- [ ] **Crear migration guide** para otros desarrolladores

## 🔍 **COMANDOS DE DIAGNÓSTICO**

### **Verificar Referencias Legacy**

```bash
# Buscar FileBrowser legacy
grep -r "FileBrowser[^V2]" src/components --include="*.tsx" --include="*.ts"

# Buscar AnyEntity
grep -r "AnyEntity" src/components --include="*.tsx" --include="*.ts"

# Buscar FileItem
grep -r "FileItem" src/components --include="*.tsx" --include="*.ts"

# Contar archivos V2 vs legacy
find src/components -name "*-v2.tsx" | wc -l
find src/components -name "*.tsx" -not -name "*-v2.tsx" | wc -l
```

### **Verificar Compilación**

```bash
# Check TypeScript
pnpm tsc --noEmit

# Check imports
pnpm check:errors -- --tool tsc --days 1
```

## 📊 **MÉTRICAS DE ÉXITO**

- [ ] **0 referencias** a `FileItem` en components
- [ ] **0 referencias** a `AnyEntity` en components
- [ ] **0 errores** de TypeScript relacionados
- [ ] **Todos los V2** funcionando correctamente
- [ ] **Bundle size** reducido por eliminación de código legacy

## ⚠️ **RIESGOS Y CONSIDERACIONES**

1. **Breaking Changes**: Algunos componentes pueden tener APIs diferentes
2. **Performance**: Verificar que las migraciones no degraden rendimiento
3. **Testing**: Probar exhaustivamente cada migración antes de eliminar legacy
4. **Rollback**: Mantener commits granulares para rollback si es necesario

## 🔗 **ARCHIVOS RELACIONADOS**

- `src/types/migration.ts` - Tipos de migración y helpers
- `src/store/unified-file-manager.store.ts` - Store migrado
- `docs/MIGRATION-GUIDE.md` - Guía general de migración
- `docs/REFACTORING-PROGRESS.md` - Progreso global

---

**Estimación**: 2-3 días de trabajo
**Prioridad**: HIGH - Bloquea otras migraciones
**Asignado**: AI Agent
**Fecha límite**: Completar antes de migración de server actions
