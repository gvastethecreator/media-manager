# Server components

These components run only on the server to initialize data or perform server-specific operations.

The directory includes the following file:

- **server-initializer.tsx**: Prepares global configuration before the application renders.

Import them only during server initialization so the client does not receive this code.
