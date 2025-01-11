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

## 📝 Documentación del Proyecto

## 🚀 Progreso

### Últimas 4 tareas, si hay mas deben ir a changelog.md al final del archivo

#### 11/01/2024 - Integración de Nuevas Entidades en el Panel de Navegación

Se han integrado las siguientes entidades en el panel de navegación:

- Álbumes (Albums)
- Personajes (Characters)
- Lugares (Places)
- Objetos (Objects)

Cambios realizados:

1. Actualización del store de gestión de archivos (FileManager)

   - Nuevos estados para las entidades
   - Nuevas acciones de navegación
   - Actualización de la inicialización

2. Actualización del panel de navegación

   - Nuevas categorías con iconos y colores
   - Contadores de elementos
   - Navegación entre vistas

3. Preparación de componentes de vista
   - Estructura base para las nuevas vistas
   - Integración en el contenedor de vistas
   - Animaciones de transición

Próximos pasos:

- Implementar la lógica de las nuevas vistas
- Crear los servicios de API correspondientes
- Agregar funcionalidad de gestión para cada entidad

#### 12/01/2024 - Implementación de Secciones de Personajes, Lugares y Objetos

Estado actual:

1. Sección de Personajes (Characters)

   - ✅ Implementación completa del componente
   - ✅ Servicio y store funcionales
   - ✅ CRUD completo de personajes
   - ✅ Gestión de imágenes asociadas
   - ✅ Error de tipado resuelto con tipo local EmojiClickData

2. Sección de Lugares (Places)

   - ✅ Actualización del modelo en schema.prisma
   - ✅ Implementación del servicio y store
   - ✅ Implementación del componente
   - ✅ CRUD completo de lugares
   - ✅ Gestión de imágenes asociadas
   - ✅ Migración de base de datos aplicada

3. Sección de Objetos (Objects)
   - ✅ Actualización del modelo en schema.prisma
   - ✅ Implementación del servicio y store
   - ✅ Implementación del componente
   - ✅ CRUD completo de objetos
   - ✅ Gestión de imágenes asociadas
   - ✅ Migración de base de datos aplicada

Próximos pasos:

1. Realizar pruebas de integración
2. Documentar el uso de cada sección
3. Optimizar el rendimiento si es necesario
4. Considerar mejoras en la interfaz de usuario

#### 20/01/2024 - Implementación de Vistas de Información para Todas las Entidades

Estado actual:

1. Vistas Implementadas:
   - ✅ all-images-info
   - ✅ favorites-info
   - ✅ search-info
   - ✅ collection-content-info
   - ✅ folder-content-info
   - ✅ tag-content-info
   - ✅ album-content-info
   - ✅ character-content-info
   - ✅ place-content-info
   - ✅ object-content-info

Objetivos Completados:

1. ✅ Implementar todas las vistas de información faltantes
2. ✅ Mantener consistencia en el diseño y UX
3. ✅ Asegurar tipado correcto y manejo de errores
4. ✅ Integrar con el panel de información principal

Próximos pasos:

- [x] Crear interfaces para cada tipo de entidad
- [x] Implementar componentes de vista
- [x] Integrar con el store correspondiente
- [ ] Realizar pruebas de integración
- [ ] Documentar el uso de cada vista

Notas de la implementación:

1. Se han creado componentes reutilizables para cada tipo de vista
2. Se mantiene un diseño consistente en todas las vistas
3. Se han agregado interfaces TypeScript para mejor tipado
4. Se han incluido características específicas para cada tipo de entidad:
   - Lugares: región, clima, peligros, recursos
   - Personajes: edad, género, ocupación
   - Objetos: tipo, material, propiedades, usos
   - Álbumes: descripción, etiquetas
   - Carpetas: ruta, tamaño
   - Etiquetas: color, conteo

#### 20/01/2024 - Implementación del Panel de Información de Configuración

Estado actual:

1. Panel de Configuración:

   - ✅ Creación del componente SettingsInfo
   - ✅ Integración de ShortcutsSection
   - ✅ Integración de SystemSection
   - ✅ Actualización del InfoPanel

2. Características implementadas:

   - Vista de atajos de teclado
   - Monitoreo del sistema
   - Estado de recursos
   - Acciones de mantenimiento

3. Mejoras:
   - Diseño consistente con otros paneles
   - Reutilización de componentes existentes
   - Integración con el sistema de navegación

Próximos pasos:

- [ ] Agregar más métricas del sistema
- [ ] Implementar acciones de mantenimiento
- [ ] Mejorar la visualización de recursos
- [ ] Agregar tooltips informativos

# Registro de Progreso

## Última Actualización

### Base de Datos

- ✅ Actualización del modelo Place con nuevos campos
  - Agregado campo `region` para ubicación geográfica
  - Agregado campo `dangers` para lista de peligros
  - Agregado campo `resources` para lista de recursos
  - Agregado campo `lore` para historia y mitología
  - Agregado índice para búsqueda por región

### Documentación

- ✅ Creada documentación detallada del schema
- ✅ Actualizado README principal
- ✅ Documentados nuevos modelos y relaciones

### Próximos Pasos

- [ ] Implementar validaciones para campos JSON
- [ ] Agregar enums para climate y type
- [ ] Mejorar la documentación de la API
- [ ] Crear guías de usuario

## Historial de Cambios

### [2024-01-20]

- Actualización del modelo Place
- Mejora en la documentación
- Corrección de errores en el seed

### [2024-01-19]

- Implementación inicial de modelos base
- Configuración del proyecto
- Creación de estructura inicial

## Tareas Pendientes

### Alta Prioridad

- [ ] Implementar sistema de búsqueda por región
- [ ] Agregar validaciones de datos
- [ ] Mejorar el rendimiento de consultas

### Media Prioridad

- [ ] Crear vistas para nuevos campos
- [ ] Implementar filtros avanzados
- [ ] Mejorar la UI de gestión de lugares

### Baja Prioridad

- [ ] Agregar más ejemplos en la documentación
- [ ] Optimizar consultas de base de datos
- [ ] Mejorar la cobertura de pruebas
