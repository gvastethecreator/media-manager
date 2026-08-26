# Providers

These components wrap the application and provide shared contexts.

The tree includes the following providers:

- **AppProvider**: Root composition of the other providers.
- **CacheProvider**: Configures React Query and client caches.
- **ThemeProvider**: Manages light and dark themes.
- **ProfileProvider**: Provides the user profile context.

`AppProvider` initializes these providers at the application root.
