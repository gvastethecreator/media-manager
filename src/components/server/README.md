# Componentes de Servidor

Componentes que solo deben ejecutarse en el servidor para inicializar datos o realizar operaciones específicas.

- **server-initializer.tsx**: Prepara configuraciones globales antes de renderizar la aplicación.

Se importan únicamente en componentes de servidor (`app/` o layouts) para evitar código innecesario en el cliente.
