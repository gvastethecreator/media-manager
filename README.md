# Image Manager

Una aplicación moderna de gestión de imágenes construida con Next.js 15, React 19, Prisma y SQLite.

## Características

- 🖼️ Visualización avanzada de imágenes con zoom, pan y gestos
- 📂 Organización jerárquica de carpetas con monitoreo automático
- 🔄 Indexación automática de imágenes
- 🏷️ Organización basada en etiquetas
- 📱 Diseño responsive
- 🎨 Tema claro/oscuro
- ⚡ Navegación rápida y eficiente
- 🔍 Capacidades avanzadas de búsqueda
- 💾 Base de datos local SQLite
- 📊 Estadísticas de carpetas y archivos

## Estructura del Proyecto

```
src/
├── app/                    # Next.js app router y API routes
├── components/
│   ├── core/              # Componentes base
│   │   ├── data-display/  # Cards, empty states
│   │   ├── feedback/      # Loading states
│   │   ├── layout/        # Layouts
│   │   ├── navigation/    # Navigation components
│   │   ├── providers/     # Context providers
│   │   └── theme/         # Theme utilities
│   ├── features/          # Componentes de características
│   │   ├── collections/   # Gestión de colecciones
│   │   ├── file-management/
│   │   │   ├── file-browser/
│   │   │   ├── file-details/
│   │   │   └── folders/
│   │   └── image-viewer/  # Visualizador de imágenes
│   └── ui/               # Componentes UI (shadcn/ui)
├── config/               # Configuraciones
├── context/             # Contextos de React
├── hooks/               # Hooks personalizados
├── lib/                 # Utilidades y configuraciones
├── services/            # Servicios (fs, watcher, etc)
├── store/              # Estado global (Zustand)
└── types/              # TypeScript types
```

## Estado del Desarrollo

### Características Completadas ✅
- Estructura base de componentes
- Navegación y visualización de archivos
- Visualizador de imágenes con características avanzadas
- Cambio de tema
- Layouts responsivos
- Gestión básica de archivos
- Indexación automática de carpetas
- Monitoreo de cambios en carpetas
- Base de datos local con SQLite
- Estadísticas de carpetas

### En Progreso 🚧
- Gestión de colecciones
- Sistema de etiquetas
- Funcionalidad de búsqueda
- Panel de configuración
- Manejo de metadatos de archivos
- Caché de miniaturas
- Optimización de rendimiento

### Características Planeadas 🎯
- Arrastrar y soltar
- Atajos de teclado
- Modo sin conexión
- Filtros de búsqueda avanzados
- Características basadas en IA
- Capacidades de procesamiento de imágenes
- Exportación/Importación de datos

## Comenzando

1. Clonar el repositorio
```bash
git clone https://github.com/yourusername/image-manager.git
cd image-manager
```

2. Instalar dependencias
```bash
pnpm install
```

3. Configurar la base de datos
```bash
pnpm prisma generate
pnpm prisma db push
```

4. Iniciar el servidor de desarrollo
```bash
pnpm dev
```

5. Abrir [http://localhost:3000](http://localhost:3000) en el navegador

## Requisitos del Sistema

- Node.js 18 o superior
- Windows 11 (recomendado para mejor compatibilidad)
- SQLite 3

## Características Técnicas

### Base de Datos
- SQLite para almacenamiento local
- Prisma como ORM
- Esquema optimizado para rendimiento

### Frontend
- Next.js 15 con App Router
- React 19 con Server Components
- Tailwind CSS para estilos
- shadcn/ui para componentes de UI
- Zustand para gestión de estado

### Backend
- API Routes de Next.js
- Sistema de archivos nativo
- Monitoreo de carpetas en tiempo real
- Caché de metadatos
- Procesamiento de imágenes optimizado

## Contribuir

Las contribuciones son bienvenidas. Por favor, lee nuestra [Guía de Contribución](CONTRIBUTING.md) para más detalles.

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.
