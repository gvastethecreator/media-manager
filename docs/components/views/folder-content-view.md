# 📂 Folder Content View

## 📝 Descripción

El componente `FolderContentView` es una vista especializada que muestra el contenido de una carpeta específica. Presenta las imágenes contenidas en la carpeta seleccionada en un formato de cuadrícula con capacidades de selección e interacción.

## 🔧 Características Principales

### Visualización

- Grid responsivo de imágenes
- Animaciones suaves con BlurFade
- Estados de carga y vacío personalizados
- Transiciones fluidas

### Interacción

- Selección de imágenes
- Vista previa con doble clic
- Integración con visor de imágenes
- Navegación intuitiva

## 🏗️ Estructura

### Hooks Utilizados

```typescript
const {
	currentItems,
	toggleItemSelection,
	currentFolderId,
	setCurrentFolder,
	isLoading,
} = useFileManager();

const { openViewer } = useImageViewer();
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
			const imageItems = items.filter(
				(i) => i.type === "image" || i.mimeType?.startsWith("image/")
			);
			openViewer(
				imageItems,
				imageItems.findIndex((i) => i.id === item.id)
			);
		}
	},
	[openViewer, items]
);
```

## 🔄 Ciclo de Vida

1. **Inicialización**

   - Verificación de ID de carpeta
   - Carga de contenido
   - Configuración de estado inicial

2. **Renderizado**

   - Comprobación de estado de carga
   - Verificación de contenido
   - Renderizado de grid o estado vacío
   - Aplicación de animaciones

3. **Interacción**
   - Manejo de selección
   - Apertura de visor
   - Actualización de estado
   - Feedback visual

## 🎨 Componentes Utilizados

- `FileGrid`: Grid principal de imágenes
- `EmptyState`: Estado cuando la carpeta está vacía
- `LoadingScreen`: Pantalla de carga
- `BlurFade`: Animaciones de transición

## 📊 Estados

```typescript
interface ViewState {
	isLoading: boolean;
	items: FileItem[];
	currentFolderId: string | null;
}
```

## 🔍 Consideraciones

### Rendimiento

- Optimización de carga de imágenes
- Manejo eficiente de memoria
- Renderizado condicional
- Animaciones optimizadas

### Accesibilidad

- Navegación por teclado
- Estados de foco
- Textos alternativos
- Mensajes de estado

### UX/UI

- Feedback visual claro
- Transiciones suaves
- Estados de carga apropiados
- Mensajes informativos

## 📚 Ejemplos de Uso

```tsx
// Uso básico
<FolderContentView />

// Integración en layout
<ViewContainer>
  <FolderContentView />
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

- Uso de useCallback para eventos
- Memorización de componentes
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
