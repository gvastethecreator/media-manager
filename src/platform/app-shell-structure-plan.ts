/**
 * @file App Shell Physical Structure Plan
 * @module platform/app-shell-structure
 * @description Plan de reorganización física del repositorio alineado con contextos.
 * Implementa 01-migration-principles.md y 02-platform-system-context.md.
 * Batch 2: enforcement + scaffolding. Batch 1 (composición global) ya completado.
 *
 * ESTADO: Estructura objetivo documentada. Migración incremental por slice.
 */

/**
 * ## Estructura actual vs objetivo
 *
 * ACTUAL (organizado por capas técnicas):
 * ```
 * src/
 *   components/     ← UI: views, features, ui, cards, panels, etc.
 *   services/       ← backend: todos los servicios mezclados
 *   transformers/   ← DTOs: por entidad
 *   store/          ← Zustand: por entidad
 *   server/         ← Express: routes, middleware
 *   lib/            ← utilidades: drizzle, logger, effects, api, filesystem, etc.
 *   types/          ← tipos: por entidad
 *   hooks/          ← React hooks
 *   providers/      ← React context providers
 *   config/         ← configuración
 *   styles/         ← CSS
 * ```
 *
 * OBJETIVO (organizado por contexto con capas internas):
 * ```
 * src/
 *   platform/             ← Platform/System Context
 *     app-shell/          ← App.tsx, main.tsx, router.tsx
 *     global-providers/   ← Providers (theme, query, cache, settings, file)
 *     operational/        ← Settings, profiles, queue, SSE, logging
 *     processes/          ← Reindex, thumbnails, sync (orquestación)
 *     enforcement/        ← Guardrails de importación, scaffolding
 *
 *   media-core/           ← Media Core Context
 *     asset/              ← Asset root, identity, fingerprint, ingestion
 *       asset.service.effect.ts
 *       asset-errors.effect.ts
 *     specializations/    ← Image, Video, Audio, Document, JsonFile, File3D
 *     organizers/         ← Folder, Album, Collection, Group
 *     placement/          ← SourceFile, PrimaryPlacement
 *     relations/          ← Relaciones estructurales fuertes (containment)
 *
 *   taxonomy/             ← Taxonomy Context (subdominio compartido)
 *     tags/               ← Tag catalog
 *     properties/         ← Property definitions + PropertyAssignment
 *     prompts/            ← Prompt artifacts (file-backed)
 *     notes/              ← Note artifacts (file-backed)
 *     wildcards/          ← Wildcard artifacts (file-backed)
 *     file-backed/        ← Infraestructura compartida file-backed
 *
 *   worldbuilding/        ← Worldbuilding Context
 *     narrative-entity/   ← Base común
 *     character/          ← Character
 *     place/              ← Place
 *     concept/            ← Concept
 *     world-item/         ← WorldItem (residual)
 *
 *   bridges/              ← Relaciones transversales
 *     favorite/           ← Favorite (canonical relation)
 *     semantic-relation/  ← SemanticRelation model
 *
 *   shared/               ← Código compartido entre contextos (no es un contexto)
 *     lib/                ← Drizzle, Effect, logger, utils (se mantiene)
 *     types/              ← Tipos compartidos
 *     styles/             ← CSS tokens
 * ```
 *
 * ## Reglas de migración
 *
 * 1. Cada slice se mueve completo (servicio + transformer + store + routes + types + UI).
 * 2. Se mantienen facades de compatibilidad en ubicación original durante la transición.
 * 3. Las importaciones se actualizan vía find-replace al mover archivos.
 * 4. Los tests se mueven junto con su módulo.
 *
 * ## Secuencia recomendada
 *
 * 1. Platform/System → consolidar providers y app shell (ya hecho lógicamente)
 * 2. Favorite bridge → mover a bridges/favorite/ (tabla canonical, servicio, API)
 * 3. Taxonomy → mover tag + property + prompt + note + wildcard
 * 4. Media Core → la migración más grande (Asset root primero)
 * 5. Worldbuilding → character + place + concept + worldItem
 *
 * ## Señales de completitud
 *
 * - Cada contexto tiene su propio directorio raíz bajo src/
 * - Las importaciones cross-context son explícitas y nombradas
 * - No hay barrels (index.ts) en servicios ni transformers
 * - El árbol físico refleja el mapa de contextos del README
 */

export const APP_SHELL_STRUCTURE_VERSION = '1.0';
export const APP_SHELL_STRUCTURE_STATUS = 'planned' as const;
