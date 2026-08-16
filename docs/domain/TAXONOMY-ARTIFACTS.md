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
- Los editores de las tres familias consultan el archivo antes de habilitar una edición, cargan su cuerpo/hash y usan la
  ruta canónica para update/delete. Un editor legacy sin versión observada no puede guardar un binding file-backed.

## Escritura y conflictos

La capa de archivo normaliza BOM/CRLF a UTF-8/LF, rechaza NUL, UTF-8 inválido y documentos mayores a 2 MiB. Las
mutaciones se serializan dentro del proceso, escriben un temporal en el mismo directorio, fuerzan `fsync` y capturan la
versión previa mediante rename antes de instalar el temporal con hard-link exclusivo. Crear/renombrar nunca reemplaza
un destino que apareció concurrentemente. Actualizar, renombrar o borrar exige el SHA-256 observado por el editor
(`expectedHash`); una divergencia responde `409 ARTIFACT_CONFLICT` y conserva el ganador externo o una cuarentena
recuperable.

La capa baja recibe una capacidad `{ rootId, relativePath, resolver }`, nunca un path físico como autoridad. El resolver
vuelve a ejecutar la validación de root, padre y reparse point justo antes de crear parent, abrir, enlazar, renombrar o
eliminar. Una prueba intercambia un directorio por junction después de una resolución previa: la mutación falla con
`ROOT_PATH_OUTSIDE` y no escribe en el destino externo.

Node no ofrece una API portable que fije un handle de directorio durante toda la operación. Un actor local no cooperativo
todavía puede cambiar un reparse point después de la última revalidación y antes del syscall. Esa microventana requiere
una implementación futura basada en handles nativos; el contrato actual no promete `openat` ni una garantía de kernel
que Node no da.

Las mutaciones de React Query usan `retry: false`. `ApiClient` sólo reintenta automáticamente GET y un POST que tenga
una clave de idempotencia persistida por el servidor. PUT, PATCH y DELETE son single-shot. La creación file-backed de
Wildcard no tiene todavía tal contrato: si se pierde su respuesta, la interfaz informa resultado incierto y pide recargar
antes de crear otro. Un conflicto 409 conserva el draft y exige reload o una acción explícita.

La [documentación oficial de filesystem de Node](https://nodejs.org/api/fs.html) no ofrece un compare-and-swap portable
para archivos frente a escritores externos no cooperativos. La garantía es
optimista y acotada: verificación posterior a la captura, instalación no-overwrite y recheck antes de finalizar. Un
proceso que mantiene un descriptor abierto y escribe in-place durante la ventana de rename no puede coordinarse de
forma absoluta sin locking específico de plataforma; por eso las cuarentenas quedan visibles al rebuild y no se afirma
una atomicidad imposible.

Después de confirmar el archivo, la app actualiza `TaxonomyArtifact` y la proyección de compatibilidad en una única
transacción SQLite. Si esa transacción falla, restaura el contenido anterior o retira el archivo recién creado. Un
borrado mueve primero el archivo a cuarentena, borra entidad, Favorite y binding en la transacción del servicio, y sólo
entonces elimina la cuarentena. Si una relación gobernada impide el borrado, la API devuelve un conflicto tipado y
restaura el archivo. Prompt permite quitar su relación con Image antes de repetir el borrado.

El delete de un binding `missing` vuelve a comprobar la ausencia dentro de la transacción que borra la entidad. Antes de
esa comprobación escribe una tombstone durable. Si el archivo reaparece, SQLite no elimina la entidad. Si aparece tras
el commit o el proceso cae, rebuild conserva la tombstone, suprime la adopción automática y deja el caso visible para
recuperación explícita. Esto impide que Wildcard reaparezca por scan y que Prompt o Note recuperen una proyección vieja.

Los triggers de `Prompt`, `Note` y `Wildcard` bloquean `UPDATE` y `DELETE` inline mientras exista un binding. La
transacción canónica obtiene un permiso efímero y acotado a familia, identidad y operación. Así, una llamada legacy que
cruza la comprobación previa durante una carrera tampoco puede crear una segunda autoridad.

## Recovery y rebuild

`POST /api/taxonomy-artifacts/rebuild` hace un scan acotado (máximo 10.000 Markdown gobernados) únicamente dentro de
raíces persistidas con permisos `read` + `index`:

- adopta un archivo válido que quedó escrito antes de confirmar su binding;
- reubica un binding cuyo path anterior desapareció y cuya identidad aparece en otro filename gobernado;
- deja en conflicto identidades duplicadas cuyo archivo anterior aún existe;
- restaura una cuarentena si entidad y binding siguen presentes;
- finaliza una cuarentena si la transacción de borrado ya eliminó entidad y binding;
- procesa primero tombstones, staging `.tmp`, Markdown visibles y cuarentenas; un rename interrumpido sólo se finaliza
  si el destino conserva la misma identidad portable y el mismo hash que la cuarentena;
- mueve cada `.tmp` de crash a `*.tmp-orphan` y jamás lo promueve como contenido authored;
- conserva tombstones de deletes ya confirmados, cuenta reapariciones suprimidas y bloquea que el scan adopte esos bytes
  hasta una resolución explícita;
- marca `missing`, `conflict` o `error` sin borrar silenciosamente la identidad authored.
- permite que el editor restaure explícitamente un binding `missing` desde su última versión indexada o elimine esa
  identidad con precondición de hash; las rutas inline siguen bloqueadas.

La búsqueda normal consulta `TaxonomyArtifact.indexedTitle/indexedSummary/indexedBody`; no recorre el filesystem y
filtra en SQL por los roots que aún conceden `read + index` y por bindings `synced`. Contenido inválido, ausente o en
conflicto deja de ser buscable hasta una reconciliación válida. Los GET legacy omiten o responden 404 para bindings de
bibliotecas retiradas. El rebuild y una lectura reconciliada vuelven a derivar la proyección desde el archivo.

La sanitización pública conserva los campos authored declarados, incluso si contienen texto parecido a un path. Los
campos privados de ubicación física siguen eliminados y los errores continúan redactados.

## API

| Operación            | Endpoint                                           | Regla principal                                                                        |
| -------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Crear Wildcard       | `POST /api/taxonomy-artifacts/wildcard`            | Archivo primero; entidad + binding se confirman juntos y rebuild recupera crash.       |
| Externalizar/guardar | `PUT /api/taxonomy-artifacts/:type/:id`            | `rootId` al crear; `expectedHash` obligatorio después.                                 |
| Leer/reconciliar     | `GET /api/taxonomy-artifacts/:type/:id`            | El archivo externo gana y refresca el índice.                                          |
| Renombrar            | `PATCH /api/taxonomy-artifacts/:type/:id/location` | Sólo filename Markdown portable dentro de la casa de la familia.                       |
| Borrar               | `DELETE /api/taxonomy-artifacts/:type/:id`         | Hash observado + cuarentena; `missing` revalida ausencia dentro de la transacción.     |
| Quitar Prompt/Image  | `DELETE /api/prompts/:id/images/:imageId`          | Libera una relación que bloquea el delete sin alterar el archivo authored.             |
| Buscar               | `GET /api/taxonomy-artifacts/search?q=...`         | LIKE literal escapado, paginado y derivado.                                            |
| Reconstruir          | `POST /api/taxonomy-artifacts/rebuild`             | Recovery acotado; informa tombstones, `.tmp` en cuarentena y reapariciones suprimidas. |

Las rutas inline de `Prompt`, `Note` y `Wildcard` responden `409 ARTIFACT_FILE_BACKED` para contenido ya
externalizado. Esto impide reintroducir una segunda autoridad por accidente.

## Persistencia

- Migración `0008_taxonomy_artifact_projection`: tabla `TaxonomyArtifact`, PK polimórfica estable, root con
  `RESTRICT/CASCADE`, ubicación única case-insensitive, checks de tipo/hash/path/timestamps e índices de root, estado y
  búsqueda por familia/título.
- Migración `0009_wildcard_shortcut_projection`: materializa `Wildcard.shortcut`, ya presente en los contratos de
  servicio/UI pero ausente históricamente del schema.
- Migración `0010_semantic_relation_model`: agrega `authoredMetadata`, el permiso transaccional efímero y triggers que
  impiden mutaciones inline sobre las tres familias file-backed.
- `scripts/db/taxonomy-artifact-schema.test.ts` prueba constraints y upgrade desde cero.
- `scripts/taxonomy-artifact-http.test.ts` prueba permisos, conflictos, bypass inline, búsqueda literal, creación
  file-backed, texto authored con rutas literales, proyección, relaciones y delete real.

## Evidencia de producción local

El smoke sobre el frontend construido y el servidor real pasa en Chrome a 1440x900 y 1024x768. Usa una base, un root y
uploads descartables; prueba load/save de Prompt y Note, edición externa de Wildcard, 409, reload y guardado final. Las
capturas inspeccionadas viven en
`.scratch/planning/2026-07-14-complete-recovery/artifacts/rel-tax-production/`.
