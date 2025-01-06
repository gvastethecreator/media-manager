# 🖼️ File Viewer Card

## 📝 Descripción

El componente `FileViewerCard` es un componente especializado para mostrar imágenes con capacidades de carga lazy, manejo de errores y estados de carga. Proporciona una experiencia visual optimizada para la visualización de imágenes.

## 🔧 Características Principales

- Carga lazy de imágenes
- Estados de carga visual
- Manejo de errores
- Optimización de rendimiento

## 🏗️ Estructura

### Interfaces

```typescript
interface ImageCardProps {
	src: string;
	alt: string;
	width?: number;
	height?: number;
	priority?: boolean;
	className?: string;
	onClick?: () => void;
}
```

### Estados

```typescript
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const { ref, inView } = useInView({
	triggerOnce: true,
	rootMargin: "50px 0px",
});
```

## 🔄 Ciclo de Vida

1. **Inicialización**

   - Configuración de observer
   - Estado de carga inicial
   - Preparación de imagen

2. **Carga**

   - Detección de visibilidad
   - Carga de imagen
   - Manejo de errores

3. **Finalización**
   - Transición de carga
   - Actualización de estado
   - Limpieza de recursos

## 🎨 Componentes UI

### Principales

- `Image`: Componente de imagen
- `Skeleton`: Estado de carga
- `ErrorDisplay`: Mensaje de error
- `motion.div`: Contenedor animado

### Estados Visuales

- Estado de carga
- Estado de error
- Estado de éxito
- Transiciones suaves

## 🔍 Consideraciones

### Rendimiento

- Carga lazy optimizada
- Observador de intersección
- Gestión de memoria
- Caché de imágenes

### UX/UI

- Feedback visual claro
- Transiciones suaves
- Estados de error
- Placeholder durante carga

### Optimización

- Tamaños responsivos
- Calidad de imagen
- Prioridad de carga
- Formato de imagen

## 📚 Ejemplos de Uso

```tsx
// Uso básico
<ImageCard
  src="/path/to/image.jpg"
  alt="Descripción de la imagen"
  width={300}
  height={200}
/>

// Con prioridad alta
<ImageCard
  src="/path/to/image.jpg"
  alt="Imagen importante"
  priority={true}
  width={500}
  height={300}
/>

// Con manejador de click
<ImageCard
  src="/path/to/image.jpg"
  alt="Imagen clickeable"
  onClick={() => handleImageClick()}
  className="cursor-pointer"
/>
```

## 🔗 Dependencias

- `next/image`: Componente de imagen
- `react-intersection-observer`: Observador de visibilidad
- `motion/react`: Animaciones
- `@/components/ui`: Componentes UI

## 📝 Notas Técnicas

### Optimizaciones

```typescript
// Configuración de observador
const { ref, inView } = useInView({
	triggerOnce: true,
	rootMargin: "50px 0px",
});

// Manejo de errores
const handleError = () => {
	setError("Error al cargar la imagen");
	setIsLoading(false);
};

// Optimización de imagen
<Image
	src={src}
	alt={alt}
	width={width}
	height={height}
	quality={80}
	sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>;
```

### Mejores Prácticas

1. **Carga de Imágenes**

   - Uso de next/image
   - Optimización automática
   - Formatos modernos
   - Tamaños responsivos

2. **Rendimiento**

   - Carga lazy
   - Priorización
   - Caché efectivo
   - Limpieza de recursos

3. **Accesibilidad**
   - Alt text descriptivo
   - Estados focusables
   - Roles semánticos
   - Contraste adecuado

### Personalización

- Clases personalizables
- Estilos extensibles
- Props configurables
- Eventos personalizados

### Integración

- Sistema de temas
- Gestión de estado
- Eventos del sistema
- Caché global

```

```
