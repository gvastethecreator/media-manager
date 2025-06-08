# Sistema de Gestión de Imágenes

## Descripción

Sistema completo para la gestión y organización de activos digitales, incluyendo imágenes, videos y metadatos asociados. Proporciona una interfaz moderna e intuitiva para administrar, categorizar y buscar todo tipo de contenido multimedia.

## Tecnologías

- **Next.js 15.3.3** - Framework de React con App Router
- **React 19** - Biblioteca de UI
- **Prisma** - ORM para acceso a base de datos (futura migración a Drizzle)
- **Tailwind CSS 4** - Framework de estilos
- **Shadcn/UI** - Componentes de UI integrados con Tailwind 4
- **Zustand** - Gestión de estado
- **Server Actions** - Acciones del servidor para operaciones CRUD
- **Motion** - Animaciones fluidas
- **Stores** consumen directamente las Server Actions eliminando llamadas a la API REST
- **PlaceStore** usa `getPlaces` y `getPlace` para cargar datos sin `fetch`
- **VisualConfig** y estadísticas de debug se obtienen ahora mediante Server Actions
- **Videos** gestionan su configuración visual con Server Actions
- **File Manager** consolidado; carga imágenes y colecciones únicamente mediante Server Actions
- **Legacy file-manager.store.ts** eliminado; se usa solo `unified-file-manager.store.ts`
- **ImageStore** ahora usa getImage y getImages directamente desde Server Actions
- **Stores** ya no importan tipos de Prisma, previniendo errores de bundler en el cliente
- **Entities Cards** permite ajustar efectos de tarjetas para personajes, lugares y objetos
- **Todas las configuraciones fueron auditadas y funcionan con Server Actions**
- **EntityPreloader** carga todas las entidades exclusivamente a través de Server Actions, sin recurrir a rutas REST
- **Biome** - Linter y formateador unificado

## Características Principales

- **Gestión completa de activos digitales**: Imágenes, videos, colecciones, álbumes
- **Sistema de organización avanzado**: Carpetas, etiquetas, grupos, colecciones
- **Múltiples vistas**: Grid, lista, tabla para todas las entidades
- **Worldbuilding**: Componentes para personajes, lugares, objetos, conceptos
- **Búsqueda avanzada**: Búsqueda por metadatos, contenido y relaciones
- **Filtros y ordenación**: Opciones avanzadas en todas las entidades
- **Estadísticas detalladas**: Métricas de uso y relaciones para cada entidad
- **Interfaz responsive**: Diseño adaptable a diferentes dispositivos
- **Seeds de ejemplo**: La base de datos se puede poblar con varios perfiles,
  carpetas y objetos de muestra ejecutando `pnpm prisma db seed`

## Estructura del Proyecto

```
src/
├── app/                    # App Router de Next.js
│   ├── actions/            # Server Actions
│   └── components/         # Componentes específicos de la aplicación
├── components/             # Componentes compartidos
│   ├── ui/                 # Componentes de UI (shadcn)
│   └── views/              # Vistas principales
├── docs/                   # Documentación general
├── examples/               # Componentes de ejemplo
├── lib/                    # Utilidades y funciones
├── services/               # Servicios de negocio
├── store/                  # Stores Zustand
│   └── entities/           # Stores por entidad
├── transformers/           # Transformadores de datos
├── types/                  # Tipos TypeScript
│   └── entities/           # Tipos por entidad
└── utils/                  # Utilidades generales
```

## Panel de Desarrollo

El sistema incluye un panel de desarrollo completo accesible en la ruta `/development` que permite probar todas las entidades implementadas:

- Dashboard
- Configuración
- Carpetas
- Etiquetas (Tags)
- Grupos
- Imágenes
- Colecciones
- Álbumes
- Personajes
- Lugares
- Videos
- Y más...

## Guía de Instalación

1. Clonar el repositorio:

```bash
git clone https://github.com/tu-usuario/image-manager.git
cd image-manager
```

2. Instalar dependencias:

```bash
pnpm install
```

3. Configurar el archivo .env:

```
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/image_manager"
```

4. Ejecutar migraciones de Prisma:

```bash
pnpm prisma migrate dev
```
5. Cargar datos de ejemplo:
```bash
pnpm prisma db seed
```

<<<<<<< HEAD
5. Iniciar el servidor de desarrollo:

=======
6. Iniciar el servidor de desarrollo:
>>>>>>> 073d42e736549c076ab943c2b4179974562a9519
```bash
pnpm dev
```

## Entidades del Sistema

El sistema gestiona las siguientes entidades principales:

### Entidades de Contenido Base

- **Image**: Gestión completa de imágenes
- **Video**: Soporte para archivos de video
- **Folder**: Sistema de carpetas jerárquico

### Entidades Organizativas

- **Tag**: Sistema de etiquetado
- **Group**: Agrupación flexible de elementos
- **Collection**: Colecciones temáticas
- **Album**: Conjuntos ordenados de contenido

### Entidades de Worldbuilding

- **Character**: Personajes con atributos
- **Place**: Ubicaciones con detalles
- **WorldItem**: Objetos del mundo narrativo
- **Concept**: Ideas y conceptos narrativos

### Entidades de Utilidad

- **Prompt**: Instrucciones para generación
- **Note**: Anotaciones y notas
- **Wildcard**: Elementos aleatorios
- **Property**: Propiedades personalizables

## Arquitectura

El sistema sigue una arquitectura en capas:

```mermaid
graph TD
    A[Cliente/UI] -->|Interactúa con| B[Server Actions]
    B -->|Utiliza| C[Services]
    C -->|Gestiona| D[Base de Datos Prisma]
    C -->|Transforma| E[Transformers]
    A -->|Estado local| F[Zustand Stores]
    F -->|Utiliza| E
    B -->|Actualiza| F
    E -->|Conforme a| G[Types]
```

### Componentes Arquitectónicos

1. **Types**: Definen la estructura de datos con interfaces TypeScript
2. **Transformers**: Convierten datos entre diferentes formatos
3. **Stores**: Manejan el estado de la aplicación usando Zustand con patrón de slices
4. **Services**: Implementan la lógica de negocio con manejo de errores
5. **Server Actions**: Proporcionan endpoints para operaciones CRUD

## Estructura de Documentación

Cada entidad cuenta con documentación detallada dentro de
`src/transformers/<entidad>/README.md` o `documentation.md`.

## Ejemplos de Uso

### Obtener Grupos

```typescript
import { getGroups } from '@/app/actions/groups/group.actions';

// En un componente React
const GroupsList = async () => {
  const groups = await getGroups();

  return (
    <div>
      <h1>Mis Grupos</h1>
      <ul>
        {groups.map(group => (
          <li key={group.id}>{group.name}</li>
        ))}
      </ul>
    </div>
  );
};
```

### Usar Store Zustand

```typescript
import { useGroupStore } from '@/store/entities/group';

// En un componente React
const GroupsManager = () => {
  // Obtener datos del store
  const groups = useGroupStore(state => state.getGroups());
  const addGroup = useGroupStore(state => state.addGroup);

  // Utilizar el store
  const handleAddGroup = (newGroup) => {
    addGroup(newGroup);
  };

  return (
    // ... UI del componente
  );
};
```

## Estado del Proyecto

El proyecto ha completado la implementación de todas las entidades principales alineadas con el esquema de Prisma. Cada entidad cuenta con su conjunto completo de tipos, transformadores, stores, servicios y acciones del servidor, así como documentación detallada.

Los próximos pasos incluyen:

1. Pruebas exhaustivas
2. Optimización de rendimiento
3. Internacionalización
4. Mejoras en UI/UX

## Testing

La configuración de Jest se actualizó para transformar dependencias como `nanoid`
y se añadió un polyfill de `TextEncoder` en `jest.setup.ts`.
Se incorporaron pruebas unitarias para los selectores del store de perfiles y se
mejoró el mock de `PrismaClient` para permitir la inicialización en entornos de
test.
Se añadió la dependencia @testing-library/user-event para pruebas de interacción.
Todas las suites de Jest se ejecutan sin fallos tras ajustar los mocks y componentes.

## Licencia

Este proyecto está licenciado bajo [MIT License](LICENSE).

## Contacto

Para más información, contáctanos en [tu-email@ejemplo.com](mailto:tu-email@ejemplo.com).

# Hallazgos y convenciones recientes sobre tests de tarjetas y servicios (junio 2025)

## Resumen de problemas detectados

- Los tests de tarjetas (`TagCard`, `FolderCard`, etc.) usaban selectores y asserts que no coincidían con el markup real: buscaban enlaces `<a>` cuando el componente renderiza `<button>` o `<article>` si hay `onClick`.
- Los asserts de badges de favorito y skeletons buscaban data-testid o clases que no existen; en el markup real se usan iconos Lucide (`Heart`, `Star`).
- Los mocks de funciones asíncronas (ej. `getFolderStats`, `getRecentFolderImages`) no siempre se llamaban correctamente por diferencias en el flujo de datos simulado vs. real.
- El archivo `use-folder-images.test.ts` estaba duplicado y con errores de sintaxis; fue eliminado.
- El test funcional de servicios (`folder.service.functional.test.ts`) tenía problemas de rutas y moduleNameMapper, especialmente con imports de acciones y servicios.
- Se detectaron warnings de act y errores de tipado por asserts sobre props/elementos inexistentes.

## Soluciones aplicadas

- Se corrigieron los selectores y asserts en los tests de tarjetas para que coincidan con el markup real:
  - Los clicks se hacen sobre `<button>` o `<article>` con `role=button`.
  - Los asserts de enlaces solo se hacen cuando no hay `onClick`.
  - Los badges de favorito se buscan por el icono Lucide correspondiente (`svg.feather-heart`, `svg.feather-star`).
- Se ajustaron los mocks de datos y funciones asíncronas para que coincidan con los tipos y el flujo real de los componentes.
- Se eliminó el archivo duplicado y roto `use-folder-images.test.ts`.
- Se revisó y ajustó el `moduleNameMapper` en `jest.config.ts` para que las rutas `@/` apunten correctamente a `src/`.
- Se documentó el plan y los cambios en `CURRENT-TASK.md`.

## Convenciones y recomendaciones para el siguiente agente

- Antes de modificar tests, revisar el markup real de los componentes y ajustar los selectores/asserts para que sean robustos y coincidan exactamente.
- Usar `waitFor` para asserts asíncronos y aceptar cualquier argumento en callbacks de mocks.
- Evitar asserts sobre props/elementos que ya no existen en el markup.
- Mantener mocks globales en `jest.setup.ts` para evitar errores de importación de código de servidor (ej. prisma, p-queue).
- Validar siempre la suite de tests completa tras cambios en los tests o el markup.
- Documentar hallazgos y convenciones en este README y en `CURRENT-TASK.md`.

## Pendiente

- Validar que los tests funcionales de servicios pasen sin errores de rutas/moduleNameMapper.
- Documentar cualquier convención nueva o hallazgo relevante tras la próxima ejecución de la suite de tests.

---

Para más detalles, ver también:

- `CURRENT-TASK.md` (plan y checklist de la tarea)
- `TRANSFORMERS-FIX.md` (convenciones de testing y mocks globales)
- `AGENTS.md` (reglas de colaboración y traspaso de contexto)
