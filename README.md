# Sistema de Gestión Multimedia

Sistema integral para la gestión inteligente de archivos multimedia, diseñado para manejar grandes volúmenes de contenido con alto rendimiento en uso local.

## ¿Qué es?

Nació como una solución para organizar grandes cantidades de imágenes generadas con IA, pero evolucionó hacia un organizador multimedia completo que no solo indexa archivos y extrae metadatos, sino que también permite crear sistemas de organización complejos y personalizables.

La filosofía del sistema combina **organización física** (estructura de carpetas) con **organización digital** (base de datos con etiquetas, álbumes, relaciones) para crear una gestión flexible sin necesidad de mover archivos de su ubicación original.

## 📂 Tipos de Archivo Soportados

### Multimedia Principal

- **Imágenes**: jpg, png, webp, gif
- **Videos**: mp4, webm, mov, avi, mkv
- **Audio**: wav, flac, mp3, ogg, m4a, aac, wma

### Contenido Especializado

- **Modelos 3D**: obj, fbx, glb (optimizados para web)
- **Documentos**: md, txt, csv
- **Datos estructurados**: json

## 🏗️ Sistema de Organización

### 📋 Entidades Básicas

#### 🏷️ Tags

- Etiquetas simples para categorización rápida
- Sistema de colores y emojis personalizables
- Relaciones flexibles con todo tipo de contenido

#### 📸 Álbumes

- Agrupaciones temáticas de archivos multimedia
- Ideal para colecciones temporales o proyectos específicos
- Metadata enriquecida con descripción y configuración visual

#### 📂 Grupos

- Meta-organizadores que permiten agrupar cualquier entidad
- Sistema jerárquico para crear taxonomías complejas
- Configuración avanzada de filtros y ordenamiento

### 🎭 Entidades Dinámicas

#### 🔧 Wildcards

- Plantillas y variables dinámicas para automatización
- Sistema jerárquico con relaciones padre-hijo
- Generación de contenido parametrizable

#### 🔍 Properties

- Descriptores de características específicas (color, forma, estilo)
- Sistema de metadatos granular para búsquedas avanzadas

### 🌟 Colecciones NFT

#### 💎 Collections

- Organización específica para NFTs y arte digital
- Metadatos blockchain: contratos, tokens, networks, pricing
- Integración con plataformas y marketplaces
- Gestión de ediciones y rareza

### 🧠 Entidades Abstractas

#### 💡 Concepts

- Ideas, conceptos abstractos y referencias conceptuales
- Sistema de conocimiento interconectado
- Base para sistemas de IA y generación automática

#### 📝 Notes

- Sistema de anotaciones con prioridades y estados
- Markdown compatible para documentación rica
- Integración con flujos de trabajo

#### 🎯 Prompts

- Plantillas para generación de IA
- Parametrización avanzada con wildcards
- Versionado y optimización iterativa

### 🗺️ Worldbuilding

#### 👤 Characters

- Personajes completos con stats, backstory, relaciones
- Sistema de niveles, clases y alineamientos
- Perfiles psicológicos y sociales detallados

#### 📍 Places

- Ubicaciones con clima, gobierno, población
- Historia, peligros y recursos
- Integración geográfica y narrativa

#### 🎯 World Items

- Objetos del mundo con atributos y efectos
- Sistema de rareza y requisitos
- Estadísticas y mecánicas de juego

### 📚 Gestión Documental

#### 📄 Documents

- Archivos markdown y texto plano
- Compatible con Obsidian vaults
- Sistema de enlaces bidireccionales

#### ⚙️ Workflows

- Flujos de trabajo complejos en JSON
- Automatización de procesos
- Integración con herramientas externas

### ⭐ Sistema de Favoritos Multi-Perfil

- Favoritos personalizados por perfil de usuario
- Cualquier entidad puede ser marcada como favorita
- Sincronización inteligente entre perfiles



## Tecnologías

### Stack Actual (Migración en progreso)

- **Vite 7.0** - Build tool y desarrollo frontend
- **React 19** - Biblioteca de UI
- **Express 5** - Servidor API
- **Prisma** - ORM para acceso a base de datos ( a ser deprecada )
- **Drizzle** - ORM para acceso a base de datos ( migrando desde Prisma)
- **Tailwind CSS 4** - Framework de estilos
- **Shadcn/UI** - Componentes de UI integrados con Tailwind 4
- **Zustand** - Gestión de estado
- **BaseUI** - Componentes de UI
- **React Router v6** - Enrutamiento frontend
- **Vitest** - Testing framework
- **Motion** - Animaciones fluidas
- **Biome** - Linter y formateador unificado

### Stack Legacy (En migración)

- ~~**Next.js 15.3.3**~~ → **Vite 7.0**
- ~~**Server Actions**~~ → **Express 5 API**
- ~~**API Routes**~~ → **Express Routes**
- ~~**Prisma**~~ → **Drizzle**
- ~~**Radix UI**~~ → **BaseUI**

## Estado de la Migración

### ✅ Completado

- [x] **T01** - Auditoría de dependencias
- [x] **T02** - Configuración inicial Vite 7 + React + TS
- [x] **T03** - Integración Tailwind 4, PostCSS
- [x] **T04** - Scripts package.json básicos
- [x] **T06** - Servidor Express 5 básico
- [x] **T07** - Configuración Vitest

### 🚧 En Progreso

- [ ] **T05** - Migración completa routing React Router v6
- [ ] **T06** - Migración completa Server Actions → Express API
- [ ] **T08** - Documentación actualizada
- [x] **T09** - Limpieza código Next.js legacy
- [x] **T26** - Limpieza residual de Next.js
- [x] **T27** - Bloque 2 UI verificado
- [x] **T28** - Bloque 3 UI verificado

- [x] **T29** - Bloque 4 UI verificado
- [x] **T30** - Configuración básica de pruebas E2E

## Desarrollo

### Requisitos Previos

```bash
node -v   # ≥ 20.19 o 22.12+ (requerido por Vite 7)
pnpm -v   # ≥ 8.0
```

### Instalación

```bash
pnpm install
cp env.example .env # Ajustar variables según entorno
```

### Desarrollo Local

#### Opción 1: Desarrollo con Vite (Recomendado)

```bash
# Terminal 1: Frontend Vite (puerto 5173)
pnpm dev:vite

# Terminal 2: Backend Express (puerto 4000)
pnpm watch:server

# Abrir: http://localhost:5173
```

### Build y Producción

```bash
# Build frontend
pnpm build:vite

# Build servidor
pnpm build:server

# Preview frontend
pnpm preview:vite

# Ejecutar servidor en producción
node dist/server/index.js
```

### Testing

```bash
# Instalación de navegadores
pnpm playwright:install

# Ejecutar pruebas E2E (Playwright)
pnpm test

# Coverage
pnpm test --coverage
```

### Herramientas de Desarrollo

```bash
# Linting y formato
pnpm lint
pnpm format

# Verificación TypeScript
pnpm tsc

# Logs del sistema
pnpm logs list
pnpm check:errors
```

## Actualizaciones Importantes (Julio 2025)

### ⚡ Migración Vite 7

- **Performance mejorada**: Builds 60% más rápidos que Next.js
- **HMR instantáneo**: Recarga en tiempo real ultrarrápida
- **Arquitectura desacoplada**: Frontend y backend independientes
- **Preparado para desktop**: Compatible con Tauri/Electron

### 🔧 Configuración Técnica

- **Node.js ≥ 20.19** requerido para Vite 7
- **Proxy automático**: Frontend (5173) → Backend (4000)
- **Path aliases**: `@/*` configurado en Vite y Vitest
- **SVG como componentes**: `vite-plugin-svgr` configurado

### 📊 Endpoints API

```bash
# Health check del servidor
curl http://localhost:4000/api/health
```

## Arquitectura

- **Frontend**: React 19 + Vite 7 + React Router
- **Backend**: Express 5 + Prisma + SQLite
- **Estado**: Zustand stores sin cambios
- **Estilos**: Tailwind 4 con variables CSS
- **Testing**: Vitest + Playwright
- **Build**: Vite (frontend) + tsup (backend)

## Migración de Next.js

### Cambios Principales

1. **Routing**: `app/` → React Router v6
2. **API**: `app/api/` → Express routes en `src/server/`
3. **Server Actions**: → Express endpoints
4. **Build**: `next build` → `vite build`
5. **Dev**: `next dev` → `vite` + `node server`

### Compatibilidad

- ✅ Todos los stores Zustand funcionan sin cambios
- ✅ Componentes UI mantienen funcionalidad
- ✅ Prisma y base de datos sin cambios
- ✅ Tailwind 4 configuración preservada
- ⚠️ Links `next/link` → `react-router-dom`
- ⚠️ `next/image` → componentes img estándar

## Testing

Sistema de testing configurado con:

- **Vitest**: Tests unitarios y de integración
- **Playwright**: Tests end-to-end
- **Happy DOM**: Environment para tests
- **Testing Library**: Utilities para React
