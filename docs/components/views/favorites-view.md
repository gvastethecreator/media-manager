# ⭐ Favorites View

## 📝 Descripción

El componente `FavoritesView` es una vista especializada que muestra todas las imágenes marcadas como favoritas. Implementa un sistema de filtrado y visualización optimizado para mostrar solo los elementos favoritos del usuario.

## 🔧 Características Principales

### Visualización

- Grid responsivo de imágenes favoritas
- Animaciones suaves con BlurFade
- Estados de carga y vacío personalizados
- Transiciones fluidas

### Interacción

- Selección de imágenes
- Vista previa con doble clic
- Integración con visor de imágenes
- Filtrado automático de favoritos

## 🏗️ Estructura

### Hooks Utilizados

```typescript
const { currentItems, toggleItemSelection, loadItems, isLoading } =
	useFileManager();

const { openViewer } = useImageViewer();
```

### Filtrado de Favoritos

```typescript
const favoriteItems = useMemo(() => {
	return items.filter((item) => item.isFavorite);
}, [items]);
```

### Manejadores de Eventos

```typescript
const handleItemClick = useCallback(
	(item: FileItem) => {
		toggleItemSelection(item, false);
	},
	[toggleItemSelection]
);

const handleItemDoubleClick = useCallback(
	(item: FileItem) => {
		if (item.type === "image" || item.mimeType?.startsWith("image/")) {
			const imageItems = favoriteItems.filter(
				(i) => i.type === "image" || i.mimeType?.startsWith("image/")
			);
			openViewer(
				imageItems,
				imageItems.findIndex((i) => i.id === item.id)
			);
		}
	},
	[openViewer, favoriteItems]
);
```

## 🔄 Ciclo de Vida

1. **Inicialización**

   - Carga inicial desde `/api/images/favorites/all`
   - Filtrado de elementos favoritos
   - Configuración de estado inicial

2. **Renderizado**

   - Comprobación de estado de carga
   - Filtrado de favoritos
   - Renderizado de grid o estado vacío
   - Aplicación de animaciones

3. **Interacción**
   - Manejo de selección
   - Apertura de visor
   - Actualización de estado
   - Feedback visual

## 🎨 Componentes Utilizados

- `FileGrid`: Grid principal de imágenes
- `EmptyState`: Estado cuando no hay favoritos
- `LoadingScreen`: Pantalla de carga
- `BlurFade`: Animaciones de transición

## 📊 Estados

```typescript
interface ViewState {
	isLoading: boolean;
	items: FileItem[];
	favoriteItems: FileItem[];
}
```

## 🔍 Consideraciones

### Rendimiento

- Memorización de filtrado
- Optimización de re-renders
- Lazy loading de imágenes
- Animaciones eficientes

### Accesibilidad

- Navegación por teclado
- Estados de foco visibles
- Textos alternativos
- Mensajes de estado claros

### UX/UI

- Feedback visual inmediato
- Transiciones suaves
- Estados de carga apropiados
- Mensajes informativos

## 📚 Ejemplos de Uso

```tsx
// Uso básico
<FavoritesView />

// Integración en layout
<ViewContainer>
  <FavoritesView />
</ViewContainer>
```

## 🔗 Dependencias

- `@/store/file-manager`: Gestión de archivos
- `@/store/image-viewer`: Visor de imágenes
- `@/components/features/file-grid`: Grid de archivos
- `@/components/core/data-display`: Componentes de visualización
- `@/components/core/feedback`: Componentes de feedback
- `@/components/ui/blur-fade`: Animaciones

## 📝 Notas Técnicas

### Optimizaciones

- Uso de useMemo para filtrado
- useCallback para eventos
- Lazy loading de imágenes
- Gestión eficiente de estado

### Manejo de Errores

- Estados de error visuales
- Mensajes de error claros
- Recuperación automática
- Fallbacks apropiados

### Mantenibilidad

- Código modular
- Funciones reutilizables
- Tipos definidos
- Documentación inline

### Integración

- Conexión con FileManager
- Integración con ImageViewer
- Manejo de estado global
- Eventos del sistema

```

```
