# Paneles de Información Contextual

## 📝 Descripción

Sistema de paneles informativos que proporcionan información detallada y contextual sobre diferentes elementos del sistema (carpetas, colecciones, etiquetas, búsquedas).

## 🎯 Objetivos

- Mostrar información relevante y actualizada
- Mantener consistencia visual
- Proporcionar interactividad útil
- Optimizar rendimiento de carga

## 🛠️ Implementación Técnica

### Arquitectura de Paneles

```typescript
interface BasePanel {
	id: string;
	type: PanelType;
	position: "left" | "right" | "bottom";
	size: number;
	isResizable: boolean;
	isCollapsible: boolean;
}

interface PanelManager {
	registerPanel(panel: BasePanel): void;
	showPanel(id: string): void;
	hidePanel(id: string): void;
	resizePanel(id: string, size: number): void;
}
```

#### Justificación

- Sistema modular para fácil extensión
- Control granular sobre comportamiento
- Gestión eficiente de estado

### Panel de Carpeta

```typescript
interface FolderPanel extends BasePanel {
	type: "folder";
	data: {
		stats: FolderStats;
		recentChanges: FileChange[];
		subfolders: FolderInfo[];
		metadata: FolderMetadata;
	};
}
```

#### Características

- Estadísticas de archivos
- Historial de cambios
- Estructura de subcarpetas
- Acciones rápidas

### Panel de Colección

```typescript
interface CollectionPanel extends BasePanel {
	type: "collection";
	data: {
		items: CollectionItem[];
		tags: TagInfo[];
		sharing: SharingInfo;
		stats: CollectionStats;
	};
}
```

#### Características

- Vista previa de items
- Gestión de etiquetas
- Opciones de compartir
- Estadísticas

### Panel de Etiquetas

```typescript
interface TagPanel extends BasePanel {
	type: "tag";
	data: {
		usage: TagUsageStats;
		related: RelatedTag[];
		items: TaggedItem[];
		hierarchy: TagHierarchy;
	};
}
```

#### Características

- Estadísticas de uso
- Etiquetas relacionadas
- Items etiquetados
- Jerarquía

### Panel de Búsqueda

```typescript
interface SearchPanel extends BasePanel {
	type: "search";
	data: {
		results: SearchResult[];
		filters: ActiveFilter[];
		suggestions: SearchSuggestion[];
		history: SearchHistory[];
	};
}
```

#### Características

- Resultados en vivo
- Filtros activos
- Sugerencias
- Historial

## 🎨 Diseño e Interacción

### Principios de Diseño

- Consistencia visual con la app
- Transiciones suaves
- Feedback inmediato
- Accesibilidad

### Componentes Compartidos

1. **Header de Panel**

   - Título dinámico
   - Acciones contextuales
   - Toggle de colapso

2. **Sección de Estadísticas**

   - Visualizaciones compactas
   - Actualización en tiempo real
   - Tooltips informativos

3. **Lista de Acciones**
   - Acciones contextuales
   - Shortcuts
   - Feedback visual

## 🔗 Dependencias

- shadcn/ui (componentes)
- TanStack Query (datos)
- Zustand (estado)
- Framer Motion (animaciones)

## 📊 Métricas de Éxito

- Tiempo de carga < 300ms
- Interacción sin lag
- Actualización en tiempo real
- UX intuitiva

## 🧪 Testing

- Tests de componentes
- Tests de integración
- Tests de accesibilidad
- Tests de rendimiento

## 🚨 Manejo de Estados

- Loading states
- Error states
- Empty states
- Skeleton loading

## 📝 Plan de Implementación

### Fase 1: Core

1. Implementar sistema base de paneles
2. Crear componentes compartidos
3. Implementar gestión de estado

### Fase 2: Paneles Individuales

1. Panel de Carpeta
2. Panel de Colección
3. Panel de Etiquetas
4. Panel de Búsqueda

### Fase 3: Refinamiento

1. Optimizar rendimiento
2. Mejorar animaciones
3. Pulir interacciones
4. Implementar shortcuts

## ⚡ Optimizaciones

- Lazy loading de paneles
- Memoización de datos
- Virtualización de listas largas
- Prefetch de datos probables

## 🔄 Integración

- Sistema de archivos
- Motor de búsqueda
- Sistema de etiquetas
- Servicio de estadísticas
