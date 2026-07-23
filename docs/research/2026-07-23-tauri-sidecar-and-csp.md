# Tauri: sidecar autónomo y CSP

Fecha: 2026-07-23

## Pregunta

¿Puede el paquete Tauri actual funcionar en una instalación de Windows sin Bun, servidor manual ni acceso al árbol del repositorio? ¿Qué mecanismo de Tauri 2 permite iniciar un backend autónomo con permisos mínimos?

## Respuesta

No. El paquete actual sólo incluye `server/index.js` y `server/wrapper.js` como recursos. El código Rust no inicia ninguno, no define `bundle.externalBin` y no entrega `MEDIA_MANAGER_DATABASE_PATH`; por ello el wrapper de producción fallaría incluso si hubiera un runtime Bun disponible. El cliente también resuelve muchas rutas `/api` contra el origen de la WebView, por lo que necesita un broker o una base de API explícita antes de poder usar un backend loopback.

La vía apta para Tauri 2 es compilar el backend como ejecutable autónomo, instalarlo como sidecar con el sufijo del target triple, declararlo en `bundle.externalBin` y arrancarlo desde Rust con `ShellExt::sidecar(...).spawn()`. La implementación debe conservar un handle para apagar sólo ese proceso propio y esperar su `/health` antes de mostrar una interfaz operativa.

## Hechos que fijan la decisión

- La guía oficial exige declarar el sidecar en `bundle.externalBin`; Tauri busca un binario con el sufijo `-$TARGET_TRIPLE` y `rustc --print host-tuple` da dicho valor. [Embedding External Binaries](https://v2.tauri.app/develop/sidecar/)
- El arranque en Rust usa `tauri_plugin_shell::ShellExt`, `app.shell().sidecar("nombre")` y `spawn()`. El nombre es el archivo, no la ruta configurada. [Embedding External Binaries](https://v2.tauri.app/develop/sidecar/)
- Las capacidades deben restringir el permiso al sidecar y a sus argumentos; para un proceso persistente el permiso es `shell:allow-spawn`. [Embedding External Binaries](https://v2.tauri.app/develop/sidecar/)
- Tauri recomienda un CSP explícito y lo más restringido posible; con CSP nulo no aplica su protección ni sus nonces/hashes de build. [Content Security Policy](https://v2.tauri.app/security/csp/)
- El Bun instalado en este checkout (`1.3.14`) expone `bun build --compile` para generar un ejecutable autónomo. El host local es `x86_64-pc-windows-msvc`.

## Incertidumbre y límites

- La prueba local de `bun build --compile` generó el ejecutable, pero su `/health` no arrancó: Sharp no puede cargar su addon nativo por resolución dinámica. Una referencia directa al addon lo incluyó, pero Windows no encontró las DLL de libvips que lo acompañan. Un ejecutable único queda descartado para esta versión del backend.
- Falta definir una única base de API/broker para los módulos que hoy llaman `fetch('/api/...')` de forma directa.
- Falta decidir el alcance de distribución, firma, instalador y el soporte multiarquitectura. Ninguno puede deducirse del código actual.

## Próxima decisión

Primero crear un contrato de empaquetado que entregue el runtime Bun y los recursos nativos de Sharp como un conjunto verificable, inicie sólo el proceso propio con una DB dentro del directorio de datos y falle de forma visible si no alcanza `/health`. Después probar el conjunto fuera del checkout y recién entonces evaluar MSI/NSIS, firma e instalación limpia.
