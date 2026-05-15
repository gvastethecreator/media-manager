---
status: accepted
---

# Asset con raíz persistente común separada de Source File

La arquitectura objetivo del `Media Core` modelará `Asset` como el objeto canónico del producto, con una **raíz persistente común, delgada pero real**, y con especializaciones por tipo de medio para la metadata específica. `Source File` seguirá existiendo como origen físico u operativo del asset, pero no se confundirá con la identidad del objeto de producto.

## Decisión

- `Asset` tendrá una raíz persistente común.
- Esa raíz será delgada: identidad, nombre visible canónico (opcional al inicio, con fallback operativo al nombre físico mientras falta), `assetType` explícito consistente con una única specialization principal, referencia directa al `primaryPlacementId`, timestamps, lifecycle visible pequeño (`active`, `archived`, `deleted`) modelado como un único `status` canónico, con timestamps de transición cuando apliquen, entendiendo `deleted` como tombstone lógico y por tanto restaurable hasta el purge físico, recuperando al restaurar el último estado no borrado cuando se conozca, y estado operativo básico verdaderamente transversal, manteniendo separado cualquier processing status de pipeline. Esa raíz puede nacer temprano durante la ingesta y completarse progresivamente a medida que llega la metadata especializada.
- La metadata específica de medio vivirá en especializaciones (`image`, `video`, `audio`, etc.).
- `Source File` no define la `Asset Identity`; expresa origen físico, ubicación o materialización durable.
- `Content Fingerprint` pertenece canónicamente a `Source File` / `Primary Placement`, aunque pueda proyectarse operacionalmente hacia la raíz cuando convenga.
- Flags de visibilidad o publicación como `hidden` o `public` no forman parte del lifecycle canónico de `Asset`.

## Se evita

- colapsar identidad de producto con `path` o `hash`.
- colapsar lifecycle del asset con flags de visibilidad o publicación.
- tratar cada tipo de medio como mini dominio aislado sin raíz compartida.
- convertir `Asset` en un paraguas puramente semántico sin consecuencia estructural.
- confundir el archivo físico con el objeto canónico que el producto organiza, relaciona y expone.

## Consecuencias

- Las relaciones transversales pueden apuntar a un objeto común más estable.
- `Asset Specialization` deja de ser sólo nomenclatura y pasa a reflejar una estructura real.
- La migración de persistencia será más exigente que una simple unificación de lenguaje.
- El diseño futuro debe tratar `path`, fingerprint y demás datos físicos como concern de `Source File` o ubicación, no como esencia identitaria del asset.
