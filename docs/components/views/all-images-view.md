# 🖼️ All Images View

## 📝 Descripción

El componente `AllImagesView` es una vista principal que muestra todas las imágenes indexadas en el sistema en formato de cuadrícula. Proporciona una visualización eficiente y optimizada de la biblioteca completa de imágenes.

## 🔧 Características Principales

### Visualización

- Grid responsivo de imágenes
- Animaciones suaves con BlurFade
- Estado vacío personalizado
- Pantalla de carga durante la obtención de datos

### Interacción

- Selección de imágenes individual
- Doble clic para vista previa
- Integración con visor de imágenes
- Soporte para selección múltiple

## 🏗️ Estructura

### Hooks Utilizados

```typescript
const { currentItems, toggleItemSelection, loadItems, isLoading } =
	useFileManager();

const { openViewer } = useImageViewer();
```

### Manejadores de Eventos

```typescript
const handleItemClick = (item: FileItem) => {
	toggleItemSelection(item, false);
};

const handleItemDoubleClick = (item: FileItem) => {
	if (item.type === "image" || item.mimeType?.startsWith("image/")) {
		const imageItems = items.filter(
			(i) => i.type === "image" || i.mimeType?.startsWith("image/")
		);
		openViewer(
			imageItems,
			imageItems.findIndex((i) => i.id === item.id)
		);
	}
};
```

## 🔄 Ciclo de Vida

1. **Inicialización**

   - Carga inicial de imágenes desde `/api/images/all`
   - Muestra pantalla de carga durante la obtención

2. **Renderizado**

   - Comprueba estado de carga
   - Verifica existencia de imágenes
   - Renderiza grid o estado vacío
   - Aplica animaciones de entrada

3. **Interacción**
   - Manejo de clics para selección
   - Manejo de doble clic para vista previa
   - Actualización de estado de selección

## 🎨 Componentes Utilizados

- `FileGrid`: Grid principal de imágenes
- `EmptyState`: Estado cuando no hay imágenes
- `LoadingScreen`: Pantalla de carga
- `BlurFade`: Animación de transición

## 📊 Estados

```typescript
interface ViewState {
	isLoading: boolean;
	items: FileItem[];
	selectedItems: FileItem[];
}
```

## 🔍 Consideraciones

### Rendimiento

- Optimización de re-renders
- Lazy loading de imágenes
- Manejo eficiente de memoria
- Animaciones optimizadas

### Accesibilidad

- Soporte para navegación por teclado
- Estados de foco visibles
- Textos alternativos para imágenes
- Mensajes de estado claros

### Mejores Prácticas

- Componentes modulares
- Manejo de errores robusto
- Estados de carga apropiados
- Feedback visual claro

## 📚 Ejemplos de Uso

```tsx
// Uso básico del componente
<AllImagesView />

// Integración en layout
<ViewContainer>
  <AllImagesView />
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

- Uso de useCallback para manejadores de eventos
- Filtrado eficiente de imágenes
- Transiciones suaves
- Gestión de memoria optimizada

### Manejo de Errores

- Estados de error visuales
- Fallbacks apropiados
- Mensajes de error claros
- Recuperación automática

### Mantenibilidad

- Código modular
- Funciones reutilizables
- Tipos definidos
- Documentación inline
