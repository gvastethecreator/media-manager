# Inventario y backup seguro de la base SQLite

Estas herramientas inspeccionan y respaldan una base local sin copiar una base activa a ciegas. El backup usa
`VACUUM INTO`, calcula SHA-256 y sólo publica el manifest después de abrir una copia restaurada y comparar schema y
conteos.

## Inventario read-only

```powershell
bun run db:check -- --database file:./db.sqlite
bun run db:inventory -- --database D:\Datos\media-manager.sqlite --json
```

Si se omite `--database`, se usa `DATABASE_URL`. El resultado incluye tamaño, modo journal, `user_version`, hash del
schema, `PRAGMA quick_check` y conteos por tabla. No incluye valores de filas.

## Crear un backup

El destino es obligatorio y debe estar fuera del workspace/Git:

```powershell
bun run db:backup -- --database file:./db.sqlite --output D:\Backups\media-manager
```

Se crean dos archivos:

- `media-manager-backup-<fecha>.sqlite`: snapshot consistente.
- `media-manager-backup-<fecha>.sqlite.manifest.json`: SHA-256, tamaño, identidad de schema, conteos y prueba de restore.

El comando no sobrescribe archivos. Si falla el snapshot, la integridad, el hash o el restore temporal, elimina los
artefactos incompletos y devuelve exit code 1.

## Verificar antes de restaurar

```powershell
bun run db:backup:verify -- --backup D:\Backups\media-manager\media-manager-backup-<fecha>.sqlite
```

La verificación vuelve a calcular tamaño y SHA-256, abre la base, ejecuta `quick_check`, copia a un directorio temporal
y compara el schema y todos los conteos del manifest. No reemplaza la base activa.

## Reset exclusivamente descartable

`bun run db:reset` es dry-run por defecto y sólo opera bajo `.scratch` o el temp del sistema después de marcar el archivo
con `db:mark-disposable` y confirmar `RESET-DISPOSABLE`. `db.sqlite`, paths externos o archivos sin marker fallan cerrado.
La API y la UI no publican reset de base de datos.

## Contrato del CLI

- `--help` y `--version` escriben en stdout y devuelven 0.
- `--json` produce datos estructurados en stdout; los errores van a stderr.
- Uso inválido devuelve 2; fallo operativo o de integridad devuelve 1.
- Sólo se admiten rutas SQLite locales; URLs remotas, query strings y fragments se rechazan.
- `db:backup:prune` ofrece retención explícita, dry-run por defecto. Verifica todo el conjunto antes de borrar y exige
  `PRUNE-VERIFIED-BACKUPS` para aplicar el plan.

> No se creó ningún backup de la biblioteca real durante el desarrollo de esta herramienta. Las pruebas usan bases
> temporales descartables.
