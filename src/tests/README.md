# 🧪 Documentación de Testing - Image Manager

## 📋 Estructura de Testing

```mermaid
graph TD
    A[Jest Config] --> B[Test Utils]
    A --> C[Fixtures]
    A --> D[Mocks]

    B --> E[Component Tests]
    B --> F[Hook Tests]
    B --> G[Store Tests]

    C --> H[Entity Data]
    C --> I[Mock Generators]

    D --> J[Prisma Mock]
    D --> K[Next.js Mocks]
    D --> L[External APIs]

    E --> M[Unit Tests]
    F --> M
    G --> M

    M --> N[Integration Tests]
    N --> O[E2E Tests]
```

## 🏗️ Arquitectura de Testing

### 📁 Estructura de Directorios

```
src/tests/
├── setup/                    # Tests de configuración
│   ├── jest-config.test.ts   # Verificación de Jest
│   └── react-testing.test.tsx # Verificación de React
├── helpers/                  # Utilidades de testing
│   └── test-utils.tsx        # Helpers comunes
├── fixtures/                 # Datos de prueba
│   └── entities.ts           # Mock data para entidades
├── __mocks__/               # Mocks globales
│   ├── @prisma/             # Mock de Prisma
│   └── next/                # Mocks de Next.js
├── resolver.js              # Resolver personalizado
└── image-mock.js            # Mock para imágenes
```

## 🔧 Configuración Principal

### Jest Config (`jest.config.ts`)

- **Environment**: jsdom para tests de React
- **Transform**: ts-jest para TypeScript
- **Resolver**: Personalizado para Next.js 15 + React 19
- **Module Mapping**: Alias y mocks configurados
- **Coverage**: 80% threshold mínimo

### Setup Files

- **jest.setup.ts**: Configuración global de Jest
- **test-utils.tsx**: Helpers para rendering y providers

## 🎯 Tipos de Tests

### 1. Tests Unitarios

- **Componentes**: Renderizado y interacciones
- **Hooks**: Lógica de estado y efectos
- **Utils**: Funciones puras y transformers
- **Stores**: Estado de Zustand

### 2. Tests de Integración

- **API Routes**: Endpoints de Next.js
- **Database**: Operaciones de Prisma
- **Scanner**: Lógica de escaneo de folders

### 3. Tests de UI

- **User Interactions**: Clicks, forms, navigation
- **Visual Regression**: Snapshots de componentes
- **Accessibility**: A11y compliance

## 📦 Utilidades Disponibles

### `renderWithProviders()`

```typescript
import { renderWithProviders } from '@/tests/helpers/test-utils';

test('should render with providers', () => {
  const { queryClient } = renderWithProviders(<MyComponent />);
  // Test con React Query disponible
});
```

### Mock Data Generators

```typescript
import { createMockFolder, createMockImage } from '@/tests/fixtures/entities';

const folder = createMockFolder({ name: 'Custom Folder' });
const image = createMockImage({ folderId: folder.id });
```

### Navigation Mocks

```typescript
import { navigationMocks } from '@/tests/__mocks__/next/navigation';

test('should navigate correctly', () => {
  // Test navigation
  expect(navigationMocks.push).toHaveBeenCalledWith('/new-path');
});
```

## 🎭 Estrategias de Mocking

### 🔄 Nivel de Mock

1. **Minimal Mocking**: Solo lo necesario
2. **Behavior Mocking**: Mock del comportamiento, no implementación
3. **Data Mocking**: Fixtures consistentes y realistas

### 📊 Prisma Mocking

```typescript
import { mockPrismaClient } from '@/tests/__mocks__/@prisma/client';

test('should query database', async () => {
  mockPrismaClient.folder.findMany.mockResolvedValue(mockFolders);
  // Test database interaction
});
```

## 🚀 Comandos de Testing

```bash
# Ejecutar todos los tests
pnpm test

# Modo watch
pnpm test:watch

# Coverage report
pnpm test:coverage

# Tests específicos
pnpm test folder.test.ts
```

## 📈 Métricas y Coverage

### Umbrales de Coverage

- **Statements**: 80%
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%

### Archivos Excluidos

- `*.d.ts` - Archivos de declaración
- `*.stories.*` - Storybook stories
- `tests/**/*` - Archivos de testing

## 🎨 Patrones de Testing

### AAA Pattern

```typescript
test('should do something', () => {
  // 🎯 Arrange
  const input = 'test';

  // ⚡ Act
  const result = myFunction(input);

  // ✅ Assert
  expect(result).toBe('expected');
});
```

### Given-When-Then

```typescript
test('given user input, when submitting form, then should save data', () => {
  // Given
  const formData = { name: 'Test' };

  // When
  fireEvent.submit(form, formData);

  // Then
  expect(mockSave).toHaveBeenCalledWith(formData);
});
```

## 🔗 Integración con Stack

### Next.js 15

- App Router testing
- Server Components mocking
- Navigation hooks testing

### React 19

- Concurrent features testing
- Suspense boundary testing
- Server Components compatibility

### Prisma

- Database operations mocking
- Transaction testing
- Type-safe mocking

### Zustand

- Store state testing
- Action testing
- Persistence testing

---

# Guía de testing actualizada (junio 2025)

## Convenciones clave

- Usar `waitFor` de Testing Library para asserts de elementos que dependen de efectos asíncronos (imágenes, enlaces, badges, stats).
- En hooks que usan React Query, envolver con `QueryClientProvider` usando un cliente de prueba.
- Los mocks de funciones asíncronas deben estar en el scope correcto y ser consistentes con los imports reales.
- Los mocks globales de Prisma y p-queue están definidos en `jest.setup.ts`.
- Los tests de tarjetas deben usar mocks completos y tipados según los tipos de props reales.
- Usar selectores robustos (`findByRole`, `waitFor`, `queryByTestId`) para evitar falsos negativos.

## Ejemplo de test robusto para tarjetas

```tsx
import { waitFor } from '@testing-library/react';
render(<TagCard tag={mockTag} />);
await waitFor(() => expect(screen.getByText('42')).toBeInTheDocument());
```

## Cambios recientes

- Se migraron todos los asserts asíncronos a `waitFor`.
- Se corrigieron los mocks de server actions y hooks.
- Se ajustó la configuración de Jest y TypeScript para evitar advertencias y errores de entorno.
- Se documentó el uso de QueryClientProvider en hooks.

## ✅ Checklist de cobertura mínima

- [x] Componentes de tarjetas (album, folder, image, tag, world-item)
- [ ] Slices de Zustand de entidades principales (folder, image, metadata, ...)
- [ ] Transformadores y utilidades de transformación
- [ ] Hooks personalizados
- [ ] Componentes core y features críticos
- [x] Utils y servicios
- [x] Prisma/schema

## 📚 Convenciones de imports y tipado en tests

- No importar tipos ni funciones de Prisma en tests de cliente.
- Usar mocks para dependencias de servidor (Prisma, Next.js, server actions).
- Los tests de transformadores deben importar solo tipos de dominio definidos en `@/types/entities/...`.
- Los tests de Zustand deben mockear server actions y nunca acceder a lógica de base de datos directamente.
- Los tests de hooks deben usar helpers de renderizado y providers.
- Mantener tipado estricto y evitar `any`.
- Documentar cualquier excepción o workaround en el propio test.

## Checklist de cobertura y auditoría de tests (junio 2025)

- [x] Utils y servicios core (`src/lib`, `src/utils/folder`)
- [x] Prisma schema (`prisma/__tests__/schema.test.ts`)
- [x] Store de profile (acciones, tipos, estado)
- [ ] Slices de otras entidades (folder, image, metadata, etc.)
- [ ] Transformadores de entidades (tests unitarios de transformación)
- [ ] Hooks personalizados (`src/hooks`)
- [x] Componentes de tarjetas (album, folder, image, tag, world-item)
- [ ] Componentes core y features críticos

## Convenciones de imports y tipado en tests

- Usar siempre mocks para dependencias de servidor (`@prisma/client`, server actions, rutas API) en tests de cliente.
- Los tests de componentes deben importar helpers desde `@/tests/helpers/test-utils` y usar `renderWithProviders` cuando sea necesario contexto.
- Los tests de store deben mockear server actions y nunca importar Prisma ni servicios directamente.
- Los tests de transformadores deben usar solo tipos de dominio, nunca tipos de Prisma.
- Si un test requiere datos de ejemplo, usar los generadores de mocks de `@/tests/fixtures/entities`.

## Hallazgos y recomendaciones

- Se detectó y corrigió la ausencia de `@testing-library/user-event`.
- Se recomienda auditar y agregar tests para slices de entidades principales, transformadores y hooks.
- Mantener actualizado este checklist tras cada iteración de refactor/testing.

**Última actualización**: ${new Date().toLocaleDateString('es-ES')}
**Versión**: 1.0.0
