---
status: accepted
---

# APIs canónicas por contexto con facades transicionales

Las APIs del producto deben converger hacia ownership explícito por contexto y por relación canónica, en vez de duplicar semántica en endpoints repartidos por cada entidad. Durante la migración se permiten facades legacy por entidad para preservar compatibilidad, pero esas rutas deben delegar internamente al servicio o contrato canónico y no definir una segunda semántica.

## Decisión

- Cada capacidad debe tener una API canónica alineada con su contexto dueño.
- Las relaciones transversales deben tener endpoints canónicos propios cuando su semántica no pertenece a una sola entidad.
- Los endpoints legacy por entidad pueden sobrevivir temporalmente como facades de compatibilidad.
- Las facades no deben introducir reglas, validaciones o persistencia alternativas a la API canónica.

## Aplicación inicial

- `Favorite` se modela canónicamente como relación transversal.
- La semántica canónica de `Favorite` debe leerse como relación scoped al actor/perfil que marca el objeto, no como flag global incrustado en la entidad objetivo.
- La familia canónica de favoritos debe vivir bajo una API de favoritos/relaciones, no como verdad repartida entre `/images/:id/favorite`, `/albums/:id/favorite`, etc.
- Los endpoints por entidad para favoritos, si continúan durante la transición, deben delegar al contrato canónico y tratarse como compatibilidad temporal.

## Consecuencias

- Se reduce la verdad duplicada entre rutas por entidad y rutas transversales.
- El ownership semántico de cada capacidad queda más claro.
- La migración puede avanzar sin romper consumidores existentes de golpe.
- El estado final del sistema debe eliminar las facades que ya no aporten compatibilidad necesaria.
