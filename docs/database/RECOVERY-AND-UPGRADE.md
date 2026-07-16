# Recuperación, upgrade y lifecycle de SQLite

Este runbook es el contrato operativo de la base local. Ningún comando elige `db.sqlite` implícitamente, ningún restore
sobrescribe un archivo existente y ningún upgrade modifica la base origen.

`db:migrate` sólo puede crear una base nueva o validar una base ya actual. Si una base existente tiene migraciones
pendientes, historia/`user_version` contradictorios o drift canónico, falla desde un preflight de sólo lectura: no cambia
el SHA, el journal mode ni crea sidecars WAL/SHM. El marker de inicialización sólo serializa procesos y nunca habilita
migraciones pendientes. Un upgrade legítimo exige este flujo de `db:upgrade`.

## Flujo de upgrade soportado

1. Detener el backend que usa la base origen.
2. Elegir un directorio de backups fuera del workspace y un output nuevo en el data dir de la aplicación.
3. Ejecutar el upgrade seguro:

```bash
bun run db:upgrade -- --database C:/AppData/MediaManager/current.sqlite --backup-dir D:/Backups/MediaManager --output C:/AppData/MediaManager/next.sqlite --root-id library --json
```

El comando crea un backup verificable con `VACUUM INTO`, calcula SHA-256, prueba un restore aislado, restaura a staging,
aplica migraciones, ejecuta `db:check` y publica mediante hard link sólo si todo pasa. El resultado es un archivo nuevo;
el origen y el backup permanecen intactos tanto en éxito como ante una migración o proceso interrumpido.

El manifest v2 registra versión de app/schema, tamaño, hash, inventario técnico y IDs opacos de roots. Nunca guarda paths
de medios ni contenido de filas.

## Backup, verificación y restore manual

```bash
bun run db:backup -- --database C:/AppData/MediaManager/current.sqlite --output D:/Backups/MediaManager --root-id library --json
bun run db:backup:verify -- --backup D:/Backups/MediaManager/media-manager-backup-....sqlite --json
bun run db:restore -- --backup D:/Backups/MediaManager/media-manager-backup-....sqlite --output C:/AppData/MediaManager/restored.sqlite --json
```

`restore` exige un output inexistente, valida manifest/hash/inventario y no tiene opción de overwrite. Cambiar el archivo
activo es una decisión posterior y explícita del supervisor/Tauri, nunca una consecuencia lateral del comando.

## Retención

La retención sólo acepta un directorio externo con backups y manifests válidos. El modo por defecto es dry-run:

```bash
bun run db:backup:prune -- --output D:/Backups/MediaManager --keep 5 --json
bun run db:backup:prune -- --output D:/Backups/MediaManager --keep 5 --confirm PRUNE-VERIFIED-BACKUPS --json
```

Todos los backups y manifests del directorio se emparejan y verifican antes de construir el plan; un archivo corrupto,
sin manifest o duplicado cancela la operación sin eliminar nada. En modo confirmado se vuelven a verificar tanto los
backups retenidos como los candidatos antes de la primera baja. El audit JSONL contiene sólo nombres técnicos, hash y
decisión.

## Diagnóstico

```bash
bun run db:check -- --database C:/AppData/MediaManager/current.sqlite --json
```

La salida estable expone `status: ok|warning|error`, `healthy`, errores y warnings separados, historia/checksums de
migración, drift de schema, `integrity_check`, `foreign_key_check`, versión SQLite, `user_version` esperado/actual, WAL, page/freelist,
tamaño y espacio libre. `error` devuelve código no-cero; un warning operativo como journal no-WAL mantiene `healthy`.

## Conexión y apagado

- Cada conexión activa y verifica `foreign_keys=ON` y `busy_timeout` antes de aceptar tráfico.
- Bases locales usan WAL, `synchronous=NORMAL` y `wal_autocheckpoint=1000`. URLs remotas/network-like no reciben una
  promesa falsa de WAL local.
- La ingesta usa un writer por defecto. `MEDIA_MANAGER_INGEST_CONCURRENCY` permite una decisión operativa explícita
  entre 1 y 4, acompañada por la métrica `busyErrors`.
- SIGINT/SIGTERM detienen reindex, cierran el servidor, hacen checkpoint WAL y cierran SQLite; existe un timeout duro de
  diez segundos para no dejar un proceso zombi.
- Tauri dev ignora `DATABASE_URL` heredada. Usa un archivo dentro del data dir de desarrollo o
  `MEDIA_MANAGER_TAURI_DEV_DATABASE`, que también debe quedar canónicamente dentro de ese directorio. Recorre cada
  segmento antes de crearlo y rechaza symlinks/junctions/reparse points, por lo que un rechazo no crea directorios fuera.
  Si el archivo existente está desactualizado, el arranque se niega y exige `db:upgrade`; nunca lo migra in-place.

## Herramientas peligrosas

`db:studio` requiere `--database`, verifica que exista y escucha sólo en `127.0.0.1`. `db:reset` sólo acepta una base bajo
`.scratch` o el temp del sistema, exige el `application_id` disposable y confirmaciones exactas:

```bash
bun run db:mark-disposable -- --database .scratch/dev.sqlite --confirm MARK-DISPOSABLE
bun run db:reset -- --database .scratch/dev.sqlite
bun run db:reset -- --database .scratch/dev.sqlite --confirm RESET-DISPOSABLE
```

La segunda línea es dry-run. `db.sqlite`, un archivo sin marker o un path fuera de los roots descartables falla cerrado.
