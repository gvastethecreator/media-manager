# Historial Legacy Prisma

Estado: Archivado (2025-08-13)

Este documento preserva el contexto histórico de la migración desde Prisma hacia Drizzle ORM. No representa el estado actual del sistema productivo (Drizzle-only) y se mantiene únicamente como referencia.

## 1. Razón de la Migración
- Reducir sobrecarga de runtime y validaciones duplicadas.
- Simplificar modelo mental: un único ORM + sql tagged para casos avanzados.
- Mejorar tiempos de arranque y footprint en Bun.

## 2. Fases (Resumen)
| Fase | Periodo | Objetivo | Resultado |
|------|---------|----------|-----------|
| Coexistencia | 2024-Q4 | Ejecutar Drizzle y Prisma en paralelo (lecturas comparativas) | Validación de paridad de datos |
| Sustitución Progresiva | 2025-Q1 | Migrar servicios entidad por entidad | 24/25 servicios migrados |
| Optimización Stats | 2025-Q2 | Reescritura agregados complejos vía SQL optimizado | `OptimizedStatsService` estable |
| Clausura | 2025-Q3 | Eliminar dependencias Prisma y limpiar documentación | Estado Drizzle-only |

## 3. Componentes Eliminados
- `schema.prisma`
- Generación de tipos `@prisma/client`
- Mappers intermedios Prisma→DTO duplicados

## 4. Patrones Sustitutos
| Antes (Prisma) | Después (Drizzle) |
|----------------|------------------|
| `prisma.model.findMany({ where, include })` | `db.select().from(...).leftJoin(...).where(...)` |
| Agregados `_count` | Subqueries y CTEs con `sql`` |
| Filtros dinámicos con objetos | Helpers composables (e.g. buildInList) |
| Middlewares Prisma | Wrappers de instrumentación (`instrumentedAll`) |

## 5. Stats Service
El antiguo uso de Prisma para estadísticas se reemplazó por consultas SQL optimizadas e instrumentadas (labels `stats.*`). Se consideró suficiente mantener SQL tagged en lugar de abstraer en exceso.

## 6. Lecciones Aprendidas
- Evitar capas de traducción bidireccional prolongadas.
- Introducir instrumentación temprano facilita decisiones de tuning.
- Extraer helpers comunes (IN, contadores) reduce divergencia.

## 7. Pendientes que se descartaron
- Generador automático de mappers Prisma→Drizzle (coste > beneficio tras clausura).
- Conservación de tipos Prisma como alias (preferido inferir tipos Drizzle).

## 8. Estado Actual
El código ya no depende de Prisma en runtime. Cualquier referencia restante en comentarios o documentación debe considerarse histórica. Nuevas funcionalidades deben apoyarse exclusivamente en Drizzle + SQL tagged.

---
> Documento archivado. No actualizar salvo para mover referencias históricas adicionales.
