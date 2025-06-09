# Providers

Componentes que envuelven a la aplicación y proveen contextos compartidos:

- **AppProvider**: Composición principal con otros providers.
- **CacheProvider**: Configura React Query y caches del cliente.
- **ThemeProvider**: Manejo de temas claro/oscuro.
- **ProfileProvider**: Contexto de perfil de usuario.

Estos providers se importan en `app/layout.tsx` para inicializar la aplicación.
