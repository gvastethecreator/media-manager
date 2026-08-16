# Recuperación del contrato de previews de carpeta

Estado: implementado y verificado de forma focal el 2026-07-23.

## Hallazgo

El navegador aceptaba URLs remotas, temporales y `file:` como preview. El filtro inicial por prefijo `/api/` también
permitía que una cadena cerrara `url()` dentro de `backgroundImage`. El generador SVG incorporaba thumbnails mediante
recursos anidados y escribía nombre y ruta de carpeta sin un escape central.

## Decisión aplicada

- Las vistas de carpeta admiten thumbnails locales de imagen o video con una ruta exacta y previews de carpeta con
  parámetros `max`, `layout` y `v` restringidos.
- Se conserva soporte para data URLs ráster y base64 histórico de thumbnails. Se rechazan SVG, `blob:`, `file:`, URLs
  remotas, fragmentos, query strings ajenas y caracteres que afectan a una declaración CSS.
- Antes de leer cualquier thumbnail, el endpoint vuelve a aplicar la autorización de raíz a cada activo. Los conteos y
  el tamaño que muestra el SVG se calculan sólo con esos activos autorizados.
- La respuesta JSON de la lista de carpetas aplica la misma autorización antes de publicar sus previews recientes.
- El endpoint SVG recorre los descendientes autorizados una sola vez: en esa pasada forma sus estadísticas y conserva
  hasta cuatro imágenes o videos recientes. Evita duplicar trabajo por cada preview de carpeta.
- El SVG de fallback incorpora thumbnails existentes como data URLs ráster. Detecta el formato desde los bytes, rechaza
  SVG u otros datos no ráster, limita cada recurso a 512 KiB y el documento entero a 1 MiB de media. No genera
  peticiones anidadas al abrirse como imagen y conserva una CSP que sólo permite `data:` para ese contenido.
- El navegador muestra la media reciente con requests directos a los thumbnails autorizados. El SVG conserva una
  composición de media para consumidores que lo usan como preview común o tarjeta TCG.
- El escape XML reside en el generador SVG para evitar doble codificación desde la ruta HTTP.

## Compatibilidad pendiente

Filas históricas con `featuredImage` remoto, `blob:` o `file:` dejan de mostrarse como preview. El valor no se borra.
La migración requiere una ruta de upload autorizada y una decisión de producto para convertir esas referencias a un
asset local.

## Evidencia

- `bunx vp lint` pasó sobre los doce archivos de la slice.
- Cuatro pruebas focales ejecutaron once casos: allowlist, SVG con thumbnail inline, formato detectado desde bytes y
  componente React con intento de inyección CSS.
- `scripts/image-canonical-http.test.ts` pasó contra Express y DB temporal. Mueve un activo a una raíz no autorizada
  y verifica que el SVG responde sin media inline, con cero archivos y cero bytes.
- `bunx tsc --noEmit --pretty` y `bun run build` pasaron.
- El smoke de producción creó una carpeta y una imagen en un root temporal. Chromium cargó el thumbnail local en la
  tarjeta, y el endpoint SVG respondió 200 con thumbnail inline sin una ruta `/api/` anidada.

## Seguimiento

- Diseñar la migración de `featuredImage` histórico cuando exista una operación de upload que conserve autorización y
  provenance.
- Mantener las pruebas de esta slice en los runners por defecto tras resolver la modificación concurrente del runner
  de tooling.
- El E2E de desarrollo existente sigue bloqueado fuera de esta slice: `bun run test:e2e --
tests/e2e/folder-preview.spec.ts` deja colgada la ruta Vite `/api/folders`, aunque el backend directo responde a
  `/health`. El smoke de producción hermético sí pasó. Investigar el proxy y la sesión de `dev:full` sin mezclarlo con
  la recuperación de previews.
