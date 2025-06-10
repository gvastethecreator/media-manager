# 🔧 AUDITORÍA TRANSFORMERS - PLAN DE CORRECCIÓN

**Fecha**: 2025-06-10T17:00:00Z
**Estado**: 🚨 EN PROGRESO
**Problema**: Constructores incorrectos de TransformerError en múltiples entidades

## 🎯 PROBLEMAS IDENTIFICADOS

### 🔍 Constructor TransformerError Inconsistencias

**Constructor correcto** (según `/utils/transformers/errors.ts`):

```typescript
export class TransformerError extends Error {
 constructor(message: string) {
  super(message);
  this.name = 'TransformerError';
 }
}
```

**Patrones incorrectos encontrados**:

#### ❌ Patrón 1: 3 argumentos (Tag v2)

```typescript
throw new TransformerError('TagTransformer', 'Datos de Tag inválidos', { cause: error });
```

#### ❌ Patrón 2: 2 argumentos (Property, Note serializers)

```typescript
throw new TransformerError('Error al transformar Property', { cause: error });
```

## 📊 ENTIDADES AFECTADAS

### 🚨 CRÍTICAS (20 archivos encontrados)

- ✅ `note/transformer.ts` - YA CORREGIDO
- 🔧 `tag/v2/serializers.ts` - 3 instancias
- 🔧 `tag/v2/mappers.ts` - 4 instancias
- 🔧 `property/transformer.ts` - 4 instancias
- 🔧 `property/v2/mappers.ts` - 3 instancias
- 🔧 `property/v2/serializers.ts` - 3 instancias
- 🔧 `note/serializers.ts` - 2 instancias

### 📋 ARCHIVOS A VERIFICAR

1. `src/transformers/tag/v2/serializers.ts`
2. `src/transformers/tag/v2/mappers.ts`
3. `src/transformers/property/transformer.ts`
4. `src/transformers/property/v2/mappers.ts`
5. `src/transformers/property/v2/serializers.ts`
6. `src/transformers/note/serializers.ts`

## 🔧 ESTRATEGIA DE CORRECCIÓN

### Paso 1: Corrección por lotes

1. Buscar todos los patrones incorrectos
2. Reemplazar constructores con versión simplificada
3. Mantener información de error en logs

### Paso 2: Validación

1. Verificar que no hay errores TypeScript
2. Confirmar que logging conserva información

## 🎯 PATRÓN DE REEMPLAZO

```typescript
// ❌ Antes (3 args)
throw new TransformerError('TagTransformer', 'Datos inválidos', { cause: error });

// ❌ Antes (2 args)
throw new TransformerError('Error transformando', { cause: error });

// ✅ Después (1 arg)
throw new TransformerError('Error transformando datos');
```

## ⏰ TIEMPO ESTIMADO

- **Corrección**: 15-20 minutos
- **Validación**: 5 minutos
- **Total**: ~25 minutos

---

**Estado siguiente**: Iniciar correcciones automáticas por archivo
