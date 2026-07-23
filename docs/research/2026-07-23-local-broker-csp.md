# CSP para el documento servido por el broker local

Fecha: 2026-07-23

## Pregunta

¿En qué proceso debe vivir el Content Security Policy de producción y qué permisos necesita el cliente local para no
romper la SPA ni sus visores?

## Respuesta

El CSP debe salir del broker local, porque es el proceso que sirve `dist/client/index.html` y todas las rutas SPA al
navegador. El backend Express sólo recibe API y uploads detrás del broker; un CSP ahí no protege el documento de la
aplicación.

La política permite únicamente el mismo origen para scripts y red. Conserva `data:` para las imágenes de UI y `blob:`
para imágenes, medios, iframes y workers creados por los visores. Los estilos inline siguen permitidos de forma acotada
porque el cliente usa atributos `style`; retirar ese permiso exige una migración separada a nonces o estilos externos.

## Evidencia local

- `scripts/start-production.ts` inicia `src/runtime/local-app-broker.ts` como origen público y el broker sirve
  `dist/client`.
- El cliente crea URLs `blob:` para previews y descargas, carga el worker PDF desde el bundle y muestra documentos en
  iframes same-origin.
- La respuesta HTML del broker es el punto que el navegador usa para aplicar CSP; los endpoints `/api` se reenvían al
  backend con el bearer fuera del navegador.

## Fuentes

- [Content Security Policy Level 3](https://www.w3.org/TR/CSP/), consultada el 2026-07-23: `default-src` actúa como
  fallback y `worker-src` controla workers.
- [MDN: `worker-src`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/worker-src),
  consultada el 2026-07-23: los workers pueden usar una directiva específica y no deben depender de un fallback casual.
- [MDN: `style-src`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/style-src),
  consultada el 2026-07-23: `unsafe-inline` permite atributos de estilo; nonces o hashes requieren generar y enlazar
  valores por respuesta.

## Decisión de implementación

1. Emitir un CSP explícito desde el broker para HTML y fallback SPA.
2. Bloquear objetos, framing externo y scripts inline; permitir `self`, `data:` y `blob:` sólo donde el runtime los usa.
3. Mantener CSP desactivado en Express: el backend sirve contenido autorizado dentro de iframes y una política global
   puede bloquear ese flujo. Los endpoints que devuelven SVG conservan su CSP específico.
4. Probar headers HTTP del broker y el arranque de la SPA construida con consola limpia.

## Incertidumbre pendiente

La política todavía permite estilos inline. El siguiente endurecimiento requiere inventariar los `style` props y
adoptar nonces o una alternativa de estilos que Vite pueda servir sin romper themes ni renderizadores.
