# 🖼️ Image Manager

## Sistema de Gestión Multimedia Inteligente

[![React](https://img.shields.io/badge/React-19.2.4-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Vite+](https://img.shields.io/badge/Vite%2B-0.1.13-646CFF?logo=vite)](https://viteplus.dev)
[![Bun](https://img.shields.io/badge/Bun-1.2+-000000?logo=bun)](https://bun.sh)
[![Drizzle](https://img.shields.io/badge/Drizzle-ORM-C5F74F)](https://orm.drizzle.team)
[![Tauri](https://img.shields.io/badge/Tauri-2.9+-FFC131?logo=tauri)](https://tauri.app)

Sistema integral para la gestión inteligente de archivos multimedia, diseñado para manejar grandes volúmenes de contenido con alto rendimiento en entornos locales.

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Stack Tecnológico](#-stack-tecnológico)
- [Requisitos](#-requisitos)
- [Instalación](#-instalación)
- [Desarrollo](#-desarrollo)
- [Scripts Disponibles](#-scripts-disponibles)
- [Arquitectura](#-arquitectura)
- [Documentación](#-documentación)
- [Testing](#-testing)
- [Contribuir](#-contribuir)

---

## ✨ Características

### Gestión de Archivos

- 📂 **Indexación automática** de carpetas con extracción de metadatos
- 🔍 **Búsqueda avanzada** con filtros múltiples y FTS5
- 🖼️ **Thumbnails optimizados** generados con Sharp y FFmpeg
- 📊 **Soporte multi-formato**: imágenes, videos, audio, 3D, documentos
- ⭐ **Sistema de favoritos** multi-perfil
- 🗂️ **Organización dual**: física (carpetas) + digital (tags, álbumes)

### Organización de Contenido

| Entidad | Descripción |
|---------|-------------|
| 🏷️ **Tags** | Etiquetas con colores y emojis personalizables |
| 📸 **Álbumes** | Colecciones temáticas de archivos |
| 📁 **Grupos** | Meta-organizadores jerárquicos |
| 💎 **Colecciones** | Soporte NFT con metadatos blockchain |

### Worldbuilding

| Entidad | Descripción |
|---------|-------------|
| 👤 **Characters** | Personajes con stats, backstory, relaciones |
| 📍 **Places** | Ubicaciones con clima, recursos, historia |
| 🎯 **World Items** | Objetos con atributos y efectos |
| 💡 **Concepts** | Sistema de conocimiento interconectado |

### Performance

- ⚡ **Virtualización** para listas de 10,000+ elementos
- 🗄️ **Caching inteligente** con TanStack Query
- 🚀 **Lazy loading** de rutas (28+ chunks)
- 🔄 **Reindexación incremental** con progreso en tiempo real

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
|------|-------------|
| **Frontend** | React 19, TypeScript 5.9, Vite+ (Vite + Rolldown), Tailwind CSS 4 |
| **Estado** | Zustand 5, TanStack Query 5, Immer |
| **UI/UX** | Radix UI, GSAP, Lucide Icons |
| **Backend** | Express 5, Bun Runtime, Effect-TS |
| **Database** | Drizzle ORM, SQLite (libsql), FTS5 |
| **Desktop** | Tauri 2 (Rust) |
| **Testing** | Vitest, Playwright, Testing Library |

---

## 📋 Requisitos

- [Bun](https://bun.sh) 1.2 o superior
- [Node.js](https://nodejs.org) 20+ (fallback)
- SQLite 3+
- FFmpeg (opcional, para thumbnails de video/audio)

---

## 🚀 Instalación

```bash
# Clonar repositorio
git clone <repository-url>
cd image-manager

# Instalar dependencias
bun install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tu configuración

# Inicializar base de datos
bun run db:push

# Iniciar desarrollo
bun run dev:full
```

### Variables de Entorno

```env
# Base de datos
DATABASE_URL="file:./dev.db"

# Servidor
API_PORT=4000
NODE_ENV=development
CORS_ORIGIN="http://localhost:5173"

# Opcional: Turso (producción)
TURSO_DATABASE_URL="libsql://..."
TURSO_AUTH_TOKEN="..."

# Feature flags
USE_EFFECT_TAGS=true
USE_EFFECT_IMAGES=true
USE_EFFECT_VIDEOS=true
USE_EFFECT_AUDIOS=true
```

---

## 💻 Desarrollo

### Modos de Desarrollo

```bash
# Desarrollo completo (frontend + backend + HMR)
bun run dev:full

# Solo frontend (Vite+)
bun run dev:vite

# Solo backend con HMR
bun run dev:server:hot

# Aplicación desktop (Tauri)
bun run dev:tauri
```

### Estructura del Proyecto

```
image-manager/
├── src/
│   ├── app/                 # Configuración de aplicación
│   ├── components/          # Componentes React
│   │   ├── ui/             # Primitivas UI (shadcn/radix)
│   │   ├── views/          # Vistas por entidad
│   │   ├── features/       # Features complejas
│   │   └── cards/          # Tarjetas de entidades
│   ├── services/           # Capa de negocio (40+ servicios)
│   ├── transformers/       # DTO/View transformers
│   ├── store/              # Zustand stores
│   ├── server/             # Express backend
│   │   ├── routes/         # API endpoints
│   │   └── middleware/     # HTTP middleware
│   ├── lib/                # Utilidades y configuración
│   │   ├── drizzle/        # ORM schema y migrations
│   │   ├── utils/          # Utilidades por dominio
│   │   └── logger/         # Sistema de logging
│   ├── types/              # TypeScript definitions
│   └── hooks/              # Custom React hooks
├── tests/                  # Tests
│   ├── unit/               # Vitest
│   ├── e2e/                # Playwright
│   └── integration/        # Tests de integración
├── docs/                   # Documentación
├── scripts/                # Scripts de automatización
└── drizzle/                # Migrations
```

---

## 📜 Scripts Disponibles

### Desarrollo

| Comando | Descripción |
|---------|-------------|
| `bun run dev:full` | Frontend + Backend (desarrollo unificado) |
| `bun run dev:vite` | Solo frontend (puerto 5173) |
| `bun run dev:server:hot` | Solo backend con HMR (puerto 4000) |
| `bun run dev:tauri` | Aplicación desktop |

### Build

| Comando | Descripción |
|---------|-------------|
| `bun run build` | Build completo (frontend + backend) |
| `bun run build:vite` | Build frontend |
| `bun run build:server` | Build backend |
| `bun run build:tauri` | Build desktop |

### Testing

| Comando | Descripción |
|---------|-------------|
| `bun run test` | Tests unitarios (Vitest) |
| `bun run test:watch` | Tests en modo watch |
| `bun run test:ci` | Tests con cobertura |
| `bun run test:e2e` | Tests E2E (Playwright) |
| `bun run test:ui` | Playwright UI mode |

### Calidad de Código

| Comando | Descripción |
|---------|-------------|
| `bun run check` | Gate operativo: lint + typecheck |
| `bun run check:full` | Auditoría completa con Vite+ (lint + format del repo) |
| `bun run lint` | Lint con Oxc / Oxlint |
| `bun run lint:fix` | Lint con auto-fix cuando aplique |
| `bun run format` | Formatear código |
| `bun run tsc` | TypeScript check |

### Base de Datos

| Comando | Descripción |
|---------|-------------|
| `bun run db:studio` | Drizzle Studio (GUI) |
| `bun run db:check` | Verificar estado de DB |
| `bun run db:reset` | Reset completo (⚠️ destructivo) |
| `bun run db:migrate:aggregates` | Migrar entity aggregates |

### Utilidades

| Comando | Descripción |
|---------|-------------|
| `bun run logs:list` | Listar logs |
| `bun run logs:clean` | Limpiar logs antiguos |
| `bun run check:errors` | Verificar errores recientes |

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                     TAURI (Desktop Shell)                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐      ┌─────────────────────────────┐  │
│  │   React Frontend    │◄────►│     Express Backend          │  │
│  │   (Vite + TS)       │ REST │     (Bun Runtime)           │  │
│  │                     │ SSE  │                              │  │
│  │  • Zustand          │      │  • 50+ Route Handlers        │  │
│  │  • TanStack Query   │      │  • 40+ Services              │  │
│  │  • React Router     │      │  • Transformers Layer        │  │
│  └─────────────────────┘      └──────────────┬──────────────┘  │
│                                              │                  │
│                               ┌──────────────▼──────────────┐  │
│                               │    Drizzle ORM + SQLite     │  │
│                               │    (6 Domain Schemas)        │  │
│                               └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Patrones de Diseño

- **Service Layer**: Cada entidad tiene un servicio dedicado
- **Transformer Pattern**: Separación entre datos DB y View Models
- **Effect-TS**: Manejo funcional de errores y efectos
- **Zustand**: Estado UI con persistencia opcional
- **TanStack Query**: Server state caching y sincronización

---

## 📚 Documentación

La documentación completa está disponible en la carpeta [`docs/`](./docs/):

| Documento | Descripción |
|-----------|-------------|
| [AUDITORIA-TECNICA-COMPLETA.md](./docs/AUDITORIA-TECNICA-COMPLETA.md) | Informe de auditoría técnica |
| [core/PRD.md](./docs/core/PRD.md) | Product Requirements Document |
| [core/ARCHITECTURE.md](./docs/core/ARCHITECTURE.md) | Arquitectura del sistema |
| [core/API-REFERENCE.md](./docs/core/API-REFERENCE.md) | Referencia de API REST |
| [core/DATABASE-SCHEMA.md](./docs/core/DATABASE-SCHEMA.md) | Esquema de base de datos |
| [core/SERVICES-GUIDE.md](./docs/core/SERVICES-GUIDE.md) | Guía de servicios |
| [core/FRONTEND-GUIDE.md](./docs/core/FRONTEND-GUIDE.md) | Guía de frontend |

---

## 🧪 Testing

### Tests Unitarios (Vitest)

```bash
# Ejecutar todos los tests
bun run test

# Modo watch
bun run test:watch

# Con cobertura
bun run test:ci
```

### Tests E2E (Playwright)

```bash
# Ejecutar tests E2E
bun run test:e2e

# Modo UI
bun run test:ui

# Debug
bun run test:e2e:debug
```

### Configuración

- **Vitest / Vite+ Test**: Entorno jsdom, cobertura mínima 50%
- **Playwright**: Chrome, timeout 60s, auto-starts dev server

---

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama feature (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

### Guías de Contribución

- Seguir [Conventional Commits](https://www.conventionalcommits.org/)
- Mantener cobertura de tests > 50%
- Usar el sistema de logging (no console.log)
- Tipar todo (evitar `any`)
- Documentar funciones públicas

---

## 📝 Licencia

[MIT](./LICENSE)

---

## 🙏 Agradecimientos

- [Drizzle Team](https://orm.drizzle.team/) por el ORM increíble
- [Effect-TS](https://effect.website/) por el sistema de efectos
- [Tauri](https://tauri.app/) por el framework desktop
- [shadcn/ui](https://ui.shadcn.com/) por los componentes base
