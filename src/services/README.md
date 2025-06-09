# Capa de Servicios

Los servicios encapsulan la lógica de negocio y acceso a datos. Son consumidos
por las **Server Actions** y en ocasiones directamente por componentes del lado
servidor.

Cada directorio dentro de `src/services` corresponde a una entidad o módulo del
sistema (por ejemplo, `folder`, `image`, `group`). Estos servicios exponen
funciones como `getFolders`, `createImage` o `updateGroup`, dependiendo de la
entidad.

```mermaid
flowchart TD
    A[Server Actions] --> B[Services]
    B --> C[Prisma/DB]
```
