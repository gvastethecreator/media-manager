# Guías de Consultas Agregadas Drizzle

## Principios
1. Preferir *una* consulta agregada sobre múltiples count/sum.
2. Parametrizar listas (IN) mediante helpers (`buildInList` o `sql.join`).
3. Encapsular medición de latencia (`instrumentedAll`).
4. Extraer fragmentos COUNT/SUM repetidos a funciones.
5. Mantener cada bloque SQL con comentario // region indicando propósito.

## Patrón Base
```ts
import { sql } from 'drizzle-orm';
import { instrumentedAll } from '@/lib/drizzle/instrumentation';

export async function getAlbumBatch(ids: string[]) {
  if (!ids.length) return {};
  const inList = sql.join(ids.map(id => sql`${id}`), sql`, `);
  const rows = await instrumentedAll('stats.batch.albums', sql`
    SELECT a.id, COUNT(DISTINCT i.id) imageCount
    FROM Album a
    LEFT JOIN _AlbumToImage ai ON a.id = ai.A
    LEFT JOIN Image i ON ai.B = i.id
    WHERE a.id IN (${inList})
    GROUP BY a.id
  `);
  return rows;
}
```

## Anti‑Patrones
- Concatenar strings manualmente para IN sin escapar.
- Ejecutar >3 queries de conteo consecutivas por la misma entidad.
- Silenciar latencias >100ms sin logging.

## Métricas
- p50/p95 de cada etiqueta (`label`) en logs `DB:Perf`.
- Revisar semanalmente queries >200ms y optimizar (índices / reducción joins).

## Futuras Mejoras
- Macro helper `buildCounts(entity, relations)` para generar SELECT dinámico.
- Cache caliente en memoria para global stats (TTL 5s) si se vuelve hot path.
