# Guía de Transformadores

Los transformadores se encargan de convertir los datos entre el formato utilizado por la base de datos y el que utiliza la aplicación.

Cada carpeta bajo `src/transformers` incluye los siguientes archivos:

- `mappers.ts`: funciones que preparan datos para operaciones CRUD.
- `serializers.ts`: utilidades para extender, validar y normalizar entidades.
- `transformer.ts`: funciones de transformación principal.
- `index.ts`: punto de entrada que reexporta las utilidades anteriores.
- `README.md` o `documentation.md`: documentación específica de la entidad.

## Principios generales

- **Sin Prisma en el cliente**: ningún archivo exportado desde un transformer debe importar `PrismaClient` ni tipos de Prisma. Utiliza los tipos definidos en `src/types`.
- **Funciones puras**: los transformers no contienen lógica de acceso a datos; se limitan a mapear y validar estructuras.
- **Errores unificados**: usa los errores definidos en `src/transformers/errors` para mantener consistencia.
- **Testing**: los tests deben mockear cualquier dependencia externa. Consulta `src/tests/README.md` para los helpers disponibles.

## Añadir un nuevo transformer

1. Crea una carpeta `src/transformers/<entidad>`.
2. Define los tipos de dominio en `src/types/entities/<entidad>`.
3. Implementa `serializers.ts`, `mappers.ts` y `transformer.ts` siguiendo el patrón actual.
4. Expón solo las funciones necesarias desde `index.ts` y evita reexportar tipos destinados al servidor.
5. Documenta el módulo en `documentation.md` e incluye diagramas mermaid si son útiles.

### Ejemplo básico

```typescript
// src/transformers/example/transformer.ts
import type { Example } from '@/types/entities/example/types';

export function transformExample(data: unknown): Example {
  // Validación y transformación del objeto
  return {
    ...data,
    createdAt: new Date(data.createdAt),
  } as Example;
}
```

## Buenas prácticas

- Mantén los archivos pequeños y enfocados en una única responsabilidad.
- Añade comentarios explicativos si se realizan transformaciones complejas.
- Incluye tests unitarios por cada función exportada.
- Si detectas dependencias de Prisma en un transformer, repórtalo en `TRANSFORMERS-FIX.md` y corrígelo.

Para más información sobre las convenciones de testing revisa `src/tests/README.md` y `TRANSFORMERS-FIX.md`.
