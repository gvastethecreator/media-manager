---
status: accepted
---

# Favorite listing seam canónico y retiro progresivo de facades por entidad

El sistema consolidará el listing/projection de favoritos detrás de un seam HTTP canónico reutilizable por todas las capacidades, y tratará los endpoints `/:id/favorite` por entidad como facades transicionales a retirar por slice. Esta decisión reduce modules shallow en rutas, concentra locality de reglas de favoritos y alinea la migración con ADR-0002 (ownership por contexto y facades temporales).

## Estado de implementación (2026-07-16)

- `Favorite(profileId, entityType, entityId)` es la única autoridad persistente y su identidad lógica es única por perfil.
- Una lectura sin perfil activo proyecta `isFavorite = false`; una escritura exige exactamente un perfil activo y falla antes de mutar en cualquier otro caso.
- `/api/favorites/toggle` y `/api/favorites/state` son las únicas superficies públicas de mutación.
- Create/update con `isFavorite` y los deletes físicos modifican entidad y Favorite dentro de la misma transacción.
- Las columnas `Entity.isFavorite` sobreviven sólo como compatibilidad de schema durante expand-contract y nunca participan en decisiones runtime.
- Las facades `/:id/favorite` fueron retiradas de los routers; tombstones centrales responden 410 para detectar callers rezagados.
- La invalidación compartida cubre mutaciones de Favorite y lifecycle de entidades para impedir proyecciones cacheadas obsoletas.

El checkpoint obtuvo revisión independiente `ACCEPT` después de cerrar orphan cleanup, eventos idempotentes, stats/streams
legacy e invalidación incompleta. La evidencia ejecutable incluye suites focales, aplicación completa y tooling aislado
sobre SQLite descartable, manteniendo `db.sqlite` byte-idéntica.
