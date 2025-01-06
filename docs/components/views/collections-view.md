# 📚 Collections View

## 📝 Descripción

El componente `CollectionsView` es una vista principal que muestra todas las colecciones de imágenes en un formato de cuadrícula de tarjetas interactivas. Cada colección se presenta con una previsualización de imágenes, estadísticas y acciones rápidas.

## 🔧 Características Principales

### Visualización

- Grid responsivo de colecciones
- Tarjetas interactivas con previsualizaciones
- Animaciones y transiciones suaves
- Estados de carga y vacío personalizados

### Interacción

- Acciones rápidas por colección
  - Descarga
  - Favoritos
  - Configuración
  - Vista rápida
- Navegación a contenido de colección
- Animaciones de hover

## 🏗️ Estructura

### Interfaces Principales

```typescript
interface CollectionCardProps {
	collection: CollectionWithStats & {
		recentImages?: string[];
		topTags?: { name: string; count: number }[];
	};
	onClick: () => void;
}

interface CollectionWithStats {
	id: string;
	name: string;
	description?: string;
	emoji: string;
	color?: string;
	count: number;
	size: string;
}
```

### Estados

```typescript
const [collections, setCollections] = useState<CollectionWithStats[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

## 🎨 Componentes Internos

### CollectionCard

- Tarjeta interactiva para cada colección
- Grid de imágenes recientes
- Estadísticas y etiquetas
- Acciones rápidas
- Animaciones y efectos visuales

### Características de Tarjeta

- Gradientes dinámicos
- Overlay con hover
- Botones de acción
- Badges y estadísticas
- HoverCards informativos

## 🔄 Ciclo de Vida

1. **Inicialización**

   - Carga de colecciones desde API
   - Manejo de estado de carga
   - Gestión de errores

2. **Renderizado**

   - Comprobación de estados
   - Renderizado condicional
   - Animaciones de entrada
   - Grid responsivo

3. **Interacción**
   - Navegación a contenido
   - Acciones rápidas
   - Feedback visual
   - Actualizaciones de estado

## 📊 Funcionalidades

### Gestión de Colecciones

- Visualización de estadísticas
- Previsualización de contenido
- Acciones de gestión
- Navegación integrada

### Sistema de Gradientes

```typescript
function getRandomGradient() {
	const gradients = [
		"from-rose-500 to-indigo-500",
		"from-emerald-500 to-sky-500",
		"from-amber-500 to-pink-500",
		// ...más combinaciones
	];
	return gradients[Math.floor(Math.random() * gradients.length)];
}
```

### Acciones Rápidas

```typescript
const handleDownload = async (e: React.MouseEvent) => {
	e.stopPropagation();
	toast.promise(fetch(`/api/collections/${collection.id}/download`), {
		loading: "Preparando descarga...",
		success: "Descarga iniciada",
		error: "Error al descargar la colección",
	});
};
```

## 🔍 Consideraciones

### Rendimiento

- Lazy loading de imágenes
- Optimización de re-renders
- Gestión eficiente de memoria
- Animaciones optimizadas

### Accesibilidad

- Navegación por teclado
- Estados de foco visibles
- Textos alternativos
- Contraste adecuado

### UX/UI

- Feedback visual claro
- Transiciones suaves
- Estados de hover
- Información contextual

## 📚 Ejemplos de Uso

```tsx
// Uso básico
<CollectionsView isResizing={false} />;

// Con manejo de estado
function App() {
	const [isResizing, setIsResizing] = useState(false);
	return <CollectionsView isResizing={isResizing} />;
}
```

## 🔗 Dependencias

- `@/store/navigation`: Navegación
- `@/store/file-manager`: Gestión de archivos
- `@/services/collection.service`: Servicio de colecciones
- `@/components/ui`: Componentes de UI
- `motion/react`: Animaciones
- `lucide-react`: Iconos

## 📝 Notas Técnicas

### Optimizaciones

- Uso de memo y useCallback
- Lazy loading de imágenes
- Animaciones eficientes
- Gestión de estado optimizada

### Manejo de Errores

- Estados de error visuales
- Mensajes de error claros
- Recuperación automática
- Feedback al usuario

### Mantenibilidad

- Código modular
- Componentes reutilizables
- Tipos definidos
- Documentación clara

```

```
