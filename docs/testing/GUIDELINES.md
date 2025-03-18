# Guías de Testing

## Estructura de Tests

```
src/
├── tests/
│   ├── unit/              # Tests unitarios
│   │   ├── lib/          # Tests de utilidades
│   │   └── services/     # Tests de servicios
│   ├── integration/       # Tests de integración
│   │   ├── api/          # Tests de API
│   │   └── services/     # Tests de servicios integrados
│   ├── e2e/              # Tests end-to-end
│   └── mocks/            # Mocks compartidos
└── __tests__/            # Tests junto al código (componentes)
```

## Tipos de Tests

### 1. Tests Unitarios

- Tests individuales de funciones y clases
- Sin dependencias externas
- Uso extensivo de mocks
- Enfoque en casos edge y manejo de errores

### 2. Tests de Integración

- Tests de múltiples componentes trabajando juntos
- Mocks mínimos, solo para externos (DB, API)
- Enfoque en flujos de datos y comunicación

### 3. Tests E2E

- Tests de flujos completos
- Mínimo uso de mocks
- Enfoque en experiencia de usuario

## Convenciones de Nombrado

- Archivos de test: `[nombre].test.ts`
- Archivos de test de componentes: `[Componente].test.tsx`
- Mocks: `[nombre].mock.ts`
- Fixtures: `[nombre].fixture.ts`

## Estructura de un Test

```typescript
describe('Módulo/Componente', () => {
	// Setup común
	beforeAll(() => {
		// Configuración inicial
	});

	beforeEach(() => {
		// Reset entre tests
	});

	describe('Funcionalidad específica', () => {
		it('debería hacer algo específico', () => {
			// Arrange
			// Act
			// Assert
		});
	});

	afterEach(() => {
		// Limpieza entre tests
	});

	afterAll(() => {
		// Limpieza final
	});
});
```

## Mejores Prácticas

### 1. Organización

- Un archivo de test por módulo/componente
- Agrupar tests relacionados con `describe`
- Nombres descriptivos para los tests
- Mantener los tests simples y enfocados

### 2. Mocks

- Usar mocks solo cuando sea necesario
- Documentar el comportamiento esperado del mock
- Resetear mocks entre tests
- Preferir mocks específicos sobre generales

### 3. Assertions

- Usar assertions específicas
- Verificar estados positivos y negativos
- Incluir mensajes descriptivos
- Evitar assertions múltiples cuando sea posible

### 4. Manejo de Errores

- Testear casos de error explícitamente
- Verificar mensajes de error específicos
- Asegurar que los errores son manejados correctamente
- Incluir tests para casos edge

## Ejemplos

### Test Unitario

```typescript
import { formatBytes } from '@/lib/utils';

describe('formatBytes', () => {
	it('debería formatear bytes correctamente', () => {
		expect(formatBytes(1024)).toBe('1 KB');
		expect(formatBytes(1024 * 1024)).toBe('1 MB');
	});

	it('debería manejar valores inválidos', () => {
		expect(formatBytes(-1)).toBe('0 B');
		expect(formatBytes(NaN)).toBe('0 B');
	});
});
```

### Test de Integración

```typescript
import { generateThumbnail } from '@/lib/thumbnail';
import { getImageMetadata } from '@/lib/metadata';

describe('Generación de Thumbnails', () => {
	it('debería generar thumbnail con metadata', async () => {
		const imagePath = 'test.jpg';
		const metadata = await getImageMetadata(imagePath);
		const thumbnail = await generateThumbnail(imagePath);

		expect(thumbnail.width).toBeLessThanOrEqual(metadata.dimensions?.width || 0);
		expect(thumbnail.format).toBe('webp');
	});
});
```

## Cobertura de Tests

### Objetivos de Cobertura

- Líneas: >80%
- Funciones: >90%
- Ramas: >75%
- Statements: >80%

### Prioridades

1. Core utilities (/lib)
2. Servicios críticos
3. API endpoints
4. Componentes de UI complejos
5. Helpers y utilidades secundarias

## Plan de Implementación

### Fase 1: Tests Unitarios

- [ ] Utilidades (/lib)
  - [ ] utils.ts
  - [ ] cache.ts
  - [ ] format.ts
  - [ ] hash.ts
- [ ] Servicios Core
  - [ ] image.ts
  - [ ] thumbnail.ts
  - [ ] metadata.ts

### Fase 2: Tests de Integración

- [ ] API Endpoints
  - [ ] folders
  - [ ] images
  - [ ] thumbnails
- [ ] Servicios Integrados
  - [ ] Queue
  - [ ] Watcher
  - [ ] Database

### Fase 3: Tests E2E

- [ ] Flujos principales
  - [ ] Indexación de carpetas
  - [ ] Generación de thumbnails
  - [ ] Visualización de imágenes
  - [ ] Búsqueda y filtrado

## Herramientas y Setup

### Jest

```typescript
// jest.config.js
module.exports = {
	testEnvironment: 'jsdom',
	setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/src/$1',
	},
	collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/tests/**/*'],
};
```

### Testing Library

```typescript
// Ejemplo de test de componente
import { render, screen } from "@testing-library/react";
import { ImageViewer } from "@/components";

describe("ImageViewer", () => {
	it("debería renderizar correctamente", () => {
		render(<ImageViewer src="test.jpg" />);
		expect(screen.getByRole("img")).toBeInTheDocument();
	});
});
```

## Recursos

- [Jest Docs](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Next.js Testing](https://nextjs.org/docs/testing)

## Notas Adicionales

1. **Mantenimiento**

   - Revisar y actualizar tests regularmente
   - Mantener los mocks actualizados
   - Refactorizar tests cuando sea necesario
   - Documentar cambios significativos

2. **Performance**

   - Agrupar tests relacionados
   - Minimizar setup/teardown
   - Usar mocks eficientemente
   - Considerar tests paralelos cuando sea posible

3. **CI/CD**
   - Ejecutar tests en cada PR
   - Verificar cobertura
   - Fallar build si los tests fallan
   - Generar reportes de cobertura
