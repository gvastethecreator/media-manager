# 🤖 AGENTS.md - Configuración de Jest y Testing

## 📖 Resumen de la Tarea

### 🎯 Objetivo Principal
Configurar un sistema de testing robusto y escalable para el **Image Manager** usando Jest como framework principal, compatible con el stack moderno (Next.js 15, React 19, TypeScript 5.8).

### 🔍 Problema Inicial
El proyecto tenía configuración de Jest parcial con errores críticos:
- ❌ **Resolver faltante**: `src/tests/resolver.js` no existía
- ⚠️ **Incompatibilidades**: Configuración obsoleta para React 19 y Next.js 15
- 📁 **Estructura incompleta**: Faltaba organización de tests y utilidades

## 🏗️ Arquitectura de Testing Implementada

```mermaid
graph TB
    subgraph "🔧 Core Config"
        A[jest.config.ts] --> B[jest.setup.ts]
        A --> C[tsconfig.test.json]
        A --> D[resolver.js]
    end

    subgraph "🧪 Test Structure"
        E[src/tests/] --> F[helpers/]
        E --> G[fixtures/]
        E --> H[__mocks__/]
        E --> I[setup/]
    end

    subgraph "📦 Utilities"
        F --> J[test-utils.tsx]
        G --> K[entities.ts]
        H --> L[@prisma/client.ts]
        H --> M[next/navigation.ts]
    end

    subgraph "🎯 Test Types"
        N[Unit Tests] --> O[Components]
        N --> P[Hooks]
        N --> Q[Utils/Stores]

        R[Integration Tests] --> S[API Routes]
        R --> T[Database]
        R --> U[File System]

        V[E2E Tests] --> W[User Flows]
        V --> X[Feature Tests]
    end

    A --> E
    E --> N
    E --> R
    E --> V
```

## 🎨 Stack Tecnológico

### 📚 Framework y Herramientas
- **Jest**: 29.7.0 (Framework de testing principal)
- **@testing-library/react**: 16.3.0 (Testing de componentes React)
- **@testing-library/jest-dom**: 6.6.3 (Matchers adicionales)
- **ts-jest**: 29.3.4 (Soporte para TypeScript)
- **jest-environment-jsdom**: 30.0.0-beta.3 (Entorno DOM)

### 🏢 Proyecto Base
- **Next.js**: 15.3.3
- **React**: 19.1.0
- **TypeScript**: 5.8.3
- **Tailwind CSS**: 4.1.8
- **Prisma**: 6.9.0
- **Zustand**: 5.0.5 (Estado global)
- **TanStack Query**: 5.80.2 (Data fetching)

## 📁 Estructura de Archivos Creada

```
src/tests/
├── 📄 resolver.js                    # Resolver personalizado para Jest
├── 📄 image-mock.js                  # Mock para archivos de imagen
├── 📄 README.md                      # Documentación completa
│
├── 📁 helpers/
│   └── 📄 test-utils.tsx            # Utilidades para rendering y providers
│
├── 📁 fixtures/
│   └── 📄 entities.ts               # Datos de prueba para entidades
│
├── 📁 __mocks__/
│   ├── 📁 @prisma/
│   │   └── 📄 client.ts             # Mock del cliente Prisma
│   └── 📁 next/
│       └── 📄 navigation.ts         # Mock de Next.js navigation
│
└── 📁 setup/
    └── 📄 react-testing.test.tsx    # Test básico de configuración
```

## 🔧 Configuraciones Implementadas

### 1. **jest.config.ts** - Configuración Principal
```typescript
// Configuración optimizada para:
- Next.js 15 con App Router
- React 19 compatibility
- TypeScript 5.8
- Module resolution personalizado
- Coverage thresholds (80%)
- Transform patterns para ESM
```

### 2. **resolver.js** - Resolución de Módulos
```javascript
// Maneja casos especiales:
- Next.js modules con paths específicos
- React 19 compatibility
- CSS/SCSS como identity-obj-proxy
- Archivos de imagen como mocks
- ESM modules resolution
```

### 3. **test-utils.tsx** - Utilidades Principales
```typescript
// Funcionalidades incluidas:
- Custom render con providers
- React Query test client
- Next.js router mocks
- Mock data generators
- Test helpers exportados
```

## 🎯 Fases de Implementación

### ✅ Fase 1: Configuración Base (COMPLETADA)
- [x] **Resolver Jest**: Creado resolver personalizado compatible
- [x] **Estructura**: Organización de directorios `/tests/`
- [x] **Mocks básicos**: Prisma, Next.js navigation, archivos
- [x] **Utilidades**: Helpers para testing, fixtures de datos
- [x] **Test inicial**: Verificación de funcionamiento básico

### 🔄 Fase 2: Tests Unitarios (SIGUIENTE)
- [ ] **Hooks personalizados**: Testing de custom hooks
- [ ] **Stores Zustand**: Testing de estado global
- [ ] **Transformers/Utils**: Testing de funciones puras
- [ ] **Components base**: Testing de componentes Shadcn/UI

### 📋 Fase 3: Tests de Componentes (FUTURO)
- [ ] **Features principales**: Folder scanner, image viewer
- [ ] **Formularios**: React Hook Form + validaciones
- [ ] **Layouts**: Navigation, panels, responsive
- [ ] **Interactions**: Drag & drop, keyboard shortcuts

### 🔗 Fase 4: Tests de Integración (FUTURO)
- [ ] **API Routes**: Testing de endpoints Next.js
- [ ] **Database**: Testing de operaciones Prisma
- [ ] **File System**: Testing de folder scanner
- [ ] **Cache**: Testing de strategies de cache

## 📊 Métricas y Objetivos

### 🎯 Coverage Targets
```typescript
coverageThreshold: {
  global: {
    branches: 80,     // 80% cobertura de ramas
    functions: 80,    // 80% cobertura de funciones
    lines: 80,        // 80% cobertura de líneas
    statements: 80,   // 80% cobertura de statements
  }
}
```

### ⚡ Performance Goals
- **Test Speed**: < 100ms por test unitario
- **Suite Time**: < 30s para suite completa
- **Watch Mode**: < 5s para re-run incremental
- **Memory**: < 512MB para suite completa

## 🛠️ Scripts Disponibles

```bash
# Testing commands
pnpm test              # Ejecutar todos los tests
pnpm test:watch        # Modo watch para desarrollo
pnpm test:coverage     # Generar reporte de cobertura

# Development workflow
pnpm dev               # Desarrollo con watch
pnpm build             # Build para producción
pnpm lint              # Linting con Biome
pnpm format            # Formateo de código
```

## 🎮 Comandos de Testing

### 🚀 Comandos Básicos
```bash
# Ejecutar tests específicos
npx jest src/tests/setup/
npx jest --testNamePattern="React Component"
npx jest --watch src/components/

# Debug y análisis
npx jest --verbose
npx jest --detectOpenHandles
npx jest --coverage --coverageReporters=html
```

### 🔍 Debugging
```bash
# Con debugger
node --inspect-brk node_modules/.bin/jest --runInBand
node --inspect-brk node_modules/.bin/jest --runInBand --no-cache

# Logs detallados
DEBUG=* npm test
```

## 📈 Roadmap de Testing

### 🌟 Corto Plazo (1-2 semanas)
1. **Completar utilities**: Más helpers específicos del dominio
2. **Component testing**: Setup para Shadcn/UI components
3. **Hook testing**: Custom hooks del proyecto
4. **Store testing**: Zustand stores con mock data

### 🚀 Mediano Plazo (3-4 semanas)
1. **Integration tests**: API routes + database
2. **Visual regression**: Screenshot testing
3. **Performance tests**: Image loading, virtual scrolling
4. **E2E basics**: Critical user flows

### 🏆 Largo Plazo (1-2 meses)
1. **Full E2E suite**: Comprehensive user journeys
2. **CI/CD integration**: GitHub Actions workflows
3. **Test analytics**: Metrics dashboard
4. **Advanced mocking**: API mocking strategies

## 🔗 Referencias y Documentación

### 📚 Enlaces Útiles
- [Jest Configuration](https://jestjs.io/docs/configuration)
- [Testing Library React](https://testing-library.com/docs/react-testing-library/intro/)
- [Next.js Testing](https://nextjs.org/docs/app/building-your-application/testing/jest)
- [Prisma Testing](https://www.prisma.io/docs/guides/testing/unit-testing)

### 🎯 Patterns y Best Practices
- **AAA Pattern**: Arrange, Act, Assert
- **Given-When-Then**: Para tests de comportamiento
- **Test Doubles**: Preferir fakes sobre mocks cuando sea posible
- **Isolation**: Cada test debe ser independiente

## 📝 Notas para Agentes Futuros

### ⚠️ Consideraciones Importantes
1. **React 19**: Verificar compatibilidad al actualizar dependencies
2. **Next.js 15**: App Router patterns en tests
3. **Prisma**: Usar mocks para DB operations en unit tests
4. **TypeScript**: Mantener types estrictos en test files

### 🎨 Convenciones Establecidas
- **Naming**: `*.test.ts` o `*.test.tsx` para test files
- **Location**: Tests junto al código o en `__tests__/`
- **Emojis**: Usar emojis en describe/test para claridad visual
- **Comments**: Comentarios en español con emojis descriptivos

### 🔄 Mantenimiento
- **Monthly**: Revisar y actualizar dependencies
- **Quarterly**: Analizar métricas de coverage y performance
- **As needed**: Actualizar mocks cuando cambie el API

---

**Estado Actual**: ✅ Configuración base completada, listo para Fase 2
**Próximo Paso**: Implementar tests para hooks personalizados
**Responsable**: GitHub Copilot Agent
**Última Actualización**: 5 de junio de 2025
