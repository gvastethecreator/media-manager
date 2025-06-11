# Seguridad: Mejores Prácticas

- **Validación estricta de uploads:** Verifica MIME, extensión y contenido real.
- **Sanitización de metadatos EXIF:** Elimina datos sensibles (GPS, seriales).
- **Prevención de path traversal:** Usa `path.normalize` y valida rutas.
- **Almacenamiento seguro:** Nombres aleatorios, no predecibles.
- **Content Security Policy:** Implementa CSP para prevenir XSS.
- **Protección CSRF:** Usa tokens en mutaciones.
- **Autenticación:** Protege rutas de API y Server Actions.
- **CORS correcto:** Configura CORS según recursos.
- **Rate limiting:** Limita endpoints de upload/procesamiento.
- **Validación de tamaño:** Limita tamaño de uploads.
- **URLs firmadas:** Para acceso a imágenes privadas.
- **Sanitización SVG:** Sanitiza SVG para evitar XSS.
- **Escaneo de malware:** Implementa escaneo básico.
- **Aislamiento de procesamiento:** Usa entornos aislados si es posible.
- **Auditoría y logging:** Mantén logs detallados de uploads/accesos.

```mermaid
graph TD
    A[Seguridad] --> B[Upload]
    A --> C[Almacenamiento]
    A --> D[Acceso]
    A --> E[Procesamiento]
    B --> B1[Validación Tipo]
    B --> B2[Tamaño Máximo]
    B --> B3[Sanitización]
    C --> C1[Nombres Aleatorios]
    C --> C2[Permisos Filesystem]
    C --> C3[Cifrado]
    D --> D1[Autenticación]
    D --> D2[URLs Firmadas]
    D --> D3[Rate Limiting]
    E --> E1[Entorno Aislado]
    E --> E2[Recursos Limitados]
    E --> E3[Timeouts]
    style A fill:#d4f1f9
    style B fill:#ffecb3
    style C fill:#e1bee7
    style D fill:#c8e6c9
    style E fill:#bbdefb
```
