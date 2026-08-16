# Auditoría de Código - 2025-08-28

## Resumen Ejecutivo

Estado general: base sólida (React 19 + Express/Bun + Drizzle). Principales oportunidades:

- Linter/formatter: alto volumen de advertencias (Tailwind class sort, JSX attr sort, organizeImports, a11y) solucionables en bloque.
- Arquitectura: accesos directos a Drizzle en rutas/utilidades; reforzar patrón Servicio → Ruta.
- Código legacy/backups: varias rutas/transformers con APIs deprecated/legacy; acordar plan de retirada.

## Hallazgos Clave

- Biome: ~500 issues/68 archivos. Categorías:
  - Orden de clases Tailwind y atributos JSX (ruido alto, autofix).
  - organizeImports (autofix).
  - a11y: botones sin type, roles redundantes, elementos no focusables con handlers.
- Patrones de datos:
  - Acceso DB en `src/server/routes/*` y utilidades de desarrollo. Debe pasar a `src/services/**`.
- Legacy/backup:
  - `src/services/file-entity-mapper/`: `*.backup.ts`, `*.clean.ts` coexistiendo con `*.ts`.
  - Transformers con funciones `@deprecated` (settings, tag, uploaded-image, wildcard, workflow).
- Scripts: uso de `new Date().getTime()` (corregido a `Date.now()`).

## Quick Wins (1-2 días)

- Ejecutar autofix guiado: `bun run biome:fix` y revisar diffs grandes por módulos.
- Asegurar botones con `type="button"` (ya aplicado en base-button).
- Normalizar literales numéricos (usar notación científica donde Biome lo prefiera).

## Refactor por Fases

1. Endurecer capa de servicios

- Extraer consultas directas de rutas (search, thumbnails, prompts, etc.) a `src/services/<dominio>/<dominio>.service.ts`.
- Handlers finos en `src/server/routes/**` con validación ligera.

2. Consolidar transformers

- Marcar funciones `@deprecated` con wrappers a nuevas variantes; actualizar llamadas y eliminar legacy en 2 PRs.

3. Stores y React Query

- Evitar duplicación de estados que ya provee React Query. Documentar keys canónicos.

4. Limpieza de backups/temporales

- Archivos `*.backup.ts`, `temp-suppressions.ts`, `debug-folders.ts`: retirar o mover a `docs/history` si se requieren como referencia.

## KPIs de Calidad

- 0 errores de TypeScript.
- 0 warnings Biome críticos; <50 advertencias menores tras autofix.
- 100% E2E base verde (create/list/delete entidades clave).

## Plan de Ejecución Propuesto

- PR1: Autofix Biome (sin cambios de lógica). Revisión por módulos.
- PR2: Rutas → Servicios (search + thumbnails).
- PR3: Deprecaciones transformers (settings, tag, uploaded-image).
- PR4: Limpieza backups/temporales.

## Riesgos y Mitigaciones

- Churn de diffs por ordenado de clases/attrs → dividir por carpetas y CI verde por etapa.
- Cambios en rutas pueden romper contratos → añadir tests E2E básicos por endpoint afectado.

## Anexos

- Puntos legacy detectados en grep (resumen): settings/\* (varias `@deprecated`), tag/transformer.ts, uploaded-image/transformer.ts, wildcard/transformer.ts, workflow/mappers.ts.
