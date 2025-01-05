# Componentes de Búsqueda

## SearchView

### Descripción General

El `SearchView` es un componente funcional de React que proporciona una interfaz de usuario completa para la búsqueda de archivos en la aplicación. Integra funcionalidades de búsqueda básica y avanzada, con soporte para múltiples tipos de filtros.

### Ubicación

`src/components/views/search/search-view.tsx`

### Responsabilidades

- Gestionar el estado de los filtros de búsqueda
- Proporcionar una interfaz de usuario para la búsqueda de archivos
- Manejar la visualización de resultados de búsqueda
- Integrar con el sistema de gestión de archivos
- Proporcionar feedback visual durante la carga
- Manejar estados vacíos y errores

### Interfaz

```typescript
interface SearchFilters {
	query: string;
	type: "name" | "content" | "metadata" | "all";
	dateFrom?: Date;
	dateTo?: Date;
	tags?: string[];
	collections?: string[];
	folders?: string[];
}

interface ViewProps {
	isResizing: boolean;
}
```

### Dependencias

- `@/components/ui/input`
- `@/components/ui/button`
- `@/components/ui/card`
- `@/components/ui/tabs`
- `@/components/features/file-grid/file-grid`
- `@/components/ui/spinner`
- `@/components/core/data-display/empty-state/empty-state`
- `@/store/file-manager`
- `@/store/image-viewer`

### Ejemplo de Uso

```tsx
<SearchView isResizing={false} />
```

### Consideraciones

#### Performance

- Implementa paginación con un tamaño de página de 100 items
- Utiliza `useCallback` para memorizar funciones
- Maneja estados de carga para feedback visual

#### Accesibilidad

- Proporciona feedback visual durante la carga
- Incluye estados vacíos con mensajes descriptivos
- Soporta navegación por teclado (Enter para búsqueda)

#### Diseño Responsivo

- Utiliza Tailwind CSS para estilos responsivos
- Se adapta a diferentes tamaños de pantalla
- Mantiene una interfaz consistente en diferentes dispositivos

### Estado del Store

El componente utiliza dos stores principales:

#### SearchStore (`src/store/search.ts`)

```typescript
interface SearchState {
	searchQuery: string;
	setSearchQuery: (query: string) => void;
}
```

#### FileManager Store

- Gestiona el estado de los archivos
- Maneja la selección de items
- Controla estados de carga y procesamiento

### Flujo de Trabajo

1. El usuario ingresa un término de búsqueda
2. Al presionar Enter o el botón Buscar:
   - Se valida la consulta
   - Se construye la URL de búsqueda con los filtros
   - Se realiza la petición a la API
3. Durante la búsqueda:
   - Se muestra un indicador de carga
   - Se deshabilitan los controles relevantes
4. Al recibir resultados:
   - Se muestran en el FileGrid
   - Se habilita la interacción con los resultados
5. Si no hay resultados:
   - Se muestra un estado vacío con mensaje descriptivo

### Mejoras Pendientes

- [ ] Implementar filtros básicos (TODO en el código)
- [ ] Implementar filtros avanzados (TODO en el código)
- [ ] Agregar soporte para búsqueda por metadatos
- [ ] Implementar historial de búsquedas
- [ ] Agregar sugerencias de búsqueda
- [ ] Mejorar la experiencia móvil

### Notas de Implementación

- El componente está diseñado para ser extensible con más tipos de filtros
- Se integra con el sistema de temas de la aplicación
- Utiliza el patrón de composición para la UI
- Sigue las mejores prácticas de React y TypeScript
