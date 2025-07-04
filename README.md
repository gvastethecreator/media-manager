# Sistema de Gestión Multimedia ( codename Image Manager )

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


**Sistema avanzado de gestión de imágenes y media** construido con React 19, Vite y Drizzle ORM.

![Estado de Migración](https://img.shields.io/badge/Drizzle%20Migration-96%25%20Complete-green)
![React](https://img.shields.io/badge/React-19.1.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-blue)
![Vite](https://img.shields.io/badge/Vite-6.1.6-purple)

---

## 🚀 **Características Principales**

### **📁 Gestión de Archivos**

- **Navegación intuitiva** por carpetas y colecciones
- **Vista en cuadrícula** con miniaturas optimizadas
- **Metadatos EXIF** automáticos para imágenes
- **Búsqueda avanzada** con filtros múltiples

### **🏷️ Organización**

- **Tags inteligentes** con estadísticas
- **Álbumes temáticos** personalizables
- **Colecciones** para agrupación lógica
- **Favoritos** para acceso rápido

### **🎨 Personalización**

- **Temas claro/oscuro** con persistencia
- **Colores personalizables** para carpetas
- **Emojis** para identificación visual
- **Layouts adaptativos** responsive

### **⚡ Performance**

- **Virtualización** para listas grandes
- **Caching inteligente** con LRU
- **Lazy loading** de imágenes
- **Optimización automática** de thumbnails

---

## 🏗️ **Arquitectura (Post-Migración Bun 2025)**

### **Runtime y Herramientas**

```
Bun 1.2.15 + TypeScript + Vite (transitorio)
├── Runtime: Bun (reemplaza Node.js) ✅
├── Package Manager: bun install (reemplaza pnpm) ✅
├── Bundler: Vite → Bun.build (migración gradual) 🔄
└── Scripts: Ejecutándose en Bun runtime ✅
```

### **Frontend Stack**

```
React 19 + TypeScript + Vite (temporal)
├── Estado: Zustand + TanStack Query
├── UI: Tailwind CSS v4 + Shadcn/Radix UI
├── Routing: React Router v7
└── Animaciones: Framer Motion
```

### **Backend Stack**

```
Express.js + TypeScript + Bun Runtime
├── ORM: Drizzle ORM (principal) ✅
├── Base de Datos: SQLite/Turso
├── API: REST + Server-Sent Events
└── Legacy: Prisma (solo StatsService) ⚠️
```

### **Herramientas de Desarrollo**

```
Bun + Vite (híbrido) + Biome + Playwright
├── Runtime: Bun para todos los scripts ✅
├── Linting: Biome + ESLint (ejecutados con Bun)
├── Testing: Playwright E2E (ejecutado con bunx)
├── Build: Vite (frontend) + Bun scripts (backend)
└── DB Tools: Drizzle Studio (ejecutado con bunx)
```

---

## 🛠️ **Instalación y Configuración**

### **Prerrequisitos**

- **Bun** 1.2+ (runtime y package manager) ✅ **NUEVO**
- **SQLite** 3+ (base de datos)
- ~~Node.js~~ (reemplazado por Bun)
- ~~pnpm~~ (reemplazado por bun install)

### **Instalación**

```bash
# Clonar repositorio
git clone <repository-url>
cd image-manager

# Instalar dependencias con Bun
bun install

# Configurar base de datos
bun run drizzle:push

# Verificar migración (opcional)
bun run drizzle:verify
```

### **Variables de Entorno**

```bash
# .env.local
DATABASE_URL="file:./dev.db"
NODE_ENV="development"
PORT=5173

# Opcional: Turso (producción)
TURSO_DATABASE_URL="libsql://..."
TURSO_AUTH_TOKEN="..."
```

---

## 🚀 **Scripts Principales**

### **Desarrollo**

```bash
bun dev               # Iniciar desarrollo (Vite + Express con Bun runtime)
bun run build         # Build para producción
bun run preview       # Preview del build
bun run start         # Iniciar servidor de producción
```

### **Base de Datos**

```bash
bun run drizzle:studio   # Abrir Drizzle Studio (GUI)
bun run drizzle:push     # Aplicar cambios de schema
bun run drizzle:verify   # Verificar migración Drizzle ✨
bun run drizzle:generate # Generar migraciones
```

### **Calidad de Código**

```bash
bun run lint             # Linting con ESLint (ejecutado con Bun)
bun run biome:check      # Linting con Biome (ejecutado con Bun)
bun run biome:fix        # Auto-fix con Biome
bun run format           # Formatear código
bun run tsc              # Verificar tipos TypeScript
```

### **Testing**

```bash
bun run test             # Tests E2E con Playwright (ejecutado con bunx)
bun run test:ui          # Playwright en modo UI
bun run test:headed      # Tests con browser visible
bun run test:debug       # Debug de tests
```

### **Logs y Debugging**

```bash
bun run logs             # Ver logs recientes
bun run logs:clean       # Limpiar logs antiguos
bun run check:errors     # Analizar errores en logs
```

---

## 📊 **Estado de Migración Drizzle**

### **✅ Completado (96%)**

- **24/25 servicios** migrados a Drizzle ORM
- **Limpieza masiva** de dependencias Prisma
- **Tipos unificados** en toda la aplicación
- **Sistema productivo** con datos reales

### **📋 Servicios Migrados**

```
✅ ImageService      ✅ TagService        ✅ AlbumService
✅ FolderService     ✅ ConceptService    ✅ CharacterService
✅ DocumentService   ✅ AudioService      ✅ File3DService
✅ JsonFileService   ✅ VideoService      ✅ NoteService
✅ ProfileService    ✅ PlaceService      ✅ WorldItemService
✅ CollectionService ✅ PropertyService   ✅ WildcardService
✅ PromptService     ✅ GroupService      ✅ SearchService
✅ SettingsService   ✅ WorkflowService   ✅ UploadedImagesService
```

### **⏳ Pendiente**

- **StatsService** (usa OptimizedStatsService con SQL raw complejo)

---

## 🚀 **Migración a Bun Runtime (2025)**

### **✅ FASE 1 COMPLETADA - Runtime Migration**

**Fecha**: Julio 2025
**Duración**: ~30 minutos
**Estado**: 100% Funcional

#### **🎯 Logros**
- **Runtime migrado** de Node.js 20+ a Bun 1.2.15
- **Package manager** migrado de pnpm a `bun install`
- **30+ scripts** actualizados para usar `bun` y `bunx`
- **Lockfile** migrado: `pnpm-lock.yaml` → `bun.lock`
- **Configuración** optimizada con `bunfig.toml`
- **📚 Documentación completamente actualizada** - Todo el proyecto ahora refleja Bun

#### **📚 Documentación Actualizada**
- ✅ **README.md principal** - Arquitectura, scripts, instalación con Bun
- ✅ **docs/rules/core-rules.md** - Reglas actualizadas para Bun runtime
- ✅ **docs/BUN-CONFIGURATION.md** - Guía completa de configuración post-migración
- ✅ **Documentación secundaria** - Referencias a pnpm/node corregidas en componentes
- ✅ **Scripts de ejemplo** - Todos los comandos actualizados a bun/bunx

#### **📊 Mejoras de Rendimiento Observadas**
```
⚡ Tiempo de inicio de scripts: 0.07ms (extremadamente rápido)
📦 Resolución de 125 dependencias: 12.40ms
📁 Operaciones de filesystem: 0.29ms
🏗️ Tiempo total de benchmarks: 13.72ms
```

#### **🔄 Estado Actual (Híbrido Estable)**

```text
Runtime: Bun 1.2.15 ✅
Package Manager: bun install ✅
Frontend Bundler: Vite (temporal) ⏳
Backend Scripts: Bun runtime ✅
Testing: Playwright con bunx ✅
Linting: Biome + ESLint con Bun ✅
Database: Drizzle con Bun runtime ✅
```

### **🔮 Fases Futuras**

#### **FASE 2: Optimización Híbrida** (planificada)
- Benchmarks comparativos detallados
- Optimización configuración Vite + Bun
- Análisis de dependencias para FASE 3

#### **FASE 3: Bun Bundler Nativo** (planificada)
- Reemplazo completo de Vite por `Bun.build()`
- Migración de plugins esenciales
- HMR nativo de Bun
- Servidor de desarrollo nativo

#### **FASE 4: Limpieza Final** (planificada)
- Eliminación de dependencias legacy
- Optimización bundle final
- Documentación actualizada completa

### **📚 Documentación de Migración**
- `docs/migration-bun/001-plan-migracion-bun.md` - Plan completo
- `docs/migration-bun/FASE-1-REPORTE-FINAL.md` - Reporte ejecutivo
- `scripts/benchmark-bun.js` - Benchmarks de rendimiento

---

## 🎯 **Características Técnicas**

### **Performance**

- **Virtualización** con `@tanstack/react-virtual`
- **Caching** con LRU cache y TanStack Query
- **Lazy loading** de imágenes y componentes
- **Debounced search** para búsquedas eficientes

### **Accesibilidad**

- **ARIA labels** completos
- **Navegación por teclado** en todos los componentes
- **Contraste** optimizado para temas claro/oscuro
- **Screen reader** support

### **Responsive Design**

- **Mobile-first** approach
- **Breakpoints** adaptativos con Tailwind
- **Touch gestures** para dispositivos móviles
- **Grid layouts** flexibles

---

## 📁 **Estructura del Proyecto**

```
image-manager/
├── src/
│   ├── components/          # Componentes React
│   │   ├── ui/             # Componentes base reutilizables
│   │   ├── views/          # Vistas principales
│   │   ├── cards/          # Cards para entidades
│   │   └── forms/          # Formularios
│   ├── services/           # Servicios de datos (Drizzle)
│   ├── store/              # Estado global (Zustand)
│   ├── lib/                # Utilidades y configuración
│   │   ├── drizzle/        # Schema y configuración Drizzle
│   │   └── utils/          # Funciones utilitarias
│   ├── types/              # Definiciones TypeScript
│   └── server/             # Backend Express
├── docs/                   # Documentación
│   ├── migration-drizzle/  # Documentación de migración
│   └── architecture.md     # Arquitectura del sistema
├── scripts/                # Scripts de utilidades
│   └── db/                 # Scripts de base de datos
└── tests/                  # Tests E2E
```

---

## 🔧 **Configuración Avanzada**

### **Drizzle Studio**

```bash
# Abrir GUI para explorar la base de datos
bun run drizzle:studio
# Disponible en: http://localhost:4983
```

### **Desarrollo con Hot Reload**

```bash
# Frontend (Vite con Bun runtime)
bun run dev:vite

# Backend con watch mode
bun run watch:server
```

### **Build para Producción**

```bash
# Build completo
bun run build

# Solo frontend
bun run build:vite

# Solo backend
bun run build:server
```

---

## 🐛 **Troubleshooting**

### **Problemas Comunes**

**Error de conexión a la base de datos:**

```bash
# Verificar schema
bun run drizzle:check

# Recrear base de datos
bun run db:full-reset
```

**Errores de TypeScript:**

```bash
# Verificar tipos
bun run tsc

# Limpiar cache
rm -rf node_modules/.cache
bun install
```

**Tests fallando:**

```bash
# Instalar browsers de Playwright
bun run playwright:install

# Ejecutar tests en modo debug
bun run test:debug
```

---

## 📈 **Roadmap**

### **Próximas Funcionalidades**

- [ ] **Migración completa** de StatsService a Drizzle
- [ ] **Sync en tiempo real** con WebSockets
- [ ] **PWA** con service workers
- [ ] **Exportación** de colecciones
- [ ] **AI tagging** automático

### **Mejoras Técnicas**

- [ ] **Migración a Tailwind CSS v4** completa
- [ ] **Consolidación de linting** (solo Biome)
- [ ] **Optimización de bundle** con code splitting
- [ ] **Docker** containers para deploy

---

## 🤝 **Contribución**

### **Desarrollo Local**

1. Fork del repositorio
2. Crear rama feature: `git checkout -b feature/nueva-funcionalidad`
3. Instalar dependencias: `bun install`
4. Ejecutar tests: `bun run test`
5. Commit y push: `git commit -m "feat: nueva funcionalidad"`
6. Crear Pull Request

### **Estándares de Código**

- **ESLint + Biome** para linting
- **Conventional Commits** para mensajes
- **TypeScript strict mode** habilitado
- **Tests E2E** para funcionalidades críticas

---

## 📄 **Licencia**

Este proyecto está bajo la licencia MIT. Ver [LICENSE](LICENSE) para más detalles.

---

## 🏆 **Logros de la Migración**

### **Estadísticas**

- **96% migración completada** Prisma → Drizzle
- **4 archivos Prisma eliminados** de dependencias core
- **8+ transformadores migrados** a tipos locales
- **3+ stores Zustand limpiados** de tipos legacy
- **Sistema 100% productivo** con datos reales

### **Beneficios**

- ✅ **Mejor performance** sin overhead de validación dual
- ✅ **Código más limpio** con imports directos de Drizzle
- ✅ **Tipos consistentes** en toda la aplicación
- ✅ **Mantenibilidad mejorada** sin duplicación de lógica
- ✅ **Arquitectura moderna** preparada para el futuro

---

## 🌱 Seeds de Base de Datos (Drizzle ORM)

El sistema de seeds está diseñado para poblar únicamente las **entidades abstractas** (organización, etiquetas, taxonomías, flujos, settings, etc.) y **NO** entidades que dependan de archivos reales (imágenes, videos, audios, etc.).

- Todas las entidades abstractas tienen máximo 2 elementos de ejemplo (excepto folders, que mantiene la estructura original).
- Seeds disponibles: folders, profiles, tags, albums, collections, groups, properties, wildcards, characters, concepts, prompts, notes, places, worldItems, settings, workflows.
- No se generan seeds para imágenes, videos, audios, documentos, ni tablas de relaciones many-to-many.

### Ejecución de seeds

```bash
bun run seed:drizzle # (o el script correspondiente)
```

Esto ejecutará todos los seeds en orden de dependencias.

---

**🚀 Ready to explore your images with modern technology!**
