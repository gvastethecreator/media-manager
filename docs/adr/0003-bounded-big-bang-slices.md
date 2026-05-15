---
status: accepted
---

# Migración por slices acotados con big bang interno

La migración no se hará como convivencia flexible e indefinida entre árbol viejo y árbol nuevo dentro de cada capacidad. Tampoco se intentará un big bang de contexto completo. La estrategia aceptada es ejecutar **big bangs acotados por capacidad bien delimitada**: cada slice se migra de punta a punta en un batch cerrado, con su nuevo ownership, rutas, servicios, documentación y limpieza del legacy relevante dentro del mismo esfuerzo.

## Decisión

- Cada slice debe representar una capacidad coherente y delimitada.
- Dentro de ese slice, el cambio se hace completo: modelo, API, composición, wiring y documentación.
- Se evita dejar dos implementaciones vivas durante mucho tiempo para la misma capacidad.
- No se intentan big bangs de contexto entero salvo que el costo sea excepcionalmente bajo.

## Qué cuenta como slice válido

Ejemplos sanos:

- `Favorite` completo como relación transversal.
- `Asset ingestion + canonical asset model`.
- `Prompt`, `Note` y `Wildcard` como batch coherente de Taxonomy.

Ejemplos a evitar:

- “Todo Media Core entero” en una sola maniobra.
- migraciones por capa técnica que corten verticalmente el dominio pero no cierren una capacidad.
- convivencias largas donde el árbol legacy siga recibiendo cambios funcionales en paralelo.

## Consecuencias

- Cada migración deja un resultado visible y con ownership claro.
- Se reduce el costo de arrastrar duplicación semántica durante semanas o meses.
- La planificación debe descomponer bien las capacidades antes de ejecutar.
- Cada slice exige preparación suficiente para poder cerrarse en una sola pasada fuerte.
