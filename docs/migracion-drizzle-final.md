# Auditoría Final Migración Prisma → Drizzle ORM

Estado: Borrador inicial
Fecha: 2025-08-13

## 1. Alcance de la Auditoría
Objetivo: Confirmar eliminación de dependencias funcionales de Prisma y consolidar consultas raw heredadas en patrones Drizzle (schema + sql tagged) asegurando consistencia tipada y mantenibilidad.

## 2. Hallazgos Clave
- No se encontraron imports de `@prisma/*`, `PrismaClient`, ni `schema.prisma` en el repositorio.
- Persisten referencias documentales (README / docs / comentarios) mencionando Prisma (solo informativas). Recomendado limpiar o marcar como legacy.
- Servicio de estadísticas optimizado (`OptimizedStatsService`) usa consultas agregadas complejas vía `db.all(sql\`...\`)` aceptables; potencial para factorizar vistas/materialized caches futuras.
- Scripts temporales en `scripts/tmp-*.js` ejecutan SQL directo (uso puntual). Pueden migrarse a helpers Drizzle si se necesitan de forma recurrente.
- Triggers/constraints custom en `src/lib/drizzle/constraints.ts` mantienen SQL multi-línea; alineado con estrategia actual (aceptable).
- Relaciones pivot `_GroupToImage`, etc. ya definidas en `schema/relations`. Consultas raw que las usan están justificadas por agregaciones multi-join.

## 3. Zonas con SQL Raw y Acción Recomendada
| Ubicación | Tipo | Acción | Prioridad |
|-----------|------|--------|-----------|
| `services/stats/optimized-stats.service.ts` | Agregados multi-join | Mantener con sql tagged. Evaluar extracción de fragmentos repetidos (COUNT/SUM) a helpers reutilizables. | Media |
| `lib/drizzle/constraints.ts` | Triggers/constraints | Mantener (Drizzle no abstrae completamente). Documentar cada bloque con precondiciones. | Media |
| `scripts/tmp-*.js` | Scripts ad-hoc | Decidir: eliminar si ya no se usan o portar a `scripts/db/maintenance/*.ts`. | Baja |
| `scripts/db/clean-and-seed.ts` | Limpieza masiva | Revisar: reemplazar DELETE por `truncate-like` secuencias sólo si rendimiento crítico. | Baja |
| `server/routes/search.ts` | SELECT compuesto (búsqueda) | Plan: sustituir por futura FTS5 (`/api/search/fts`) según Plan Mínimo Disruptivo. | Alta |

## 4. Checklist Cierre Migración
- [x] Sin dependencias de Prisma en runtime.
- [x] Eliminar referencias narrativas de Prisma en documentación pública (archivadas en `docs/history/prisma-legacy.md`).
- [x] Introducir convención util `@/lib/drizzle/fragments` / helpers (creado `helpers/in-list.ts`, `instrumentation.ts`).
- [x] Reemplazar literales manuales IN (...) por helper seguro (`buildInList`).
- [x] Instrumentar queries agregadas críticas (álbumes, tags, colecciones, global, grupo, favoritos, top tags).
- [ ] Implementar FTS5 y retirar consultas LIKE/UNION actuales (infraestructura creada + ranking bm25 básico expuesto como score; pendiente eliminar fallback LIKE tras validación estable).
- [ ] Revisar scripts ad-hoc y archivar o migrar.

## 5. Mejoras Propuestas Post-Migración
1. FTS5 + ranking → reducirá complejidad de join manual en búsqueda y permitirá índices especializados.
2. Vistas materializadas (o tablas cache) para métricas globales si frecuencia de actualización << frecuencia de lectura. Cron ligero invalidando.
3. Helper de agregados: `buildEntityCounts({ albumIds? })` que genere SQL dinámico seguro (reducir duplicación en stats service).
4. Telemetría de latencia por consulta agregada (envolver `db.all` en wrapper con logging p95).
5. Centralizar manejo de IN lists (albumIds/tagIds) con util que construya placeholders para prevenir SQL injection y mejorar legibilidad.

## 6. Riesgos y Mitigación
- Consultas muy largas en stats → Riesgo de mantenimiento. Mitigar con helpers y comentarios estructurados.
- Futura ampliación de entidades rompe agregados globales → Añadir test snapshot de columnas devueltas por `getGlobalStatsOptimized`.
- Scripts sueltos corren fuera de control transaccional → Migrar a scripts tipados y registrar en CHANGELOG interno.

## 7. Quick Wins Inmediatos
- [x] Crear archivo `docs/drizzle-aggregates-guidelines.md` con patrones para agregados.
- [x] Añadir wrapper `instrumentedAll(label, sql)` para métricas.
- [x] Adoptar helper `buildInList` en stats batch (álbum, tag, colección) evitando concatenaciones.
- [x] Instrumentar resto de métodos stats (global, grupo, favoritos, top tags).
- [x] Limpiar menciones Prisma en comentarios de stores migrados (se mantienen marcadores `MIGRADO A DRIZZLE`).

## 7.1 Cobertura Instrumentación Actual
| Área | Método / Label | Estado |
|------|----------------|--------|
| Álbum batch | stats.batch.albums | ✅ |
| Tags batch | stats.batch.tags.filtered / .all | ✅ |
| Colecciones batch | stats.batch.collections.filtered / .all | ✅ |
| Global | stats.global | ✅ |
| Grupo | stats.group | ✅ |
| Favoritos | stats.favorites | ✅ |
| Top Tags | stats.topTags | ✅ |

Todos los métodos críticos exponen label consistente para agregación y futura observabilidad (filtros por prefijo `stats.`).

## 8. Plan de Acción (Orden Sugerido)
1. (Alta) Implementar endpoint FTS5 y retirar lógica búsqueda legacy → desbloquea mejoras rendimiento.
2. (Media) Wrapper instrumentación DB.
3. (Media) Helper de listas IN parametrizadas.
4. (Baja) Limpieza documentación histórica Prisma (mover a `docs/history/prisma-legacy.md`).
5. (Baja) Normalizar scripts ad-hoc.

## 9. Criterios de Hecho Final
- Todas las consultas complejas pasan por Drizzle `sql` o builders tipados.
- No hay literales `IN (${ids.map(...)})` sin parametrizar (helper central).
- Métricas de latencia disponibles para top 5 queries agregadas.
- Documentación actualizada reflejando estado Drizzle-only.

---
> Este documento se actualizará conforme se completen los pasos pendientes.
