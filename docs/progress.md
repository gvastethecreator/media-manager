# NO BORRAR

Este proyecto es una aplicación moderna de gestión y visualización de archivos multimedia diseñada para proporcionar una experiencia fluida y eficiente en la organización y visualización de grandes colecciones de medios locales.

# Stack Tecnológico

## Front End

- **Next.js 15** - con App Router
- **React 19** - con Server Components
- **Tailwind CSS** - para estilos
- **shadcn/ui** - para componentes de UI
- **Zustand** - para gestión de estado
- **Jest** - para testing
- **Motion** - para animaciones
- **Lucide React** - para iconos
- **Typescript** - para tipado estático

## Back End

- **SQLite 3** - para base de datos local
- **Prisma ORM** - para ORM
- **Next.js API Routes** - para endpoints
- **Node.js fs/promises** - para manipulación de archivos

### Otras dependencias

- **Event Source Polyfill** - para soporte de eventos en navegadores antiguos
- **Event Source Stream** - para soporte de eventos en navegadores antiguos
- **Tanstack Query** - para gestión de datos
- **Bull** - para procesamiento de imágenes
- **Chokidar** - para monitoreo de cambios en carpetas
- **Exifr** - para extraer metadatos de imágenes
- **Sharp** - para procesamiento de imágenes
- **React Scan** - para debug de renderizado
- **React Color** - para color picker
- **Next Themes** - para gestión de temas
- **Eslint** - para linting

## 📝 Documentación del Proyecto (05/01/2024)

### 🎯 Tarea Actual: Documentación Detallada de Servicios y Componentes

#### Objetivo

- Crear documentación detallada de cada servicio y componente del proyecto
- Organizar la documentación en una estructura clara y mantenible
- Facilitar el entendimiento y mantenimiento del código

#### Estructura de Documentación

```
docs/
├── services/        # Documentación de servicios
│   ├── image-service.md
│   ├── thumbnail-service.md
│   ├── files-service.md
│   ├── folder-service.md
│   ├── watcher-service.md
│   ├── collection-service.md
│   ├── tag-service.md
│   └── favorite-service.md
├── components/      # Documentación de componentes
├── FRONTEND.md     # Guía general frontend
├── BACKEND.md      # Guía general backend
└── PRD.md         # Documento de requerimientos
```

#### Plan de Trabajo

1. **Análisis Inicial**

   - [x] Revisión de estructura actual
   - [x] Creación de carpetas de documentación
   - [x] Identificación de servicios principales
   - [ ] Identificación de componentes clave

2. **Documentación de Servicios**

   - [x] Servicio de Imágenes
   - [x] Servicio de Thumbnails
   - [x] Servicio de Archivos
   - [x] Servicio de Carpetas
   - [x] Servicio de Monitoreo
   - [x] Servicio de Colecciones
   - [x] Servicio de Etiquetas
   - [x] Servicio de Favoritos
   - [ ] Servicio de Búsqueda
   - [ ] Servicio de Estadísticas
   - [ ] Servicio de Perfiles
   - [ ] Servicio de Usuarios

3. **Documentación de Componentes**

   - [ ] Componentes de Layout
   - [ ] Componentes de Vista
   - [ ] Componentes de UI
   - [ ] Componentes de Features
   - [ ] Componentes Core

4. **Revisión y Validación**
   - [ ] Verificación de completitud
   - [ ] Validación de exactitud
   - [ ] Actualización de referencias

#### Estado Actual

- [x] Creadas carpetas base
- [x] Documentados 8 servicios principales
- [x] Añadidos diagramas de flujo a servicios
- [x] Documentados servicios restantes
- [ ] Pendiente documentación de componentes

#### Mejoras en Documentación

1. **Diagramas de Flujo**

   - Añadidos diagramas Mermaid para visualización de procesos
   - Documentados flujos principales de cada servicio
   - Incluidos escenarios de error y casos especiales
   - Mejorada comprensión de la arquitectura

2. **Servicios Actualizados**

   - Servicio de Imágenes: 4 diagramas
   - Servicio de Thumbnails: 4 diagramas
   - Servicio de Archivos: 4 diagramas
   - Servicio de Carpetas: 4 diagramas
   - Servicio de Monitoreo: 4 diagramas
   - Servicio de Colecciones: 4 diagramas
   - Servicio de Etiquetas: 4 diagramas
   - Servicio de Favoritos: 4 diagramas

3. **Tipos de Diagramas**
   - Flujos de proceso principales
   - Sistemas de caché y optimización
   - Manejo de errores
   - Integración entre servicios

#### Próximos Pasos

1. Comenzar con la documentación de componentes core
2. Establecer plantillas de documentación
3. Integrar con documentación existente
4. Revisar y validar documentación

#### Servicios Documentados

1. **Servicio de Imágenes**

   - Procesamiento de imágenes
   - Gestión de thumbnails
   - Sistema de caché
   - Optimizaciones

2. **Servicio de Thumbnails**

   - Generación de miniaturas
   - Sistema de cola
   - Monitoreo y estadísticas
   - Optimizaciones

3. **Servicio de Archivos**

   - Gestión de archivos
   - Mapeo de tipos
   - Relaciones y metadata
   - Optimizaciones

4. **Servicio de Carpetas**

   - Indexación de carpetas
   - Sistema de callbacks
   - Monitoreo de progreso
   - Gestión de errores

5. **Servicio de Monitoreo**

   - Observación de cambios
   - Sistema de eventos
   - Cliente/Servidor
   - Optimizaciones

6. **Servicio de Colecciones**

   - Organización de imágenes
   - Metadatos personalizados
   - Estadísticas integradas
   - Gestión eficiente

7. **Servicio de Etiquetas**

   - Categorización flexible
   - Sistema de colores
   - Atajos de teclado
   - Búsqueda integrada

8. **Servicio de Favoritos**

   - Marcado de imágenes
   - Gestión por usuario
   - Acceso rápido
   - Estadísticas personales

9. **Servicio de Estadísticas**

   - Tracking de eventos
   - Rankings y métricas
   - Sistema de caché
   - Análisis de uso

10. **Servicio de Perfiles**

    - Gestión de preferencias
    - Temas y personalización
    - Sincronización
    - Activación/Desactivación

11. **Servicio de Usuarios**
    - Gestión de cuentas
    - Relaciones con recursos
    - Validaciones
    - Seguridad

#### Stack Tecnológico

##### Frontend

- Next.js 15 (App Router)
- React 19 (Server Components)
- Tailwind CSS
- Zustand
- TanStack Query

##### Backend

- SQLite 3
- Prisma ORM
- Next.js API Routes
- Node.js fs/promises

##### Herramientas

- Sharp (Procesamiento de imágenes)
- Chokidar (Monitoreo de archivos)
- Bull (Colas de trabajo)
- EventSource (Eventos en tiempo real)

#### Notas Importantes

- Los servicios están bien estructurados y documentados
- Se mantiene un patrón consistente en la documentación
- Se identifican áreas de mejora en cada servicio
- La documentación incluye tipos, interfaces y ejemplos
- Cada servicio tiene su propia documentación detallada
- Se mantiene consistencia en el formato y estructura
- Se incluyen ejemplos de código y tipos
- Se documentan áreas de mejora y optimizaciones

# EDITAR A PARTIR DE ACA
