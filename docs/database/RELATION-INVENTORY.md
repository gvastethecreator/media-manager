# Inventario de relaciones conceptuales

Hasta que las foreign keys se introduzcan dominio por dominio, `scripts/db/orphan-inventory.ts` mantiene el catálogo
ejecutable de 80 relaciones que hoy dependen de convención:

- 52 extremos de 26 junctions de Group/Image/Video hacia organización, taxonomía y worldbuilding;
- placements `folderId` de siete tablas de archivos hacia `Folder`;
- nueve jerarquías `parentId` de Character/Collection/Concept/Folder/Place/Prompt/Tag/Wildcard/WorldItem;
- siete referencias directas adicionales de Settings/Profile/UploadedImage/FileStats/Favorite e `Image.noteId`;
- cinco referencias polimórficas de Favorite/Thumbnail/Metadata/Activity/EntityAggregates.

El inventario abre SQLite en modo read-only y entrega únicamente `count`, `technicalIds`, nombre del contrato y política.
No serializa paths, nombres de medios, metadata ni contenido. Las muestras son hashes técnicos SHA-256 truncados a 24
caracteres. Si falta una tabla o columna declarada, el contrato se reporta como `uninspectable` y el comando falla: una
superficie que no pudo medirse nunca se presenta como cero huérfanos.

Las políticas iniciales son deliberadamente conservadoras:

- `auto-delete-link`: sólo para un junction cuyo extremo ya no existe; se podrá reparar de forma idempotente después de
  generar backup y manifest.
- `quarantine`: settings/favorites sin perfil no se reasignan por inferencia.
- `manual-reconcile`: archivos sin folder y jerarquías rotas necesitan una decisión de placement.

La herramienta de este checkpoint no repara nada. Su salida es la entrada del paquete DB-006, donde cada familia obtendrá
FK y política `ON DELETE/UPDATE` explícita después de reconciliar una copia representativa.

## Resultado sobre la copia representativa adoptada

El inventario detectó y preservó cuatro findings:

- una fila de `_ImageToWorldItem` tiene roto el extremo Image y también el extremo WorldItem;
- 2 filas de `Metadata` no resuelven su target polimórfico;
- 17 filas de `EntityAggregates` no resuelven su target polimórfico.

No se aplicó limpieza automática. El junction puede entrar en la futura reparación idempotente `auto-delete-link`; los
metadatos y agregados requieren reconciliación manual o cuarentena antes de introducir FKs.
