# 📄 Actualización de Copilot Instructions - Resumen Final

## ✅ Tareas Completadas

### 1. Integración Completa de Reglas

- **Consolidado** todas las reglas de `.cursor/rules/` en `copilot-instructions.md`
- **Actualizado** el stack tecnológico para 2025: Next.js 15.3.3, React 19, Tailwind 4, Shadcn/ui, motion/react, PNPM
- **Integrado** la migración Prisma → Drizzle en las instrucciones
- **Reforzado** la regla de documentación obligatoria

### 2. Estructura del Documento Mejorada

#### 🚀 Principios Fundamentales

- Prioridad de herramientas internas sobre terminal
- Documentación obligatoria inmediata
- Stack tecnológico actualizado 2025
- Prohibición explícita de importar tipos Prisma en cliente

#### 📋 Stack y Tecnologías Completo

- **Core**: Next.js 15.3.3 + React 19 + TypeScript
- **UI**: Tailwind 4 + Shadcn/ui + motion/react + Radix UI
- **Estado**: Zustand + React Query (TanStack Query)
- **Datos**: Prisma (→ Drizzle) + Zod
- **Herramientas**: PNPM + Jest + Bull + Lodash

#### 🏗️ Arquitectura y Estructura Detallada

- Organización de carpetas actualizada
- 24 entidades del sistema documentadas
- Patrón arquitectónico: `types/ → transformers/ → services/ → store/ → actions/`

#### 📝 Reglas por Tecnología Específicas

- **Next.js 15 & React 19**: Server Components, Server Actions, features modernas
- **TypeScript**: Modo estricto, prohibición tipos Prisma en cliente
- **Tailwind & Shadcn/ui**: Clases utilitarias, componentes reutilizables
- **Transformers**: Estructura crítica documentada (mappers, serializers, transformer)
- **Estado y Datos**: Patrones específicos Zustand + React Query
- **Seguridad**: Validación, sanitización, rate limiting
- **Performance**: Lazy loading, memoización, virtualización
- **Accesibilidad**: ARIA, navegación, contraste

#### 🔧 Flujo de Trabajo en 3 Fases

1. **Antes**: Buscar codebase, actualizar CURRENT-TASK.md, listar reglas
2. **Durante**: Crear/modificar código, validar, documentar inmediatamente
3. **Después**: Verificar integración, actualizar documentación, limpiar legacy

#### 🏛️ Arquitectura de Transformers

- Diagrama mermaid del flujo de datos
- Responsabilidades específicas por archivo
- Patrón de estructura obligatorio

#### 🛠️ Herramientas y Patrones Específicos

- **Server Actions**: Organización por dominio, validación Zod
- **Zustand Stores**: Estructura Core + UI + Filters, selectores optimizados
- **React Query**: Keys jerárquicos, tiempos de caché específicos
- **Components UI**: Base Radix UI, animaciones motion/react
- **Testing**: Unitarios + Integration, mocks centralizados

#### 📚 Documentación Requerida

- README.md obligatorio por componente/módulo
- Diagramas mermaid para relaciones complejas
- Tipos canónicos únicamente en types.ts

#### 🚨 Reglas de Seguridad y Calidad

- **Importaciones**: Nunca tipos Prisma en cliente, usar tipos dominio
- **Estructura**: Index files controlados, naming conventions
- **Performance**: Lazy loading, memoización, bundle splitting

#### ⚠️ Prohibiciones y Limitaciones Claras

- **NO**: Directorios vacíos, tipos Prisma en cliente, duplicación
- **SÍ**: Búsqueda previa, tipos canónicos, documentación, validación

### 3. Integración con Proyecto Real

- **Contexto del codebase** analizado mediante semantic_search
- **Estructura actual** verificada en transformers, services, types
- **Patrones existentes** documentados (24 entidades principales)
- **Convenciones reales** integradas en las instrucciones

### 4. Beneficios Obtenidos

#### Para Desarrollo

- **Consistencia**: Reglas unificadas en un solo documento
- **Eficiencia**: Herramientas internas priorizadas
- **Calidad**: Validación y documentación obligatoria
- **Seguridad**: Prohibiciones claras sobre importaciones

#### Para Mantenimiento

- **Documentación**: README.md obligatorio en cada módulo
- **Arquitectura**: Patrones consistentes entre entidades
- **Testing**: Estrategia centralizada con mocks y fixtures
- **Performance**: Optimizaciones específicas por tecnología

#### Para Nuevos Desarrolladores

- **Guía completa**: Stack, arquitectura, patrones, reglas
- **Ejemplos claros**: Diagramas mermaid, estructura de carpetas
- **Prohibiciones**: Qué NO hacer para evitar errores comunes
- **Flujo de trabajo**: 3 fases estructuradas para cada tarea

## 📊 Métricas de Actualización

- **Reglas integradas**: 22 archivos de `.cursor/rules/`
- **Líneas de documentación**: ~258 líneas estructuradas
- **Secciones principales**: 11 secciones temáticas
- **Tecnologías documentadas**: 15+ herramientas y frameworks
- **Entidades cubiertas**: 24 entidades del sistema
- **Patrones arquitectónicos**: 5 capas principales

## 🔄 Estado Final

### Archivos Actualizados

- ✅ `d:\DEV\image-manager\.github\copilot-instructions.md` - **Completamente renovado**
- ✅ `d:\DEV\image-manager\.cursor\rules\*.mdc` - **22 archivos actualizados**
- ✅ `d:\DEV\image-manager\.github\*.md` - **22 réplicas en formato markdown**

### Consistencia Lograda

- **Stack tecnológico**: Alineado con 2025 (Next.js 15.3.3, React 19, etc.)
- **Reglas de desarrollo**: Consolidadas y actualizadas
- **Documentación**: Formato unificado con ejemplos y diagramas
- **Prohibiciones**: Claras y específicas (tipos Prisma, directorios vacíos)

## 🎯 Resultado

El proyecto **image-manager** ahora cuenta con un sistema de reglas de desarrollo **completamente actualizado, consistente y alineado con las mejores prácticas 2025**. Las instrucciones de Copilot están integradas con todas las reglas específicas del proyecto, proporcionando una guía completa para desarrollo, mantenimiento y onboarding de nuevos desarrolladores.

---

> **Fecha de actualización**: 2025-06-10
> **Versión**: Integración completa v2.0
> **Stack**: Next.js 15.3.3 + React 19 + Tailwind 4 + Shadcn/ui + Prisma→Drizzle
