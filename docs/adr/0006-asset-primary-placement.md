---
status: accepted
---

# Un placement primario canónico por `Asset`

La arquitectura objetivo adopta una regla base simple: cada `Asset` tiene **un placement/source principal canónico** en el modelo base.

Eso no impide que en el futuro existan copias, mirrors, réplicas o placements secundarios. Lo que impide es tratarlos como si fueran equivalentes por defecto desde el corazón del modelo.

## Decisión

- Cada `Asset` se ancla operativamente en un placement/source principal canónico.
- En el modelo base, ese placement/source principal coincide conceptualmente con `Source File`; no se abre una capa separada desde día 1.
- Ese placement principal no define la identidad del asset, pero sí su referencia física base en el modelo central.
- Placements adicionales sólo existen como estructuras explícitas posteriores, no como equivalencia implícita desde día 1.
- Un placement secundario del mismo asset sólo nace por decisión/modelado explícito, nunca por coincidencia automática de fingerprint u otros heurísticos débiles.
- Reindex, thumbnails, lifecycle y demás procesos operativos pueden apoyarse en ese placement primario sin ambigüedad sobre qué archivo físico manda.

## Qué evita esta decisión

- que el núcleo nazca con varios archivos físicos “igualmente canónicos”,
- que `path` o la ubicación operativa vuelvan a confundirse con identidad,
- y que cada capacidad transversal tenga que inventar su propia regla para elegir qué placement usar.

## Consecuencias

- `Asset` sigue separado de `Source File`, pero ya no queda ambiguo cuál es su anclaje físico principal.
- El modelo base no paga todavía el costo de separar `Source File` de `Primary Placement` como capas independientes.
- Los placements secundarios, mirrors o copias deberán modelarse explícitamente si el producto realmente los necesita.
- La migración puede converger antes en un modelo entendible, en vez de arrancar con un caso general demasiado costoso para el corazón del sistema.
