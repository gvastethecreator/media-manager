# Baseline reproducible de SQLite

## Fuente de verdad

La única cadena canónica es:

1. `src/lib/drizzle/schema/index.ts` declara el modelo vigente.
2. `src/lib/drizzle/migrations/` contiene SQL, journal y snapshot versionados.
3. `src/lib/drizzle/schema-contract.json` fija el fingerprint de los objetos administrados.
4. `scripts/db/migrations.ts` aplica y verifica esa historia.

El DDL sin filas capturado desde la copia histórica se conserva en `docs/database/representative-schema.sql`; fue
generado por `scripts/db/export-schema.ts`, que falla cerrado si encuentra objetos desconocidos y no incluye path fuente.

`drizzle/migrations/` dejó de ser una segunda fuente. Su migración de índices fue absorbida en el schema: los índices
simples necesarios se conservaron y los compuestos `folderId + hash`, junto con `Folder.parentId`, ahora son declarativos.
El plan SQL de `Asset` que estaba ignorado no se adoptó: creaba un modelo que el código vigente todavía no usa y dejaba
la migración de datos comentada.

## Inventario reproducible

El baseline generado actualmente contiene 58 tablas Drizzle, incluidos los junctions, y sus índices declarados. El gate
normaliza el DDL de `sqlite_schema`, calcula SHA-256 por objeto y un fingerprint del conjunto completo. Un objeto esperado
ausente o modificado y cualquier objeto extra no clasificado hacen fallar `db:check`.

La copia representativa verificada de la base histórica contiene 69 tablas. El baseline canónico contiene 58 tablas
Drizzle; la diferencia está explicada por extensiones FTS5, tablas legacy de Task y tablas operativas locales. Esa
diferencia no autoriza a adivinar ni a borrar tablas. La clasificación aplicada sobre el backup fue:

- `managed`: objeto presente en el contrato versionado;
- `extension`: `sqlite_*`, historial del runner o tablas auxiliares de FTS5;
- `legacy`: nombres históricos conocidos de Task o del intento no consumado de Asset Root;
- `unknown`: requiere decisión manual y hace fallar el gate.

No se modificó `db.sqlite`. La comparación y adopción se ejecutaron sobre artefactos externos al workspace:

- backup restaurable: 69 tablas, `PRAGMA quick_check = ok`, SHA-256 verificado antes y después;
- drift conocido: DDL/índices históricos de `Favorite` y ocho índices compuestos/de jerarquía ausentes;
- drift permitido sin borrado: Task/junctions legacy y FTS5;
- resultado adoptado: 70 tablas, incluida `__media_manager_migrations`, `integrity_check = ok`, 0 violaciones FK,
  baseline aplicado y 0 objetos administrados faltantes, cambiados o desconocidos;
- conteos de todas las tablas fuente preservados exactamente.

La copia adoptada es evidencia de compatibilidad, no un reemplazo automático de la base del usuario.

## Objetos fuera de Drizzle

- FTS5 (`media_fts` y tablas/triggers auxiliares) se crea actualmente en runtime cuando el módulo está disponible. Se
  clasifica como extensión sólo si la virtual table y cada trigger presente coinciden con hashes DDL canónicos; un nombre
  allowlisted con SQL alterado falla el gate. Su migración completa a DDL versionado pertenece al paquete de búsqueda/FTS.
- `src/lib/drizzle/constraints.ts` contiene triggers de compatibilidad que no forman parte del baseline ejecutado. No se
  presentan como constraints activos hasta tener migración y prueba propias.
- La tabla `__media_manager_migrations` pertenece al runner y se excluye del contrato del dominio.

## Comandos seguros

Todos los comandos exigen `DATABASE_URL` o `--database`; no hay fallback implícito a `db.sqlite`.

```bash
bun run db:plan -- --database C:/tmp/media-manager-copy.sqlite
bun run db:status -- --database C:/tmp/media-manager-copy.sqlite
bun run db:migrate -- --database C:/tmp/media-manager-new.sqlite
bun run db:adopt-legacy -- --backup C:/backup/media-manager.sqlite --manifest C:/backup/media-manager.sqlite.manifest.json --output C:/rehearsal/media-manager-adopted.sqlite
bun run db:check -- --database C:/tmp/media-manager-new.sqlite
bun run db:orphans -- --database C:/tmp/media-manager-copy.sqlite
bun run db:schema:export -- --database C:/tmp/media-manager-copy.sqlite --output docs/database/representative-schema.sql
bun run db:schema:check
```

Una base no vacía sin historial es rechazada por el runner normal. `db:adopt-legacy` es una ruta separada y fail-closed:
exige un backup con manifest válido, crea un output nuevo fuera del workspace, rechaza objetos desconocidos, favoritos
sin perfil/duplicados y cualquier pérdida de conteos. Sólo reconstruye el DDL histórico conocido de `Favorite`, crea los
ocho índices aditivos y registra el baseline dentro de `BEGIN IMMEDIATE`. Nunca sobrescribe el backup ni el output.
