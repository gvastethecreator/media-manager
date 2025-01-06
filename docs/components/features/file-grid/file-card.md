# 📄 File Card

## 📝 Descripción

El componente `FileCard` es una tarjeta interactiva que muestra información detallada de un archivo, incluyendo su miniatura, metadatos y acciones contextuales. Proporciona una interfaz rica en funcionalidades con animaciones suaves y efectos visuales.

## 🔧 Características Principales

- Visualización de miniaturas
- Efectos de hover y selección
- Menú contextual
- Animaciones fluidas
- Información detallada
- Estados interactivos

## 🏗️ Estructura

### Interfaces

```typescript
interface FileCardProps {
	item: FileItem;
	thumbnailSize?: ThumbnailSize;
	onClick?: (item: FileItem) => void;
	onDoubleClick?: (item: FileItem) => void;
	style?: React.CSSProperties;
	index?: number;
	totalColumns?: number;
	shouldLoad?: boolean;
	hasBeenRendered?: boolean;
}
```

### Estados

```typescript
const [thumbnail, setThumbnail] = useState<string | null>(null);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [isHovered, setIsHovered] = useState(false);
const [isMarked, setIsMarked] = useState(false);
```

## 🔄 Ciclo de Vida

1. **Inicialización**

   - Configuración de estados
   - Carga de miniatura
   - Configuración de eventos

2. **Interacción**

   - Manejo de hover
   - Gestión de selección
   - Acciones contextuales
   - Animaciones

3. **Actualización**
   - Carga de datos
   - Actualización de estado
   - Transiciones
   - Feedback visual

## 🎨 Componentes UI

### Principales

- `ImageCard`: Visualización de miniatura
- `ContextMenu`: Menú contextual
- `Badge`: Etiquetas y colecciones
- `motion.div`: Contenedor animado

### Estados Visuales

- Normal
- Hover
- Seleccionado
- Marcado
- Error
- Cargando

## 🔍 Consideraciones

### Rendimiento

- Carga lazy de miniaturas
- Memorización de componentes
- Optimización de renders
- Gestión de memoria

### UX/UI

- Feedback visual claro
- Transiciones suaves
- Estados interactivos
- Acciones contextuales

### Accesibilidad

- Navegación por teclado
- Roles ARIA
- Estados focusables
- Mensajes descriptivos

## 📚 Ejemplos de Uso

```tsx
// Uso básico
<FileCard
  item={fileItem}
  thumbnailSize="medium"
/>

// Con manejadores personalizados
<FileCard
  item={fileItem}
  onClick={handleClick}
  onDoubleClick={handleDoubleClick}
  thumbnailSize="large"
/>

// Con carga controlada
<FileCard
  item={fileItem}
  shouldLoad={isVisible}
  hasBeenRendered={false}
/>
```

## 🔗 Dependencias

- `motion/react`: Animaciones
- `lucide-react`: Iconos
- `@/components/ui`: Componentes UI
- `@/services/thumbnail.service`: Servicio de miniaturas
- `@/store/file-manager`: Gestión de archivos
- `@/store/image-viewer`: Visor de imágenes

## 📝 Notas Técnicas

### Animaciones

```typescript
const variants = {
	hover: {
		scale: 1,
		transition: springConfig,
	},
	selected: {
		scale: 0.96,
		transition: {
			...springConfig,
			stiffness: 400,
			damping: 10,
		},
	},
	marked: {
		scale: 0.96,
		transition: {
			...springConfig,
			stiffness: 400,
			damping: 10,
		},
	},
	tap: {
		scale: 0.96,
		transition: {
			...springConfig,
			stiffness: 400,
			damping: 10,
		},
	},
};
```

### Efecto de Brillo

```typescript
export function useGlowEffect(elementRef: React.RefObject<HTMLElement>) {
	const handleMouseMove = useCallback(
		(e: MouseEvent) => {
			if (!elementRef.current) return;
			const rect = elementRef.current.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const y = e.clientY - rect.top;
			elementRef.current.style.setProperty("--mouse-x", `${x}px`);
			elementRef.current.style.setProperty("--mouse-y", `${y}px`);
		},
		[elementRef]
	);

	useEffect(() => {
		const element = elementRef.current;
		if (!element) return;
		element.addEventListener("mousemove", handleMouseMove);
		return () => {
			element.removeEventListener("mousemove", handleMouseMove);
		};
	}, [elementRef, handleMouseMove]);
}
```

### Mejores Prácticas

1. **Gestión de Estado**

   - Estado centralizado
   - Actualizaciones atómicas
   - Manejo de errores
   - Limpieza apropiada

2. **Optimización**

   - Carga lazy
   - Memorización
   - Caché de miniaturas
   - Gestión de eventos

3. **Interactividad**
   - Gestos intuitivos
   - Atajos de teclado
   - Feedback visual
   - Estados claros

### Características Avanzadas

- **Efecto de Brillo**: Efecto visual interactivo
- **Selección Múltiple**: Control + Click, Shift + Click
- **Menú Contextual**: Acciones rápidas y personalizables
- **Estados Persistentes**: Mantenimiento de selección
- **Animaciones Fluidas**: Transiciones suaves entre estados
- **Información Detallada**: Metadatos y propiedades

### Integración

- Sistema de temas
- Gestión de estado
- Eventos del sistema
- Caché global

```

```
