# Checklist de verificación (pre-merge)

**Fecha:** 2 de febrero de 2026

## Backend

- [ ] No hay rutas duplicadas en `src/server/index.ts`.
- [ ] Todas las rutas usan el mismo adaptador de errores (Effect o wrapper común).
- [ ] No hay `require` en rutas TS/ESM.
- [ ] Logging centralizado (sin `console.error` en rutas productivas).

## Servicios

- [ ] Contratos alineados entre interfaz y runtime.
- [ ] Errores tipados en `Effect.tryPromise`.
- [ ] Validación de inputs en servicios o rutas según el patrón acordado.

## Transformers

- [ ] Sin `Math.random()` en datos para UI.
- [ ] Sin mutación de inputs.
- [ ] Guardas para campos opcionales.

## UI

- [ ] Cálculo de tamaño consistente en cards (virtualizado y no virtualizado).
- [ ] Sin estados o refs no usados.
- [ ] Scroll behavior compatible.

## Calidad

- [ ] `bun run tsc` sin errores.
- [ ] `bun run biome` sin issues.
- [ ] Tests relevantes ejecutados.
