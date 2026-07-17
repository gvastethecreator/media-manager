# Contrato operativo de artefactos textuales Taxonomy

Este documento describe la implementación de ADR-0007. Para `Prompt`, `Note` y `Wildcard` externalizados, el archivo
es la única fuente authored; SQLite conserva identidad operativa, ubicación opaca, hash, estado de sincronización e
índices reconstruibles.

## Formato y autoridad

- Los archivos viven bajo `taxonomy/prompts`, `taxonomy/notes` o `taxonomy/wildcards` dentro de un `MediaRoot`
  autorizado y persistido. La API nunca acepta ni devuelve paths físicos.
- La identidad portable está en el frontmatter (`id`, `kind`, `schemaVersion`) y no cambia al renombrar el archivo.
- El núcleo authored permitido es `title`, `summary`, `category`, `emoji` y `color`. `Prompt` agrega `purpose` y un
  bloque `parameters` gobernado. Claves desconocidas se rechazan.
- `Prompt.parameters` usa los tipos `text`, `number`, `boolean`, `date` y `enum_token`; su vocabulario canónico inicial
  es `subject`, `context`, `tone`, `style` y `constraints`. Las extensiones custom deben declararse y documentarse.
- Todo placeholder `{{snake_case}}` de un Prompt debe tener parámetro. Los parámetros `required` deben aparecer en el
  cuerpo. El Prompt portable exige `purpose` y cuerpo no vacíos.
- El cuerpo de `Wildcard` es una lista plana: una entrada recortada por línea, sin vacíos ni duplicados. La proyección
  legacy `Wildcard.children` se deriva como JSON para mantener compatibles los lectores existentes.
- `Wildcard` nuevo se crea file-backed por defecto desde los editores actualizados. `Prompt` y `Note` pueden madurar
  desde inline mediante `PUT /api/taxonomy-artifacts/:type/:id`.

## Escritura y conflictos

La capa de archivo normaliza BOM/CRLF a UTF-8/LF, rechaza NUL, UTF-8 inválido y documentos mayores a 2 MiB. Las
mutaciones se serializan dentro del proceso, escriben un temporal en el mismo directorio, fuerzan `fsync`, renombran y
sincronizan el directorio cuando la plataforma lo permite. Actualizar, renombrar o borrar exige el SHA-256 observado
por el editor (`expectedHash`); un hash obsoleto responde `409 ARTIFACT_CONFLICT` y nunca pisa la edición externa.

Después de confirmar el archivo, la app actualiza `TaxonomyArtifact` y la proyección de compatibilidad en una única
transacción SQLite. Si esa transacción falla, restaura el contenido anterior o retira el archivo recién creado. Un
borrado mueve primero el archivo a cuarentena, borra entidad, relaciones, Favorite y binding en la transacción del
servicio, y sólo entonces elimina la cuarentena.

## Recovery y rebuild

`POST /api/taxonomy-artifacts/rebuild` hace un scan acotado (máximo 10.000 Markdown gobernados) únicamente dentro de
raíces persistidas con permisos `read` + `index`:

- adopta un archivo válido que quedó escrito antes de confirmar su binding;
- reubica un binding cuyo path anterior desapareció y cuya identidad aparece en otro filename gobernado;
- deja en conflicto identidades duplicadas cuyo archivo anterior aún existe;
- restaura una cuarentena si entidad y binding siguen presentes;
- finaliza una cuarentena si la transacción de borrado ya eliminó entidad y binding;
- marca `missing`, `conflict` o `error` sin borrar silenciosamente la identidad authored.

La búsqueda normal consulta `TaxonomyArtifact.indexedTitle/indexedSummary/indexedBody`; no recorre el filesystem. El
rebuild y una lectura reconciliada vuelven a derivar esa proyección desde el archivo.

## API

| Operación            | Endpoint                                           | Regla principal                                                                 |
| -------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------- |
| Crear Wildcard       | `POST /api/taxonomy-artifacts/wildcard`            | Crea identidad y archivo; compensa la identidad si falla el archivo/proyección. |
| Externalizar/guardar | `PUT /api/taxonomy-artifacts/:type/:id`            | `rootId` al crear; `expectedHash` obligatorio después.                          |
| Leer/reconciliar     | `GET /api/taxonomy-artifacts/:type/:id`            | El archivo externo gana y refresca el índice.                                   |
| Renombrar            | `PATCH /api/taxonomy-artifacts/:type/:id/location` | Sólo filename Markdown portable dentro de la casa de la familia.                |
| Borrar               | `DELETE /api/taxonomy-artifacts/:type/:id`         | Cuarentena + delete transaccional + `204`.                                      |
| Buscar               | `GET /api/taxonomy-artifacts/search?q=...`         | LIKE literal escapado, paginado y derivado.                                     |
| Reconstruir          | `POST /api/taxonomy-artifacts/rebuild`             | Recovery acotado sobre roots autorizados.                                       |

Las rutas inline de `Prompt`, `Note` y `Wildcard` responden `409 ARTIFACT_FILE_BACKED` para contenido ya
externalizado. Esto impide reintroducir una segunda autoridad por accidente.

## Persistencia

- Migración `0008_taxonomy_artifact_projection`: tabla `TaxonomyArtifact`, PK polimórfica estable, root con
  `RESTRICT/CASCADE`, ubicación única case-insensitive, checks de tipo/hash/path/timestamps e índices de root, estado y
  búsqueda por familia/título.
- Migración `0009_wildcard_shortcut_projection`: materializa `Wildcard.shortcut`, ya presente en los contratos de
  servicio/UI pero ausente históricamente del schema.
- `scripts/db/taxonomy-artifact-schema.test.ts` prueba constraints y upgrade desde cero.
- `scripts/taxonomy-artifact-http.test.ts` prueba permisos, conflictos, bypass inline, búsqueda literal, creación
  file-backed, proyección y delete real.
