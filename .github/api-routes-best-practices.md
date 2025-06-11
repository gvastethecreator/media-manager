# API Routes: Mejores Prácticas

- **Estructura organizada:** Carpetas y nombres descriptivos en `app/api/`.
- **Manejo de métodos HTTP:** Handlers para GET, POST, PUT, DELETE según corresponda.
- **Validación de input:** Siempre validar datos con Zod u otro validador.
- **Manejo de errores:** Respuestas HTTP y errores robustos.
- **Preferir Server Actions:** Usar Server Actions para mutaciones desde frontend.
- **Paginación:** Implementar en rutas que devuelvan listas.
- **Entrega de imágenes:** Rutas especializadas con headers y caché.
- **Streaming de archivos grandes:** Usar streaming para imágenes grandes.
- **Procesamiento de thumbnails:** Rutas dedicadas y optimizadas.
- **Event streams:** Implementar para monitoreo de progreso.
- **Rate limiting:** Limitar rutas intensivas.
- **Conditional requests:** Soporte para ETags y Last-Modified.
- **Compresión de respuestas:** Comprimir JSON/texto.
- **CORS:** Configuración adecuada según seguridad.
- **Security headers:** Añadir headers de seguridad en todas las respuestas.
