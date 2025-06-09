# Utils (`src/utils`)

Funciones auxiliares y helpers ligeros. Incluye manejo de rutas, transformaciones
básicas de datos y pequeñas utilidades independientes del resto de la
aplicación. Sirven como complemento de `src/lib`.

```ts
import { cn } from '@/utils';
const classes = cn('p-2', condition && 'text-red-500');
```
