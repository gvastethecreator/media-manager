# Tauri: ventana sobre broker local

Fecha: 2026-07-23

## Pregunta

¿Puede el cliente de escritorio conservar las rutas relativas `/api` sin exponer el token de sesión al frontend ni reescribir cada llamada HTTP?

## Respuesta

Sí, si Tauri abre su ventana contra el broker loopback ya existente (`http://127.0.0.1:<puerto>`), en vez de cargar directamente los assets desde `tauri.localhost`. Tauri 2 admite una `WebviewUrl::External` HTTP para una ventana. El broker conserva el origen único para el cliente, añade el bearer sólo al reenviar hacia el backend y ya controla health, assets y aborts.

No se debe aplicar todavía como cambio de paquete: falta un runtime Bun distribuible junto con los binarios nativos de Sharp. Un ejecutable único del backend no sirve en este checkout porque no carga las DLL de libvips. Añadir `tauri-plugin-localhost` tampoco resuelve el ciclo de vida del backend ni sustituye el broker con sesión autenticada.

## Fuentes

- [Tauri Localhost plugin](https://v2.tauri.app/plugin/localhost/), consultada el 2026-07-23: muestra la creación de una ventana con `WebviewUrl::External` hacia `http://localhost:<port>`.
- [Tauri Configuration](https://v2.tauri.app/reference/config/), consultada el 2026-07-23: permite URLs externas HTTP o HTTPS en una ventana Tauri.
- [Embedding External Binaries](https://v2.tauri.app/develop/sidecar/), consultada el 2026-07-23: `bundle.externalBin` empaqueta sidecars con sufijo del target.
- [Tauri sidecar and CSP research](./2026-07-23-tauri-sidecar-and-csp.md): prueba local de este repo; Sharp impide por ahora usar un único ejecutable Bun.

## Decisión de implementación

1. Mantener el broker local como único origen del cliente y límite de sesión.
2. Preparar un paquete de runtime Bun más `dist/server`, `dist/client` y recursos nativos de Sharp, con hashes de inventario.
3. Cuando ese conjunto arranque fuera del checkout, iniciar sólo ese proceso desde Rust, esperar `/health` y crear la ventana con `WebviewUrl::External` al broker.
4. Mantener el contrato actual sin plugins shell/fs hasta que el launcher propio tenga un binario y un cierre verificables.

## Incertidumbre pendiente

Falta una prueba de paquete extraído que confirme la ruta exacta del runtime Bun, las DLL de Sharp y el cierre ordenado en Windows. Sin ella, el estado máximo es `repository-ready`, no candidato instalable.
