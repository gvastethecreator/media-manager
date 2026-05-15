# Favorite Bridge

`Favorite` no es sólo una feature simpática de UI. En el estado actual del repositorio es también una zona de contradicción importante: existe como tabla transversal y a la vez como flags `isFavorite` repartidos por múltiples tablas y endpoints.

Este documento define por qué `Favorite` merece un batch propio y por qué aparece como puente entre `Media Core` y los contextos restantes.

## Problema actual

Hoy conviven dos ideas distintas de favorito:

- una relación transversal (`Favorite`),
- y un estado embebido por entidad (`isFavorite`).

Eso genera riesgos obvios:

- drift entre dos fuentes de verdad,
- APIs duplicadas,
- cachés inconsistentes,
- y semántica confusa en el dominio.

## Decisión canónica

`Favorite` es una **relación transversal canónica**.

No es una propiedad esencial de `Image`, `Video`, `Album`, `Character` o cualquier otra entidad. Es un marcador que destaca un objeto sin cambiar su identidad ni su tipo.

## Consecuencia estructural

### Fuente de verdad final

La fuente de verdad final debe vivir en una familia canónica de favoritos/relaciones transversales.

### Qué pasa con `isFavorite`

Los flags embebidos:

- no son la verdad conceptual,
- no deben sobrevivir como contrato principal,
- y sólo pueden tolerarse temporalmente como deuda o cache de transición.

## API objetivo

### Contrato canónico

El contrato canónico debe vivir bajo una familia de API de favoritos o relaciones transversales.

### Contratos legacy

Los endpoints por entidad pueden seguir existiendo un tiempo, pero sólo como facades. Eso significa:

- delegan internamente al contrato canónico,
- no definen reglas distintas,
- no persisten por otra vía,
- y no viven como segunda semántica permanente.

## ¿Por qué este batch va entre `Media Core` y `Taxonomy`?

Porque necesita dos cosas a la vez:

- suficiente estabilidad de tipos y ownership en el núcleo,
- pero todavía conviene resolverlo antes de que `Taxonomy` y `Worldbuilding` se cierren sobre una base con verdad dual.

En otras palabras:

- demasiado temprano: el modelo del core todavía está moviéndose,
- demasiado tarde: la dualidad se sigue arrastrando por todo el sistema.

## Qué debe incluir el batch

### 1. Canonical relation model

- shape estable de la relación `Favorite`.
- ownership claro.
- contrato de lectura y escritura coherente.

### 2. Facades transicionales

- rutas legacy por entidad que delegan.
- estrategia clara de compatibilidad temporal.

### 3. Remoción del estado dual

- desmontar `isFavorite` como verdad primaria.
- acotar o eliminar dependencias de UI que asumen el flag como canónico.

### 4. Reindexación conceptual del frontend

El frontend debe dejar de pensar “cada entidad tiene su favorito embebido” y pasar a pensar “hay una relación transversal que marca favoritos”.

## Qué no debe pasar

- no convertir `Favorite` en un mega-contenedor genérico para cualquier relación.
- no dejarlo preso de un solo contexto de negocio cuando ya se decidió que es transversal.
- no sostener indefinidamente tabla transversal más flags locales como contrato dual permanente.

## Criterio de salida del batch

Este batch estará bien resuelto cuando:

- haya una única semántica canónica de favorito,
- las APIs por entidad ya sean compatibilidad y no fuente primaria,
- el frontend deje de depender conceptualmente del flag embebido,
- y el modelo pueda crecer sin volver a abrir la discusión de “cuál era la verdad real”.
