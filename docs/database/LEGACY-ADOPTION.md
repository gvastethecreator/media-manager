# Runbook de adopción de una base histórica

Este flujo ensaya un upgrade sin tocar la base original. No debe ejecutarse directamente contra `db.sqlite`.

## Precondiciones

1. Crear un backup verificado fuera del workspace con `db:backup`.
2. Conservar juntos el `.sqlite` y su `.manifest.json`.
3. Elegir un path de output nuevo, también fuera del workspace.
4. No continuar si el inventario de huérfanos contiene datos que el siguiente cambio de schema no tolera.

## Ensayo

```bash
bun run db:adopt-legacy -- \
  --backup C:/backup/media-manager.sqlite \
  --manifest C:/backup/media-manager.sqlite.manifest.json \
  --output C:/rehearsal/media-manager-adopted.sqlite

bun run db:check -- --database C:/rehearsal/media-manager-adopted.sqlite
bun run db:orphans -- --database C:/rehearsal/media-manager-adopted.sqlite
```

La adopción sólo acepta el perfil histórico conocido: `Favorite` previo, ocho índices faltantes, Task legacy y FTS5. El
proceso valida checksum/restore del backup, propiedad y unicidad de favoritos, conteos por tabla, integridad SQLite,
foreign keys y contrato de schema. Todas las mutaciones ocurren en una copia y el cambio de schema usa una transacción de
escritura inmediata. Ante error, el output parcial se elimina y el backup se vuelve a verificar.

La aplicación no migra ni asigna favoritos durante una lectura. Si `Favorite` no tiene el contrato canónico, falla con
instrucciones para ejecutar este runbook sobre un backup; la propiedad de filas legacy nunca se infiere desde “el primer
perfil activo”.

## Criterio de promoción

Un ensayo es promovible sólo cuando:

- `db:check` devuelve `healthy: true`;
- no hay objetos administrados faltantes/cambiados ni extras desconocidos;
- `integrity_check` es `ok` y hay 0 violaciones FK;
- todos los conteos de tablas fuente se conservaron;
- los findings de `db:orphans` tienen una decisión explícita;
- el backup original vuelve a verificar el mismo SHA-256.

La promoción sobre datos reales todavía requiere una ventana operativa, cierre limpio de la aplicación, backup adicional,
rollback ensayado y autorización explícita. Este checkpoint no autoriza esa operación.
