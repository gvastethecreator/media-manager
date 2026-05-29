---
status: accepted
---

# Favorite listing seam canónico y retiro progresivo de facades por entidad

El sistema consolidará el listing/projection de favoritos detrás de un seam HTTP canónico reutilizable por todas las capacidades, y tratará los endpoints `/:id/favorite` por entidad como facades transicionales a retirar por slice. Esta decisión reduce modules shallow en rutas, concentra locality de reglas de favoritos y alinea la migración con ADR-0002 (ownership por contexto y facades temporales).