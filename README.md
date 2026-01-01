# 🖼️ Image Manager

## Sistema de Gestión Multimedia Inteligente

[![React](https://img.shields.io/badge/React-19.2.3-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-7.3.0-646CFF?logo=vite)](https://vitejs.dev)
[![Bun](https://img.shields.io/badge/Bun-Runtime-000000?logo=bun)](https://bun.sh)
[![Drizzle](https://img.shields.io/badge/Drizzle-ORM-C5F74F)](https://orm.drizzle.team)
[![Tauri](https://img.shields.io/badge/Tauri-2.9.6-FFC131?logo=tauri)](https://tauri.app)

Sistema integral para la gestión inteligente de archivos multimedia, diseñado para manejar grandes volúmenes de contenido con alto rendimiento en entornos locales.

---

## 📋 Tabla de Contenidos

- [¿Qué es?](#-qué-es)
- [Características](#-características)
- [Inicio Rápido](#-inicio-rápido)
- [Scripts](#-scripts)
- [Arquitectura](#-arquitectura)
- [Documentación](#-documentación)
- [Contribuir](#-contribuir)

---

## 🎯 ¿Qué es?

Image Manager es un **organizador multimedia completo** que:

- 📁 **Indexa archivos** y extrae metadatos automáticamente (EXIF, audio metadata, dimensiones)
- 🏷️ **Organiza contenido** con tags, álbumes, colecciones y grupos jerárquicos
- 🔗 **Combina organización física** (estructura de carpetas) **con digital** (base de datos relacional)
- 📌 **Gestiona sin mover archivos** de su ubicación original
- 🖼️ **Genera thumbnails** optimizados con Sharp
- 🌐 **Ejecuta como web o desktop** gracias a Tauri

### Tipos de Archivo Soportados

| Categoría | Formatos |
|-----------|----------|
| **Imágenes** | jpg, png, webp, gif, bmp, tiff |
| **Videos** | mp4, webm, mov, avi, mkv |
| **Audio** | wav, flac, mp3, ogg, m4a, aac |
| **3D** | obj, fbx, glb |
| **Documentos** | md, txt, csv, json |

---

## ✨ Características

### Gestión de Archivos

- 📂 Navegación jerárquica por carpetas con contadores de archivos
- 🔍 Búsqueda avanzada con filtros múltiples
- 🖼️ Vista en cuadrícula/lista con thumbnails optimizados
- 📊 Extracción automática de metadatos (EXIF, audio tags, dimensiones)
- ⭐ Sistema de favoritos multi-perfil

### Organización

- 🏷️ **Tags**: Etiquetas con colores y emojis personalizables
- 📸 **Álbumes**: Agrupaciones temáticas de archivos
- 📁 **Grupos**: Meta-organizadores jerárquicos
- 💎 **Colecciones NFT**: Soporte para metadatos blockchain

### Worldbuilding

- 👤 **Characters**: Personajes con stats, backstory, relaciones
- 📍 **Places**: Ubicaciones con clima, recursos, historia
- 🎯 **World Items**: Objetos con atributos y efectos
- 💡 **Concepts**: Sistema de conocimiento interconectado

### Performance

- ⚡ Virtualización para listas de 10,000+ elementos
- 🗄️ Caching con TanStack Query
- 🚀 Lazy loading de rutas (28 chunks)
- 🎨 Thumbnails optimizados con Sharp

---

## 🚀 Inicio Rápido

### Prerrequisitos

- [Bun](https://bun.sh) 1.2+
- SQLite 3+

### Instalación

```bash
# Clonar repositorio
git clone <repository-url>
cd image-manager

# Instalar dependencias
bun install

# Configurar base de datos
bun run db:push

# Iniciar desarrollo
bun run dev:full
```

### Variables de Entorno

```bash
# .env.local
DATABASE_URL="file:./dev.db"
PORT=4000
CORS_ORIGIN="http://localhost:5173"

# Opcional: Turso (producción)
TURSO_DATABASE_URL="libsql://..."
TURSO_AUTH_TOKEN="..."
```

---

## 🛠️ Scripts

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
| `bun run build` | Build completo |
| `bun run build:vite` | Build frontend |
| `bun run build:server` | Build backend |
| `bun run build:tauri` | Build desktop |

### Testing & Calidad

| Comando | Descripción |
|---------|-------------|
| `bun run test:e2e` | Tests E2E con Playwright |
| `bun run test:ui` | Playwright UI mode |
| `bun run biome` | Lint con Biome |
| `bun run format` | Formatear código |
| `bun run tsc` | TypeScript check |

### Base de Datos

| Comando | Descripción |
|---------|-------------|
| `bun run db:studio` | Drizzle Studio (GUI) |
| `bun run db:push` | Aplicar schema a DB |
| `bun run db:seed` | Seed de datos abstractos |
| `bun run db:reset` | Reset completo |

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                     TAURI (Desktop Shell)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────┐      ┌─────────────────────────────┐  │
│  │   React Frontend    │      │     Express Backend          │  │
│  │   (Vite + TS)       │◄────►│     (Bun Runtime)           │  │
│  │                     │ REST │                              │  │
│  │  • Zustand          │ SSE  │  • 50+ Route Handlers        │  │
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

### Stack Tecnológico

| Capa | Tecnologías |
|------|-------------|
| **Frontend** | React 19, Vite 7, TypeScript 5.9, Tailwind CSS 4 |
| **Estado** | Zustand 5, TanStack Query 5 |
| **Backend** | Express 5, Bun Runtime |
| **Database** | Drizzle ORM, SQLite/Turso |
| **Desktop** | Tauri 2 (Rust) |
| **Testing** | Playwright, Vitest |

---

## 📚 Documentación

| Documento | Descripción |
|-----------|-------------|
| [PRD.md](docs/PRD.md) | Documento de Requerimientos del Producto |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Arquitectura del Sistema |
| [DATABASE-SCHEMA.md](docs/DATABASE-SCHEMA.md) | Referencia de Esquema de Base de Datos |
| [API-REFERENCE.md](docs/API-REFERENCE.md) | Documentación de API REST |
| [SERVICES-GUIDE.md](docs/SERVICES-GUIDE.md) | Guía de Servicios Backend |
| [FRONTEND-GUIDE.md](docs/FRONTEND-GUIDE.md) | Guía de Desarrollo Frontend |

---

## 📁 Estructura del Proyecto

```
image-manager/
├── src/
│   ├── components/          # Componentes React
│   │   ├── ui/             # Componentes base (Shadcn/Radix)
│   │   ├── views/          # Vistas principales (30+)
│   │   └── cards/          # Cards de entidades (21)
│   ├── server/             # Backend Express
│   │   └── routes/         # 50+ endpoints REST
│   ├── services/           # Servicios de negocio (40+)
│   ├── store/              # Estado global Zustand
│   │   └── entities/       # Stores por entidad
│   ├── lib/
│   │   ├── drizzle/        # Schema ORM (6 dominios)
│   │   ├── filesystem/     # Utilidades de archivos
│   │   └── logger/         # Sistema de logging
│   ├── transformers/       # DTOs y serialización
│   └── types/              # Definiciones TypeScript
├── src-tauri/              # Aplicación desktop (Rust)
├── tests/                  # Tests E2E y unitarios
├── docs/                   # Documentación
└── scripts/                # Scripts operativos
```

---

## 🤝 Contribuir

1. Fork del repositorio
2. Crear rama feature: `git checkout -b feature/nueva-funcionalidad`
3. Instalar dependencias: `bun install`
4. Ejecutar tests: `bun run test:e2e`
5. Commit: `git commit -m "feat: nueva funcionalidad"`
6. Crear Pull Request

### Estándares

- **Biome** para linting y formatting
- **Conventional Commits** para mensajes
- **TypeScript strict mode** habilitado
- **Tests E2E** para funcionalidades críticas

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver [LICENSE](LICENSE) para más detalles.

---

**🚀 Ready to explore your multimedia with modern technology!**
