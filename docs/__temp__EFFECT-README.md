# 🌊 Effect-TS Integration - Guía Rápida

> **Implementación sistemática de Effect-TS en el proyecto Image Manager**

## 📌 Estado Actual

✅ **Fase 0 Completada** - Runtime y servicios base  
✅ **Fase 1 Completada** - TagService piloto funcional  
✅ **Fase 2 Completada** - Schemas y validación centralizada  
✅ **Fase 3 Completada** - AlbumService (20/20 tests passing)  
🔧 **Fase 4 En Progreso** - FolderService y servicios restantes

## 🚀 Inicio Rápido

### Importar y Usar Effect

```typescript
// Import del barrel
import { Effect, runPromise, DrizzleService } from '@/lib/effect';

// Ejemplo básico
const program = Effect.gen(function*() {
  const drizzle = yield* DrizzleService;
  const tags = yield* drizzle.query((db) => 
    db.select().from(tags).where(eq(tags.isFavorite, true))
  );
  return tags;
});

// Ejecutar
const tags = await runPromise(
  program.pipe(Effect.provide(DrizzleLive))
);
```

### Convertir Promise a Effect

```typescript
import { fromPromise, toPromise } from '@/lib/effect';

// Promise → Effect
const effect = fromPromise(() => fetch('/api/users'));

// Effect → Promise (para integración legacy)
const result = await toPromise(myEffect);
```

---

## 📁 Estructura

```
src/lib/effect/
├── index.ts                    # ⭐ Barrel export - usar este
├── runtime/
│   └── runtime.ts             # Runtime + Logger integrado
├── services/
│   └── drizzle.service.ts     # Drizzle como Effect Service
└── utils/
    └── adapt-promise.ts        # Promise ↔ Effect adapters
```

---

## 📖 Documentación

| Documento | Descripción |
|-----------|-------------|
| [EFFECT-IMPLEMENTATION-PLAN.md](./EFFECT-IMPLEMENTATION-PLAN.md) | 📘 Plan completo de 5 fases |
| [__temp__EFFECT-PHASE-0-SUMMARY.md](__temp__EFFECT-PHASE-0-SUMMARY.md) | ✅ Resumen Fase 0 completada |
| Este README | 🚀 Guía rápida de uso |

---

## 🎯 Próximos Pasos

### Para Desarrolladores

1. **Leer:** [EFFECT-IMPLEMENTATION-PLAN.md](./EFFECT-IMPLEMENTATION-PLAN.md)
2. **Estudiar:** Ejemplos en `/src/services/tag/` (próximamente)
3. **Migrar:** Seguir el patrón del servicio piloto

### Para Continuar Implementación

**Siguiente:** Fase 1 - TagService Piloto

```bash
# Ver plan detallado
cat docs/EFFECT-IMPLEMENTATION-PLAN.md | grep -A 50 "Fase 1"

# O abrir en VS Code
code docs/EFFECT-IMPLEMENTATION-PLAN.md
```

---

## 🔗 Enlaces Útiles

- 📚 [Effect Docs](https://effect.website/docs/)
- 💬 [Discord Effect-TS](https://discord.gg/effect-ts)
- 🎥 [Visual Effect Tutorial](https://effect.kitlangton.com/)
- 📦 [Effect GitHub](https://github.com/Effect-TS/effect)
- 🌟 [Effect Examples](https://github.com/Effect-TS/examples)

---

## ❓ FAQ

### ¿Cuándo usar Effect vs. Promise?

- **Nuevo código:** Usar Effect siempre que sea posible
- **Legacy:** Mantener Promises, migrar incrementalmente
- **Express routes:** Usar helpers `handleEffect()` (ver Fase 1)

### ¿Cómo ejecutar un Effect?

```typescript
// En servidor (Node/Bun)
import { runPromise } from '@/lib/effect';
const result = await runPromise(myEffect);

// Con Layer dependencies
const result = await runPromise(
  myEffect.pipe(Effect.provide(MyServiceLive))
);
```

### ¿Cómo manejar errores?

```typescript
import { Effect, Either } from 'effect';

// Opción 1: Try/catch tradicional
try {
  const result = await runPromise(myEffect);
} catch (error) {
  console.error(error);
}

// Opción 2: Either (sin excepciones)
import { runPromiseEither } from '@/lib/effect/runtime/runtime';
const result = await runPromiseEither(myEffect);
if (Either.isRight(result)) {
  console.log(result.right);
} else {
  console.error(result.left);
}

// Opción 3: Dentro de Effect.gen
const program = Effect.gen(function*() {
  const result = yield* myEffect.pipe(
    Effect.catchAll((error) => {
      console.error(error);
      return Effect.succeed(defaultValue);
    })
  );
  return result;
});
```

---

## 🛠️ Troubleshooting

### Error: "Cannot find module '@/lib/effect'"

**Solución:** Verificar que TypeScript paths estén configurados en `tsconfig.json`:

```jsonc
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@effect": ["./src/lib/effect/*"]
    }
  }
}
```

### Error: "DrizzleService not found"

**Solución:** Proveer el Layer en el Effect:

```typescript
import { DrizzleLive } from '@/lib/effect';

const result = await runPromise(
  myEffect.pipe(Effect.provide(DrizzleLive))
);
```

### TypeScript errors en Effect files

**Solución temporal:** La mayoría son warnings menores que no afectan funcionalidad. Se resolverán en Fase 1.

---

## 📊 Progreso

- [x] Fase 0: Fundamentos (Completada ✅)
- [ ] Fase 1: Servicio Piloto - TagService
- [ ] Fase 2: Validación y Schemas Compartidos
- [ ] Fase 3: Servicios Complejos
- [ ] Fase 4: Optimizaciones Avanzadas
- [ ] Fase 5: Documentación Final

---

**Última actualización:** 11 de octubre de 2025  
**Versión Effect:** 3.x  
**Estado:** ✅ Fundamentos listos, listo para migración de servicios

☄️☄️☄️☄️
