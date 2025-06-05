# Guía de Transformadores

Los transformadores se encargan de convertir los datos entre el formato utilizado por la base de datos y el que se utiliza en la aplicación.

Cada carpeta bajo `src/transformers` contiene:

- `mappers.ts`: funciones que preparan datos para operaciones CRUD.
- `serializers.ts`: utilidades para extender, validar y normalizar entidades.
- `transformer.ts`: funciones de transformación principal.
- `index.ts`: punto de entrada que reexporta las utilidades anteriores.
- `README.md` o `documentation.md`: documentación específica de la entidad.

Para añadir un nuevo transformador se recomienda seguir la misma estructura y exponer las funciones a través de `index.ts`.
