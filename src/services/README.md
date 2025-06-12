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

## Organización y convenciones

- Cada servicio agrupa las operaciones CRUD y utilidades relacionadas con su entidad.
- Las funciones exportadas están pensadas para ser consumidas desde las Server Actions.
- Los servicios no deben importar código que dependa del cliente.

### Estructura típica

```text
src/services/<entidad>/
├── <entidad>.service.ts   # Implementación principal
├── index.ts               # Exportaciones públicas
└── README.md              # Documentación del módulo
```

### Ejemplo de uso

```typescript
import { imageService } from '@/services';

// Subir una imagen y notificar progreso
const img = await imageService.createImage({
  file,
  folderId: 'folder-1',
});
```

## Buenas prácticas

- Documenta cada función exportada con comentarios JSDoc.
- Usa helpers de `src/lib` para operaciones comunes (cache, logger, eventos).
- Mantén las firmas de las funciones estables para facilitar el versionado.
