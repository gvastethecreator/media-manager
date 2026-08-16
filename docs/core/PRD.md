# PRD · Image Manager

**Versión documental:** 2026-03-31  
**Estado del producto:** desarrollo activo  
**Tipo de producto:** aplicación local web/desktop para gestión multimedia avanzada

## 1. Resumen del producto

Image Manager es una aplicación local orientada a **catalogar, enriquecer, organizar y navegar colecciones grandes de archivos multimedia** sin exigir moverlos de su ubicación física original. El producto combina un explorador de contenido, un sistema de metadatos enriquecidos y un conjunto amplio de entidades semánticas para organización creativa y worldbuilding.

El sistema no se limita a “mostrar carpetas”; su propuesta de valor es unificar:

- organización física del filesystem,
- organización lógica en base de datos,
- visualización rica por tipo de archivo,
- metadatos y relaciones entre entidades,
- herramientas de mantenimiento como reindexado, thumbnails, cachés y búsqueda.

## 2. Problema que resuelve

Los usuarios que trabajan con miles de archivos suelen tener tres problemas simultáneos:

1. **La estructura de carpetas no basta** para encontrar o clasificar contenido.
2. **Los metadatos nativos no son suficientes** para flujos creativos complejos.
3. **Las bibliotecas grandes degradan la experiencia** si no hay virtualización, previews y búsquedas rápidas.

Image Manager responde a esto con un modelo híbrido:

- respeta la ubicación real de los archivos,
- guarda conocimiento adicional en SQLite,
- expone vistas y relaciones ricas por entidad,
- automatiza parte del trabajo pesado mediante indexación y extracción de metadata.

## 3. Usuarios objetivo

### Primarios

- Artistas digitales con bibliotecas de referencias o salidas generadas por IA.
- Creadores audiovisuales con archivos mixtos: imágenes, video, audio y documentos.
- Usuarios que necesitan clasificar material por campañas, colecciones o temas.

### Secundarios

- Equipos o individuos de worldbuilding: personajes, lugares, conceptos y objetos.
- Desarrolladores creativos que necesitan relacionar media con entidades narrativas.
- Usuarios que prefieren una herramienta local, autocontenida y sin dependencia cloud.

## 4. Objetivos del producto

### Objetivos funcionales

- Importar e indexar carpetas locales con persistencia estructurada.
- Gestionar múltiples tipos de archivo desde una sola interfaz.
- Permitir clasificación transversal mediante tags, álbumes, colecciones y grupos.
- Facilitar la exploración visual mediante thumbnails, vistas, paneles y viewers especializados.
- Soportar modelos creativos avanzados como worldbuilding y prompts.

### Objetivos técnicos

- Mantener la aplicación operativa sobre bibliotecas medianas o grandes.
- Reducir trabajo repetitivo con reindexado incremental y utilidades de caché.
- Asegurar una base extensible con TypeScript, servicios por dominio y esquema Drizzle segmentado.
- Permitir ejecución tanto en navegador local como en escritorio vía Tauri.

## 5. Alcance funcional

### 5.1 Tipos de contenido soportados

- Imágenes
- Videos
- Audios
- Documentos
- JSON
- Archivos 3D
- Imágenes subidas

### 5.2 Entidades organizativas

- Carpetas
- Tags
- Álbumes
- Colecciones
- Grupos
- Favoritos
- Profiles
- Settings

### 5.3 Entidades creativas y de conocimiento

- Characters
- Places
- Concepts
- World Items
- Prompts
- Notes
- Properties
- Tasks
- Wildcards

### 5.4 Capacidades transversales

- Reindexado total y por carpeta
- Reindexado incremental por hashes/cambios
- Búsqueda global y FTS con fallback
- Extracción de metadatos
- Generación y consulta de thumbnails
- Operaciones sobre archivos y descargas
- Seguimiento de actividad, cola y eventos

## 6. Casos de uso clave

### Caso 1 · Explorar una carpeta con previews

1. El usuario abre una carpeta indexada.
2. La app carga archivos y subcarpetas con datos agregados.
3. Se muestran previews, conteos y accesos a detalles.
4. El usuario navega sin cargar toda la colección en DOM gracias a virtualización.

### Caso 2 · Organizar contenido con relaciones

1. El usuario selecciona imágenes o videos.
2. Les asigna tags, favoritos, álbumes o relaciones narrativas.
3. La base de datos conserva esa organización sin alterar la ruta física original.

### Caso 3 · Reindexar una biblioteca viva

1. Cambian archivos en disco.
2. El usuario lanza un reindexado.
3. El sistema detecta contenido nuevo, cambiado o ausente.
4. Se actualizan hashes, metadatos y thumbnails.

### Caso 4 · Usar el producto como escritorio local

1. El usuario inicia Tauri.
2. La UI React se ejecuta en WebView.
3. El backend Express opera como capa de servicios local.
4. Tauri aporta integración nativa para operaciones del escritorio.

## 7. Requerimientos funcionales

### Ingesta e indexación

| ID    | Requerimiento                                                            |
| ----- | ------------------------------------------------------------------------ |
| RF-01 | Registrar carpetas raíz y subcarpetas en el índice local                 |
| RF-02 | Detectar tipos de archivo soportados y mapearlos a entidades             |
| RF-03 | Permitir reindexado total y por carpeta                                  |
| RF-04 | Permitir reindexado incremental cuando el flujo lo soporte               |
| RF-05 | Mantener previews y metadatos alineados con el estado físico del archivo |

### Exploración y visualización

| ID    | Requerimiento                                              |
| ----- | ---------------------------------------------------------- |
| RF-06 | Proveer múltiples vistas para navegar entidades y archivos |
| RF-07 | Mostrar paneles laterales y detalles contextuales          |
| RF-08 | Incluir visores especializados por tipo de contenido       |
| RF-09 | Permitir obtener thumbnail u original cuando aplique       |

### Organización semántica

| ID    | Requerimiento                                                |
| ----- | ------------------------------------------------------------ |
| RF-10 | Crear, editar y eliminar tags, álbumes, colecciones y grupos |
| RF-11 | Relacionar media con entidades de worldbuilding              |
| RF-12 | Marcar favoritos y administrar perfiles/configuraciones      |
| RF-13 | Guardar notas, prompts, wildcards, tasks y propiedades       |

### Búsqueda y consulta

| ID    | Requerimiento                                                 |
| ----- | ------------------------------------------------------------- |
| RF-14 | Ejecutar búsqueda global por texto                            |
| RF-15 | Ofrecer búsqueda FTS cuando esté disponible                   |
| RF-16 | Hacer fallback a búsqueda LIKE cuando FTS no esté disponible  |
| RF-17 | Exponer filtros por carpeta, favoritos y atributos relevantes |

### Operación del sistema

| ID    | Requerimiento                                                       |
| ----- | ------------------------------------------------------------------- |
| RF-18 | Exponer endpoints de salud, estadísticas, actividad, cola y eventos |
| RF-19 | Proveer logging estructurado y herramientas de depuración           |
| RF-20 | Permitir operación local web y modo escritorio                      |

## 8. Requerimientos no funcionales

### Rendimiento

- Virtualizar listas o grids voluminosos.
- Cargar vistas pesadas mediante lazy loading.
- Mantener thumbnails, cachés y consultas razonablemente eficientes.
- Evitar bloqueos prolongados de UI durante reindexado o procesamiento.

### Calidad y mantenibilidad

- TypeScript estricto en frontend y backend.
- Servicios y rutas segmentados por dominio.
- Documentación técnica suficiente para mantenimiento.
- Scripts de build, test, lint y chequeo reproducibles.

### Fiabilidad

- Manejo de errores tipado en la capa Effect donde aplica.
- Logs útiles para reproducir fallos operativos.
- Compatibilidad con testing unitario, integración y E2E.

### Portabilidad

- Soporte local multiplataforma.
- Modo web local.
- Empaquetado de escritorio con Tauri.

## 9. Restricciones y decisiones de producto

- La aplicación es **local-first**; no está pensada como SaaS multiusuario.
- La organización lógica no debe forzar cambios en la organización física.
- El sistema debe tolerar coexistencia de capas nuevas y heredadas mientras evoluciona.
- La base de datos es SQLite/libsql, lo que simplifica despliegue local y respaldo.

## 10. Riesgos de producto

- Complejidad creciente del dominio por la cantidad de entidades.
- Documentación histórica parcialmente desalineada si no se mantiene una fuente de verdad clara.
- Convivencia de providers, servicios y utilidades de distintas épocas del proyecto.
- Coste operacional de thumbnails, reindexados y viewers pesados cuando la biblioteca escala.

## 11. Qué no intenta resolver hoy

- Sincronización cloud colaborativa en tiempo real.
- Multiusuario remoto con permisos complejos.
- Plataforma SaaS centralizada.
- Orquestación distribuida o microservicios.

## 12. Indicadores de éxito razonables

- El usuario puede indexar y volver a encontrar contenido sin depender solo del árbol físico.
- El producto soporta bibliotecas heterogéneas con navegación fluida.
- El mantenimiento técnico se apoya en rutas, servicios y documentación comprensibles.
- Las operaciones críticas del sistema pueden auditarse mediante logs, tests y scripts.

## 13. Documentos relacionados

- [`./ARCHITECTURE.md`](./ARCHITECTURE.md)
- [`./REPOSITORY-MAP.md`](./REPOSITORY-MAP.md)
- [`./DATABASE-SCHEMA.md`](./DATABASE-SCHEMA.md)
- [`./FRONTEND-GUIDE.md`](./FRONTEND-GUIDE.md)
- [`./SERVICES-GUIDE.md`](./SERVICES-GUIDE.md)
- [`./IMPLEMENTATION-DETAILS.md`](./IMPLEMENTATION-DETAILS.md)
