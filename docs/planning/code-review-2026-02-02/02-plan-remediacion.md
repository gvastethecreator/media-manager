# Plan de remediación por fases

**Fecha:** 2 de febrero de 2026

## Fase 0 — Preparación (1–2 días)

**Objetivo:** acordar criterios y evitar cambios inconsistente.

- Definir contratos de errores (Effect vs null) por entidad.
- Alinear política de logging (serverLogger vs console).
- Confirmar endpoints canónicos y rutas duplicadas.

**Criterio de salida:** checklist aprobado y actualizado en `docs/planning`.

## Fase 1 — Estabilidad crítica (3–5 días)

**Objetivo:** eliminar fallas de producción y ambigüedades.

- Resolver duplicidad `/api/audio`.
- Sustituir `require` por import estático en `images.effect.ts`.
- Unificar adaptador de errores en rutas legacy.

**Criterio de salida:** rutas deterministas y errores consistentes.

## Fase 2 — Determinismo y datos confiables (3–6 días)

**Objetivo:** eliminar datos aleatorios en UI.

- Reemplazar `Math.random()` en transformers.
- Agregar métricas reales o dejar `null`/`0`.
- Evitar mutaciones de input en transformers.

**Criterio de salida:** resultados estables entre renders.

## Fase 3 — Deuda técnica controlada (1–2 semanas)

**Objetivo:** consolidar migración Effect y eliminar stubs.

- Migrar rutas legacy restantes a Effect.
- Resolver `local-files` (reactivar o retirar).
- Eliminar `@ts-nocheck` en debug routes.

**Criterio de salida:** reducción de deuda y coherencia arquitectónica.

## Fase 4 — Rendimiento y UX (3–5 días)

**Objetivo:** consistencia de UI en listados grandes.

- Unificar cálculo de ancho en cards.
- Evitar virtualizer cuando no está habilitado.
- Ajustar scroll behavior.

**Criterio de salida:** UX uniforme con o sin virtualización.
