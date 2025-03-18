# Análisis de Estructura de Carpetas

## Estado Actual

La estructura de carpetas del proyecto Image Manager muestra una organización basada en responsabilidades, pero con algunas inconsistencias y oportunidades de mejora. A continuación se presenta un análisis detallado de las principales carpetas:

### 1. Carpeta `lib/`

La carpeta `lib/` contiene utilidades, helpers y funcionalidades compartidas, pero ha crecido considerablemente, mezclando diferentes tipos de responsabilidades:

- **Funcionalidades de procesamiento de imágenes**: `thumbnail.ts`, `image.ts`, `image-processing.ts`
- **Utilidades generales**: `utils.ts`, `hash.ts`, `format.ts`
- **Gestión de caché**: `cache.ts`, carpeta `cache/`
- **Configuración y logging**: `logger.ts`, `logger.config.ts`
- **Integración con base de datos**: `prisma.ts`, `db.ts`
- **Sistema de eventos**: `events.ts`, carpetas `events/`, `client/`, `server/`

Existe una mezcla de archivos sueltos y subcarpetas, lo que dificulta la localización de funcionalidades específicas.

### 2. Carpeta `store/`

La carpeta `store/` contiene los stores de Zustand para gestión de estado, con una buena organización temática:

- **Stores específicos por entidad**: `albums.store.ts`, `characters.store.ts`, etc.
- **Componentes de estado reutilizables**: `base.store.ts`, `store.factory.ts`
- **Stores para funcionalidades específicas**: `file-manager.store.ts`, `image-viewer.store.ts`

Sin embargo, hay algunas inconsistencias en la forma en que los stores están implementados y algunas funcionalidades que podrían agruparse mejor.

### 3. Carpeta `types/`

La carpeta `types/` contiene definiciones de tipos TypeScript, pero con algunas superposiciones:

- **Tipos específicos por entidad**: archivos dispersos como `files.ts`, `folders.ts`, etc.
- **Tipos para características específicas**: `thumbnails.ts`, `metadata.ts`
- **Tipos de UI**: `ui.d.ts`
- **Tipos globales y extensiones**: `global.d.ts`

Hay duplicación potencial entre los tipos definidos aquí y los definidos en otras partes de la aplicación.

### 4. Carpeta `services/`

La carpeta `services/` contiene servicios para lógica de negocio, con una buena separación por responsabilidad:

- **Servicios específicos por entidad**: `folder.service.ts`, `image.service.ts`, etc.
- **Servicios base**: `base.service.ts`
- **Servicios de utilidad**: `fs.server.ts`, `image-converter.service.ts`

### 5. Carpeta `app/actions/`

La carpeta `app/actions/` contiene Server Actions para operaciones del servidor:

- **Acciones específicas por entidad**: `album.actions.ts`, `folder.actions.ts`, etc.
- **Acciones de sistema**: `stats.actions.ts`, `thumbnails.actions.ts`
- **Acciones base y utilidades**: `base.actions.ts`

La implementación es bastante consistente, pero hay algunas redundancias y falta de modularidad en archivos grandes.

## Problemas Identificados

1. **Falta de Modularidad Clara**:

   - La carpeta `lib/` ha crecido demasiado y mezcla diferentes responsabilidades
   - Algunos archivos son excesivamente grandes (ej. `folder.actions.ts` con 1100+ líneas)

2. **Inconsistencia en Nombrado y Estructura**:

   - Mezcla de archivos sueltos y carpetas para conceptos relacionados
   - Variaciones en el formato de nombrado (singular vs plural)

3. **Superposición de Responsabilidades**:

   - Algunas funcionalidades están divididas entre `lib/`, `services/` y `app/actions/`
   - Existe duplicación potencial entre tipos en `types/` y otras partes

4. **Navegabilidad Reducida**:
   - Difícil localizar funcionalidades específicas sin buscar en múltiples lugares
   - Falta de un patrón claro para saber dónde buscar ciertos tipos de código

## Propuesta de Reorganización

### 1. Reestructuración por Dominios y Responsabilidades

```
src/
├─ domains/                 # Organizado por dominios de negocio
│  ├─ images/               # Todo lo relacionado con imágenes
│  │  ├─ actions/           # Server actions relacionadas con imágenes
│  │  ├─ components/        # Componentes específicos para imágenes
│  │  ├─ services/          # Servicios para procesamiento de imágenes
│  │  ├─ stores/            # Stores Zustand para estado de imágenes
│  │  ├─ types.ts           # Tipos para el dominio de imágenes
│  │  ├─ utils.ts           # Utilidades específicas para imágenes
│  │  └─ hooks.ts           # Hooks relacionados con imágenes
│  │
│  ├─ files/                # Todo lo relacionado con archivos
│  ├─ collections/          # Todo lo relacionado con colecciones
│  ├─ entities/             # Entidades comunes (tags, folders, etc)
│  └─ thumbnails/           # Sistema de miniaturas
│
├─ core/                    # Funcionalidades core de la aplicación
│  ├─ api/                  # Cliente API y utilidades
│  ├─ auth/                 # Autenticación y autorización
│  ├─ cache/                # Sistema de caché
│  ├─ config/               # Configuración de la aplicación
│  ├─ database/             # Acceso a base de datos
│  ├─ events/               # Sistema de eventos
│  │  ├─ client/            # Implementación cliente
│  │  ├─ server/            # Implementación servidor
│  │  └─ types.ts           # Tipos compartidos para eventos
│  ├─ logging/              # Sistema de logging
│  └─ types/                # Tipos core compartidos
│
├─ ui/                      # Componentes de UI y diseño
│  ├─ components/           # Componentes reutilizables
│  │  ├─ common/            # Componentes básicos (botones, inputs, etc)
│  │  ├─ layout/            # Componentes de layout
│  │  └─ feedback/          # Componentes de feedback (alertas, toast, etc)
│  ├─ hooks/                # Hooks relacionados con UI
│  ├─ styles/               # Estilos globales
│  └─ themes/               # Configuración de temas
│
├─ utils/                   # Utilidades generales
│  ├─ date/                 # Utilidades para fechas
│  ├─ formatting/           # Utilidades para formato
│  ├─ validation/           # Validaciones generales
│  └─ misc/                 # Otras utilidades
│
├─ store/                   # Configuración central de stores
│  ├─ index.ts              # Exportación central de stores
│  ├─ middlewares/          # Middlewares compartidos
│  └─ factory.ts            # Factory para crear stores
│
├─ app/                     # Rutas y páginas de Next.js
│  ├─ api/                  # API routes
│  └─ ...                   # Páginas por ruta
```

### 2. Refactorización de Archivos Grandes

Dividir los archivos grandes en módulos más pequeños y enfocados:

```typescript
// Antes: un archivo grande folder.actions.ts

// Después: dividido en varios archivos
// domains/files/actions/folder-create.actions.ts
// domains/files/actions/folder-update.actions.ts
// domains/files/actions/folder-delete.actions.ts
// domains/files/actions/folder-query.actions.ts
// domains/files/actions/index.ts (para re-exportar todo)
```

### 3. Estandarización de Patrones

Implementar patrones consistentes para:

- **Nombrado**: Usar consistentemente singular para conceptos (ej. `image` vs `images`)
- **Organización**: Agrupar funcionalidades relacionadas en carpetas vs archivos
- **Exportaciones**: Implementar archivos barrel (`index.ts`) para cada módulo

### 4. Modularización del Sistema de Imágenes

El procesamiento de imágenes es una parte central y compleja de la aplicación que merece su propia estructura:

```
domains/images/
├─ processing/                  # Procesamiento de imágenes
│  ├─ sharp/                    # Operaciones con Sharp
│  ├─ metadata/                 # Extracción de metadatos
│  └─ formats/                  # Soporte para diferentes formatos
│
├─ thumbnails/                  # Sistema de miniaturas
│  ├─ generation/               # Generación de miniaturas
│  ├─ storage/                  # Almacenamiento de miniaturas
│  ├─ queue/                    # Cola de procesamiento
│  └─ cache/                    # Caché de miniaturas
│
├─ viewer/                      # Visualizador de imágenes
│  ├─ components/               # Componentes del visor
│  └─ store/                    # Estado del visor
```

## Plan de Implementación

1. **Fase 1: Reorganización de Alto Nivel**

   - Crear la nueva estructura de carpetas
   - Mover archivos a sus nuevas ubicaciones manteniendo funcionalidad
   - Actualizar imports para reflejar la nueva estructura

2. **Fase 2: Refactorización de Módulos Grandes**

   - Identificar archivos con más de 300 líneas
   - Dividir en módulos más pequeños y enfocados
   - Implementar archivos index.ts para exportaciones

3. **Fase 3: Estandarización**

   - Aplicar patrones de nombrado consistentes
   - Revisar y consolidar tipos duplicados
   - Documentar la nueva estructura y convenciones

4. **Fase 4: Optimización**
   - Identificar y eliminar código duplicado
   - Mejorar la organización interna de cada módulo
   - Implementar lazy loading donde sea apropiado

## Beneficios Esperados

1. **Mejor Navegabilidad**: Localización más intuitiva de funcionalidades
2. **Mantenibilidad Mejorada**: Archivos más pequeños y enfocados
3. **Escalabilidad**: Estructura que soporta mejor el crecimiento futuro
4. **Colaboración**: Más fácil para nuevos desarrolladores entender la estructura
5. **Modularidad**: Componentes claramente separados por responsabilidad

## Riesgos y Consideraciones

1. **Esfuerzo de Migración**: La reorganización requiere actualizar numerosos imports
2. **Compatibilidad con Next.js**: Asegurar que la nueva estructura respete las convenciones de Next.js
3. **Curva de Aprendizaje**: Tiempo para que el equipo se adapte a la nueva estructura

## Conclusión

La reorganización propuesta mejorará significativamente la claridad, mantenibilidad y escalabilidad del proyecto. Al agrupar el código por dominios y responsabilidades, será más intuitivo localizar funcionalidades específicas y entender cómo interactúan los diferentes componentes del sistema.

La estructura orientada a dominios también facilitará futuras expansiones al proporcionar un patrón claro para añadir nuevas características.
