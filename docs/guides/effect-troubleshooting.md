# 🔧 Effect-TS Troubleshooting Guide

**Fecha:** 11 de octubre de 2025  
**Versión:** 1.0  
**Contexto:** Guía de resolución de problemas comunes en implementación Effect-TS

---

## 📋 Índice

1. [Drizzle Integration Issues](EFFECT-TROUBLESHOOTING.md#drizzle-integration-issues)
2. [Test Environment Issues](EFFECT-TROUBLESHOOTING.md#test-environment-issues)
3. [Schema Validation Issues](EFFECT-TROUBLESHOOTING.md#schema-validation-issues)
4. [TaggedError Issues](EFFECT-TROUBLESHOOTING.md#taggederror-issues)
5. [Performance Issues](EFFECT-TROUBLESHOOTING.md#performance-issues)
6. [Type Issues](EFFECT-TROUBLESHOOTING.md#type-issues)

---

## 🗃️ Drizzle Integration Issues

### Issue 1: "then is not a function" en Effect.tryPromise

**Síntoma:**
```
TypeError: evaluate().then is not a function
```

**Causa:**
Drizzle con driver `libsql` retorna query builders "thenable" (tienen método `.then()`) pero no son verdaderas Promises hasta que se esperan.

**Solución:**
```typescript
// ❌ INCORRECTO
const result = yield* Effect.tryPromise({
  try: () => db.select().from(albums).where(eq(albums.id, id))
});

// ✅ CORRECTO
const result = yield* Effect.tryPromise({
  try: async () => await db.select().from(albums).where(eq(albums.id, id)),
  catch: (error) => fromUnknownError('operation', error),
});
```

**Explicación:**
- `async () => await query` fuerza la resolución de la Promise
- El `await` convierte el thenable en Promise real
- Effect.tryPromise necesita una función que retorne Promise, no thenable

**Aplicar a:** Todas las operaciones de base de datos con Drizzle + libsql

---

### Issue 2: Query ejecuta pero retorna array vacío

**Síntoma:**
```typescript
const albums = await service.create({ name: 'Test' });
console.log(albums); // []
```

**Causa:**
El query se ejecuta pero en base de datos incorrecta (mock en lugar de real).

**Diagnóstico:**
```typescript
// Agregar logs temporales
console.log('[DEBUG] DB Client type:', db.constructor.name);
console.log('[DEBUG] Insert result:', result);
```

**Solución:**
Verificar que la detección de environment use DB real en tests:
```typescript
const isServerOrTest = typeof process !== 'undefined' && 
  (typeof window === 'undefined' || 
   process.env.NODE_ENV === 'test' || 
   typeof (globalThis as any).Bun !== 'undefined');
```

---

## 🧪 Test Environment Issues

### Issue 3: Tests usan mock DB cuando deberían usar real

**Síntoma:**
Tests insertan datos pero queries SELECT retornan vacío. IDs generados como "mock-id-XXX".

**Causa:**
`tests/setup.ts` define `window` global para jsdom, rompiendo la condición `typeof window === 'undefined'`.

**Solución:**
En `src/lib/drizzle/index.ts`:
```typescript
// ❌ INCORRECTO
if (typeof window === 'undefined') {
  // Servidor: usa DB real
} else {
  // Browser: usa mock
}

// ✅ CORRECTO
const isServerOrTest = typeof process !== 'undefined' && 
  (typeof window === 'undefined' || 
   process.env.NODE_ENV === 'test' || 
   typeof (globalThis as any).Bun !== 'undefined');

if (isServerOrTest) {
  // Servidor o test: usa DB real
} else {
  // Browser: usa mock
}
```

**Verificación:**
```bash
bun test src/services/album/__tests__/album.service.effect.test.ts

# Logs deben mostrar IDs reales:
# ✅ "juO3ZL-S7P3gZe_xoqQl-"
# ❌ "mock-id-1234567890"
```

---

### Issue 4: Tests fallan con "window is not defined"

**Síntoma:**
```
ReferenceError: window is not defined
```

**Causa:**
Código ejecutándose en Node.js/Bun intenta acceder a `window`.

**Solución:**
Usar detección defensiva:
```typescript
// ❌ INCORRECTO
if (window.location.href) {
  // código browser
}

// ✅ CORRECTO
if (typeof window !== 'undefined' && window.location?.href) {
  // código browser
}
```

---

## 📝 Schema Validation Issues

### Issue 5: "Expected UUID, actual [nanoid]"

**Síntoma:**
```
AlbumValidationError: Expected UUID, actual "juO3ZL-S7P3gZe_xoqQl-"
```

**Causa:**
Schema usa tipo `UUID` estricto (formato `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`) pero la DB genera IDs con nanoid (21 chars alphanumeric).

**Solución:**
Crear tipo `ID` genérico en `src/lib/effect/schemas/common.ts`:
```typescript
export const ID = Schema.String.pipe(
  Schema.minLength(1),
  Schema.maxLength(30)
).annotations({
  identifier: 'ID',
  title: 'Entity Identifier',
  description: 'Unique identifier (nanoid format)',
});
```

Actualizar schemas de entidades:
```typescript
// ❌ INCORRECTO
export const Album = Schema.Struct({
  id: UUID,  // Muy estricto
  // ...
});

// ✅ CORRECTO
export const Album = Schema.Struct({
  id: ID,  // Acepta nanoid
  // ...
});
```

**Cuándo usar cada uno:**
- `ID`: Para primary keys generadas con nanoid (mayoría de casos)
- `UUID`: Solo si el ID debe ser específicamente UUID v4 format

---

### Issue 6: Schema.decodeUnknownSync con Effect.tryPromise

**Síntoma:**
```
Error: decodeUnknownSync is not async but wrapped in tryPromise
```

**Causa:**
`Schema.decodeUnknownSync` es síncrono, no debe usar `Effect.tryPromise`.

**Solución:**
```typescript
// ❌ INCORRECTO - tryPromise para sync
const validated = yield* Effect.tryPromise({
  try: () => Schema.decodeUnknownSync(Album)(data),
  catch: (error) => new ValidationError(...)
});

// ✅ CORRECTO - Effect.try para sync
const validated = yield* Effect.try({
  try: () => Schema.decodeUnknownSync(Album)(data),
  catch: (error) => new AlbumValidationError({
    field: 'album',
    message: 'Error validando datos',
    value: data,
  }),
});
```

**Regla general:**
- `Effect.tryPromise` → Operaciones **asíncronas** (DB, HTTP, File I/O)
- `Effect.try` → Operaciones **síncronas** (validación, parsing, transform)

---

## ⚠️ TaggedError Issues

### Issue 7: displayMessage retorna string vacío

**Síntoma:**
```typescript
const error = new AlbumNotFound({ albumId: 'test-123' });
console.log(error.displayMessage); // ""  ← vacío!
```

**Causa:**
Campo opcional `message?: string` no existe en instancia si no se provee. El getter falla silenciosamente.

**Solución:**
```typescript
// ❌ INCORRECTO - campo opcional causa problemas
export class AlbumNotFound extends Data.TaggedError('AlbumNotFound')<{
  readonly albumId: string;
  readonly message?: string;  // Opcional problemático
}> {
  get displayMessage(): string {
    return this.message ?? `Album no encontrado: ${this.albumId}`;
  }
}

// ✅ CORRECTO - solo campos requeridos
export class AlbumNotFound extends Data.TaggedError('AlbumNotFound')<{
  readonly albumId: string;  // Solo requerido
}> {
  get displayMessage(): string {
    return `Album no encontrado: ${this.albumId}`;
  }
}
```

**Regla:**
- **NO usar campos opcionales** en getters de TaggedError
- Si necesitas mensaje custom, hazlo campo **requerido**:
  ```typescript
  export class CustomError extends Data.TaggedError('CustomError')<{
    readonly context: string;
    readonly customMessage: string;  // Requerido, no opcional
  }> {
    get displayMessage(): string {
      return `${this.context}: ${this.customMessage}`;
    }
  }
  ```

---

### Issue 8: Error no se puede serializar JSON

**Síntoma:**
```
Error: Cannot convert circular structure to JSON
```

**Causa:**
TaggedError con referencias circulares o métodos no serializables.

**Solución:**
Agregar método `toJSON`:
```typescript
export class AlbumError extends Data.TaggedError('AlbumError')<{
  readonly albumId: string;
  readonly details: unknown;
}> {
  get displayMessage(): string {
    return `Error con álbum: ${this.albumId}`;
  }

  toJSON() {
    return {
      _tag: this._tag,
      albumId: this.albumId,
      message: this.displayMessage,
      // Evitar serializar 'details' si puede tener referencias circulares
    };
  }
}
```

---

## 🐌 Performance Issues

### Issue 9: Validación muy lenta en requests

**Síntoma:**
Request toma >100ms adicionales después de agregar validación Effect.

**Diagnóstico:**
```typescript
const start = performance.now();
const validated = yield* Effect.try({
  try: () => Schema.decodeUnknownSync(LargeSchema)(data)
});
console.log(`Validation took: ${performance.now() - start}ms`);
```

**Soluciones:**

**A) Usar decode en lugar de decodeUnknownSync:**
```typescript
// Más rápido si data ya está parcialmente validada
Schema.decode(Album)(data)
```

**B) Cache de schemas compilados:**
```typescript
// Compilar schema una vez
const decodeAlbum = Schema.decodeUnknownSync(Album);

// Reutilizar función compilada
const validated = decodeAlbum(data);
```

**C) Validación lazy para fields grandes:**
```typescript
export const AlbumWithLargeMetadata = Schema.Struct({
  id: ID,
  name: NonEmptyString,
  metadata: Schema.Lazy(() => LargeMetadataSchema),  // Solo valida si se accede
});
```

---

### Issue 10: Memory leak en tests

**Síntoma:**
Tests consumen cada vez más memoria, eventualmente fallan con OOM.

**Causa:**
Datos no limpiados entre tests, referencias retenidas.

**Solución:**
```typescript
describe('AlbumService', () => {
  afterEach(async () => {
    // Limpiar tablas
    await db.delete(albums);
    await db.delete(imageAlbums);
    
    // Si usas cache o stores
    cache.clear();
  });
  
  afterAll(async () => {
    // Cerrar conexiones
    await db.close();
  });
});
```

---

## 🔤 Type Issues

### Issue 11: Type mismatch entre Effect.gen y función normal

**Síntoma:**
```
Type 'Effect<Album, AlbumError, AlbumService>' is not assignable to type 'Promise<Album>'
```

**Causa:**
Mezclar Effect y async/await sin conversión.

**Solución:**
```typescript
// ❌ INCORRECTO - Effect sin ejecutar
async function getAlbum(id: string): Promise<Album> {
  return Effect.gen(function* () {
    const service = yield* AlbumService;
    return yield* service.getById(id);
  });  // Retorna Effect, no Promise
}

// ✅ CORRECTO - Ejecutar Effect con runPromise
async function getAlbum(id: string): Promise<Album> {
  const effect = Effect.gen(function* () {
    const service = yield* AlbumService;
    return yield* service.getById(id);
  });
  
  return Effect.runPromise(
    Effect.provide(effect, AlbumServiceLive)
  );
}
```

---

### Issue 12: Cannot find name 'yield*'

**Síntoma:**
```
Error: Cannot find name 'yield'
Property 'yield' does not exist
```

**Causa:**
Función no es generator o falta `function*`.

**Solución:**
```typescript
// ❌ INCORRECTO - función normal
Effect.gen(() => {
  const service = yield* AlbumService;  // Error!
});

// ✅ CORRECTO - función generator
Effect.gen(function* () {
  const service = yield* AlbumService;  // OK
});
```

---

## 📚 Checklist General de Troubleshooting

Cuando encuentres un error Effect:

1. **Verificar tipo de operación:**
   - [ ] ¿Es async? → `Effect.tryPromise`
   - [ ] ¿Es sync? → `Effect.try`
   - [ ] ¿DB query? → Agregar `async () => await`

2. **Verificar environment:**
   - [ ] ¿Tests usan DB real? → Check `isServerOrTest`
   - [ ] ¿Logs muestran IDs correctos? → Debe ser nanoid, no "mock-id"

3. **Verificar schemas:**
   - [ ] ¿IDs usan tipo correcto? → `ID` no `UUID`
   - [ ] ¿Schema compila correctamente? → Test con `Schema.decodeUnknownSync`

4. **Verificar errors:**
   - [ ] ¿TaggedError sin campos opcionales? → Solo requeridos
   - [ ] ¿displayMessage funciona? → Test manualmente

5. **Verificar tests:**
   - [ ] ¿Cleanup después de cada test? → `afterEach(() => db.delete(...))`
   - [ ] ¿Helpers reutilizables? → `runEffect` y `runEffectExpectFailure`

---

## 🔗 Referencias

- [Effect Documentation](https://effect.website/docs/introduction)
- [Drizzle ORM Docs](https://orm.drizzle.team/docs/overview)
- [Effect Schema Guide](https://effect.website/docs/schema/introduction)
- Implementación: `docs/EFFECT-PHASE-2-PLAN.md`
- Patrones: Sección "Patrones Críticos Descubiertos"

---

**Última actualización:** 2025-10-11  
**Mantenido por:** Equipo Effect Implementation  
**Contribuir:** Agregar issues encontrados con soluciones verificadas

☄️☄️☄️☄️
