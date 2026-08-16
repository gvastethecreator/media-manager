# Límites de entrada para el runtime local

Fecha: 2026-07-23

## Pregunta

¿Cómo limitar cabeceras, cuerpos y tiempos de entrada en el backend Express y en el broker público ejecutados por Bun?

## Respuesta

El encabezado de respuesta `X-Max-Header-Size` no limita nada: el parser HTTP ya aceptó la solicitud cuando Express lo
emite. El backend debe crearse con opciones de `node:http`; el broker, que usa `Bun.serve`, necesita sus propios límites
de cuerpo e inactividad.

El límite general de JSON es 4 MiB. Cubre los artefactos de taxonomía que validan cuerpos de hasta 2 MiB, pero reduce el
techo anterior de 50 MiB. Los formularios URL-encoded se limitan a 64 KiB. Un guard previo rechaza también cuerpos
chunked de tipos no parseados, incluso si llegan con GET. Las cargas multimedia no viajan por estos parsers: el producto
registra archivos desde roots autorizados y los recursos se sirven por rutas protegidas.

## Fuentes

- [Bun: opciones de `node:http.Server`](https://bun.com/reference/node/http/Server/constructor), consultada el
  2026-07-23: `maxHeaderSize`, `headersTimeout` y `requestTimeout` se configuran al crear el servidor.
- [Bun: `maxHeaderSize`](https://bun.com/reference/node/http/ServerOptions/maxHeaderSize), consultada el 2026-07-23:
  la opción controla bytes de cabeceras de entrada recibidas por el servidor.
- [Bun: `Bun.serve`](https://bun.com/reference/bun/Serve), consultada el 2026-07-23: `maxRequestBodySize` limita el
  cuerpo de entrada e `idleTimeout` controla conexiones inactivas.

## Decisión de implementación

1. Crear Express mediante `node:http.createServer` con 32 KiB de cabeceras, 15 s para cabeceras y 60 s para la
   solicitud completa.
2. Configurar el broker con 4 MiB más 64 KiB de margen de transporte y 60 s de inactividad; SSE conserva su timeout
   por solicitud en cero.
3. Convertir `entity.too.large` a 413 con código público, mensaje seguro y request ID; mantener detalles internos sólo
   en logs.
4. Probar cuerpos declarados y chunked que superan el máximo, una solicitud de cabeceras sobredimensionadas y el límite
   del broker.

## Resultado específico de Bun

En este runtime, una cabecera que supera 32 KiB recibe 431 antes de llegar a Express. La prueba usa una conexión HTTP
real y comprueba que la ruta no se ejecuta. El margen de 64 KiB permite que el broker inspeccione `Content-Length` y
devuelva 413 antes de reenviar un cuerpo declarado mayor de 4 MiB; cuerpos streaming sin ese header siguen acotados por
Bun. El backend también drena y limita tipos no parseados antes de llegar a sus rutas. El middleware público entrega el
mismo status si un parser detecta un exceso.
