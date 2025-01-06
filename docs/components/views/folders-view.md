# 📁 Folders View

## 📝 Descripción

El componente `FoldersView` es una vista principal que muestra todas las carpetas indexadas en el sistema. Proporciona una interfaz interactiva para gestionar y visualizar carpetas con previsualizaciones de su contenido, estadísticas y acciones rápidas.

## 🔧 Características Principales

### Visualización

- Grid responsivo de carpetas
- Tarjetas interactivas con previsualizaciones
- Gradientes dinámicos personalizados
- Estados de carga y vacío personalizados

### Interacción

- Acciones rápidas por carpeta
  - Reindexación
  - Configuración
  - Eliminación
  - Vista rápida
- Navegación a contenido
- Confirmación de acciones
- Feedback visual de procesos

## 🏗️ Estructura

### Interfaces Principales

```typescript
interface FolderCardProps {
	folder: any;
	onReindex: (id: string) => void;
	onDelete: (id: string) => void;
	isProcessing: boolean;
	processStatus: any;
	onClick: () => void;
}
```

### Estados

```typescript
const [folders, setFolders] = useState<any[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [isProcessing, setIsProcessing] = useState(false);
const [processStatus, setProcessStatus] = useState({});
```

## 🎨 Componentes Internos

### FolderCard

- Tarjeta interactiva para cada carpeta
- Grid de imágenes recientes
- Estadísticas y métricas
- Acciones rápidas
- Barra de progreso para procesos

### Sistema de Gradientes

```typescript
function getRandomGradient() {
	const gradients = [
		"from-blue-500/20 to-cyan-500/20",
		"from-purple-500/20 to-pink-500/20",
		// ...más combinaciones
	];
	return gradients[Math.floor(Math.random() * gradients.length)];
}
```

## 🔄 Ciclo de Vida

1. **Inicialización**

   - Carga de carpetas desde API
   - Manejo de estado de carga
   - Gestión de errores

2. **Renderizado**

   - Comprobación de estados
   - Renderizado condicional
   - Animaciones de entrada
   - Grid responsivo

3. **Interacción**
   - Navegación a contenido
   - Acciones de gestión
   - Feedback visual
   - Actualizaciones de estado

## 📊 Funcionalidades

### Gestión de Carpetas

```typescript
const handleReindex = async (folderId: string) => {
	setIsProcessing(true);
	setProcessStatus({ folderId, progress: 0 });

	toast.promise(
		fetch(`/api/folders/${folderId}/reindex`, {
			method: "POST",
		}).finally(() => {
			setIsProcessing(false);
			setProcessStatus({});
		}),
		{
			loading: "Reindexando carpeta...",
			success: "Carpeta reindexada correctamente",
			error: "Error al reindexar la carpeta",
		}
	);
};

const handleDelete = async (folderId: string) => {
	toast.promise(
		fetch(`/api/folders/${folderId}`, {
			method: "DELETE",
		}).then(() => {
			setFolders((prev) => prev.filter((f) => f.id !== folderId));
		}),
		{
			loading: "Eliminando carpeta...",
			success: "Carpeta eliminada correctamente",
			error: "Error al eliminar la carpeta",
		}
	);
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
- Confirmaciones de acciones
- Estados de proceso
- Información contextual

## 📚 Ejemplos de Uso

```tsx
// Uso básico
<FoldersView isResizing={false} />;

// Con manejo de estado
function App() {
	const [isResizing, setIsResizing] = useState(false);
	return <FoldersView isResizing={isResizing} />;
}
```

## 🔗 Dependencias

- `@/store/navigation`: Navegación
- `@/store/file-manager`: Gestión de archivos
- `@/services/folder.service`: Servicio de carpetas
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

### Integración

- Conexión con FileManager
- Integración con NavigationStore
- Manejo de estado global
- Sistema de eventos

```

```
