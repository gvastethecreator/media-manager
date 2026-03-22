# Backlog priorizado (acción)

**Fecha:** 2 de febrero de 2026

## P0 — Crítico

1. **Eliminar duplicidad de `/api/audio`**
   - Resultado: un único router canónico.
2. **Alinear contrato de `getByHash`/`getByPathAndFolder`**
   - Resultado: tipo y comportamiento coherentes.
3. **Eliminar datos aleatorios en transformer de imágenes**
   - Resultado: UI determinista.

## P1 — Alto

4. **Unificar adaptador de errores en rutas legacy**
   - Resultado: respuestas API consistentes.
5. **Reemplazar `require` en `images.effect.ts`**
   - Resultado: compatibilidad ESM/TS segura.
6. **Normalizar cálculos con guardas (width/height/size)**
   - Resultado: sin `NaN` en métricas.

## P2 — Medio

7. **Unificar layout virtualizado/no virtualizado en cards**
   - Resultado: tamaños consistentes.
8. **Eliminar estado no usado en `cards.tsx`**
   - Resultado: menos ruido en UI.
9. **Evaluar destino de `local-files`**
   - Resultado: deuda técnica resuelta.

## P3 — Bajo

10. **Retirar `@ts-nocheck` en rutas de debug**
    - Resultado: tipado mínimo garantizado.
11. **Documentar migración Effect por entidad**
    - Resultado: roadmap claro.
