# Plan Técnico FTS5
Estado: Draft inicial (2025-08-13)

## Objetivo
Reemplazar búsquedas LIKE / OR legacy por índice Full-Text Search (FTS5) sobre entidad `files` (y extensible a `images` si divergen) para mejorar relevancia y latencia (<30ms p95 en 10k rows locales).

## 1. Tabla Virtual
```sql
CREATE VIRTUAL TABLE files_fts USING fts5(
  name UNINDEXED, -- opcional si no se requiere ranking por name
  content,        -- texto combinado (name + path + tags)
  tags,           -- campo separado para filtros exactos futuros
  tokenize = 'unicode61 remove_diacritics 2'
);
```

## 2. Estrategia de Poblado Inicial
```sql
INSERT INTO files_fts(rowid, name, content, tags)
SELECT id, name, (name || ' ' || path || ' ' || coalesce(tags,'')), coalesce(tags,'')
FROM File;
```

## 3. Sincronización (Triggers)
```sql
CREATE TRIGGER files_ai AFTER INSERT ON File BEGIN
  INSERT INTO files_fts(rowid,name,content,tags)
  VALUES (new.id, new.name, (new.name||' '||new.path||' '||coalesce(new.tags,'')), coalesce(new.tags,''));
END;
CREATE TRIGGER files_ad AFTER DELETE ON File BEGIN
  DELETE FROM files_fts WHERE rowid = old.id;
END;
CREATE TRIGGER files_au AFTER UPDATE ON File BEGIN
  UPDATE files_fts SET
    name=new.name,
    content=(new.name||' '||new.path||' '||coalesce(new.tags,'')),
    tags=coalesce(new.tags,'')
  WHERE rowid=new.id;
END;
```

## 4. Query Endpoint (/search/fts)
- Params: `q`, `limit=50`, `offset=0`
- Seguridad: sanitize doble comillas -> remover `"`
- SQL (actual con score):
```sql
SELECT f.id, f.name, f.path, f.tags, bm25(files_fts) AS score
FROM files_fts ft
JOIN File f ON f.rowid = ft.rowid
WHERE ft MATCH ?
ORDER BY score
LIMIT ? OFFSET ?;
```

## 5. Ranking
Se utiliza `bm25(files_fts)` como `score` (menor = mayor relevancia). Expuesto en API para futuros ajustes UI.

## 6. Fallback
Si error (tabla no existe): fallback LIKE (actual) + log nivel warn `SearchFallbackLike`.

## 7. Métricas
- Instrumentar consulta FTS con label `search.fts` (wrapper).
- Contador fallback LIKE label `search.like`.

## 8. Backfill Script
`scripts/db/backfill-fts5.ts`:
1. Detectar existencia `files_fts`.
2. Crear si falta (idempotente).
3. Insert inicial por lotes (commit cada 1000).
4. Verificar recuento (rows File vs files_fts).

## 9. Riesgos
| Riesgo | Mitigación |
|--------|------------|
| Drift datos si triggers fallan | Test E2E comparando COUNT | 
| Consultas OOM en match amplio | Limitar `q.length` y `limit` |
| Tokenización incorrecta | Ajustar `tokenize` tras pruebas | 

## 10. Roadmap Extensión
- Añadir columna `metadata` (EXIF normalizado) si se indexa más adelante.
- Tabla FTS separada para notas / prompts.

---
> Próximo paso: implementar creación tabla y triggers en módulo migrations/ o constraints.
