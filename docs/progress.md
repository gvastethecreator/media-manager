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

#### 11/01/2024 - Integración de Nuevas Entidades en el Menú Contextual

Se ha completado la integración de las nuevas entidades en el menú contextual de archivos:

1. Álbumes

   - Creación de nuevos álbumes con emoji y color
   - Asignación de imágenes a álbumes existentes
   - Integración con el servicio y store correspondiente

2. Personajes

   - Creación de nuevos personajes con emoji y color
   - Asignación de imágenes a personajes existentes
   - Integración con el servicio y store correspondiente

3. Lugares

   - Creación de nuevos lugares con emoji y color
   - Asignación de imágenes a lugares existentes
   - Integración con el servicio y store correspondiente

4. Objetos
   - Creación de nuevos objetos con emoji y color
   - Asignación de imágenes a objetos existentes
   - Integración con el servicio y store correspondiente

Cambios técnicos realizados:

- Actualización de los stores para incluir métodos de addImageTo[Entity]
- Integración con los servicios correspondientes
- Implementación de manejo de errores y logging
- Actualización del menú contextual con las nuevas opciones
- Integración con el sistema de eventos para actualización en tiempo real

#### 11/01/2024 - Corrección de Carga de Datos en el Menú Contextual

Se ha implementado la carga inicial de datos para todas las entidades en el menú contextual:

- Implementación de useEffect para cargar datos al montar el componente
- Carga paralela de álbumes, personajes, lugares y objetos
- Manejo de errores y logging durante la carga
- Optimización de rendimiento usando Promise.all para carga paralela
- Actualización automática de las listas en el menú contextual

#### 11/01/2024 - Actualización de Estilos del Breadcrumb

Se han actualizado los estilos del breadcrumb en el componente `ViewToolbar` para alinearse con la documentación oficial de shadcn/ui:

- Implementación de estilos consistentes en todos los elementos del breadcrumb
- Mejora en la legibilidad con tamaños de fuente y pesos adecuados
- Adición de estados hover para los enlaces
- Uso de colores de texto muted para elementos no interactivos
- Mantenimiento de la jerarquía visual con separadores consistentes

#### 12/01/2024 - Migración a Server Actions en Next.js 15

Se ha realizado una migración importante para adaptar la aplicación a Next.js 15:

1. Creación de Server Actions

   - Implementación de acciones del servidor para Places
   - Implementación de acciones del servidor para Objects
   - Implementación de acciones del servidor para Characters
   - Separación clara de la lógica cliente/servidor

2. Actualización de Stores

   - Migración del store de Places para usar Server Actions
   - Migración del store de Objects para usar Server Actions
   - Migración del store de Characters para usar Server Actions
   - Corrección de tipos y manejo de errores

3. Mejoras Técnicas

   - Implementación de revalidación de rutas
   - Optimización de llamadas al servidor
   - Mejora en el manejo de estados de carga
   - Corrección de errores de tipado

4. Cambios en la Arquitectura
   - Movimiento de lógica de Prisma al servidor
   - Implementación de patrón de Server Actions
   - Mejora en la estructura del proyecto
   - Optimización de rendimiento

#### 12/01/2024 - Plan de Implementación de Server Actions para Entidades Restantes

Se ha planificado la implementación de Server Actions para las entidades restantes:

1. Entidades a Migrar

   - Albums
   - Tags
   - Collections
   - Folders
   - Profiles

2. Componentes a Actualizar

   - Vistas de configuración
   - Componentes de lista
   - Componentes de detalle
   - Menús contextuales
   - Formularios de edición

3. Servicios y Stores

   - Migración de servicios a Server Actions
   - Actualización de stores para usar Server Actions
   - Implementación de tipos y validaciones
   - Optimización de consultas Prisma

4. Mejoras de Sistema

   - Integración con sistema de eventos
   - Implementación de revalidación
   - Manejo de errores unificado
   - Optimización de rendimiento

5. Tareas Específicas

   - Crear Server Actions para cada entidad
   - Actualizar interfaces y tipos
   - Implementar manejo de errores
   - Optimizar consultas a base de datos
   - Actualizar documentación
   - Implementar pruebas

6. Consideraciones Técnicas

   - Mantener compatibilidad con eventos en tiempo real
   - Asegurar operaciones atómicas
   - Implementar rollback en errores
   - Mantener consistencia de estado
   - Optimizar rendimiento de consultas
   - Implementar caché donde sea necesario

7. Documentación
   - Actualizar README.md
   - Documentar nuevas APIs
   - Actualizar ejemplos de uso
   - Documentar patrones de migración

#### 12/01/2024 - Próximos Pasos para la Implementación de Server Actions

1. Actualización de Servicios

   - Migrar servicios existentes a Server Actions
   - Actualizar tipos y interfaces
   - Implementar manejo de errores consistente
   - Optimizar consultas a la base de datos

2. Actualización de Stores

   - Migrar stores para usar Server Actions
   - Implementar manejo de estado optimizado
   - Actualizar tipos y validaciones
   - Mejorar manejo de errores

3. Actualización de Componentes

   - Migrar componentes a usar los nuevos stores
   - Implementar manejo de estado de carga
   - Actualizar manejo de errores
   - Optimizar renderizado

4. Implementación de Sistema de Eventos

   - Integrar Server Actions con eventos
   - Implementar revalidación de rutas
   - Optimizar actualizaciones en tiempo real
   - Mejorar manejo de caché

5. Pruebas y Documentación

   - Implementar pruebas unitarias
   - Actualizar documentación de API
   - Documentar patrones de uso
   - Crear ejemplos de implementación

6. Optimización y Rendimiento

   - Optimizar consultas a la base de datos
   - Implementar caché donde sea necesario
   - Mejorar tiempos de respuesta
   - Reducir uso de memoria

7. Despliegue y Monitoreo
   - Implementar logging mejorado
   - Configurar monitoreo de rendimiento
   - Establecer métricas de éxito
   - Planificar rollback en caso necesario
