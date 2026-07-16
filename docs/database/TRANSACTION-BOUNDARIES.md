# Fronteras transaccionales e idempotencia

SQLite y el filesystem no comparten una transacción. Este documento define dónde existe atomicidad real y dónde el
sistema usa staging, journal o reintento deliberado.

| Operación                           | Frontera                                                  | Contrato ante fallo                                                                                         |
| ----------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Favorite set/toggle                 | transacción SQLite                                        | proyección legacy y fila canónica cambian juntas; rollback completo                                         |
| Añadir relaciones a álbum/colección | un `INSERT` múltiple con FK + conflicto idempotente       | una FK inválida revierte el lote; duplicados ya existentes no cuentan                                       |
| Quitar relaciones de álbum          | un `DELETE ... RETURNING`                                 | el conteo informa filas realmente removidas                                                                 |
| Crear estructura de subcarpetas     | una transacción SQLite por fase                           | IDs y jerarquía parent-first se publican juntos; cualquier FK/insert revierte toda la fase                  |
| Enqueue reintentable                | unique `(queue,idempotencyKey)` + insert atómico          | mismo key/payload devuelve el job existente; key con payload distinto falla                                 |
| Move/rename de un asset             | journal write-ahead sincronizado + staging FS + commit DB | startup reconcilia evidencia segura; caso ambiguo queda en recuperación manual sin inventar estado          |
| Ingest de archivo                   | tres etapas idempotentes                                  | la entidad básica es el checkpoint; metadata/thumbnail pueden fallar y reintentarse sin duplicar la entidad |
| Backup/upgrade                      | snapshot verificado + staging + publicación a path nuevo  | fuente nunca se reemplaza; staging incompleto se elimina y el backup queda restaurable                      |
| Prune de backups                    | plan manifest-driven + confirmación                       | cada archivo se revalida antes de borrar y la decisión queda auditada                                       |

## Regla para nuevas operaciones

Una operación que escriba varias tablas debe usar una sentencia atómica o `db.transaction`. Si también modifica disco,
debe preparar y sincronizar un intent log antes del primer cambio irreversible, usar nombres temporales/no-clobber y
definir reconciliación de startup. Capturar excepciones y devolver “éxito parcial” no es una transacción.

Los trabajos reintentables necesitan una idempotency key derivada del comando lógico, no un UUID nuevo por intento. La
reutilización del key con payload distinto es corrupción de protocolo y debe fallar, no adoptar silenciosamente el job.

## Pruebas de fallo obligatorias

- FK inválida en mitad lógica de un lote de relaciones: cero enlaces nuevos.
- Parent inválido después de una subcarpeta válida: cero subcarpetas publicadas.
- Idempotency key repetida: una fila; payload diferente: conflicto.
- Migración rota/corte: origen y backup intactos, output final inexistente.
- Restauración sobre path existente, reset sin marker o prune sin confirmación: operación rechazada/dry-run.
