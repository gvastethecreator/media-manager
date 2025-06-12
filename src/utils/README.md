# Utils (`src/utils`)

Funciones auxiliares y helpers ligeros. Incluye manejo de rutas, transformaciones
básicas de datos y pequeñas utilidades independientes del resto de la
aplicación. Sirven como complemento de `src/lib`.

Las utilidades de este directorio no dependen de React ni de código de servidor.
Se pueden importar libremente desde componentes cliente o servidor.

## Ejemplo

```ts
import { cn } from '@/utils';
const classes = cn('p-2', condition && 'text-red-500');
```

Cuando una utilidad empieza a manejar lógica de negocio o requiere acceder a la
base de datos, se debe mover a `src/lib` y documentarse en `docs/utils-lib.md`.
