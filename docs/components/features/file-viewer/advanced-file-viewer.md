# 🖼️ Advanced File Viewer

## 📝 Descripción

El componente `AdvancedFileViewer` es un visor de imágenes avanzado que proporciona funcionalidades de zoom, navegación, gestos y controles interactivos. Permite una experiencia completa de visualización de imágenes con animaciones suaves y controles intuitivos.

## 🔧 Características Principales

- Zoom interactivo
- Navegación entre imágenes
- Gestos de arrastre
- Controles de imagen
- Atajos de teclado
- Animaciones suaves

## 🏗️ Estructura

### Interfaces

```typescript
interface ImageItem {
	id: string;
	name: string;
	type: "image";
	thumbnail?: string;
	src?: string;
	alt?: string;
	width?: number;
	height?: number;
	duration?: number;
	fps?: number;
	mimeType?: string;
}

interface AdvancedImageViewerProps {
	images: ImageItem[];
	initialIndex?: number;
	isOpen: boolean;
	onClose: () => void;
}
```

### Estados

```typescript
const [index, setIndex] = useState(initialIndex);
const [scale, setScale] = useState(1);
const [position, setPosition] = useState({ x: 0, y: 0 });
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

## 🔄 Ciclo de Vida

1. **Inicialización**

   - Configuración inicial
   - Carga de imagen
   - Configuración de eventos

2. **Interacción**

   - Gestos de zoom
   - Navegación
   - Arrastre de imagen
   - Controles de usuario

3. **Limpieza**
   - Limpieza de eventos
   - Reset de estados
   - Cierre de visor

## 🎨 Componentes UI

### Toolbar

- Botones de zoom
- Control de reset
- Botón de copiar
- Botón de descargar
- Botón de cerrar

### Visualización

- Imagen principal
- Estado de carga
- Mensajes de error
- Miniaturas de navegación

### Controles

- Navegación por teclado
- Gestos táctiles
- Controles de zoom
- Acciones rápidas

## 🔍 Consideraciones

### Rendimiento

- Optimización de gestos
- Caché de imágenes
- Animaciones eficientes
- Gestión de memoria

### UX/UI

- Feedback visual claro
- Transiciones suaves
- Controles intuitivos
- Estados de carga

### Accesibilidad

- Navegación por teclado
- Roles ARIA
- Estados focusables
- Mensajes descriptivos

## 📚 Ejemplos de Uso

```tsx
// Uso básico
<AdvancedFileViewer
  images={imageList}
  isOpen={isViewerOpen}
  onClose={() => setViewerOpen(false)}
/>

// Con índice inicial
<AdvancedFileViewer
  images={imageList}
  initialIndex={2}
  isOpen={isViewerOpen}
  onClose={handleClose}
/>
```

## 🔗 Dependencias

- `motion/react`: Animaciones
- `lucide-react`: Iconos
- `@/components/ui`: Componentes UI
- `@/lib/utils`: Utilidades

## 📝 Notas Técnicas

### Gestos y Controles

```typescript
// Zoom con rueda
const handleWheel = (e: React.WheelEvent) => {
	e.preventDefault();
	const zoomFactor = 0.1;
	const newScale = Math.min(
		Math.max(0.1, scale * (1 - Math.sign(e.deltaY) * zoomFactor)),
		5
	);
	setScale(newScale);
};

// Navegación por teclado
useEffect(() => {
	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === "Escape") onClose();
		if (e.key === "ArrowLeft")
			setIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
		if (e.key === "ArrowRight")
			setIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
		if (e.key === "0" || e.key === "r") resetView();
		if (e.key === "+") handleZoom(1.2);
		if (e.key === "-") handleZoom(0.8);
	};

	window.addEventListener("keydown", handleKeyDown);
	return () => window.removeEventListener("keydown", handleKeyDown);
}, [isOpen, images.length, onClose]);
```

### Mejores Prácticas

1. **Gestión de Estado**

   - Estado centralizado
   - Actualizaciones atómicas
   - Manejo de errores
   - Limpieza apropiada

2. **Optimización**

   - Caché de imágenes
   - Lazy loading
   - Compresión adaptativa
   - Gestión de memoria

3. **Interactividad**
   - Gestos intuitivos
   - Atajos de teclado
   - Feedback visual
   - Estados claros

### Características Avanzadas

- **Zoom Adaptativo**: Zoom suave y limitado
- **Navegación Circular**: Navegación continua entre imágenes
- **Gestos Multi-touch**: Soporte para gestos táctiles
- **Controles Contextuales**: Toolbar adaptativa
- **Estados Persistentes**: Mantenimiento de estado entre imágenes
- **Animaciones Fluidas**: Transiciones suaves entre estados

### Integración

- Sistema de temas
- Gestión de estado
- Eventos del sistema
- Caché global

```

```
