# Server Actions

Este directorio agrupa las funciones "use server" que actúan como puente entre los componentes/hook y la capa de `services`.
Cada carpeta corresponde a una entidad o módulo del sistema (albums, folders, tags, etc.).

```mermaid
flowchart TD
    A[Componentes/Hooks] --> B[Server Actions]
    B --> C[Servicios]
    C --> D[Prisma]
```

Cada subdirectorio contiene su propia documentación con detalles y ejemplos.
