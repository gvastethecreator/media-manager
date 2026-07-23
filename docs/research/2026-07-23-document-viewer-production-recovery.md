# Recuperación del visor de documentos de texto

## Hallazgo

El smoke de producción entregaba correctamente `GET /api/documents/:id/content` con estado 200, pero el diálogo de
texto quedaba indefinidamente en `Loading...`. La captura de Chromium confirmó que el contenido no llegaba a ser
visible aunque el archivo estuviera autorizado y disponible.

La causa estaba en el editor Monaco usado sólo para lectura. Su cargador no terminaba en el artefacto de producción,
por lo que el visor no ofrecía recuperación ni una representación alternativa.

## Decisión

El visor usa ahora un elemento `pre` nativo para archivos de texto. Conserva descarga y copia, evita el cargador de
Monaco y muestra un error accionable con `Reintentar` cuando no puede obtener la fuente autorizada. La petición se
cancela al cerrar el diálogo para no actualizar un visor que ya no está abierto.

No se retiró la dependencia de `package.json` en este bloque: debe hacerse junto con una revisión separada de
consumidores y del lockfile.

## Evidencia

- `bun scripts/run-tests-isolated.ts --run --silent=true src/components/viewers/code-viewer.test.tsx`: 2 pruebas verdes.
- `bun run build`: verde; queda un warning ajeno de tiempo de `vite-plugin-svgr`.
- `bun scripts/run-production-smoke.ts tests/e2e-production/document-viewer.spec.ts`: 3 pruebas verdes en Chromium,
  con texto, PDF válido y PDF corrupto.
- Capturas desktop y compactas generadas por el smoke; la vista compacta no tuvo overflow horizontal.
