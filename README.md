# MOKLOS MEDIA MANAGER

Moklos Media Manager esta pensado como un organizador de medios para la vida.
Podemos organizar nuestras imagenes basandonos en diferentes categorias como carpetas como la principal fuente que luego podremos usar para asignarles albumes, colecciones, tags, personajes, lugares, items, notas, conceptos, etc.

Estamos en pleno desarrollo y todavía hay muchas funcionalidades que se irán agregando.

## Stack

- Nextjs 15.2
- Shadcn UI
- Tailwind CSS 4
- TypeScript
- Drizzle ORM (migrado desde Prisma)

## Features :

- Agregar carpetas
- Visor de imagenes
- Navegador de archivos (por ahora sin soporte de subcarpetas)
- Thumbnails
- Extracción de metadata de las imagenes
- Sistema de Entity Cards para distintos tipos de entidades
- Configuración avanzada de tarjetas con sistema modular
- Sistema de formularios estandarizado para una mejor experiencia de usuario
- Base de datos SQLite con Drizzle ORM para mejor rendimiento

## Sistema de Entity Cards

El proyecto incluye un sistema avanzado de tarjetas para representar diferentes tipos de entidades como álbumes, colecciones, personajes y más. Características principales:

- **Configuración por capas**: Sistema modular con capas configurables
- **Efectos visuales**: Amplia gama de efectos visuales y avanzados
- **Backside**: Soporte para cara posterior de tarjetas
- **Performance optimizado**: Opciones de rendimiento configurables
- **Formularios estandarizados**: Sistema consistente para configuración de tarjetas
- **Layouts flexibles**: Estructuras de layouts reutilizables

### Sistema de Formularios

Hemos implementado un sistema estandarizado para la integración entre formularios y layouts:

- **Componentes de layout**: `FormLayout`, `FormSection`, `FormRow`, `FormGroup`
- **Componentes de campo**: `FormToggle`, `FormSlider`, `FormSelect`, `FormInput`
- **Características**:
  - Soporte para esquemas de colores
  - Animaciones sutiles
  - Tooltips para información adicional
  - Mensajes de error
  - Diseño responsivo

### Sistema de Logging Avanzado

La aplicación cuenta con un sistema de logging avanzado que facilita la depuración y el monitoreo:

- **EnhancedLogger**: Logger mejorado con soporte para colores, iconos y métodos avanzados.
- **ServerLogger**: Logger optimizado para entornos de servidor con estilos ANSI.
- **ApiLogger**: Logger específico para rutas API.
- **ActionLogger**: Wrapper para Server Actions con logging mejorado.
- **LogViewer**: Componente UI para visualizar logs en la interfaz.

Para más detalles, consulta la [documentación del sistema de logging](docs/logging-architecture.md).

## Future Plans:

- Agregar soporte para subcarpetas
- Agregar soporte para videos
- Agregar soporte para audios
- Agregar soporte para documentos
- Agregar soporte para PDFs
- Chat con IA
- Crear entidades nuevas
- Mejores cartas
- Mapas de relaciones
- Mapas de entidades
- Mejores animaciones
