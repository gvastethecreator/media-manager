# 📄 File Card

## 📝 Descripción

El componente `FileCard` es una tarjeta interactiva que muestra información detallada de un archivo, incluyendo su miniatura, metadatos y acciones contextuales.

## 🔧 Características Principales

- Visualización de miniaturas con caché optimizado
- Efectos de hover y selección con animaciones fluidas
- Menú contextual con acciones dinámicas
- Gestión de errores y estados de carga
- Integración con el sistema de caché

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

interface ThumbnailState {
	data: string | null;
	isLoading: boolean;
	error: string | null;
	retryCount: number;
}

interface CardState {
	isHovered: boolean;
	isSelected: boolean;
	isMarked: boolean;
}
```

### Hooks Personalizados

```typescript
const useThumbnail = (imageId: string, quality: ThumbnailQuality = "mid") => {
	const [state, setState] = useState<ThumbnailState>({
		data: null,
		isLoading: true,
		error: null,
		retryCount: 0,
	});

	useEffect(() => {
		let mounted = true;

		const loadThumbnail = async () => {
			try {
				const data = await thumbnailService.getThumbnail(imageId, quality);
				if (mounted) {
					setState((prev) => ({
						...prev,
						data,
						isLoading: false,
						error: null,
					}));
				}
			} catch (error) {
				if (mounted) {
					setState((prev) => ({
						...prev,
						isLoading: false,
						error: error instanceof Error ? error.message : "Error desconocido",
						retryCount: prev.retryCount + 1,
					}));
				}
			}
		};

		loadThumbnail();
		return () => {
			mounted = false;
		};
	}, [imageId, quality]);

	return state;
};
```

### Manejo de Eventos

```typescript
const handleClick = useCallback(
	(event: React.MouseEvent) => {
		event.preventDefault();
		onClick?.(item);
	},
	[item, onClick]
);

const handleDoubleClick = useCallback(
	(event: React.MouseEvent) => {
		event.preventDefault();
		onDoubleClick?.(item);
	},
	[item, onDoubleClick]
);

const handleContextMenu = useCallback(
	(event: React.MouseEvent) => {
		event.preventDefault();
		// Implementación del menú contextual
	},
	[item]
);
```

## 🎨 Estilos y Animaciones

```typescript
const variants = {
	initial: { scale: 0.95, opacity: 0 },
	animate: {
		scale: 1,
		opacity: 1,
		transition: {
			type: "spring",
			stiffness: 300,
			damping: 20,
		},
	},
	exit: {
		scale: 0.95,
		opacity: 0,
		transition: {
			duration: 0.2,
		},
	},
};
```

## 🔄 Ciclo de Vida y Optimizaciones

1. **Inicialización**

   - Configuración de estados iniciales
   - Suscripción a eventos del sistema
   - Inicialización del caché

2. **Carga de Datos**

   - Carga lazy de miniaturas
   - Gestión de caché
   - Manejo de errores

3. **Limpieza**
   - Cancelación de solicitudes pendientes
   - Limpieza de caché
   - Desuscripción de eventos

## 📚 Ejemplos de Uso

```tsx
// Uso básico
<FileCard
	item={fileItem}
	thumbnailSize="medium"
/>

// Con manejo de eventos
<FileCard
	item={fileItem}
	onClick={handleItemClick}
	onDoubleClick={handleItemOpen}
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

- `@/services/thumbnail.service`: Gestión de miniaturas
- `@/services/cache.service`: Sistema de caché
- `@/store/file-manager`: Estado global
- `@/lib/utils`: Utilidades comunes
- `@/hooks/use-thumbnail`: Hook personalizado para miniaturas

## 📝 Notas Técnicas

### Gestión de Caché

```typescript
const getCachedThumbnail = async (
	imageId: string,
	quality: ThumbnailQuality
) => {
	const cacheKey = `thumbnail:${imageId}:${quality}`;
	try {
		return await thumbnailCache.get(cacheKey);
	} catch (error) {
		logger.error("cache", "Error al obtener thumbnail del caché:", error);
		return null;
	}
};
```

### Manejo de Errores

```typescript
const handleError = (error: Error) => {
	logger.error("ui", "Error en FileCard:", error);
	setState((prev) => ({
		...prev,
		error: error.message,
		isLoading: false,
	}));
};
```

### Optimizaciones de Rendimiento

1. **Memorización de Componentes**

   ```typescript
   export const FileCard = memo(FileCardComponent);
   ```

2. **Lazy Loading**

   ```typescript
   const shouldLoadThumbnail = useCallback(() => {
   	return shouldLoad && isVisible && !hasBeenRendered;
   }, [shouldLoad, isVisible, hasBeenRendered]);
   ```

3. **Caché de Recursos**
   ```typescript
   const preloadThumbnail = useCallback(async () => {
   	if (thumbnail) {
   		const img = new Image();
   		img.src = thumbnail;
   		await img.decode();
   	}
   }, [thumbnail]);
   ```

```

```
