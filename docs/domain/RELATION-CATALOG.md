# Catálogo canónico de relaciones

Este inventario cubre las relaciones estructurales tipadas existentes. La capa semántica híbrida que convive con ellas
está especificada en `docs/domain/SEMANTIC-RELATIONS.md`; no debe confundirse con las tablas operativas polimórficas.

`src/lib/drizzle/schema/relations/catalog.ts` es la autoridad de alcance para las relaciones authored. El contrato es
híbrido de forma deliberada:

- las 28 relaciones consultadas y críticas viven en junctions tipados A/B;
- cada junction exige ambos extremos por FK, elimina enlaces por cascade, impide pares duplicados y mantiene índice B
  para queries inversas;
- el inventario de huérfanos consume el mismo catálogo, por lo que una relación nueva no puede quedar fuera del
  diagnóstico por mantener listas paralelas;
- la polimorfía queda limitada a seis tablas operativas explícitas: Activity, EntityAggregates, Favorite, Metadata,
  TaxonomyArtifact y Thumbnail. Cada una declara si se preserva, se reconstruye o es autoridad canónica.

## Reglas de evolución

1. Una relación authored nueva debe entrar como junction tipado y añadirse al catálogo en el mismo cambio.
2. Una tabla polimórfica nueva requiere rationale y política de cleanup/rebuild explícitos; no se acepta como atajo para
   evitar una FK.
3. Una migración debe reconciliar huérfanos antes de activar FKs y terminar con `foreign_key_check` vacío.
4. Los deletes de entidades no eliminan relaciones manualmente cuando la FK cascade ya posee esa responsabilidad.
5. El test `scripts/db/relation-catalog.test.ts` verifica catálogo, schema vivo, cascades, unicidad e índices inversos.
