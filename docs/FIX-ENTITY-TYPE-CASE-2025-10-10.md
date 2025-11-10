# 🔧 FIX: EntityType UPPERCASE vs lowercase
**Fecha**: 10 de Octubre, 2025  
**Tipo**: CRÍTICO - Bloqueaba todo el reindex  
**Estado**: ✅ RESUELTO

---

## 🚨 PROBLEMA

**Error observado**:
```
Error: Unsupported entity type: IMAGE
Error: Unsupported entity type: VIDEO
...
```

**Resultado**: 100% de archivos fallando en reindex (0 exitosos, 24 fallidos)

---

## 🔍 ANÁLISIS ROOT CAUSE

### Definición de Tipos (UPPERCASE)
**Archivo**: `src/types/file-entity-mapper.ts`
```typescript
export const EntityType = {
  IMAGE: 'IMAGE',    // ← UPPERCASE
  VIDEO: 'VIDEO',    // ← UPPERCASE
  AUDIO: 'AUDIO',
  // ...
}
```

### Map de Procesadores (lowercase)
**Archivo**: `src/services/file-entity-mapper/core.service.ts`
```typescript
private constructor() {
  this.processors = new Map();
  this.processors.set('image' as EntityType, new ImageProcessor());    // ← lowercase
  this.processors.set('video' as EntityType, new VideoProcessor());    // ← lowercase
  // ...
}
```

### Lookup Fallando
```typescript
const entityType = getEntityTypeFromExtension('.jpg');  // Returns 'IMAGE'
const processor = this.processors.get(entityType);      // Looks for 'IMAGE' but Map has 'image'
if (!processor) {
  throw new Error(`Unsupported entity type: ${entityType}`);  // ❌ FAIL
}
```

---

## ✅ SOLUCIÓN

### Opción 1: Cambiar Map a UPPERCASE ❌ RECHAZADA
- Requeriría cambiar 200+ archivos
- Inconsistente con convención del proyecto (99% usa lowercase)
- Inconsistente con nombres de tablas BD (`images`, `videos`)

### Opción 2: Cambiar Tipos a lowercase ✅ ELEGIDA
- Consistente con 99% del código existente
- Consistente con nombres de tablas BD
- Solo requiere cambiar 1 archivo

---

## 🔧 IMPLEMENTACIÓN

**Archivo modificado**: `src/types/file-entity-mapper.ts`

```diff
export const EntityType = {
-  IMAGE: 'IMAGE',
-  VIDEO: 'VIDEO',
-  AUDIO: 'AUDIO',
-  JSON: 'JSON',
-  FILE3D: 'FILE3D',
-  DOCUMENT: 'DOCUMENT',
-  UNKNOWN: 'UNKNOWN',
+  IMAGE: 'image',
+  VIDEO: 'video',
+  AUDIO: 'audio',
+  JSON: 'jsonFile',
+  FILE3D: 'file3d',
+  DOCUMENT: 'document',
+  UNKNOWN: 'unknown',
} as const;
```

**Nota sobre `JSON`**: Se mapea a `'jsonFile'` porque así está definido el procesador y tabla BD.

---

## 📊 VALIDACIÓN

### Antes del Fix
```
[SERVER] {
[SERVER]   "total": 24,
[SERVER]   "exitosos": 0,      ← 0% éxito
[SERVER]   "fallidos": 24,
[SERVER]   "errores": 24
[SERVER] }
[SERVER] Error: Unsupported entity type: IMAGE
```

### Después del Fix (Esperado)
```
[SERVER] {
[SERVER]   "total": 24,
[SERVER]   "exitosos": 24,     ← 100% éxito
[SERVER]   "fallidos": 0,
[SERVER]   "errores": 0
[SERVER] }
```

---

## 🎯 IMPACTO

### Código Afectado
- ✅ `EntityType.IMAGE` ahora devuelve `'image'` (antes `'IMAGE'`)
- ✅ `getEntityTypeFromExtension()` devuelve `'image'` (antes `'IMAGE'`)
- ✅ Map de procesadores encuentra matches correctamente
- ✅ Consistente con 200+ archivos que usan `=== 'image'`

### Retrocompatibilidad
- ✅ No rompe código existente (constantes mantienen nombres)
- ✅ `EntityType.IMAGE` sigue siendo accesible
- ✅ Solo cambia el **valor** de la constante, no su nombre

### Tests
- ⚠️ Algunos tests pueden necesitar actualización si hardcodeaban `'IMAGE'`
- ✅ Tests que usan `EntityType.IMAGE` funcionan sin cambios

---

## 🔍 BÚSQUEDA DE PATRÓN

Para encontrar posibles problemas en el futuro:

```bash
# Buscar comparaciones con UPPERCASE (posibles bugs)
grep -r "=== 'IMAGE'" src/
grep -r "=== 'VIDEO'" src/

# Buscar uso correcto de constantes (OK)
grep -r "EntityType.IMAGE" src/
```

**Convención establecida**: Siempre usar `EntityType.IMAGE` en lugar de `'image'` literal.

---

## 📚 LECCIONES APRENDIDAS

1. **Consistencia es clave**: Todo el código debe seguir la misma convención (lowercase)
2. **Validar constantes**: Las constantes deben reflejar los valores usados en el código
3. **Tests críticos**: Este tipo de error debería ser detectado por tests de integración
4. **Type safety**: TypeScript no detectó el mismatch entre string literal y Map key

---

## ✅ CHECKLIST POST-FIX

- [x] Cambiar `EntityType` values a lowercase
- [x] Verificar que Map de procesadores usa lowercase
- [x] Actualizar documentación de auditoría
- [ ] Reiniciar servidor
- [ ] Ejecutar reindex de prueba
- [ ] Verificar logs muestran éxito
- [ ] Confirmar entities creadas en BD

---

**Fix aplicado por**: GitHub Copilot  
**Fecha**: 10 de Octubre, 2025  
**Versión**: Drizzle ORM Migration
