# Revisión técnica — Hallazgos detallados

**Fecha:** 2 de febrero de 2026

## 1) Backend y routing

### 1.1 Doble registro de `/api/audio`

- **Dónde:** `src/server/index.ts`
- **Impacto:** rutas ambiguas, handlers inesperados, fallos difíciles de reproducir.
- **Recomendación:** separar a `/api/audio` y `/api/audio-waveforms` o unificar routers.

### 1.2 Routers stubs o deshabilitados

- **Dónde:** `src/server/routes/local-files.ts`, `src/server/routes/local-files-simple.ts`
- **Impacto:** deuda técnica sin estrategia clara, endpoints en estado “temporal” permanente.
- **Recomendación:** definir decisión (reactivar o retirar). Documentar y mover a `docs/history` si se elimina.

### 1.3 Manejo de errores inconsistente

- **Dónde:** rutas legacy con `console.error`, rutas Effect con `runEffectForExpress`, uso de `require` en `images.effect.ts`.
- **Impacto:** respuestas heterogéneas y pérdida de trazabilidad.
- **Recomendación:** estandarizar adaptador de errores y logging en todas las rutas.

## 2) Servicios

### 2.1 Contrato inconsistentes en retornos

- **Dónde:** `src/services/image/image.service.effect.ts`
- **Impacto:** tipos incorrectos, errores lógicos en consumidores.
- **Ejemplo:** `getByHash` y `getByPathAndFolder` declaran `Image | null` en la interfaz, pero internamente fallan con `ImageNotFound`.
- **Recomendación:** elegir contrato único (retorna `null` o lanza error) y alinear implementación + tipos.

### 2.2 Dependencias legacy dentro de flujo Effect

- **Dónde:** `thumbnailService` con `any` y callback legacy
- **Impacto:** pérdida de type safety, errores silenciosos en runtime.
- **Recomendación:** crear wrapper tipado o migrar a Effect con errores explícitos.

## 3) Transformers

### 3.1 Métricas no deterministas

- **Dónde:** `src/transformers/image/transformer.ts`
- **Impacto:** resultados cambian en cada render, tests no confiables, UX inconsistente.
- **Recomendación:** reemplazar `Math.random()` por métricas reales o valores deterministas.

### 3.2 Mutación del input

- **Dónde:** `calculateImageStatistics` asigna `_count` sobre `drizzleImage`.
- **Impacto:** side-effects no esperados.
- **Recomendación:** construir un objeto local y mantener inmutabilidad.

### 3.3 Cálculos sin validación

- **Dónde:** `calculateQualityScore` usa `width/height` sin fallback.
- **Impacto:** `NaN` o excepciones en datos incompletos.
- **Recomendación:** aplicar guardas y valores por defecto.

## 4) UI — File Browser Cards

### 4.1 Inconsistencia de layout

- **Dónde:** `src/components/features/file-browser-new/views/cards.tsx`
- **Impacto:** tarjetas con tamaños distintos según modo virtualizado.
- **Recomendación:** usar una fórmula única para el tamaño.

### 4.2 Estado no usado

- **Dónde:** `internalScrollEl`
- **Impacto:** ruido y mantenimiento innecesario.
- **Recomendación:** eliminar si no se usa.

### 4.3 Scroll instantáneo no estándar

- **Dónde:** `scrollTo({ behavior: 'instant' })`
- **Impacto:** comportamiento inconsistente según navegador.
- **Recomendación:** usar `behavior: 'auto'`.

---

## Resumen de severidad

- **Alta:** routing duplicado, contratos inconsistentes, métricas no deterministas.
- **Media:** manejo de errores heterogéneo, dependencia legacy en Effect.
- **Baja:** inconsistencias de layout, variables no usadas.
