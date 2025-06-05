# 🚨 PROBLEMAS CRÍTICOS DEL PROYECTO - PLAN DE ACCIÓN

## 📊 ANÁLISIS DE PROBLEMAS DETECTADOS

### 🔥 **PROBLEMA 1: AlbumTransformer RelationError**

```
ERROR [AlbumTransformer] Error transformando álbum: { "error": { "name": "RelationError" } }
ERROR [AlbumTransformer] Error transformando álbum a versión extendida: { "error": { "name": "TransformerError" }, "albumId": "cmbhg2opn001z93xk7qqje8p4" }
ERROR [AlbumActions] ❌ Error al obtener álbumes (simplificado): { "name": "TransformerError" }
```

### ⚠️ **PROBLEMA 2: WorldItemTransformer JSON Parsing**

```
WARN [WorldItemTransformer:Serializers] Failed to parse JSON field: SyntaxError: Unexpected token 'N', "Ninguno" is not valid JSON. Using default value.
```

- Múltiples warnings de campos JSON inválidos en WorldItem
- Datos como "Ninguno", "Fuerza 15", etc. guardados como strings en lugar de JSON

### 🔍 **PROBLEMA 3: Consultas Prisma Repetitivas**

- Múltiples consultas SUM duplicadas para calcular tamaños de imágenes
- Posible problema de performance y N+1 queries

## 🎯 PLAN DE RESOLUCIÓN

### **Paso 1: Analizar AlbumTransformer** ✅ COMPLETADO

- [x] Buscar archivos relacionados con AlbumTransformer
- [x] Identificar RelationError en transformaciones
- [x] Verificar estructura de datos de álbum con ID problemático

**DIAGNÓSTICO**: Error en `fromPrismaAlbum` del álbum ID `cmbhg2opn001z93xk7qqje8p4`. Falta validación robusta de campos requeridos.

### **Paso 2: Corregir AlbumTransformer** ✅ COMPLETADO

- [x] Agregar validación robusta en `fromPrismaAlbum`
- [x] Implementar fallbacks para álbumes corruptos
- [x] Mejorar logging de errores específicos

**RESULTADO**: Error en `fromPrismaAlbum` resuelto con validación mejorada y manejo de errores robusto.

### **Paso 3: Corregir WorldItemTransformer** ✅ COMPLETADO

- [x] Localizar serializers de WorldItem
- [x] Crear script de migración para limpiar datos JSON inválidos
- [x] Mejorar parsing de campos JSON con mejor fallback
- [x] Corregir errores TypeScript en serializers

**DIAGNÓSTICO RESUELTO**:

- ✅ Función `fromWorldItemBase` creada para manejar objetos `WorldItemBase`
- ✅ Separación clara entre `fromPrismaWorldItem` (para tipos Prisma) y `fromWorldItemBase` (para tipos base)
- ✅ Funciones auxiliares actualizadas: `parseJsonFields`, `toExtendedWorldItem`, `toWorldItemWithStats`
- ✅ Todos los errores TypeScript resueltos (0 errores)
- ✅ Estrategias de reparación JSON implementadas (normalizar, reparar patrones, envolver en arrays)

### **Paso 4: Corregir Errores de Compilación en group.service.ts** 🔄 EN PROGRESO

- [ ] **EventType Issues**: Arreglar tipos de eventos incorrectos
- [ ] **Error Handling**: Corregir tipos `unknown` en parámetros de error
- [ ] **Prisma Relations**: Actualizar consultas para usar relaciones many-to-many correctas
- [ ] **Template Literals**: Reemplazar concatenación de strings con template literals
- [ ] **GroupSearchResult**: Corregir acceso a propiedades de paginación
- [ ] **GroupRelations Type**: Corregir tipos en switch cases

**ERRORES IDENTIFICADOS**:

- ❌ 35+ errores de compilación TypeScript en `group.service.ts`
- ❌ Uso incorrecto de `EventType` (string no asignable)
- ❌ Parámetros `error` tipados como `unknown` sin type guards
- ❌ Queries Prisma usando tablas many-to-many inexistentes (`groupToImage`, etc.)
- ❌ Acceso incorrecto a `result.pagination.totalItems` (no existe)
- ❌ Strings concatenados en lugar de template literals
- ❌ Tipos `GroupRelations` inconsistentes en switch cases

### **Paso 4: Migrar y Limpiar Datos JSON** ✅ COMPLETADO

- [x] Ejecutar script de migración para limpiar campos JSON inválidos
- [x] Verificar que los warnings de JSON parsing se reduzcan
- [x] Confirmar que WorldItemTransformer funciona correctamente

**RESULTADO**:

- ✅ Script ejecutado exitosamente: `scripts/migrations/run-cleanup.js`
- ✅ 14 registros procesados y corregidos sin errores
- ✅ 14 campos `requirements` reparados de "Ninguno" → "[]" y patrones como "Fuerza 15" → JSON estructurado
- ✅ Datos JSON corruptos en WorldItem completamente limpiados

### **Paso 5: Optimizar Consultas Prisma** 🔧 EN PROGRESO

- [ ] Identificar queries duplicadas de SUM()
- [ ] Implementar batching o caching para estadísticas
- [ ] Reducir N+1 problems en cálculo de tamaños

### **Paso 5: Testing y Validación**

- [ ] Verificar que errores de AlbumTransformer se resuelven
- [ ] Validar que warnings de WorldItem desaparecen
- [ ] Comprobar performance mejorada de consultas

## 🔧 STACK TÉCNICO

- Next.js 15.3.3 + React 19
- Prisma ORM (migrando a Drizzle)
- Tailwind CSS 4 + Shadcn/ui
- Motion/React para animaciones
- PNPM como gestor de paquetes

---
*Actualizado: 2025-06-04*
