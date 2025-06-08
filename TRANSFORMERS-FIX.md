# TRANSFORMERS-FIX.md (actualización junio 2025)

## Checklist de cobertura y convenciones

- Todos los transformadores y tipos deben evitar dependencias de Prisma y tipos de servidor en código compartido o importable por el cliente.
- Los tests de transformadores deben usar mocks explícitos y evitar dependencias cruzadas.
- Los errores personalizados deben ser unificados y no aceptar argumentos extra en constructores.
- Documentar cualquier convención nueva tras cada iteración.

## Hallazgos recientes

- Se detectaron y corrigieron imports de Prisma y tipos de servidor en transformadores y tipos.
- Se unificaron los mocks de errores y se eliminaron argumentos extra en constructores.
- Se mejoró la cobertura de tests unitarios y de integración para transformadores.
- Se documentó el uso de waitFor y mocks globales en tests de transformadores.

## Convenciones de imports y tipado en transformadores

- Nunca importar ni usar `PrismaClient` ni tipos de Prisma en archivos que puedan ser importados por el cliente (tipos, transformadores, Zustand stores).
- Los tipos de dominio deben estar definidos en `@/types/entities/.../types.ts` y ser usados en transformadores y tests.
- Los transformadores deben centrarse solo en la transformación de datos, sin lógica de acceso a datos ni dependencias de servidor.
- Los errores personalizados deben ser importados desde un único origen (`@/transformers/errors`), y su constructor debe usarse correctamente (sin argumentos extra).
- Si se detecta una dependencia de Prisma en un archivo de cliente, debe eliminarse y reportarse en este archivo.

## Auditoría y recomendaciones de testing (junio 2025)

- Se detectó y corrigió la ausencia de `@testing-library/user-event` para tests de componentes.
- Se recomienda auditar y agregar tests unitarios para slices de entidades principales (folder, image, metadata, etc.), transformadores y hooks personalizados.
- Los tests de store deben mockear server actions y nunca importar Prisma ni servicios directamente.
- Los tests de transformadores deben usar solo tipos de dominio, nunca tipos de Prisma.
- Mantener actualizado este archivo tras cada iteración de refactor/testing.

---

## Hallazgos y convenciones de testing (junio 2025)

- Los asserts en tests de tarjetas deben coincidir exactamente con el markup real: clicks sobre `<button>` o `<article>`, asserts de favoritos por icono Lucide, asserts de enlaces solo si no hay onClick.
- Usar `waitFor` para asserts asíncronos y aceptar cualquier argumento en callbacks de mocks.
- Mantener mocks globales en `jest.setup.ts` para evitar errores de importación de código de servidor (prisma, p-queue, etc).
- Eliminar archivos de test duplicados o rotos para evitar confusión y errores de tipado.
- Validar la suite de tests completa tras cambios en markup o lógica de componentes.
- Documentar cualquier convención nueva o hallazgo relevante en este archivo y en el README.
