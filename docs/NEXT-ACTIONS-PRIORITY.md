# 🎯 ACCIONES PRIORITARIAS - CONTINUACIÓN DE AUDITORÍA

**Fecha**: 2025-01-27
**Estado**: Auditoría inicial completada, próximas acciones definidas
**Prioridad**: Continuar migración sistemática

---

## 🔥 **ACCIONES INMEDIATAS (HOY)**

### 1. **Completar Components Migration** [HIGH] [BIG]

📄 **Seguir**: `docs/COMPONENTS-MIGRATION-TASK.md`

**Próximos pasos específicos:**

```bash
# 1. Verificar referencias a EntityCard legacy
grep -r "EntityCard[^V2]" src/components --include="*.tsx" --include="*.ts"

# 2. Migrar entity-card.tsx → entity-card-v2.tsx
# 3. Eliminar file-browser.tsx legacy después de migración completa
# 4. Limpiar funciones inline temporales
```

**Estimación**: 4-6 horas
**Impacto**: Crítico - desbloquea otras migraciones

---

## ⚡ **ACCIONES CORTO PLAZO (1-2 DÍAS)**

### 2. **Consolidar File Context** [MEDIUM] [MEDIUM]

**Problema**: Duplicación entre `file-context.tsx` y stores Zustand

**Archivos afectados:**

- `src/lib/contexts/file-context.tsx` (12KB, 457 líneas)
- `src/lib/hooks/files/use-file-actions.ts`
- `src/lib/hooks/files/use-file-drop.ts`
- `src/lib/hooks/files/use-file-list.ts`
- `src/providers/app-provider.tsx`

**Estrategia**:

1. Migrar `file-context.tsx` a usar `EntityWithStats`
2. Consolidar funcionalidad con `unified-file-manager.store.ts`
3. Deprecar contexto en favor de store Zustand
4. Migrar hooks dependientes

**Estimación**: 3-4 horas

### 3. **Limpiar Services Legacy** [MEDIUM] [SMALL]

**Problema**: Carpeta `services/_legacy/` sin auditar

```bash
# Explorar contenido legacy
ls -la src/services/_legacy/
find src/services/_legacy/ -name "*.ts" -exec grep -l "FileItem\|AnyEntity" {} \;
```

**Estimación**: 2-3 horas

---

## 🔄 **ACCIONES MEDIANO PLAZO (1 SEMANA)**

### 4. **Eliminar Tipos Legacy Completamente** [HIGH] [BIG]

**Objetivo**: 0 referencias a `FileItem` y `AnyEntity`

**Archivos críticos identificados:**

- `src/types/files.ts` - Definición de FileItem
- `src/types/entities.ts` - Definición de AnyEntity
- `src/components/views/*/` - 15+ archivos con referencias

**Estrategia por fases:**

1. **Fase 1**: Migrar todos los components restantes
2. **Fase 2**: Migrar server actions para devolver EntityWithStats
3. **Fase 3**: Eliminar definiciones de tipos legacy
4. **Fase 4**: Verificar compilación completa

**Estimación**: 2-3 días

### 5. **Optimizar Transformadores** [LOW] [MEDIUM]

**Problema**: Código deprecated marcado pero funcional

**Archivos con @deprecated:**

- `src/transformers/tag/transformer.ts`
- `src/transformers/property/transformer.ts`
- `src/transformers/wildcard/transformer.ts`

**Acción**: Planificar eliminación para v2.0

---

## 📋 **VALIDACIONES REQUERIDAS**

### **Antes de cada migración:**

```bash
# 1. Verificar compilación
pnpm tsc --noEmit

# 2. Verificar errores específicos
pnpm check:errors -- --tool tsc --days 1

# 3. Buscar referencias rotas
grep -r "import.*from.*file-that-will-be-deleted" src/
```

### **Después de cada migración:**

```bash
# 1. Verificar funcionalidad básica
# 2. Probar navegación entre vistas
# 3. Verificar selección de items
# 4. Comprobar panel de detalles
```

---

## ⚠️ **RIESGOS A MONITOREAR**

### 🔴 **Críticos:**

1. **Breaking Changes**: Migración de components puede romper funcionalidad
2. **Performance**: Verificar que no haya degradación de rendimiento
3. **Type Safety**: Mantener seguridad de tipos durante migración

### 🟡 **Moderados:**

1. **Dependencies**: Algunos componentes legacy pueden tener dependencias ocultas
2. **Testing**: Componentes migrados requieren testing manual
3. **Rollback**: Mantener capacidad de rollback en cada paso

---

## 🎯 **MÉTRICAS DE ÉXITO**

### **Objetivos Semanales:**

- [ ] **Components**: 100% migrados a EntityWithStats
- [ ] **FileItem references**: 0 en components
- [ ] **AnyEntity references**: 0 en components
- [ ] **TypeScript errors**: 0 relacionados con migración
- [ ] **Performance**: Sin degradación medible

### **Objetivos Mensuales:**

- [ ] **Legacy types**: Completamente eliminados
- [ ] **Server actions**: Devuelven EntityWithStats
- [ ] **Documentation**: Arquitectura actualizada
- [ ] **Bundle size**: Reducido por eliminación de código legacy

---

## 🔗 **ARCHIVOS DE REFERENCIA**

### **Documentación:**

- `docs/COMPONENTS-MIGRATION-TASK.md` - Plan detallado components
- `docs/AUDIT-REPORT-FINAL.md` - Reporte completo de auditoría
- `docs/MIGRATION-GUIDE.md` - Guía general de migración

### **Tipos de Migración:**

- `src/types/migration.ts` - Tipos y helpers de migración
- `src/lib/hooks/entities/use-entity-conversion.ts` - Hook de conversión

### **Stores Migrados:**

- `src/store/unified-file-manager.store.ts` - Store principal migrado
- `src/store/selection.store.ts` - Store de selección migrado
- `src/store/details-panel.store.ts` - Store de panel migrado

---

## 🚀 **COMANDO PARA CONTINUAR**

```bash
# Activar el siguiente paso
echo "Continuando con migración de components..."
echo "Siguiente archivo: docs/COMPONENTS-MIGRATION-TASK.md"
echo "Comando: Seguir el plan detallado fase por fase"
```

---

**Preparado por**: AI Agent
**Próxima revisión**: Después de completar components migration
**Escalación**: Si aparecen errores de compilación críticos
